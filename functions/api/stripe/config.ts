interface CFContext {
  request: Request;
  env: Record<string, string | undefined>;
}

export function onRequestGet({ env }: CFContext) {
  const configured = Boolean(env.STRIPE_SECRET_KEY?.trim());
  const defaultProductId = env.STRIPE_PRODUCT_ID?.trim() || null;

  return Response.json({
    configured,
    productId: defaultProductId,
    tiers: [
      {
        amountDollars: 1,
        amountCents: 100,
        label: '1$',
        productId: env.STRIPE_PRODUCT_ID_1?.trim() || defaultProductId,
      },
      {
        amountDollars: 10,
        amountCents: 1000,
        label: '10$',
        productId: env.STRIPE_PRODUCT_ID_10?.trim() || defaultProductId,
      },
      {
        amountDollars: 100,
        amountCents: 10000,
        label: '100$',
        productId: env.STRIPE_PRODUCT_ID_100?.trim() || defaultProductId,
      },
    ],
  });
}
