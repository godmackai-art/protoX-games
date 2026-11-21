import { useState } from 'react';
import { Gamepad2 } from 'lucide-react';
import type { NormalizedGame } from '../types/game';

interface GameThumbnailProps {
  game: NormalizedGame;
  className?: string;
  hoverZoom?: boolean;
}

export function GameThumbnail({ game, className = '', hoverZoom = true }: GameThumbnailProps) {
  const [imgFailed, setImgFailed] = useState(false);

  const paletteMap: Record<string, string> = {
    Arcade: 'from-emerald-950 via-[#0B1618] to-[#080C12]',
    Action: 'from-sky-950 via-[#0C1520] to-[#080C12]',
    Puzzle: 'from-teal-950 via-[#0A181B] to-[#080C12]',
    Strategy: 'from-indigo-950 via-[#101322] to-[#080C12]',
    Sports: 'from-lime-950 via-[#0F1811] to-[#080C12]',
    Driving: 'from-cyan-950 via-[#0B171D] to-[#080C12]',
    '3d': 'from-emerald-950 via-[#12161E] to-[#080C12]',
  };

  const gradientClass = paletteMap[game.category] || 'from-slate-900 via-[#0D141D] to-[#080C12]';

  if (game.thumb && !imgFailed) {
    return (
      <img
        src={game.thumb}
        alt={game.title}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setImgFailed(true)}
        className={`h-full w-full object-cover ${
          hoverZoom ? 'transition-transform duration-200 group-hover:scale-[1.04]' : ''
        } ${className}`}
      />
    );
  }

  return (
    <div
      className={`relative flex h-full w-full items-center justify-center bg-gradient-to-br ${gradientClass} p-4 ${className}`}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 160 100"
        className="absolute inset-0 h-full w-full opacity-20"
      >
        <path
          d="M0 20 H160 M0 50 H160 M0 80 H160 M40 0 V100 M80 0 V100 M120 0 V100"
          stroke="#10B981"
          strokeWidth="0.6"
          fill="none"
        />
        <circle cx="80" cy="50" r="26" stroke="#34D399" strokeWidth="1" fill="none" />
      </svg>
      <div className="relative z-10 flex flex-col items-center gap-2 text-center">
        <Gamepad2 className="h-7 w-7 text-emerald-400" />
        <span className="line-clamp-1 max-w-[160px] font-display text-xs font-semibold tracking-wide text-slate-200">
          {game.title}
        </span>
      </div>
    </div>
  );
}
