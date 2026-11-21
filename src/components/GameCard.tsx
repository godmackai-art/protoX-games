import { Heart, Play } from 'lucide-react';
import type { NormalizedGame, PlayHistoryEntry } from '../types/game';
import { GameThumbnail } from './GameThumbnail';

interface GameCardProps {
  game: NormalizedGame;
  isFavorite: boolean;
  stats?: PlayHistoryEntry;
  onSelect: (game: NormalizedGame) => void;
  onToggleFavorite: (game: NormalizedGame) => void;
  compact?: boolean;
}

export function GameCard({
  game,
  isFavorite,
  stats,
  onSelect,
  onToggleFavorite,
  compact = false,
}: GameCardProps) {
  const orientationLabel = game.orientation.horizontal
    ? game.orientation.vertical
      ? 'Any Screen'
      : 'Landscape'
    : 'Portrait';

  return (
    <article
      className={`group flex flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0F151E] transition hover:border-emerald-500/45 ${
        compact ? 'w-[210px] shrink-0 sm:w-[232px]' : 'w-full'
      }`}
    >
      <a
        href={`/game/${game.slug}`}
        onClick={(e) => {
          e.preventDefault();
          onSelect(game);
        }}
        className="relative aspect-[16/10] w-full overflow-hidden bg-[#080C12] focus-visible:outline-2 focus-visible:outline-emerald-400"
      >
        <GameThumbnail game={game} />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500 text-slate-950 shadow-lg">
            <Play className="ml-0.5 h-5 w-5 fill-current" />
          </span>
        </div>
      </a>

      <div className="flex flex-1 items-center justify-between gap-2 px-3.5 py-3">
        <a
          href={`/game/${game.slug}`}
          onClick={(e) => {
            e.preventDefault();
            onSelect(game);
          }}
          className="min-w-0 flex-1 text-left"
        >
          <h3 className="truncate font-display text-sm font-bold text-white transition group-hover:text-emerald-300">
            {game.title}
          </h3>
          <div className="mt-0.5 flex items-center gap-1.5 truncate text-[11px] text-slate-400">
            <span>{game.category}</span>
            <span aria-hidden="true">·</span>
            <span>{orientationLabel}</span>
            {stats && stats.playCount > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono text-emerald-400">{stats.playCount}x</span>
              </>
            )}
          </div>
        </a>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(game);
          }}
          aria-label={isFavorite ? `Remove ${game.title} from favorites` : `Save ${game.title} to favorites`}
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition ${
            isFavorite
              ? 'border-emerald-500/45 bg-emerald-500/15 text-emerald-400'
              : 'border-white/10 bg-[#0A0F17] text-slate-400 hover:border-white/25 hover:text-white'
          }`}
        >
          <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
      </div>
    </article>
  );
}
