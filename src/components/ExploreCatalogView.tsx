import { useEffect, useMemo, useState } from 'react';
import { ArrowUpDown, Search, SlidersHorizontal, X } from 'lucide-react';
import type {
  GameSortOrder,
  GameTypeFilter,
  NormalizedGame,
  PlayHistoryEntry,
  SupportAmountDollars,
} from '../types/game';
import { matchesGenreGroup } from '../utils/catalog';
import { InfiniteGameGrid } from './InfiniteGameGrid';
import { SupportReminderBanner } from './SupportReminderBanner';

interface ExploreCatalogViewProps {
  title: string;
  subtitle: string;
  games: NormalizedGame[];
  favorites: Record<string, boolean>;
  playHistory: Record<string, PlayHistoryEntry>;
  searchQuery: string;
  activeGenre: string;
  sortOrder: GameSortOrder;
  typeFilter: GameTypeFilter;
  reminderDismissed: boolean;
  compactCards?: boolean;
  onDismissReminder: () => void;
  onSearchChange: (value: string) => void;
  onGenreChange: (genre: string) => void;
  onSortChange: (sort: GameSortOrder) => void;
  onTypeFilterChange: (filter: GameTypeFilter) => void;
  onSelectGame: (game: NormalizedGame) => void;
  onToggleFavorite: (game: NormalizedGame) => void;
  onOpenSupport: (amount: SupportAmountDollars) => void;
}

const CURATED_CATEGORIES = [
  'All Games',
  'Action',
  'Racing',
  'Adventure',
  'Puzzle',
  'Sports',
  'Multiplayer',
  'Arcade',
  '3D',
  'Strategy',
  'Simulation',
  'Shooting',
];

export function ExploreCatalogView({
  title,
  subtitle,
  games,
  favorites,
  playHistory,
  searchQuery,
  activeGenre,
  sortOrder,
  typeFilter,
  reminderDismissed,
  compactCards = false,
  onDismissReminder,
  onSearchChange,
  onGenreChange,
  onSortChange,
  onTypeFilterChange,
  onSelectGame,
  onToggleFavorite,
  onOpenSupport,
}: ExploreCatalogViewProps) {
  const [filterTransitioning, setFilterTransitioning] = useState(false);

  useEffect(() => {
    setFilterTransitioning(true);
    const id = setTimeout(() => setFilterTransitioning(false), 120);
    return () => clearTimeout(id);
  }, [activeGenre, sortOrder, typeFilter]);

  const filteredGames = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const list = games.filter((g) => {
      if (activeGenre !== 'All Games' && !matchesGenreGroup(g, activeGenre)) {
        return false;
      }

      if (typeFilter === '3d') {
        const is3d = [...g.genres, ...g.tags].some((tag) => tag.toLowerCase().includes('3d'));
        if (!is3d) return false;
      } else if (typeFilter === 'mobile') {
        if (g.mobileReady.length === 0) return false;
      } else if (typeFilter === 'landscape') {
        if (!g.orientation.horizontal) return false;
      } else if (typeFilter === 'portrait') {
        if (!g.orientation.vertical) return false;
      }

      if (!q) return true;
      return (
        g.title.toLowerCase().includes(q) ||
        g.category.toLowerCase().includes(q) ||
        g.genres.some((item) => item.toLowerCase().includes(q)) ||
        g.tags.some((item) => item.toLowerCase().includes(q))
      );
    });

    if (sortOrder === 'az') {
      return [...list].sort((a, b) => a.title.localeCompare(b.title));
    }
    if (sortOrder === 'newest') {
      return [...list].sort((a, b) => b.catalogIndex - a.catalogIndex);
    }
    return [...list].sort((a, b) => {
      const playsA = playHistory[a.id]?.playCount || 0;
      const playsB = playHistory[b.id]?.playCount || 0;
      const popA = Number(a.rating) * 10 + a.supportedLanguages.length + playsA * 3;
      const popB = Number(b.rating) * 10 + b.supportedLanguages.length + playsB * 3;
      return popB - popA;
    });
  }, [games, searchQuery, activeGenre, sortOrder, typeFilter, playHistory]);

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-3xl p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {title}
            </h1>
            <p className="mt-1 text-xs text-[#A1A1B5] sm:text-sm">{subtitle}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative min-w-[220px] flex-1 sm:w-64 sm:flex-none">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#A1A1B5]" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Filter by title or tag..."
                className="glass-input h-10 w-full rounded-xl pr-8 pl-9 text-xs text-white placeholder:text-[#A1A1B5] focus:border-[#8B5CF6]/70 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  aria-label="Clear filter"
                  className="absolute top-1/2 right-2.5 -translate-y-1/2 text-[#A1A1B5] hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="glass-input flex h-10 items-center gap-1.5 rounded-xl px-3 text-xs text-white">
              <ArrowUpDown className="h-3.5 w-3.5 text-[#A78BFA]" />
              <select
                aria-label="Sort games"
                value={sortOrder}
                onChange={(e) => onSortChange(e.target.value as GameSortOrder)}
                className="bg-transparent text-xs font-medium text-white focus:outline-none"
              >
                <option value="popularity" className="bg-[#101629]">
                  Sort: Popularity
                </option>
                <option value="newest" className="bg-[#101629]">
                  Sort: Recently Added
                </option>
                <option value="az" className="bg-[#101629]">
                  Sort: A – Z
                </option>
              </select>
            </div>

            <div className="glass-input flex h-10 items-center gap-1.5 rounded-xl px-3 text-xs text-white">
              <SlidersHorizontal className="h-3.5 w-3.5 text-[#06B6D4]" />
              <select
                aria-label="Filter game type"
                value={typeFilter}
                onChange={(e) => onTypeFilterChange(e.target.value as GameTypeFilter)}
                className="bg-transparent text-xs font-medium text-white focus:outline-none"
              >
                <option value="all" className="bg-[#101629]">
                  Type: All Games
                </option>
                <option value="3d" className="bg-[#101629]">
                  3D Graphics
                </option>
                <option value="mobile" className="bg-[#101629]">
                  Mobile Ready
                </option>
                <option value="landscape" className="bg-[#101629]">
                  Landscape Mode
                </option>
                <option value="portrait" className="bg-[#101629]">
                  Portrait Mode
                </option>
              </select>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 border-t border-white/10 pt-4">
          {CURATED_CATEGORIES.map((genre) => {
            const active = activeGenre === genre;
            return (
              <button
                key={genre}
                type="button"
                onClick={() => onGenreChange(genre)}
                className={`min-h-[36px] rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                  active
                    ? 'bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] text-white shadow-sm shadow-[#8B5CF6]/30'
                    : 'border border-white/10 bg-white/5 text-[#A1A1B5] hover:border-white/25 hover:text-white'
                }`}
              >
                {genre}
              </button>
            );
          })}
        </div>
      </section>

      <SupportReminderBanner
        dismissed={reminderDismissed}
        onDismiss={onDismissReminder}
        onOpenSupport={onOpenSupport}
      />

      <InfiniteGameGrid
        games={filteredGames}
        favorites={favorites}
        playHistory={playHistory}
        isLoading={filterTransitioning}
        compactCards={compactCards}
        onSelectGame={onSelectGame}
        onToggleFavorite={onToggleFavorite}
        onResetFilters={() => {
          onSearchChange('');
          onGenreChange('All Games');
          onTypeFilterChange('all');
        }}
      />
    </div>
  );
}
