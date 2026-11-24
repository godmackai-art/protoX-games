import type React from 'react';
import { Compass, Flame, Gamepad2, Play, Star } from 'lucide-react';
import { motion } from 'motion/react';
import type { NormalizedGame } from '../types/game';
import { GameThumbnail } from './GameThumbnail';

interface HeroSectionProps {
  totalGames: number;
  totalCategories: number;
  featuredGame?: NormalizedGame;
  showcaseGames: NormalizedGame[];
  favoritesCount: number;
  totalSessions: number;
  onExploreGames: () => void;
  onDiscoverTrending: () => void;
  onSelectGenre: (genre: string) => void;
  onLaunchFeatured: (game: NormalizedGame) => void;
}

const DESKTOP_QUICK_GENRES = [
  'All Games',
  'Action',
  'Racing',
  'Shooting',
  'Multiplayer',
  'Puzzle',
  'Sports',
  'Arcade',
  'Adventure',
  '3D',
  'Strategy',
];

function genreToHref(genre: string): string {
  if (genre === 'All Games') return '/games';
  return `/category/${encodeURIComponent(genre.toLowerCase())}`;
}

export function HeroSection({
  totalGames,
  totalCategories,
  featuredGame,
  showcaseGames,
  favoritesCount,
  totalSessions,
  onExploreGames,
  onDiscoverTrending,
  onSelectGenre,
  onLaunchFeatured,
}: HeroSectionProps) {
  const spaClick = (fn: () => void) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    fn();
  };

  return (
    <>
      {/* Desktop CrazyGames Showcase Mosaic (lg+) */}
      <section aria-label="Featured games showcase" className="hidden space-y-4 lg:block">
        {/* Quick Genre Chips Strip (Crawlable Links) */}
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-0.5">
          <a
            href="/trending"
            onClick={spaClick(onDiscoverTrending)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-[#8B5CF6]/45 bg-[#8B5CF6]/20 px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap text-white transition hover:bg-[#8B5CF6]/30"
          >
            <Flame className="h-3.5 w-3.5 text-[#06B6D4]" />
            Trending
          </a>
          {DESKTOP_QUICK_GENRES.map((genre) => (
            <a
              key={genre}
              href={genreToHref(genre)}
              onClick={spaClick(() => onSelectGenre(genre))}
              className="shrink-0 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap text-[#A1A1B5] transition hover:border-white/25 hover:bg-white/10 hover:text-white"
            >
              {genre}
            </a>
          ))}
        </div>

        {/* CrazyGames Bento Grid: Left Spotlight Banner + Right 3x2 Instant Play Mosaic */}
        <div className="grid grid-cols-12 items-stretch gap-3.5">
          {/* Left Hero Spotlight */}
          <div className="glass-panel-deep relative col-span-6 flex min-h-[300px] flex-col justify-between overflow-hidden rounded-2xl p-6">
            <img
              src="/assets/aistudio/Neon_Web_Games_Hub__2__1ce608a6.webp"
              alt="ProtoX Games – Play Free Online Action, Adventure, Racing, Puzzle, and Arcade Games"
              fetchPriority="high"
              decoding="async"
              className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-55"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#080B16]/95 via-[#080B16]/75 to-[#080B16]/35" />

            <div className="relative z-10 flex items-center justify-between gap-3">
              <span className="text-xs font-semibold text-[#06B6D4]">
                {totalGames.toLocaleString()} Playable Titles · {totalCategories} Genres · Zero Downloads
              </span>
              {featuredGame && (
                <span className="inline-flex items-center gap-1 font-mono text-xs text-amber-300">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  {featuredGame.rating}
                </span>
              )}
            </div>

            <div className="relative z-10 my-auto py-3">
              <h1 className="max-w-lg font-display text-3xl leading-[1.06] font-bold tracking-tight text-white text-balance xl:text-4xl">
                YOUR NEXT GAME{' '}
                <span className="bg-gradient-to-r from-[#A78BFA] via-white to-[#06B6D4] bg-clip-text text-transparent">
                  STARTS HERE.
                </span>
              </h1>
              <p className="mt-2 max-w-md text-xs leading-relaxed text-[#A1A1B5] xl:text-sm">
                Discover thousands of free online games at ProtoX Games across action, adventure, racing, puzzle, sports, and arcade. Play instantly in your browser.
              </p>
            </div>

            <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2.5">
                {featuredGame && (
                  <a
                    href={`/game/${featuredGame.slug}`}
                    onClick={spaClick(() => onLaunchFeatured(featuredGame))}
                    className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] px-4 py-2 text-xs font-semibold whitespace-nowrap text-white shadow-lg shadow-[#8B5CF6]/30 transition hover:brightness-110"
                  >
                    <Play className="h-3.5 w-3.5 fill-current" />
                    Play {featuredGame.title}
                  </a>
                )}
                <a
                  href="/games"
                  onClick={spaClick(onExploreGames)}
                  className="glass-card inline-flex min-h-[40px] items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold whitespace-nowrap text-white hover:border-[#06B6D4]/50"
                >
                  <Gamepad2 className="h-3.5 w-3.5 text-[#06B6D4]" />
                  All Games
                </a>
              </div>
              <span className="font-mono text-xs text-[#A1A1B5]">
                {totalSessions > 0 ? `${totalSessions} runs` : `${favoritesCount} saved`}
              </span>
            </div>
          </div>

          {/* Right 3x2 Featured Quick-Play Mosaic (Crawlable Links) */}
          <div className="col-span-6 grid grid-cols-3 grid-rows-2 gap-3">
            {showcaseGames.slice(0, 6).map((game, idx) => (
              <a
                key={game.id}
                href={`/game/${game.slug}`}
                onClick={spaClick(() => onLaunchFeatured(game))}
                className="group relative overflow-hidden rounded-xl border border-white/12 bg-[#101629] text-left transition duration-200 hover:-translate-y-0.5 hover:border-[#8B5CF6]/65 hover:shadow-lg hover:shadow-[#8B5CF6]/20"
              >
                <GameThumbnail game={game} hoverZoom priority={idx < 3} />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#080B16]/95 via-[#080B16]/25 to-transparent" />
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] text-white shadow-md">
                    <Play className="ml-0.5 h-4 w-4 fill-current" />
                  </span>
                </div>
                <div className="absolute inset-x-0 bottom-0 p-2.5">
                  <p className="line-clamp-1 font-display text-xs font-bold text-white group-hover:text-[#A78BFA]">
                    {game.title}
                  </p>
                  <p className="truncate text-[10px] text-[#A1A1B5]">{game.category}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Mobile Layout Preserved (< lg) */}
      <section
        aria-label="Featured arcade showcase"
        className="glass-panel-deep relative overflow-hidden rounded-3xl p-6 sm:p-8 lg:hidden"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-28 -left-24 h-80 w-80 rounded-full bg-[#8B5CF6]/25 blur-[95px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -bottom-28 h-80 w-80 rounded-full bg-[#06B6D4]/20 blur-[95px]"
        />

        <div className="relative z-10 grid items-center gap-8">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#A78BFA]">
              <span>Instant Browser Gaming Hub</span>
            </div>

            <h1 className="mt-3 font-display text-4xl leading-[1.03] font-bold tracking-tight text-white sm:text-5xl">
              YOUR NEXT GAME
              <br />
              <span className="bg-gradient-to-r from-[#A78BFA] via-white to-[#06B6D4] bg-clip-text text-transparent">
                STARTS HERE.
              </span>
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#A1A1B5] sm:text-base">
              Discover thousands of free online games at ProtoX Games. Explore action, adventure, racing, puzzle, sports, and arcade games instantly in your browser.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a
                href="/games"
                onClick={spaClick(onExploreGames)}
                className="inline-flex min-h-[48px] items-center gap-2 rounded-2xl bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#8B5CF6]/30 transition hover:brightness-110"
              >
                <Gamepad2 className="h-4 w-4" />
                Explore Games
              </a>

              <a
                href="/trending"
                onClick={spaClick(onDiscoverTrending)}
                className="glass-card inline-flex min-h-[48px] items-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold text-white hover:border-[#06B6D4]/50"
              >
                <Compass className="h-4 w-4 text-[#06B6D4]" />
                Discover Trending
              </a>
            </div>

            <div className="mt-7 grid grid-cols-3 gap-3">
              <div className="glass-card rounded-2xl p-3.5">
                <p className="text-[11px] font-medium text-[#A1A1B5]">Playable Titles</p>
                <p className="mt-1 font-mono text-lg font-bold text-white sm:text-xl">
                  {totalGames.toLocaleString()}
                </p>
              </div>
              <div className="glass-card rounded-2xl p-3.5">
                <p className="text-[11px] font-medium text-[#A1A1B5]">Game Genres</p>
                <p className="mt-1 font-mono text-lg font-bold text-[#A78BFA] sm:text-xl">
                  {totalCategories}
                </p>
              </div>
              <div className="glass-card rounded-2xl p-3.5">
                <p className="text-[11px] font-medium text-[#A1A1B5]">Your Activity</p>
                <p className="mt-1 font-mono text-lg font-bold text-[#06B6D4] sm:text-xl">
                  {totalSessions > 0 ? `${totalSessions} runs` : `${favoritesCount} saved`}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="relative"
          >
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-3xl border border-white/15 bg-[#101629] shadow-2xl shadow-black/60">
              <img
                src="/assets/aistudio/Neon_Web_Games_Hub__2__1ce608a6.webp"
                alt="ProtoX Games – Free Instant Browser Games Hub"
                decoding="async"
                className="h-full w-full object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#080B16] via-[#080B16]/25 to-transparent" />

              {featuredGame && (
                <div className="glass-panel-deep absolute right-3.5 bottom-3.5 left-3.5 flex flex-col justify-between gap-3 rounded-2xl p-3.5 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="h-12 w-16 shrink-0 overflow-hidden rounded-xl border border-white/15 bg-[#080B16]">
                      <GameThumbnail game={featuredGame} hoverZoom={false} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-[#06B6D4]">
                          {featuredGame.category}
                        </span>
                        <span className="inline-flex items-center gap-0.5 font-mono text-[11px] text-amber-300">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          {featuredGame.rating}
                        </span>
                      </div>
                      <h2 className="truncate font-display text-sm font-bold text-white sm:text-base">
                        {featuredGame.title}
                      </h2>
                    </div>
                  </div>

                  <a
                    href={`/game/${featuredGame.slug}`}
                    onClick={spaClick(() => onLaunchFeatured(featuredGame))}
                    className="inline-flex min-h-[40px] shrink-0 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] px-4 py-2 text-xs font-semibold text-white shadow-md shadow-[#8B5CF6]/25 transition hover:brightness-110"
                  >
                    <Play className="h-3.5 w-3.5 fill-current" />
                    Play Now
                  </a>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
