import { ArrowRight } from 'lucide-react';
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
    <div className="space-y-10">
      {shelves.map((shelf, shelfIdx) => (
        <div key={shelf.id} className="space-y-4">
          <section aria-label={shelf.title} className="space-y-4">
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

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
