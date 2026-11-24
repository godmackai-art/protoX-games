import seoGamesRaw from './_seoGames.json';

export const PRODUCTION_ORIGIN = 'https://protox-games.pages.dev';
export const DEFAULT_OG_IMAGE = `${PRODUCTION_ORIGIN}/assets/aistudio/Neon_Web_Games_Hub__2__1ce608a6.webp`;
export const OFFICIAL_LOGO_URL = `${PRODUCTION_ORIGIN}/favicon-192x192.png`;

type CompactGameTuple = [title: string, category: string, description: string, thumb: string];
const SEO_GAMES = seoGamesRaw as unknown as Record<string, CompactGameTuple>;

export const CATEGORY_SEO_MAP: Record<string, { label: string; description: string }> = {
  action: {
    label: 'Action',
    description:
      'Play free online action games at ProtoX Games. Fast-paced combat, platformers, fighters, and arcade challenges instant in your browser.',
  },
  racing: {
    label: 'Racing',
    description:
      'Play free online racing and driving games at ProtoX Games. Drift tracks, street circuits, and stunt cars directly in your browser.',
  },
  adventure: {
    label: 'Adventure',
    description:
      'Explore free online adventure games at ProtoX Games. Story quests, survival worlds, and exploration journeys with zero downloads.',
  },
  puzzle: {
    label: 'Puzzle',
    description:
      'Challenge your mind with free online puzzle games at ProtoX Games. Logic boards, match-3, mahjong, chess, and brain teasers.',
  },
  sports: {
    label: 'Sports',
    description:
      'Play free online sports games at ProtoX Games. Soccer matches, basketball showdowns, golf, and arcade sports directly in your browser.',
  },
  multiplayer: {
    label: 'Multiplayer',
    description:
      'Compete in free online multiplayer games at ProtoX Games. Head-to-head arenas and real-time browser matchups.',
  },
  arcade: {
    label: 'Arcade',
    description:
      'Play free online arcade classics at ProtoX Games. Pick-up-and-play score chasers and retro-inspired browser hits.',
  },
  '3d': {
    label: '3D',
    description:
      'Play free 3D WebGL browser games at ProtoX Games. Immersive 3D worlds, shooters, and racers with zero installation.',
  },
  strategy: {
    label: 'Strategy',
    description:
      'Play free online strategy games at ProtoX Games. Tower defense, tactical battles, chess, and resource management in your browser.',
  },
  simulation: {
    label: 'Simulation',
    description:
      'Play free online simulation games at ProtoX Games. Sandbox builders, tycoon management, and life simulators in your browser.',
  },
  shooting: {
    label: 'Shooting',
    description:
      'Play free online shooting games at ProtoX Games. FPS arenas, tactical shooters, and target action directly in your browser.',
  },
};

export interface RouteSeoPayload {
  status: number;
  title: string;
  description: string;
  canonical: string;
  robots: string;
  ogType: string;
  ogImage: string;
  jsonLd: Record<string, unknown>;
}

const INDEXABLE_ROBOTS = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
const NOINDEX_ROBOTS = 'noindex, follow';

function buildBaseNodes() {
  return [
    {
      '@type': 'WebSite',
      '@id': `${PRODUCTION_ORIGIN}/#website`,
      name: 'ProtoX Games',
      url: `${PRODUCTION_ORIGIN}/`,
      description:
        'Discover thousands of free online games at ProtoX Games. Explore action, adventure, racing, puzzle, sports and arcade games. Play instantly in your browser.',
      potentialAction: {
        '@type': 'SearchAction',
        target: `${PRODUCTION_ORIGIN}/games?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'Organization',
      '@id': `${PRODUCTION_ORIGIN}/#organization`,
      name: 'ProtoX Games',
      url: `${PRODUCTION_ORIGIN}/`,
      logo: {
        '@type': 'ImageObject',
        url: OFFICIAL_LOGO_URL,
        width: 192,
        height: 192,
      },
    },
  ];
}

export function resolveRouteSeo(rawPathname: string): RouteSeoPayload {
  const clean = rawPathname.replace(/\/+$/, '') || '/';

  if (clean === '/' || clean === '/discover') {
    const title = 'ProtoX Games – Play Free Online Games';
    const description =
      'Discover thousands of free online games at ProtoX Games. Explore action, adventure, racing, puzzle, sports and arcade games. Play instantly in your browser.';
    const canonical = `${PRODUCTION_ORIGIN}/`;
    const robots = clean === '/discover' ? NOINDEX_ROBOTS : INDEXABLE_ROBOTS;
    return {
      status: 200,
      title,
      description,
      canonical,
      robots,
      ogType: 'website',
      ogImage: DEFAULT_OG_IMAGE,
      jsonLd: {
        '@context': 'https://schema.org',
        '@graph': [
          ...buildBaseNodes(),
          {
            '@type': 'WebPage',
            '@id': `${canonical}#webpage`,
            url: canonical,
            name: title,
            description,
            isPartOf: { '@id': `${PRODUCTION_ORIGIN}/#website` },
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: `${PRODUCTION_ORIGIN}/` },
            ],
          },
        ],
      },
    };
  }

  if (clean === '/games' || clean === '/explore') {
    const title = 'Explore Free Online Games – Full Catalog | ProtoX Games';
    const description =
      'Browse over 2,900 free HTML5 and WebGL browser games at ProtoX Games. Filter by genre, popularity, or newest arrivals and play instantly.';
    const canonical = `${PRODUCTION_ORIGIN}/games`;
    return {
      status: 200,
      title,
      description,
      canonical,
      robots: INDEXABLE_ROBOTS,
      ogType: 'website',
      ogImage: DEFAULT_OG_IMAGE,
      jsonLd: {
        '@context': 'https://schema.org',
        '@graph': [
          ...buildBaseNodes(),
          {
            '@type': 'CollectionPage',
            '@id': `${canonical}#webpage`,
            url: canonical,
            name: title,
            description,
            isPartOf: { '@id': `${PRODUCTION_ORIGIN}/#website` },
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: `${PRODUCTION_ORIGIN}/` },
              { '@type': 'ListItem', position: 2, name: 'All Games', item: canonical },
            ],
          },
        ],
      },
    };
  }

  if (clean === '/categories') {
    const title = 'Game Categories – Action, Racing, Puzzle | ProtoX Games';
    const description =
      'Browse free online game categories on ProtoX Games including Action, Racing, Adventure, Puzzle, Sports, Multiplayer, Strategy, and Arcade.';
    const canonical = `${PRODUCTION_ORIGIN}/categories`;
    return {
      status: 200,
      title,
      description,
      canonical,
      robots: INDEXABLE_ROBOTS,
      ogType: 'website',
      ogImage: DEFAULT_OG_IMAGE,
      jsonLd: {
        '@context': 'https://schema.org',
        '@graph': [
          ...buildBaseNodes(),
          {
            '@type': 'CollectionPage',
            '@id': `${canonical}#webpage`,
            url: canonical,
            name: title,
            description,
            isPartOf: { '@id': `${PRODUCTION_ORIGIN}/#website` },
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: `${PRODUCTION_ORIGIN}/` },
              { '@type': 'ListItem', position: 2, name: 'Categories', item: canonical },
            ],
          },
        ],
      },
    };
  }

  if (clean.startsWith('/category/')) {
    const slug = decodeURIComponent(clean.slice('/category/'.length)).toLowerCase();
    const cat = CATEGORY_SEO_MAP[slug];
    if (cat) {
      const title = `${cat.label} Games – Play Free Online | ProtoX Games`;
      const description = cat.description;
      const canonical = `${PRODUCTION_ORIGIN}/category/${slug}`;
      return {
        status: 200,
        title,
        description,
        canonical,
        robots: INDEXABLE_ROBOTS,
        ogType: 'website',
        ogImage: DEFAULT_OG_IMAGE,
        jsonLd: {
          '@context': 'https://schema.org',
          '@graph': [
            ...buildBaseNodes(),
            {
              '@type': 'CollectionPage',
              '@id': `${canonical}#webpage`,
              url: canonical,
              name: title,
              description,
              isPartOf: { '@id': `${PRODUCTION_ORIGIN}/#website` },
            },
            {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: `${PRODUCTION_ORIGIN}/` },
                {
                  '@type': 'ListItem',
                  position: 2,
                  name: 'Categories',
                  item: `${PRODUCTION_ORIGIN}/categories`,
                },
                { '@type': 'ListItem', position: 3, name: `${cat.label} Games`, item: canonical },
              ],
            },
          ],
        },
      };
    }
  }

  if (clean === '/trending') {
    const title = 'Trending Online Games – Popular Picks | ProtoX Games';
    const description =
      'Play the most popular and trending free browser games on ProtoX Games. Discover top-played HTML5 and WebGL hits instantly.';
    const canonical = `${PRODUCTION_ORIGIN}/trending`;
    return {
      status: 200,
      title,
      description,
      canonical,
      robots: INDEXABLE_ROBOTS,
      ogType: 'website',
      ogImage: DEFAULT_OG_IMAGE,
      jsonLd: {
        '@context': 'https://schema.org',
        '@graph': [
          ...buildBaseNodes(),
          {
            '@type': 'CollectionPage',
            '@id': `${canonical}#webpage`,
            url: canonical,
            name: title,
            description,
            isPartOf: { '@id': `${PRODUCTION_ORIGIN}/#website` },
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: `${PRODUCTION_ORIGIN}/` },
              { '@type': 'ListItem', position: 2, name: 'Trending Games', item: canonical },
            ],
          },
        ],
      },
    };
  }

  if (clean === '/leaderboard') {
    const title = 'Top Games Leaderboard – ProtoX Games';
    const description =
      'View top-ranked instant browser games on ProtoX Games across action, puzzle, racing, and arcade categories.';
    const canonical = `${PRODUCTION_ORIGIN}/leaderboard`;
    return {
      status: 200,
      title,
      description,
      canonical,
      robots: INDEXABLE_ROBOTS,
      ogType: 'website',
      ogImage: DEFAULT_OG_IMAGE,
      jsonLd: {
        '@context': 'https://schema.org',
        '@graph': [
          ...buildBaseNodes(),
          {
            '@type': 'WebPage',
            '@id': `${canonical}#webpage`,
            url: canonical,
            name: title,
            description,
            isPartOf: { '@id': `${PRODUCTION_ORIGIN}/#website` },
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: `${PRODUCTION_ORIGIN}/` },
              { '@type': 'ListItem', position: 2, name: 'Leaderboard', item: canonical },
            ],
          },
        ],
      },
    };
  }

  if (clean.startsWith('/game/')) {
    const slug = decodeURIComponent(clean.slice('/game/'.length)).toLowerCase();
    const entry = SEO_GAMES[slug];
    if (entry) {
      const [gameTitle, category, shortDesc, thumb] = entry;
      const title = `Play ${gameTitle} Free Online – ${category} | ProtoX Games`;
      const description =
        shortDesc || `Play ${gameTitle}, a free ${category} browser game, instantly on ProtoX Games.`;
      const canonical = `${PRODUCTION_ORIGIN}/game/${slug}`;
      const ogImage = thumb || DEFAULT_OG_IMAGE;
      const categorySlug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const hasCategoryPage = Boolean(CATEGORY_SEO_MAP[categorySlug]);

      return {
        status: 200,
        title,
        description,
        canonical,
        robots: INDEXABLE_ROBOTS,
        ogType: 'website',
        ogImage,
        jsonLd: {
          '@context': 'https://schema.org',
          '@graph': [
            ...buildBaseNodes(),
            {
              '@type': 'WebPage',
              '@id': `${canonical}#webpage`,
              url: canonical,
              name: title,
              description,
              isPartOf: { '@id': `${PRODUCTION_ORIGIN}/#website` },
            },
            {
              '@type': 'VideoGame',
              name: gameTitle,
              description,
              genre: category,
              image: ogImage,
              url: canonical,
              playMode: 'SinglePlayer',
              applicationCategory: 'Game',
              operatingSystem: 'Web Browser',
              publisher: { '@id': `${PRODUCTION_ORIGIN}/#organization` },
            },
            {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: `${PRODUCTION_ORIGIN}/` },
                {
                  '@type': 'ListItem',
                  position: 2,
                  name: category,
                  item: hasCategoryPage
                    ? `${PRODUCTION_ORIGIN}/category/${categorySlug}`
                    : `${PRODUCTION_ORIGIN}/categories`,
                },
                { '@type': 'ListItem', position: 3, name: gameTitle, item: canonical },
              ],
            },
          ],
        },
      };
    }
  }

  const privateTitles: Record<string, string> = {
    '/favorites': 'Favorite Games – ProtoX Games',
    '/recent': 'Recently Played Games – ProtoX Games',
    '/settings': 'Settings – ProtoX Games',
    '/profile': 'Player Profile – ProtoX Games',
  };

  if (privateTitles[clean]) {
    const title = privateTitles[clean];
    const canonical = `${PRODUCTION_ORIGIN}${clean}`;
    const description = 'Manage your ProtoX Games library, preferences, and saved favorites.';
    return {
      status: 200,
      title,
      description,
      canonical,
      robots: NOINDEX_ROBOTS,
      ogType: 'website',
      ogImage: DEFAULT_OG_IMAGE,
      jsonLd: {
        '@context': 'https://schema.org',
        '@graph': [...buildBaseNodes()],
      },
    };
  }

  return {
    status: 404,
    title: 'Page Not Found – ProtoX Games',
    description: 'The requested ProtoX Games page or game route could not be found.',
    canonical: `${PRODUCTION_ORIGIN}/`,
    robots: 'noindex, nofollow',
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [...buildBaseNodes()],
    },
  };
}
