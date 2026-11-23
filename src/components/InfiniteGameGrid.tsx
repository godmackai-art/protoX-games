import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { NormalizedGame, PlayHistoryEntry } from '../types/game';
import { GameCard, GameCardSkeleton } from './GameCard';

interface InfiniteGameGridProps {
  games: NormalizedGame[];
  favorites: Record<string, boolean>;
  playHistory: Record<string, PlayHistoryEntry>;
  onSelectGame: (game: NormalizedGame) => void;
  onToggleFavorite: (game: NormalizedGame) => void;
  batchSize?: number;
  isLoading?: boolean;
  compactCards?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onResetFilters?: () => void;
}

export function InfiniteGameGrid({
  games,
  favorites,
  playHistory,
  onSelectGame,
  onToggleFavorite,
  batchSize = 28,
  isLoading = false,
  compactCards = false,
  emptyTitle = 'No matching games found',
  emptyDescription = 'Try clearing your search filter or switching categories.',
  onResetFilters,
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
      { rootMargin: '520px 0px' }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, games.length, batchSize]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <GameCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="glass-panel rounded-3xl p-10 text-center">
        <p className="font-display text-lg font-bold text-white">{emptyTitle}</p>
        <p className="mt-1.5 text-sm text-[#A1A1B5]">{emptyDescription}</p>
        {onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="mt-5 inline-flex min-h-[42px] items-center rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] px-5 py-2 text-xs font-semibold text-white"
          >
            Reset Filters
          </button>
        )}
      </div>
    );
  }

  const renderedGames = games.slice(0, visibleCount);

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {renderedGames.map((game, idx) => (
          <GameCard
            key={game.id}
            game={game}
            isFavorite={Boolean(favorites[game.id])}
            stats={playHistory[game.id]}
            compact={compactCards}
            index={idx % 12}
            onSelect={onSelectGame}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </div>

      <div ref={sentinelRef} className="mt-8 flex flex-col items-center justify-center gap-3 py-4">
        <p className="font-mono text-xs text-[#A1A1B5]">
          Showing {renderedGames.length.toLocaleString()} of {games.length.toLocaleString()} games
        </p>
        {hasMore && (
          <button
            type="button"
            onClick={() => setVisibleCount((prev) => Math.min(games.length, prev + batchSize))}
            className="glass-card inline-flex min-h-[44px] items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold text-white hover:border-[#8B5CF6]/55"
          >
            <Loader2 className="h-3.5 w-3.5 text-[#06B6D4]" />
            Load Next {Math.min(batchSize, games.length - renderedGames.length)} Games
          </button>
        )}
      </div>
    </div>
  );
}
