import {
  Clock,
  Compass,
  Gamepad2,
  Grid,
  Heart,
  Home,
  Settings,
  Trophy,
} from 'lucide-react';
import { motion } from 'motion/react';
import type { AppViewMode, UserProfileDoc } from '../types/game';

interface SidebarProps {
  activeView: AppViewMode;
  profile: UserProfileDoc | null;
  favoritesCount: number;
  recentCount: number;
  onNavigateView: (view: AppViewMode) => void;
  onOpenSupport: () => void;
}

const SIDEBAR_ITEMS: {
  id: AppViewMode;
  label: string;
  icon: typeof Home;
  badgeKey?: 'favorites' | 'recent';
}[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'discover', label: 'Discover', icon: Compass },
  { id: 'games', label: 'All Games', icon: Gamepad2 },
  { id: 'categories', label: 'Categories', icon: Grid },
  { id: 'favorites', label: 'Favorites', icon: Heart, badgeKey: 'favorites' },
  { id: 'recent', label: 'Recently Played', icon: Clock, badgeKey: 'recent' },
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar({
  activeView,
  profile,
  favoritesCount,
  recentCount,
  onNavigateView,
  onOpenSupport,
}: SidebarProps) {
  const totalSupportedDollars = Math.round(Number(profile?.totalSupportedCents || 0) / 100);

  return (
    <aside
      aria-label="Platform navigation"
      className="sticky top-24 hidden h-[calc(100vh-7rem)] w-[248px] shrink-0 flex-col justify-between gap-4 lg:flex"
    >
      <div className="glass-panel flex-1 overflow-y-auto rounded-2xl p-3">
        <p className="px-3 pt-1 pb-2 text-[11px] font-semibold tracking-wider text-[#A1A1B5] uppercase">
          Navigation
        </p>
        <div className="space-y-1">
          {SIDEBAR_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            const count =
              item.badgeKey === 'favorites'
                ? favoritesCount
                : item.badgeKey === 'recent'
                ? recentCount
                : 0;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigateView(item.id)}
                className={`relative flex w-full items-center justify-between gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-semibold transition-colors ${
                  isActive ? 'text-white' : 'text-[#A1A1B5] hover:text-white'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active-indicator"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    className="absolute inset-0 rounded-xl border border-[#8B5CF6]/45 bg-gradient-to-r from-[#8B5CF6]/25 to-[#06B6D4]/15 shadow-inner shadow-[#8B5CF6]/20"
                  />
                )}
                <span className="relative z-10 flex items-center gap-2.5">
                  <Icon
                    className={`h-4 w-4 ${isActive ? 'text-[#A78BFA]' : 'text-[#A1A1B5]'}`}
                  />
                  <span>{item.label}</span>
                </span>
                {count > 0 && (
                  <span className="relative z-10 font-mono text-[11px] text-[#06B6D4]">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Support ProtoX Games Card */}
      <div className="glass-panel relative overflow-hidden rounded-2xl p-4">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full bg-[#8B5CF6]/25 blur-2xl"
        />
        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 fill-[#06B6D4] text-[#06B6D4]" />
            <span className="font-display text-xs font-bold text-white">
              Support ProtoX Games
            </span>
          </div>
          <p className="mt-1.5 text-[11px] leading-relaxed text-[#A1A1B5]">
            {totalSupportedDollars > 0
              ? `Thank you for contributing ${totalSupportedDollars}$ via Stripe.`
              : 'Every game is free with zero ads. Help keep the arcade fast with 1$, 10$, or 100$.'}
          </p>
          <button
            type="button"
            onClick={onOpenSupport}
            className="mt-3 w-full rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] px-3 py-2 text-xs font-semibold text-white transition hover:brightness-110"
          >
            Support (1$ · 10$ · 100$)
          </button>
        </div>
      </div>
    </aside>
  );
}
