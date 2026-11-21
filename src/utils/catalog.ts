import type { NormalizedGame, RawGameEntry } from '../types/game';

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
      item.description || `Play ${title} instantly in your browser on protoX Games.`
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
    });
  });

  return normalized;
}
