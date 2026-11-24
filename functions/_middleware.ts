import { resolveRouteSeo } from './_seoHelper';

interface CFElement {
  setInnerContent(content: string, options?: { html?: boolean }): void;
  setAttribute(name: string, value: string): void;
}

interface CFHTMLRewriter {
  on(selector: string, handlers: { element(element: CFElement): void }): CFHTMLRewriter;
  transform(response: Response): Response;
}

declare const HTMLRewriter: {
  new (): CFHTMLRewriter;
};

interface CFContext {
  request: Request;
  next: () => Promise<Response>;
}

const STATIC_PASSTHROUGH_PREFIXES = ['/api/', '/assets/'];
const STATIC_PASSTHROUGH_EXACT = new Set([
  '/sitemap.xml',
  '/robots.txt',
  '/google25ec37742473ff7b.html',
  '/favicon.ico',
  '/favicon-32x32.png',
  '/favicon-192x192.png',
  '/favicon.webp',
  '/apple-touch-icon.png',
  '/apple-touch-icon.webp',
  '/site.webmanifest',
]);

export async function onRequest({ request, next }: CFContext) {
  const url = new URL(request.url);
  const { pathname } = url;

  if (
    request.method !== 'GET' ||
    STATIC_PASSTHROUGH_EXACT.has(pathname) ||
    STATIC_PASSTHROUGH_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
    /\.[a-z0-9]{1,8}$/i.test(pathname)
  ) {
    return next();
  }

  const res = await next();
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('text/html') || typeof HTMLRewriter === 'undefined') {
    return res;
  }

  const seo = resolveRouteSeo(pathname);
  const safeJsonLd = JSON.stringify(seo.jsonLd).replace(/</g, '\\u003c');

  const transformed = new HTMLRewriter()
    .on('title', {
      element(el) {
        el.setInnerContent(seo.title);
      },
    })
    .on('meta[name="description"]', {
      element(el) {
        el.setAttribute('content', seo.description);
      },
    })
    .on('meta[name="robots"]', {
      element(el) {
        el.setAttribute('content', seo.robots);
      },
    })
    .on('link[rel="canonical"]', {
      element(el) {
        el.setAttribute('href', seo.canonical);
      },
    })
    .on('meta[property="og:url"]', {
      element(el) {
        el.setAttribute('content', seo.canonical);
      },
    })
    .on('meta[property="og:title"]', {
      element(el) {
        el.setAttribute('content', seo.title);
      },
    })
    .on('meta[property="og:description"]', {
      element(el) {
        el.setAttribute('content', seo.description);
      },
    })
    .on('meta[property="og:image"]', {
      element(el) {
        el.setAttribute('content', seo.ogImage);
      },
    })
    .on('meta[name="twitter:title"]', {
      element(el) {
        el.setAttribute('content', seo.title);
      },
    })
    .on('meta[name="twitter:description"]', {
      element(el) {
        el.setAttribute('content', seo.description);
      },
    })
    .on('meta[name="twitter:image"]', {
      element(el) {
        el.setAttribute('content', seo.ogImage);
      },
    })
    .on('script#protox-route-jsonld', {
      element(el) {
        el.setInnerContent(safeJsonLd, { html: true });
      },
    })
    .transform(res);

  const headers = new Headers(transformed.headers);
  if (seo.robots.startsWith('noindex')) {
    headers.set('X-Robots-Tag', seo.robots);
  }

  return new Response(transformed.body, {
    status: seo.status,
    headers,
  });
}
