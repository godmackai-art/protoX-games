export interface CFContext {
  request: Request;
  env: Record<string, string | undefined>;
}

export function onRequestGet() {
  return Response.json({ ok: true, service: 'protox-games', runtime: 'cloudflare-pages' });
}
