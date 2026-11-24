export async function onRequestGet() {
  const body = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /api/',
    'Disallow: /profile',
    'Disallow: /favorites',
    'Disallow: /recent',
    'Disallow: /settings',
    '',
    'Sitemap: https://protox-games.pages.dev/sitemap.xml',
    '',
  ].join('\n');

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
