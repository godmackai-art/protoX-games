interface CFContext {
  request: Request;
  env: Record<string, string | undefined>;
}

export async function onRequestGet({ request, env }: CFContext) {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('session_id')?.trim() || '';
    if (!sessionId) {
      return Response.json({ error: 'Missing session_id query parameter.' }, { status: 400 });
    }

    const stripeKey = env.STRIPE_SECRET_KEY?.trim() || '';
    if (!stripeKey) {
      return Response.json(
        { error: 'Stripe secret key is not configured on Cloudflare Pages.' },
        { status: 503 }
      );
    }

    const stripeRes = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
      {
        headers: {
          Authorization: `Bearer ${stripeKey}`,
        },
      }
    );

    const session = (await stripeRes.json()) as {
      id?: string;
      payment_status?: string;
      status?: string;
      amount_total?: number;
      currency?: string;
      client_reference_id?: string | null;
      metadata?: Record<string, string>;
      error?: { message?: string };
    };

    if (!stripeRes.ok) {
      return Response.json(
        { error: session.error?.message || 'Unable to verify Stripe session.' },
        { status: stripeRes.status || 500 }
      );
    }

    const isPaid = session.payment_status === 'paid' || session.status === 'complete';
    const amountCents = Number(session.amount_total || session.metadata?.amountCents || 0);
    const amountDollars = Math.round(amountCents / 100);

    return Response.json({
      paid: isPaid,
      amountCents,
      amountDollars,
      currency: session.currency || 'usd',
      productId: session.metadata?.productId || env.STRIPE_PRODUCT_ID?.trim() || null,
      uid: session.client_reference_id || session.metadata?.uid || null,
      sessionId: session.id,
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unable to verify Stripe session.' },
      { status: 500 }
    );
  }
}
