import { Flame, Heart, Play, Star } from 'lucide-react';
import { motion } from 'motion/react';
import type { NormalizedGame, PlayHistoryEntry } from '../types/game';
import { GameThumbnail } from './GameThumbnail';

interface GameCardProps {
  game: NormalizedGame;
  isFavorite: boolean;
  stats?: PlayHistoryEntry;
  isTrending?: boolean;
  compact?: boolean;
  variant?: 'card' | 'tile';
  index?: number;
  onSelect: (game: NormalizedGame) => void;
  onToggleFavorite: (game: NormalizedGame) => void;
}

export function GameCard({
  game,
  isFavorite,
  stats,
  isTrending = false,
  compact = false,
  variant = 'card',
  index = 0,
  onSelect,
  onToggleFavorite,
}: GameCardProps) {
  if (variant === 'tile') {
    return (
      <article className="group relative overflow-hidden rounded-xl border border-white/12 bg-[#101629] transition duration-200 hover:-translate-y-1 hover:border-[#8B5CF6]/65 hover:shadow-xl hover:shadow-[#8B5CF6]/15">
        <div
          role="button"
          tabIndex={0}
          onClick={() => onSelect(game)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSelect(game);
            }
          }}
          className="relative aspect-[16/10] w-full cursor-pointer overflow-hidden text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]"
        >
          <GameThumbnail game={game} hoverZoom />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#080B16]/95 via-[#080B16]/30 to-transparent opacity-90 transition-opacity group-hover:opacity-100" />

          {/* Top Left Trending / Favorite Top Right */}
          <div className="absolute top-2 right-2 left-2 flex items-center justify-between gap-2">
            {isTrending ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-[#080B16]/80 px-2 py-0.5 text-[10px] font-semibold text-[#A78BFA] backdrop-blur-sm">
                <Flame className="h-3 w-3 text-[#06B6D4]" />
                Hot
              </span>
            ) : (
              <span />
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(game);
              }}
              aria-label={isFavorite ? `Remove ${game.title} from favorites` : `Favorite ${game.title}`}
              className={`flex h-8 w-8 items-center justify-center rounded-lg border backdrop-blur-md transition ${
                isFavorite
                  ? 'border-[#8B5CF6]/65 bg-[#8B5CF6]/35 text-white opacity-100'
                  : 'border-white/15 bg-[#080B16]/70 text-white/80 opacity-0 group-hover:opacity-100 hover:text-white'
              }`}
            >
              <Heart className={`h-3.5 w-3.5 ${isFavorite ? 'fill-[#A78BFA] text-[#A78BFA]' : ''}`} />
            </button>
          </div>

          {/* Center Hover Play Affordance */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] text-white shadow-lg shadow-[#8B5CF6]/40">
              <Play className="ml-0.5 h-4 w-4 fill-current" />
            </span>
          </div>

          {/* Bottom Title Overlay inside media frame */}
          <div className="absolute inset-x-0 bottom-0 p-2.5">
            <h3 className="line-clamp-1 font-display text-xs font-bold tracking-tight text-white group-hover:text-[#A78BFA] sm:text-[13px]">
              {game.title}
            </h3>
            <div className="mt-0.5 flex items-center justify-between gap-2 text-[10px] text-[#A1A1B5]">
              <span className="truncate">{game.category}</span>
              <span className="inline-flex shrink-0 items-center gap-0.5 font-mono text-amber-300">
                <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                {game.rating}
              </span>
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: Math.min(index * 0.025, 0.22) }}
      whileHover={{ y: -4 }}
      className="glass-card group relative flex flex-col overflow-hidden rounded-2xl transition-all duration-300"
    >
      {/* Subtle purple-cyan rim glow on hover */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-br from-[#8B5CF6]/0 via-transparent to-[#06B6D4]/0 opacity-0 transition-opacity duration-300 group-hover:from-[#8B5CF6]/25 group-hover:to-[#06B6D4]/20 group-hover:opacity-100"
      />

      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelect(game)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect(game);
          }
        }}
        className="relative z-10 flex h-full cursor-pointer flex-col text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]"
      >
        {/* Thumbnail Window */}
        <div className={`relative w-full overflow-hidden bg-[#101629] ${compact ? 'aspect-[16/10]' : 'aspect-[16/10]'}`}>
          <GameThumbnail game={game} hoverZoom />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#080B16]/90 via-[#080B16]/15 to-transparent" />

          {/* Top Controls Overlay */}
          <div className="absolute top-2.5 right-2.5 left-2.5 flex items-center justify-between gap-2">
            {isTrending ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-[#8B5CF6]/45 bg-[#080B16]/75 px-2.5 py-1 text-[11px] font-semibold text-[#A78BFA] backdrop-blur-md">
                <Flame className="h-3 w-3 text-[#06B6D4]" />
                Trending
              </span>
            ) : (
              <span className="rounded-full border border-white/15 bg-[#080B16]/65 px-2.5 py-1 text-[11px] font-medium text-white/90 backdrop-blur-md">
                {game.category}
              </span>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(game);
              }}
              aria-label={isFavorite ? `Remove ${game.title} from favorites` : `Favorite ${game.title}`}
              className={`flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur-md transition ${
                isFavorite
                  ? 'border-[#8B5CF6]/60 bg-[#8B5CF6]/30 text-white'
                  : 'border-white/15 bg-[#080B16]/60 text-white/75 hover:border-white/30 hover:text-white'
              }`}
            >
              <Heart className={`h-4 w-4 ${isFavorite ? 'fill-[#A78BFA] text-[#A78BFA]' : ''}`} />
            </button>
          </div>

          {/* Bottom Rating / Play Count inside media frame */}
          <div className="absolute right-3 bottom-2.5 left-3 flex items-center justify-between text-[11px] text-white/90">
            <span className="inline-flex items-center gap-1 font-mono font-medium">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {game.rating}
            </span>
            {stats && stats.playCount > 0 && (
              <span className="font-mono text-[11px] text-[#06B6D4]">
                {stats.playCount} {stats.playCount === 1 ? 'play' : 'plays'}
              </span>
            )}
          </div>
        </div>

        {/* Metadata & Play CTA */}
        <div className="flex flex-1 flex-col justify-between gap-3 p-3.5 sm:p-4">
          <div>
            <h3 className="line-clamp-1 font-display text-sm font-bold tracking-tight text-white transition-colors group-hover:text-[#A78BFA] sm:text-[15px]">
              {game.title}
            </h3>
            <p className="mt-1 line-clamp-1 text-xs text-[#A1A1B5]">
              {game.genres.slice(0, 2).join(' · ')}
            </p>
          </div>

          <div className="flex items-center justify-between gap-2 pt-0.5">
            <span className="text-[11px] text-[#A1A1B5]">
              {game.mobileReady.length > 0 ? 'Desktop & Mobile' : 'Instant Browser'}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-[#8B5CF6]/25 transition group-hover:brightness-110">
              <Play className="h-3 w-3 fill-current" />
              Play Now
            </span>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

export function GameCardSkeleton() {
  return (
    <div className="glass-card overflow-hidden rounded-2xl">
      <div className="aspect-[16/10] w-full animate-pulse bg-white/10" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-3/4 animate-pulse rounded-md bg-white/10" />
        <div className="h-3 w-1/2 animate-pulse rounded-md bg-white/5" />
        <div className="flex items-center justify-between pt-1">
          <div className="h-3 w-20 animate-pulse rounded-md bg-white/5" />
          <div className="h-7 w-24 animate-pulse rounded-xl bg-[#8B5CF6]/25" />
        </div>
      </div>
    </div>
  );
}
