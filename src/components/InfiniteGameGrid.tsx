import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { NormalizedGame, PlayHistoryEntry } from '../types/game';
import { GameCard } from './GameCard';

interface InfiniteGameGridProps {
  games: NormalizedGame[];
  favorites: Record<string, boolean>;
  playHistory: Record<string, PlayHistoryEntry>;
  onSelectGame: (game: NormalizedGame) => void;
  onToggleFavorite: (game: NormalizedGame) => void;
  batchSize?: number;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function InfiniteGameGrid({
  games,
  favorites,
  playHistory,
  onSelectGame,
  onToggleFavorite,
  batchSize = 30,
  emptyTitle = 'No matching games found',
  emptyDescription = 'Try clearing your search filter or switching genres.',
}: InfiniteGameGridProps) {
  const [visibleCount, setVisibleCount] = useState(batchSize);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setVisibleCount(batchSize);
  }, [games, batchSize]);

  const hasMore = visibleCount < games.length;

  useEffect(() => {
    if (!hasMore) return;
    const target = sentinelRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisibleCount((prev) => Math.min(games.length, prev + batchSize));
        }
      },
      { rootMargin: '500px 0px' }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, games.length, batchSize]);

  if (games.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#0F151E] p-10 text-center">
        <p className="font-display text-lg font-semibold text-white">{emptyTitle}</p>
        <p className="mt-1 text-sm text-slate-400">{emptyDescription}</p>
      </div>
    );
  }

  const renderedGames = games.slice(0, visibleCount);

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {renderedGames.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            isFavorite={Boolean(favorites[game.id])}
            stats={playHistory[game.id]}
            onSelect={onSelectGame}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </div>

      <div ref={sentinelRef} className="mt-8 flex flex-col items-center justify-center gap-3 py-4">
        <p className="font-mono text-xs text-slate-400">
          Rendered {renderedGames.length.toLocaleString()} of {games.length.toLocaleString()} games
        </p>
        {hasMore && (
          <button
            type="button"
            onClick={() => setVisibleCount((prev) => Math.min(games.length, prev + batchSize))}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-white/15 bg-[#0F151E] px-5 py-2.5 text-xs font-semibold text-slate-200 transition hover:border-emerald-500/45 hover:text-white"
          >
            <Loader2 className="h-3.5 w-3.5 text-emerald-400" />
            Load Next {Math.min(batchSize, games.length - renderedGames.length)} Games
          </button>
        )}
      </div>
    </div>
  );
}
