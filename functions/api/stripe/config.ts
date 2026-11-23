interface CFContext {
  request: Request;
  env: Record<string, string | undefined>;
}

export function onRequestGet({ env }: CFContext) {
  const configured = Boolean(env.STRIPE_SECRET_KEY?.trim());

  return Response.json({
    configured,
    tiers: [
      { amountDollars: 1, amountCents: 100, label: '1$' },
      { amountDollars: 10, amountCents: 1000, label: '10$' },
      { amountDollars: 100, amountCents: 10000, label: '100$' },
    ],
  });
}
