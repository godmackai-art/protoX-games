import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Stripe from 'stripe';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim() || '';
const stripeClient = stripeSecretKey ? new Stripe(stripeSecretKey) : null;
const defaultStripeProductId = process.env.STRIPE_PRODUCT_ID?.trim() || '';

export type SupportAmountDollars = 1 | 5 | 10 | 100;

interface SupportTierConfig {
  amountDollars: SupportAmountDollars;
  unitAmount: number;
  label: string;
  productId: string;
}

const SUPPORT_TIERS: Record<SupportAmountDollars, SupportTierConfig> = {
  1: {
    amountDollars: 1,
    unitAmount: 100,
    label: '$1',
    productId: process.env.STRIPE_PRODUCT_ID_1?.trim() || defaultStripeProductId,
  },
  5: {
    amountDollars: 5,
    unitAmount: 500,
    label: '$5',
    productId: process.env.STRIPE_PRODUCT_ID_5?.trim() || defaultStripeProductId,
  },
  10: {
    amountDollars: 10,
    unitAmount: 1000,
    label: '$10',
    productId: process.env.STRIPE_PRODUCT_ID_10?.trim() || defaultStripeProductId,
  },
  100: {
    amountDollars: 100,
    unitAmount: 10000,
    label: '$100',
    productId: process.env.STRIPE_PRODUCT_ID_100?.trim() || defaultStripeProductId,
  },
};

function sanitizeBaseOrigin(rawOrigin: unknown): string {
  if (typeof rawOrigin === 'string') {
    try {
      const parsed = new URL(rawOrigin);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        return parsed.origin;
      }
    } catch {
      // Fall through to APP_URL / localhost
    }
  }
  const appUrl = process.env.APP_URL?.trim();
  if (appUrl && appUrl !== 'MY_APP_URL') {
    try {
      const parsed = new URL(appUrl);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        return parsed.origin;
      }
    } catch {
      // Fall through
    }
  }
  return `http://localhost:${PORT}`;
}

function sanitizeReturnPath(rawPath: unknown): string {
  if (typeof rawPath !== 'string') return '/';
  const trimmed = rawPath.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return '/';
  return trimmed.slice(0, 200);
}

async function startServer() {
  const app = express();
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'protox-games' });
  });

  app.get('/api/stripe/config', (_req, res) => {
    res.json({
      configured: Boolean(stripeClient),
      productId: defaultStripeProductId || null,
      tiers: [1, 5, 10, 100].map((amount) => {
        const tier = SUPPORT_TIERS[amount as SupportAmountDollars];
        return {
          amountDollars: tier.amountDollars,
          amountCents: tier.unitAmount,
          label: tier.label,
          productId: tier.productId || null,
        };
      }),
    });
  });

  app.post('/api/stripe/create-checkout-session', async (req, res) => {
    try {
      const body = req.body as {
        amount?: unknown;
        uid?: unknown;
        email?: unknown;
        origin?: unknown;
        returnPath?: unknown;
      };

      const parsedAmount = Number(body.amount);
      if (parsedAmount !== 1 && parsedAmount !== 5 && parsedAmount !== 10 && parsedAmount !== 100) {
        res.status(400).json({ error: 'Support amount must be $1, $5, $10, or $100.' });
        return;
      }

      const tier = SUPPORT_TIERS[parsedAmount as SupportAmountDollars];
      const uid = typeof body.uid === 'string' ? body.uid.trim().slice(0, 128) : '';
      const email =
        typeof body.email === 'string' && body.email.includes('@')
          ? body.email.trim().slice(0, 160)
          : '';
      const baseOrigin = sanitizeBaseOrigin(body.origin);
      const returnPath = sanitizeReturnPath(body.returnPath);
      const separator = returnPath.includes('?') ? '&' : '?';

      if (!stripeClient) {
        res.json({
          configured: false,
          mode: 'sandbox',
          sandboxSessionId: `cs_test_protox_support_${tier.amountDollars}_${Date.now()}`,
          amountDollars: tier.amountDollars,
          amountCents: tier.unitAmount,
          currency: 'usd',
          productId: tier.productId || 'prod_protox_support_sandbox',
        });
        return;
      }

      const priceData: Stripe.Checkout.SessionCreateParams.LineItem.PriceData = tier.productId
        ? {
            currency: 'usd',
            unit_amount: tier.unitAmount,
            product: tier.productId,
          }
        : {
            currency: 'usd',
            unit_amount: tier.unitAmount,
            product_data: {
              name: `Support protoX Games (${tier.label})`,
              description: 'One-time contribution to support protoX Games.',
            },
          };

      const session = await stripeClient.checkout.sessions.create({
        mode: 'payment',
        customer_email: email || undefined,
        client_reference_id: uid || undefined,
        payment_intent_data: {
          receipt_email: email || undefined,
          description: `protoX Games Support (${tier.label})`,
          metadata: {
            uid: uid || 'guest',
            amountDollars: String(tier.amountDollars),
            productId: tier.productId || '',
          },
        },
        metadata: {
          uid: uid || 'guest',
          amountDollars: String(tier.amountDollars),
          amountCents: String(tier.unitAmount),
          productId: tier.productId || '',
        },
        line_items: [
          {
            price_data: priceData,
            quantity: 1,
          },
        ],
        success_url: `${baseOrigin}${returnPath}${separator}stripe_status=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseOrigin}${returnPath}${separator}stripe_status=cancelled`,
      });

      res.json({
        configured: true,
        mode: 'stripe',
        url: session.url,
        sessionId: session.id,
        productId: tier.productId || null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to create Stripe session.';
      res.status(500).json({ error: message });
    }
  });

  app.get('/api/stripe/verify-session', async (req, res) => {
    try {
      const sessionId = typeof req.query.session_id === 'string' ? req.query.session_id.trim() : '';
      if (!sessionId) {
        res.status(400).json({ error: 'Missing session_id query parameter.' });
        return;
      }

      if (!stripeClient) {
        res.status(400).json({ error: 'Stripe secret key is not configured on this server.' });
        return;
      }

      const session = await stripeClient.checkout.sessions.retrieve(sessionId);
      const isPaid = session.payment_status === 'paid';
      const amountCents = Number(session.amount_total || session.metadata?.amountCents || 0);
      const amountDollars = Math.round(amountCents / 100);

      res.json({
        paid: isPaid,
        amountCents,
        amountDollars,
        currency: session.currency || 'usd',
        productId: session.metadata?.productId || defaultStripeProductId || null,
        uid: session.client_reference_id || session.metadata?.uid || null,
        sessionId: session.id,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to verify Stripe session.';
      res.status(500).json({ error: message });
    }
  });

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexHtml = path.join(distDir, 'index.html');
      if (fs.existsSync(indexHtml)) {
        res.sendFile(indexHtml);
      } else {
        res.status(404).send('Build output not found.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`protoX Games server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start protoX Games server:', err);
  process.exit(1);
});
