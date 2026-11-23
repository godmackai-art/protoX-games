import { useRef } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import type { NormalizedGame, PlayHistoryEntry, SupportAmountDollars } from '../types/game';
import type { DiscoveryShelf } from '../utils/catalog';
import { GameCard } from './GameCard';
import { SupportReminderBanner } from './SupportReminderBanner';

interface DiscoveryShelvesProps {
  shelves: DiscoveryShelf[];
  favorites: Record<string, boolean>;
  playHistory: Record<string, PlayHistoryEntry>;
  reminderDismissed: boolean;
  compactCards?: boolean;
  onDismissReminder: () => void;
  onSelectGame: (game: NormalizedGame) => void;
  onToggleFavorite: (game: NormalizedGame) => void;
  onExploreGenre: (genre: string) => void;
  onOpenSupport: (amount: SupportAmountDollars) => void;
}

function DesktopShelfCarousel({
  shelf,
  favorites,
  playHistory,
  onSelectGame,
  onToggleFavorite,
  onExploreGenre,
}: {
  shelf: DiscoveryShelf;
  favorites: Record<string, boolean>;
  playHistory: Record<string, PlayHistoryEntry>;
  onSelectGame: (game: NormalizedGame) => void;
  onToggleFavorite: (game: NormalizedGame) => void;
  onExploreGenre: (genre: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const scrollRow = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const distance = Math.max(480, el.clientWidth * 0.78);
    el.scrollBy({
      left: direction === 'left' ? -distance : distance,
      behavior: 'smooth',
    });
  };

  return (
    <section aria-label={shelf.title} className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-baseline gap-3">
          <h2 className="font-display text-lg font-bold tracking-tight text-white xl:text-xl">
            {shelf.title}
          </h2>
          <button
            type="button"
            onClick={() => onExploreGenre(shelf.filterGenre)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#A78BFA] transition hover:text-[#06B6D4]"
          >
            <span>View more</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => scrollRow('left')}
            aria-label={`Scroll ${shelf.title} left`}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/5 text-[#A1A1B5] transition hover:border-white/30 hover:bg-white/10 hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollRow('right')}
            aria-label={`Scroll ${shelf.title} right`}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/5 text-[#A1A1B5] transition hover:border-white/30 hover:bg-white/10 hover:text-white"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="no-scrollbar flex gap-3.5 overflow-x-auto scroll-smooth pb-1"
      >
        {shelf.games.slice(0, 14).map((game, idx) => (
          <div key={`${shelf.id}-${game.id}`} className="w-[216px] shrink-0 xl:w-[234px]">
            <GameCard
              game={game}
              variant="tile"
              isFavorite={Boolean(favorites[game.id])}
              stats={playHistory[game.id]}
              isTrending={shelf.id === 'trending'}
              index={idx}
              onSelect={onSelectGame}
              onToggleFavorite={onToggleFavorite}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

export function DiscoveryShelves({
  shelves,
  favorites,
  playHistory,
  reminderDismissed,
  compactCards = false,
  onDismissReminder,
  onSelectGame,
  onToggleFavorite,
  onExploreGenre,
  onOpenSupport,
}: DiscoveryShelvesProps) {
  return (
    <div className="space-y-8 lg:space-y-7">
      {shelves.map((shelf, shelfIdx) => (
        <div key={shelf.id} className="space-y-4">
          {/* Desktop CrazyGames Horizontal Carousel (lg+) */}
          <div className="hidden lg:block">
            <DesktopShelfCarousel
              shelf={shelf}
              favorites={favorites}
              playHistory={playHistory}
              onSelectGame={onSelectGame}
              onToggleFavorite={onToggleFavorite}
              onExploreGenre={onExploreGenre}
            />
          </div>

          {/* Mobile Stacked Grid Layout Preserved (< lg) */}
          <section aria-label={shelf.title} className="space-y-4 lg:hidden">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-xl font-bold tracking-tight text-white sm:text-2xl">
                  {shelf.title}
                </h2>
                <p className="mt-0.5 text-xs text-[#A1A1B5] sm:text-sm">{shelf.subtitle}</p>
              </div>

              <button
                type="button"
                onClick={() => onExploreGenre(shelf.filterGenre)}
                className="glass-card inline-flex min-h-[38px] shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap text-white hover:border-[#8B5CF6]/55"
              >
                <span>View All</span>
                <ArrowRight className="h-3.5 w-3.5 text-[#06B6D4]" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {shelf.games.slice(0, 8).map((game, idx) => (
                <GameCard
                  key={`${shelf.id}-${game.id}`}
                  game={game}
                  isFavorite={Boolean(favorites[game.id])}
                  stats={playHistory[game.id]}
                  isTrending={shelf.id === 'trending'}
                  compact={compactCards}
                  index={idx}
                  onSelect={onSelectGame}
                  onToggleFavorite={onToggleFavorite}
                />
              ))}
            </div>
          </section>

          {shelfIdx === 2 && (
            <SupportReminderBanner
              dismissed={reminderDismissed}
              onDismiss={onDismissReminder}
              onOpenSupport={onOpenSupport}
            />
          )}
        </div>
      ))}
    </div>
  );
}
