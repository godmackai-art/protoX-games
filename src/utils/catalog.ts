import type { NormalizedGame, PlayHistoryEntry, RawGameEntry } from '../types/game';

export function formatLabel(raw: string): string {
  const cleaned = raw.trim().replace(/[-_]+/g, ' ');
  if (!cleaned) return '';
  return cleaned
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .slice(0, 50);
}

export function extractIframeSrc(embedHtml?: string): string {
  if (!embedHtml) return '';
  const match = embedHtml.match(/src\s*=\s*['"]([^'"]+)['"]/i);
  return match ? match[1] : '';
}

export function sanitizeFirestoreId(raw: string, fallbackIndex: number): string {
  const cleaned = raw
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 120);
  return cleaned || `game_${fallbackIndex}`;
}

export function sanitizeSlug(raw: string, fallbackIndex: number): string {
  const cleaned = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
  return cleaned || `game-${fallbackIndex}`;
}

function computeMetadataRating(item: RawGameEntry, genresLen: number, tagsLen: number): string {
  // Deterministic compatibility/quality score derived strictly from real catalog richness fields
  let score = 4.2;
  if (item.mobileReady && item.mobileReady.length >= 2) score += 0.25;
  if (item.supportedLanguages && item.supportedLanguages.length >= 4) score += 0.2;
  if (item.howToPlayText && item.howToPlayText.length > 20) score += 0.15;
  if (genresLen >= 3) score += 0.1;
  if (tagsLen >= 3) score += 0.05;
  return Math.min(4.9, score).toFixed(1);
}

export function normalizeGamesInput(source: unknown): NormalizedGame[] {
  let entries: [string, RawGameEntry][] = [];

  if (Array.isArray(source)) {
    entries = source.map((item, idx) => {
      const obj = (item && typeof item === 'object' ? item : {}) as RawGameEntry;
      return [obj.slug || obj.id || obj.title || obj.name || `game_${idx}`, obj];
    });
  } else if (source && typeof source === 'object') {
    const record = source as Record<string, unknown>;
    if (Array.isArray(record.segments)) {
      const hits = (record.segments as { hits?: RawGameEntry[] }[]).flatMap((s) => s.hits ?? []);
      entries = hits.map((item, idx) => [
        item.slug || item.id || item.title || item.name || `game_${idx}`,
        item,
      ]);
    } else if (Array.isArray(record.games)) {
      entries = record.games.map((item, idx) => {
        const obj = (item && typeof item === 'object' ? item : {}) as RawGameEntry;
        return [obj.slug || obj.id || obj.title || obj.name || `game_${idx}`, obj];
      });
    } else {
      entries = Object.entries(record).map(([key, val]) => [
        key,
        (val && typeof val === 'object' ? val : {}) as RawGameEntry,
      ]);
    }
  }

  const seenIds = new Set<string>();
  const seenSlugs = new Set<string>();
  const normalized: NormalizedGame[] = [];

  entries.forEach(([rawKey, item], idx) => {
    const url = (
      item.url ||
      item.gameURL ||
      item.embedUrl ||
      item.iframeUrl ||
      extractIframeSrc(item.embed) ||
      item.playgamaGameUrl ||
      ''
    ).trim();

    if (!url) return;

    let id = sanitizeFirestoreId(item.slug || item.id || rawKey, idx);
    if (seenIds.has(id)) {
      id = `${id.slice(0, 110)}_${idx}`;
    }
    seenIds.add(id);

    let slug = sanitizeSlug(item.slug || item.title || item.id || rawKey, idx);
    if (seenSlugs.has(slug)) {
      slug = `${slug.slice(0, 110)}-${idx}`;
    }
    seenSlugs.add(slug);

    const title = (item.title || item.name || rawKey || `Game ${idx + 1}`).trim().slice(0, 120);
    const rawGenres = [
      ...(Array.isArray(item.genres) ? item.genres : []),
      ...(item.category ? [item.category] : []),
      ...(item.genre ? [item.genre] : []),
    ]
      .map(formatLabel)
      .filter(Boolean);

    const uniqueGenres = Array.from(new Set(rawGenres));
    const category = uniqueGenres[0] || 'Arcade';
    if (uniqueGenres.length === 0) uniqueGenres.push(category);

    const uniqueTags = Array.from(
      new Set((Array.isArray(item.tags) ? item.tags : []).map(formatLabel).filter(Boolean))
    );

    const thumb = (
      item.thumb ||
      item.thumbnail ||
      item.image ||
      (Array.isArray(item.images) ? item.images[0] || item.images[1] || '' : '')
    ).trim();

    const icon = (
      (Array.isArray(item.images) ? item.images[1] || item.images[0] : '') ||
      thumb
    ).trim();

    const description = (
      item.description || `Play ${title} instantly in your browser on ProtoX Games.`
    )
      .replace(/\r\n/g, '\n')
      .trim();

    const mobileReady = Array.isArray(item.mobileReady) ? item.mobileReady : [];
    const supportedLanguages = Array.isArray(item.supportedLanguages) ? item.supportedLanguages : [];

    normalized.push({
      id,
      slug,
      title,
      category,
      genres: uniqueGenres,
      tags: uniqueTags,
      url,
      playgamaGameUrl: item.playgamaGameUrl?.trim() || undefined,
      thumb,
      icon,
      description,
      howToPlayText: item.howToPlayText?.trim() || undefined,
      mobileReady,
      supportedLanguages,
      orientation: {
        horizontal: item.screenOrientation?.horizontal ?? true,
        vertical: item.screenOrientation?.vertical ?? false,
      },
      inGamePurchases: item.inGamePurchases,
      rating: computeMetadataRating(item, uniqueGenres.length, uniqueTags.length),
      catalogIndex: idx,
    });
  });

  return normalized;
}

export function matchesGenreGroup(game: NormalizedGame, groupName: string): boolean {
  const lowerTarget = groupName.toLowerCase();
  const hay = [...game.genres, ...game.tags].map((x) => x.toLowerCase());

  if (lowerTarget === 'all games') return true;
  if (lowerTarget === 'racing') {
    return hay.some((h) => h.includes('racing') || h.includes('driving') || h.includes('car'));
  }
  if (lowerTarget === 'sports') {
    return hay.some(
      (h) =>
        h.includes('sport') ||
        h.includes('soccer') ||
        h.includes('basketball') ||
        h.includes('football') ||
        h.includes('golf')
    );
  }
  return hay.some((h) => h === lowerTarget || h.includes(lowerTarget));
}

export interface DiscoveryShelf {
  id: string;
  title: string;
  subtitle: string;
  filterGenre: string;
  games: NormalizedGame[];
  badge?: string;
}

export function buildDiscoveryShelves(
  games: NormalizedGame[],
  playHistory: Record<string, PlayHistoryEntry>
): DiscoveryShelf[] {
  const withThumb = games.filter((g) => Boolean(g.thumb));
  const pool = withThumb.length >= 40 ? withThumb : games;

  // Trending: rich multi-language / multi-platform games ordered cleanly
  const trending = [...pool]
    .sort((a, b) => {
      const scoreA = Number(a.rating) * 10 + a.supportedLanguages.length + a.genres.length;
      const scoreB = Number(b.rating) * 10 + b.supportedLanguages.length + b.genres.length;
      return scoreB - scoreA;
    })
    .slice(0, 12);

  // Most Played: personal playHistory first, followed by top flagship catalog picks
  const historyList = Object.values(playHistory).sort((a, b) => b.playCount - a.playCount);
  const playedIds = new Set(historyList.map((h) => h.gameId));
  const playedGames = historyList
    .map((h) => games.find((g) => g.id === h.gameId))
    .filter((g): g is NormalizedGame => Boolean(g));
  const mostPlayedFallback = pool.filter((g) => !playedIds.has(g.id)).slice(12, 24);
  const mostPlayed = [...playedGames, ...mostPlayedFallback].slice(0, 12);

  // New Releases: tail of catalog reversed so newest additions show first
  const newReleases = [...pool].reverse().slice(0, 12);

  const pickByGroup = (group: string, limit = 12): NormalizedGame[] =>
    pool.filter((g) => matchesGenreGroup(g, group)).slice(0, limit);

  return [
    {
      id: 'trending',
      title: 'Trending Games',
      subtitle: 'Top-rated instant browser hits across desktop and mobile.',
      filterGenre: 'All Games',
      badge: 'Trending',
      games: trending,
    },
    {
      id: 'most-played',
      title: 'Most Played',
      subtitle: 'Your most launched sessions paired with player favorites.',
      filterGenre: 'All Games',
      games: mostPlayed,
    },
    {
      id: 'new-releases',
      title: 'New Releases',
      subtitle: 'Fresh arrivals ready to launch with zero downloads.',
      filterGenre: 'All Games',
      games: newReleases,
    },
    {
      id: 'action',
      title: 'Action Games',
      subtitle: 'High-tempo combat, shooters, and reflex challenges.',
      filterGenre: 'Action',
      games: pickByGroup('Action'),
    },
    {
      id: 'racing',
      title: 'Racing Games',
      subtitle: 'High-speed street racers, drift tracks, and stunt rigs.',
      filterGenre: 'Racing',
      games: pickByGroup('Racing'),
    },
    {
      id: 'adventure',
      title: 'Adventure Games',
      subtitle: 'Story worlds, exploration quests, and survival journeys.',
      filterGenre: 'Adventure',
      games: pickByGroup('Adventure'),
    },
    {
      id: 'puzzle',
      title: 'Puzzle Games',
      subtitle: 'Logic boards, spatial brain teasers, and strategy grids.',
      filterGenre: 'Puzzle',
      games: pickByGroup('Puzzle'),
    },
    {
      id: 'sports',
      title: 'Sports Games',
      subtitle: 'Soccer arenas, basketball showdowns, and arcade golf.',
      filterGenre: 'Sports',
      games: pickByGroup('Sports'),
    },
    {
      id: 'multiplayer',
      title: 'Multiplayer Games',
      subtitle: 'Competitive arenas and head-to-head browser action.',
      filterGenre: 'Multiplayer',
      games: pickByGroup('Multiplayer'),
    },
    {
      id: 'arcade',
      title: 'Arcade Classics',
      subtitle: 'Pick-up-and-play score chasers and retro-inspired runs.',
      filterGenre: 'Arcade',
      games: pickByGroup('Arcade'),
    },
  ].filter((shelf) => shelf.games.length > 0);
}
