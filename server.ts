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
const FEEDBACK_RECIPIENT = 'stevenevel003@gmail.com';

export type SupportAmountDollars = 1 | 10 | 100;

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
    label: '1$',
    productId: process.env.STRIPE_PRODUCT_ID_1?.trim() || defaultStripeProductId,
  },
  10: {
    amountDollars: 10,
    unitAmount: 1000,
    label: '10$',
    productId: process.env.STRIPE_PRODUCT_ID_10?.trim() || defaultStripeProductId,
  },
  100: {
    amountDollars: 100,
    unitAmount: 10000,
    label: '100$',
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

function sanitizeSingleLine(value: unknown, maxLen: number): string {
  if (typeof value !== 'string') return '';
  return value.replace(/[\r\n]+/g, ' ').trim().slice(0, maxLen);
}

async function startServer() {
  const app = express();
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'protox-games' });
  });

  app.get('/sitemap.xml', (req, res) => {
    const sitemapPath = isProduction
      ? path.resolve(__dirname, 'dist', 'sitemap.xml')
      : path.resolve(__dirname, 'public', 'sitemap.xml');
    if (!fs.existsSync(sitemapPath)) {
      res.status(404).send('Sitemap not found.');
      return;
    }
    const rawXml = fs.readFileSync(sitemapPath, 'utf8');
    const host = req.get('x-forwarded-host') || req.get('host') || `localhost:${PORT}`;
    const proto = req.get('x-forwarded-proto') || req.protocol || 'https';
    const origin = sanitizeBaseOrigin(`${proto}://${host}`);
    const rewritten = rawXml.replace(/https:\/\/protox-games\.pages\.dev/g, origin);
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.send(rewritten);
  });

  app.get('/robots.txt', (req, res) => {
    const host = req.get('x-forwarded-host') || req.get('host') || `localhost:${PORT}`;
    const proto = req.get('x-forwarded-proto') || req.protocol || 'https';
    const origin = sanitizeBaseOrigin(`${proto}://${host}`);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(`User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`);
  });

  app.get('/google25ec37742473ff7b.html', (_req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send('google-site-verification: google25ec37742473ff7b.html');
  });

  app.get('/api/stripe/config', (_req, res) => {
    res.json({
      configured: Boolean(stripeClient),
      tiers: [1, 10, 100].map((amount) => {
        const tier = SUPPORT_TIERS[amount as SupportAmountDollars];
        return {
          amountDollars: tier.amountDollars,
          amountCents: tier.unitAmount,
          label: tier.label,
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
      if (parsedAmount !== 1 && parsedAmount !== 10 && parsedAmount !== 100) {
        res.status(400).json({ error: 'Support amount must be 1$, 10$, or 100$.' });
        return;
      }

      if (!stripeClient) {
        res.status(503).json({
          configured: false,
          error: 'Stripe checkout requires STRIPE_SECRET_KEY to be configured on the server.',
        });
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
              name: `Support ProtoX Games (${tier.label})`,
              description: 'One-time contribution to support ProtoX Games.',
            },
          };

      const session = await stripeClient.checkout.sessions.create({
        mode: 'payment',
        customer_email: email || undefined,
        client_reference_id: uid || undefined,
        payment_intent_data: {
          receipt_email: email || undefined,
          description: `ProtoX Games Support (${tier.label})`,
          metadata: {
            kind: 'support',
            uid: uid || 'guest',
            amountDollars: String(tier.amountDollars),
            productId: tier.productId || '',
          },
        },
        metadata: {
          kind: 'support',
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
        kind: 'support',
        url: session.url,
        sessionId: session.id,
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
        res.status(503).json({ error: 'Stripe secret key is not configured on this server.' });
        return;
      }

      const session = await stripeClient.checkout.sessions.retrieve(sessionId);
      const isPaid = session.payment_status === 'paid' || session.status === 'complete';
      const amountCents = Number(session.amount_total || session.metadata?.amountCents || 0);
      const amountDollars = Math.round(amountCents / 100);

      res.json({
        paid: isPaid,
        amountCents,
        amountDollars,
        currency: session.currency || 'usd',
        uid: session.client_reference_id || session.metadata?.uid || null,
        sessionId: session.id,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to verify Stripe session.';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/feedback', async (req, res) => {
    try {
      const body = req.body as {
        name?: unknown;
        email?: unknown;
        message?: unknown;
        gameTitle?: unknown;
      };

      const name = sanitizeSingleLine(body.name, 100);
      const email = sanitizeSingleLine(body.email, 160);
      const gameTitle = sanitizeSingleLine(body.gameTitle, 120);
      const message = typeof body.message === 'string' ? body.message.trim().slice(0, 2000) : '';

      if (!name) {
        res.status(400).json({ error: 'Please enter your name.' });
        return;
      }
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        res.status(400).json({ error: 'Please enter a valid reply email address.' });
        return;
      }
      if (message.length < 3) {
        res.status(400).json({ error: 'Please enter a comment or feedback message.' });
        return;
      }

      const subject = gameTitle
        ? `ProtoX Games Feedback (${gameTitle}) from ${name}`
        : `ProtoX Games Feedback from ${name}`;
      const bodyLines = [
        `From: ${name} <${email}>`,
        gameTitle ? `Game: ${gameTitle}` : null,
        '',
        message,
      ]
        .filter((line) => line !== null)
        .join('\n');

      const mailtoUrl = `mailto:${FEEDBACK_RECIPIENT}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines)}`;

      let deliveredViaEmail = false;
      const resendApiKey = process.env.RESEND_API_KEY?.trim() || '';
      if (resendApiKey) {
        const emailRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM_EMAIL?.trim() || 'ProtoX Games Feedback <onboarding@resend.dev>',
            to: [FEEDBACK_RECIPIENT],
            reply_to: email,
            subject,
            text: bodyLines,
          }),
        });
        deliveredViaEmail = emailRes.ok;
      }

      res.json({
        ok: true,
        deliveredViaEmail,
        recipient: FEEDBACK_RECIPIENT,
        mailtoUrl,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unable to process feedback.';
      res.status(500).json({ error: msg });
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
    console.log(`ProtoX Games server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start ProtoX Games server:', err);
  process.exit(1);
});
