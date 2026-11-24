interface CFContext {
  request: Request;
  env: Record<string, string | undefined>;
}

const SUPPORT_TIERS: Record<1 | 10 | 100, { unitAmount: number; label: string }> = {
  1: { unitAmount: 100, label: '1$' },
  10: { unitAmount: 1000, label: '10$' },
  100: { unitAmount: 10000, label: '100$' },
};

function sanitizeBaseOrigin(rawOrigin: unknown, requestUrl: string): string {
  if (typeof rawOrigin === 'string') {
    try {
      const parsed = new URL(rawOrigin);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        return parsed.origin;
      }
    } catch {
      // Fallback to request origin
    }
  }
  return new URL(requestUrl).origin;
}

function sanitizeReturnPath(rawPath: unknown): string {
  if (typeof rawPath !== 'string') return '/';
  const trimmed = rawPath.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return '/';
  return trimmed.slice(0, 200);
}

export async function onRequestPost({ request, env }: CFContext) {
  try {
    const stripeKey = env.STRIPE_SECRET_KEY?.trim() || '';
    if (!stripeKey) {
      return Response.json(
        {
          configured: false,
          error: 'Stripe checkout requires STRIPE_SECRET_KEY in your Cloudflare Pages environment variables.',
        },
        { status: 503 }
      );
    }

    const body = (await request.json()) as {
      amount?: unknown;
      uid?: unknown;
      email?: unknown;
      origin?: unknown;
      returnPath?: unknown;
    };

    const parsedAmount = Number(body.amount);
    if (parsedAmount !== 1 && parsedAmount !== 10 && parsedAmount !== 100) {
      return Response.json(
        { error: 'Support amount must be 1$, 10$, or 100$.' },
        { status: 400 }
      );
    }

    const tier = SUPPORT_TIERS[parsedAmount];
    const defaultProductId = env.STRIPE_PRODUCT_ID?.trim() || '';
    const productId =
      (parsedAmount === 1
        ? env.STRIPE_PRODUCT_ID_1?.trim()
        : parsedAmount === 10
        ? env.STRIPE_PRODUCT_ID_10?.trim()
        : env.STRIPE_PRODUCT_ID_100?.trim()) || defaultProductId;

    const uid = typeof body.uid === 'string' ? body.uid.trim().slice(0, 128) : '';
    const email =
      typeof body.email === 'string' && body.email.includes('@')
        ? body.email.trim().slice(0, 160)
        : '';

    const baseOrigin = sanitizeBaseOrigin(body.origin, request.url);
    const returnPath = sanitizeReturnPath(body.returnPath);
    const separator = returnPath.includes('?') ? '&' : '?';

    const params = new URLSearchParams();
    params.set('mode', 'payment');
    params.set('line_items[0][quantity]', '1');

    if (productId.startsWith('price_')) {
      params.set('line_items[0][price]', productId);
    } else {
      params.set('line_items[0][price_data][currency]', 'usd');
      params.set('line_items[0][price_data][unit_amount]', String(tier.unitAmount));

      if (productId) {
        params.set('line_items[0][price_data][product]', productId);
      } else {
        params.set('line_items[0][price_data][product_data][name]', `Support ProtoX Games (${tier.label})`);
        params.set(
          'line_items[0][price_data][product_data][description]',
          'One-time contribution to support ProtoX Games.'
        );
      }
    }

    if (email) {
      params.set('customer_email', email);
      params.set('payment_intent_data[receipt_email]', email);
    }
    if (uid) {
      params.set('client_reference_id', uid);
    }

    params.set('payment_intent_data[description]', `ProtoX Games Support (${tier.label})`);
    params.set('metadata[kind]', 'support');
    params.set('metadata[uid]', uid || 'guest');
    params.set('metadata[amountDollars]', String(parsedAmount));
    params.set('metadata[amountCents]', String(tier.unitAmount));
    params.set(
      'success_url',
      `${baseOrigin}${returnPath}${separator}stripe_status=success&session_id={CHECKOUT_SESSION_ID}`
    );
    params.set('cancel_url', `${baseOrigin}${returnPath}${separator}stripe_status=cancelled`);

    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const session = (await stripeRes.json()) as {
      id?: string;
      url?: string;
      error?: { message?: string };
    };

    if (!stripeRes.ok || !session.url) {
      return Response.json(
        { error: session.error?.message || 'Unable to create Stripe Checkout session.' },
        { status: stripeRes.status || 500 }
      );
    }

    return Response.json({
      configured: true,
      kind: 'support',
      url: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unable to create Stripe session.' },
      { status: 500 }
    );
  }
}
