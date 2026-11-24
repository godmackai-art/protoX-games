interface CFContext {
  next: () => Promise<Response>;
}

export async function onRequestGet({ next }: CFContext) {
  const res = await next();
  if (!res.ok) return res;
  const xml = await res.text();
  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
