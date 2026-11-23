interface CFContext {
  request: Request;
  next: () => Promise<Response>;
}

export async function onRequestGet({ request, next }: CFContext) {
  const res = await next();
  const contentType = res.headers.get('content-type') || '';
  if (!res.ok || !contentType.includes('xml')) {
    return res;
  }
  const xml = await res.text();
  const origin = new URL(request.url).origin;
  const rewritten = xml.replace(/https:\/\/protox-games\.pages\.dev/g, origin);
  return new Response(rewritten, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
