import { useMemo, useRef } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, Flame, Heart, Play } from 'lucide-react';
import type { NormalizedGame, PlayHistoryEntry, SupportAmountDollars } from '../types/game';
import { GameCard } from './GameCard';
import { GameThumbnail } from './GameThumbnail';
import { InfiniteGameGrid } from './InfiniteGameGrid';
import { SupportReminderBanner } from './SupportReminderBanner';

interface HomeViewProps {
  games: NormalizedGame[];
  favorites: Record<string, boolean>;
  playHistory: Record<string, PlayHistoryEntry>;
  reminderDismissed: boolean;
  onDismissReminder: () => void;
  onSelectGame: (game: NormalizedGame) => void;
  onToggleFavorite: (game: NormalizedGame) => void;
  onBrowseGenre: (genre: string) => void;
  onOpenSupportModal: (amount?: SupportAmountDollars) => void;
}

function HorizontalGameRail({
  title,
  subtitle,
  games,
  favorites,
  playHistory,
  onSelectGame,
  onToggleFavorite,
  onViewAll,
}: {
  title: string;
  subtitle?: string;
  games: NormalizedGame[];
  favorites: Record<string, boolean>;
  playHistory: Record<string, PlayHistoryEntry>;
  onSelectGame: (game: NormalizedGame) => void;
  onToggleFavorite: (game: NormalizedGame) => void;
  onViewAll?: () => void;
}) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  if (games.length === 0) return null;

  const scrollByAmount = (delta: number) => {
    scrollerRef.current?.scrollBy({ left: delta, behavior: 'smooth' });
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-bold text-white sm:text-xl">{title}</h2>
          {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-1 sm:flex">
            <button
              type="button"
              onClick={() => scrollByAmount(-520)}
              aria-label={`Scroll ${title} left`}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-[#0F151E] text-slate-300 transition hover:border-white/25 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollByAmount(520)}
              aria-label={`Scroll ${title} right`}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-[#0F151E] text-slate-300 transition hover:border-white/25 hover:text-white"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          {onViewAll && (
            <button
              type="button"
              onClick={onViewAll}
              className="inline-flex min-h-[36px] items-center gap-1 text-xs font-semibold text-emerald-400 transition hover:text-emerald-300"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="flex gap-3.5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {games.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            compact
            isFavorite={Boolean(favorites[game.id])}
            stats={playHistory[game.id]}
            onSelect={onSelectGame}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </div>
    </section>
  );
}

export function HomeView({
  games,
  favorites,
  playHistory,
  reminderDismissed,
  onDismissReminder,
  onSelectGame,
  onToggleFavorite,
  onBrowseGenre,
  onOpenSupportModal,
}: HomeViewProps) {
  const featuredGame = games[0];
  const quickSpotlight = useMemo(() => games.slice(1, 5), [games]);

  const recentGames = useMemo(() => {
    const ids = Object.keys(playHistory);
    if (ids.length === 0) return [];
    const byId = new Map(games.map((g) => [g.id, g]));
    return ids
      .map((id) => byId.get(id))
      .filter((g): g is NormalizedGame => Boolean(g))
      .slice(0, 12);
  }, [games, playHistory]);

  const genreRails = useMemo(() => {
    const targetGenres = ['Arcade', 'Puzzle', '3d', 'Action', 'Driving', 'Shooting'];
    return targetGenres.map((genre) => {
      const lower = genre.toLowerCase();
      const matched = games
        .filter((g) => g.genres.some((item) => item.toLowerCase() === lower))
        .slice(0, 14);
      return { genre, label: genre === '3d' ? '3D Games' : `${genre} Games`, items: matched };
    });
  }, [games]);

  return (
    <div className="pb-24">
      {/* CrazyGames-style Featured Spotlight Grid */}
      <section className="mx-auto max-w-7xl px-4 pt-5 pb-4 sm:px-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-12">
          {featuredGame && (
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0F151E] lg:col-span-8">
              <div className="relative aspect-[16/9] min-h-[260px] w-full overflow-hidden sm:min-h-[340px]">
                <GameThumbnail game={featuredGame} hoverZoom={false} />
                <div className="absolute inset-0 bg-gradient-to-t from-[#070A0F] via-[#070A0F]/65 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#070A0F]/90 via-[#070A0F]/45 to-transparent" />

                <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8">
                  <div className="flex items-center gap-2 text-xs font-medium text-emerald-400">
                    <Flame className="h-3.5 w-3.5" />
                    <span>Featured Now</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-slate-300">{featuredGame.genres.slice(0, 3).join(' · ')}</span>
                  </div>

                  <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-white sm:text-4xl">
                    {featuredGame.title}
                  </h1>
                  <p className="mt-2 line-clamp-2 max-w-xl text-xs leading-relaxed text-slate-300 sm:text-sm">
                    {featuredGame.description}
                  </p>

                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => onSelectGame(featuredGame)}
                      className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
                    >
                      <Play className="h-4 w-4 fill-current" /> Play Now
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenSupportModal(5)}
                      className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-white/20 bg-black/45 px-4 py-2.5 text-xs font-semibold text-white backdrop-blur-sm transition hover:border-emerald-500/50"
                    >
                      <Heart className="h-3.5 w-3.5 text-emerald-400" /> Support protoX Games
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Right Spotlight Column: 4 Quick Launch Cards */}
          <div className="grid grid-cols-2 gap-3 lg:col-span-4">
            {quickSpotlight.map((game) => (
              <a
                key={game.id}
                href={`/game/${game.slug}`}
                onClick={(e) => {
                  e.preventDefault();
                  onSelectGame(game);
                }}
                className="group relative flex min-h-[128px] flex-col justify-end overflow-hidden rounded-xl border border-white/10 bg-[#0F151E] transition hover:border-emerald-500/50"
              >
                <div className="absolute inset-0">
                  <GameThumbnail game={game} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />
                </div>
                <div className="relative z-10 p-3">
                  <p className="text-[10px] font-medium text-emerald-400">{game.category}</p>
                  <p className="mt-0.5 truncate font-display text-xs font-bold text-white sm:text-sm">
                    {game.title}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Continue Playing Rail (if user has played games) */}
      <HorizontalGameRail
        title="Continue Playing"
        subtitle="Jump back into your recent browser sessions"
        games={recentGames}
        favorites={favorites}
        playHistory={playHistory}
        onSelectGame={onSelectGame}
        onToggleFavorite={onToggleFavorite}
      />

      {/* Top Genre Discovery Rails */}
      {genreRails.slice(0, 2).map((rail) => (
        <HorizontalGameRail
          key={rail.genre}
          title={rail.label}
          games={rail.items}
          favorites={favorites}
          playHistory={playHistory}
          onSelectGame={onSelectGame}
          onToggleFavorite={onToggleFavorite}
          onViewAll={() => onBrowseGenre(rail.genre)}
        />
      ))}

      {/* Support Reminder Banner */}
      {!reminderDismissed && (
        <SupportReminderBanner
          onOpenSupportModal={onOpenSupportModal}
          onDismiss={onDismissReminder}
        />
      )}

      {genreRails.slice(2, 5).map((rail) => (
        <HorizontalGameRail
          key={rail.genre}
          title={rail.label}
          games={rail.items}
          favorites={favorites}
          playHistory={playHistory}
          onSelectGame={onSelectGame}
          onToggleFavorite={onToggleFavorite}
          onViewAll={() => onBrowseGenre(rail.genre)}
        />
      ))}

      {/* Infinite FlatList Game Feed */}
      <section className="mx-auto mt-4 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-end justify-between border-b border-white/10 pb-3">
          <div>
            <h2 className="font-display text-xl font-bold text-white sm:text-2xl">
              Discover All Games
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Infinite scroll across {games.length.toLocaleString()} real HTML5 titles
            </p>
          </div>
          <button
            type="button"
            onClick={() => onBrowseGenre('All Games')}
            className="inline-flex min-h-[40px] items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
          >
            Filter Catalog <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <InfiniteGameGrid
          games={games}
          favorites={favorites}
          playHistory={playHistory}
          onSelectGame={onSelectGame}
          onToggleFavorite={onToggleFavorite}
          batchSize={28}
        />
      </section>
    </div>
  );
}
