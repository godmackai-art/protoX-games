import { useMemo } from 'react';
import { Monitor, Search, Smartphone, X } from 'lucide-react';
import type { NormalizedGame, PlayHistoryEntry, SupportAmountDollars } from '../types/game';
import { InfiniteGameGrid } from './InfiniteGameGrid';
import { SupportReminderBanner } from './SupportReminderBanner';

export type OrientationFilter = 'all' | 'horizontal' | 'vertical' | 'mobile';

interface GamesViewProps {
  games: NormalizedGame[];
  favorites: Record<string, boolean>;
  playHistory: Record<string, PlayHistoryEntry>;
  searchQuery: string;
  activeGenre: string;
  orientationFilter: OrientationFilter;
  reminderDismissed: boolean;
  onDismissReminder: () => void;
  onSearchChange: (q: string) => void;
  onGenreChange: (genre: string) => void;
  onOrientationChange: (mode: OrientationFilter) => void;
  onSelectGame: (game: NormalizedGame) => void;
  onToggleFavorite: (game: NormalizedGame) => void;
  onOpenSupportModal: (amount?: SupportAmountDollars) => void;
}

export function GamesView({
  games,
  favorites,
  playHistory,
  searchQuery,
  activeGenre,
  orientationFilter,
  reminderDismissed,
  onDismissReminder,
  onSearchChange,
  onGenreChange,
  onOrientationChange,
  onSelectGame,
  onToggleFavorite,
  onOpenSupportModal,
}: GamesViewProps) {
  const genres = useMemo(() => {
    const counts = new Map<string, number>();
    games.forEach((g) => {
      g.genres.forEach((genre) => {
        counts.set(genre, (counts.get(genre) || 0) + 1);
      });
    });
    const topGenres = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 14)
      .map(([genre]) => genre);
    return ['All Games', ...topGenres, 'Favorites'];
  }, [games]);

  const filteredGames = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return games.filter((g) => {
      if (activeGenre === 'Favorites') {
        if (!favorites[g.id]) return false;
      } else if (activeGenre !== 'All Games') {
        const target = activeGenre.toLowerCase();
        if (!g.genres.some((item) => item.toLowerCase() === target)) return false;
      }

      if (orientationFilter === 'horizontal' && !g.orientation.horizontal) return false;
      if (orientationFilter === 'vertical' && !g.orientation.vertical) return false;
      if (
        orientationFilter === 'mobile' &&
        !g.mobileReady.some((m) => m.toLowerCase().includes('android') || m.toLowerCase().includes('ios'))
      ) {
        return false;
      }

      if (!q) return true;
      return (
        g.title.toLowerCase().includes(q) ||
        g.genres.some((genre) => genre.toLowerCase().includes(q)) ||
        g.tags.some((tag) => tag.toLowerCase().includes(q)) ||
        g.description.toLowerCase().includes(q)
      );
    });
  }, [games, searchQuery, activeGenre, orientationFilter, favorites]);

  const orientationButtons: { id: OrientationFilter; label: string }[] = [
    { id: 'all', label: 'All Screens' },
    { id: 'horizontal', label: 'Landscape' },
    { id: 'vertical', label: 'Portrait' },
    { id: 'mobile', label: 'Mobile Ready' },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 pb-24 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-5 md:flex-row md:items-end">
        <div>
          <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">All Games</h1>
          <p className="mt-1 text-xs text-slate-400 sm:text-sm">
            {filteredGames.length.toLocaleString()} matching titles · Instant play with zero ads
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[230px] flex-1 sm:w-80 sm:flex-none">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search games, genres, tags..."
              className="h-11 w-full rounded-lg border border-white/15 bg-[#0F151E] pr-9 pl-10 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="Clear search"
                className="absolute top-1/2 right-2.5 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Orientation / Device Segmented Filter */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {orientationButtons.map((btn) => {
            const active = orientationFilter === btn.id;
            return (
              <button
                key={btn.id}
                type="button"
                onClick={() => onOrientationChange(btn.id)}
                className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                  active
                    ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300'
                    : 'border-white/10 bg-[#0F151E] text-slate-300 hover:border-white/20 hover:text-white'
                }`}
              >
                {btn.id === 'mobile' && <Smartphone className="h-3.5 w-3.5" />}
                {btn.id === 'horizontal' && <Monitor className="h-3.5 w-3.5" />}
                {btn.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Genre Strip */}
      <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {genres.map((genre) => {
          const active = activeGenre.toLowerCase() === genre.toLowerCase();
          return (
            <button
              key={genre}
              type="button"
              onClick={() => onGenreChange(genre)}
              className={`min-h-[40px] shrink-0 whitespace-nowrap rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
                active
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-[#0F151E] text-slate-300 hover:bg-[#17202D] hover:text-white'
              }`}
            >
              {genre === '3d' ? '3D' : genre}
            </button>
          );
        })}
      </div>

      {!reminderDismissed && (
        <SupportReminderBanner
          compact
          onOpenSupportModal={onOpenSupportModal}
          onDismiss={onDismissReminder}
        />
      )}

      <div className="mt-5">
        <InfiniteGameGrid
          games={filteredGames}
          favorites={favorites}
          playHistory={playHistory}
          onSelectGame={onSelectGame}
          onToggleFavorite={onToggleFavorite}
          batchSize={32}
          emptyDescription={
            activeGenre === 'Favorites'
              ? 'Tap the heart button on any game card to save it to Favorites.'
              : 'Try clearing your search or selecting another genre.'
          }
        />
      </div>
    </div>
  );
}
