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
    Arcade: 'from-[#2A1B54] via-[#101629] to-[#080B16]',
    Action: 'from-[#3B1958] via-[#12172D] to-[#080B16]',
    Puzzle: 'from-[#0E354A] via-[#101629] to-[#080B16]',
    Strategy: 'from-[#252463] via-[#101629] to-[#080B16]',
    Sports: 'from-[#0D3D40] via-[#101629] to-[#080B16]',
    Racing: 'from-[#18385E] via-[#101629] to-[#080B16]',
    Driving: 'from-[#18385E] via-[#101629] to-[#080B16]',
    Adventure: 'from-[#2B2058] via-[#101629] to-[#080B16]',
  };

  const gradientClass = paletteMap[game.category] || 'from-[#1D1B4B] via-[#101629] to-[#080B16]';

  if (game.thumb && !imgFailed) {
    return (
      <img
        src={game.thumb}
        alt={game.title}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setImgFailed(true)}
        className={`h-full w-full object-cover ${
          hoverZoom ? 'transition-transform duration-500 ease-out group-hover:scale-105' : ''
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
        className="absolute inset-0 h-full w-full opacity-25"
      >
        <path
          d="M0 20 H160 M0 50 H160 M0 80 H160 M40 0 V100 M80 0 V100 M120 0 V100"
          stroke="#8B5CF6"
          strokeWidth="0.6"
          fill="none"
        />
        <circle cx="80" cy="50" r="24" stroke="#06B6D4" strokeWidth="1" fill="none" />
      </svg>
      <div className="relative z-10 flex flex-col items-center gap-2 text-center">
        <Gamepad2 className="h-7 w-7 text-[#A78BFA]" />
        <span className="line-clamp-1 max-w-[160px] font-display text-xs font-semibold tracking-wide text-white/90">
          {game.title}
        </span>
      </div>
    </div>
  );
}
