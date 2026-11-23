import { Compass, Flame, Gamepad2, Play, Sparkles, Star } from 'lucide-react';
import { motion } from 'motion/react';
import type { NormalizedGame } from '../types/game';
import { GameThumbnail } from './GameThumbnail';

interface HeroSectionProps {
  totalGames: number;
  totalCategories: number;
  featuredGame?: NormalizedGame;
  favoritesCount: number;
  totalSessions: number;
  onExploreGames: () => void;
  onDiscoverTrending: () => void;
  onLaunchFeatured: (game: NormalizedGame) => void;
}

export function HeroSection({
  totalGames,
  totalCategories,
  featuredGame,
  favoritesCount,
  totalSessions,
  onExploreGames,
  onDiscoverTrending,
  onLaunchFeatured,
}: HeroSectionProps) {
  return (
    <section
      aria-label="Featured arcade showcase"
      className="glass-panel-deep relative overflow-hidden rounded-3xl p-6 sm:p-8 lg:p-10"
    >
      {/* Ambient Animated Background Lighting */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-28 -left-24 h-80 w-80 rounded-full bg-[#8B5CF6]/25 blur-[95px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -bottom-28 h-80 w-80 rounded-full bg-[#06B6D4]/20 blur-[95px]"
      />

      <div className="relative z-10 grid items-center gap-8 lg:grid-cols-12">
        {/* Left Copy & CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="lg:col-span-6"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-[#8B5CF6]/40 bg-[#8B5CF6]/15 px-3.5 py-1.5 text-xs font-semibold text-[#A78BFA]">
            <Sparkles className="h-3.5 w-3.5 text-[#06B6D4]" />
            <span>Instant Browser Gaming Hub</span>
          </div>

          <h1 className="mt-5 font-display text-4xl leading-[1.03] font-bold tracking-tight text-white sm:text-5xl xl:text-[56px]">
            YOUR NEXT GAME
            <br />
            <span className="bg-gradient-to-r from-[#A78BFA] via-white to-[#06B6D4] bg-clip-text text-transparent">
              STARTS HERE.
            </span>
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#A1A1B5] sm:text-base">
            Explore thousands of incredible games. Play instantly. No downloads. Just pure gaming.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onExploreGames}
              className="inline-flex min-h-[48px] items-center gap-2 rounded-2xl bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#8B5CF6]/30 transition hover:brightness-110"
            >
              <Gamepad2 className="h-4 w-4" />
              Explore Games
            </button>

            <button
              type="button"
              onClick={onDiscoverTrending}
              className="glass-card inline-flex min-h-[48px] items-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold text-white hover:border-[#06B6D4]/50"
            >
              <Compass className="h-4 w-4 text-[#06B6D4]" />
              Discover Trending
            </button>
          </div>

          {/* Floating Real Stats Bar */}
          <div className="mt-8 grid grid-cols-3 gap-3">
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

        {/* Right Cinematic Artwork + Featured Trending Spotlight */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="relative lg:col-span-6"
        >
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-3xl border border-white/15 bg-[#101629] shadow-2xl shadow-black/60">
            <img
              src="/assets/aistudio/Neon_Web_Games_Hub__2__1ce608a6.webp"
              alt="ProtoX Games cinematic browser showcase"
              className="h-full w-full object-cover"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#080B16] via-[#080B16]/25 to-transparent" />

            {/* Top Floating Trending Badge */}
            <div className="absolute top-3.5 left-3.5 inline-flex items-center gap-1.5 rounded-full border border-[#8B5CF6]/50 bg-[#080B16]/75 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
              <Flame className="h-3.5 w-3.5 text-[#06B6D4]" />
              <span>Featured Spotlight</span>
            </div>

            {/* Bottom Floating Featured Game Glass Panel */}
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

                <button
                  type="button"
                  onClick={() => onLaunchFeatured(featuredGame)}
                  className="inline-flex min-h-[40px] shrink-0 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] px-4 py-2 text-xs font-semibold text-white shadow-md shadow-[#8B5CF6]/25 transition hover:brightness-110"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  Play Now
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
