import {
  Brain,
  Car,
  Clock,
  Compass,
  Crosshair,
  Flame,
  Gamepad2,
  Grid,
  Heart,
  Home,
  Layers,
  Puzzle,
  Settings,
  Sparkles,
  Swords,
  Trophy,
  Users,
} from 'lucide-react';
import { motion } from 'motion/react';
import type { AppViewMode, UserProfileDoc } from '../types/game';

interface SidebarProps {
  activeView: AppViewMode;
  activeGenre: string;
  collapsed: boolean;
  profile: UserProfileDoc | null;
  favoritesCount: number;
  recentCount: number;
  onNavigateView: (view: AppViewMode) => void;
  onSelectGenre: (genre: string) => void;
  onOpenSupport: () => void;
}

const FEED_ITEMS: {
  id: AppViewMode;
  label: string;
  icon: typeof Home;
  badgeKey?: 'favorites' | 'recent';
}[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'recent', label: 'Recently Played', icon: Clock, badgeKey: 'recent' },
  { id: 'games', label: 'All Games', icon: Gamepad2 },
  { id: 'trending', label: 'Trending', icon: Flame },
  { id: 'discover', label: 'Updated & Top', icon: Compass },
  { id: 'favorites', label: 'Favorites', icon: Heart, badgeKey: 'favorites' },
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
];

const SIDEBAR_GENRES: {
  id: string;
  label: string;
  icon: typeof Swords;
}[] = [
  { id: 'Action', label: 'Action', icon: Swords },
  { id: 'Racing', label: 'Racing', icon: Car },
  { id: 'Shooting', label: 'Shooting', icon: Crosshair },
  { id: 'Multiplayer', label: 'Multiplayer', icon: Users },
  { id: 'Puzzle', label: 'Puzzle', icon: Puzzle },
  { id: 'Adventure', label: 'Adventure', icon: Compass },
  { id: 'Sports', label: 'Sports', icon: Trophy },
  { id: 'Arcade', label: 'Arcade', icon: Gamepad2 },
  { id: '3D', label: '3D Games', icon: Layers },
  { id: 'Strategy', label: 'Strategy', icon: Brain },
  { id: 'Simulation', label: 'Simulation', icon: Sparkles },
];

export function Sidebar({
  activeView,
  activeGenre,
  collapsed,
  profile,
  favoritesCount,
  recentCount,
  onNavigateView,
  onSelectGenre,
  onOpenSupport,
}: SidebarProps) {
  const totalSupportedDollars = Math.round(Number(profile?.totalSupportedCents || 0) / 100);

  return (
    <aside
      aria-label="Platform navigation"
      className={`sticky top-16 hidden h-[calc(100vh-4rem)] shrink-0 flex-col border-r border-white/10 bg-[#080B16]/85 backdrop-blur-xl transition-all duration-200 lg:flex ${
        collapsed ? 'w-[68px]' : 'w-[224px]'
      }`}
    >
      <div className="no-scrollbar flex-1 overflow-y-auto px-2.5 py-3">
        {/* Main CrazyGames Feed Links */}
        <div className="space-y-0.5">
          {FEED_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              activeView === item.id && !(item.id === 'games' && activeGenre !== 'All Games');
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
                title={collapsed ? item.label : undefined}
                onClick={() => {
                  if (item.id === 'games') {
                    onSelectGenre('All Games');
                  } else {
                    onNavigateView(item.id);
                  }
                }}
                className={`relative flex w-full items-center rounded-xl py-2.5 text-left text-xs font-semibold transition-colors ${
                  collapsed ? 'justify-center px-0' : 'justify-between gap-2.5 px-3'
                } ${isActive ? 'text-white' : 'text-[#A1A1B5] hover:bg-white/5 hover:text-white'}`}
              >
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active-indicator"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    className="absolute inset-0 rounded-xl border border-[#8B5CF6]/40 bg-gradient-to-r from-[#8B5CF6]/25 to-[#06B6D4]/15"
                  />
                )}
                <span className="relative z-10 flex items-center gap-2.5">
                  <Icon
                    className={`h-4 w-4 shrink-0 ${isActive ? 'text-[#A78BFA]' : 'text-[#A1A1B5]'}`}
                  />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </span>
                {!collapsed && count > 0 && (
                  <span className="relative z-10 font-mono text-[11px] text-[#06B6D4]">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Hairline Separator */}
        <div className="my-3 border-t border-white/10" />

        {/* CrazyGames Genres Rail */}
        <div className="space-y-0.5">
          {!collapsed && (
            <p className="px-3 pb-1 text-[11px] font-semibold tracking-wide text-[#A1A1B5]">
              Categories
            </p>
          )}
          {SIDEBAR_GENRES.map((genre) => {
            const Icon = genre.icon;
            const isGenreActive = activeView === 'games' && activeGenre === genre.id;
            return (
              <button
                key={genre.id}
                type="button"
                title={collapsed ? genre.label : undefined}
                onClick={() => onSelectGenre(genre.id)}
                className={`flex w-full items-center rounded-xl py-2 text-left text-xs font-medium transition-colors ${
                  collapsed ? 'justify-center px-0' : 'gap-2.5 px-3'
                } ${
                  isGenreActive
                    ? 'bg-white/10 font-semibold text-white'
                    : 'text-[#A1A1B5] hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${
                    isGenreActive ? 'text-[#06B6D4]' : 'text-[#A1A1B5]'
                  }`}
                />
                {!collapsed && <span className="truncate">{genre.label}</span>}
              </button>
            );
          })}

          <button
            type="button"
            title={collapsed ? 'All Categories' : undefined}
            onClick={() => onNavigateView('categories')}
            className={`flex w-full items-center rounded-xl py-2 text-left text-xs font-medium transition-colors ${
              collapsed ? 'justify-center px-0' : 'gap-2.5 px-3'
            } ${
              activeView === 'categories'
                ? 'bg-white/10 font-semibold text-white'
                : 'text-[#A1A1B5] hover:bg-white/5 hover:text-white'
            }`}
          >
            <Grid className="h-4 w-4 shrink-0 text-[#A78BFA]" />
            {!collapsed && <span className="truncate">All Categories</span>}
          </button>

          <button
            type="button"
            title={collapsed ? 'Settings' : undefined}
            onClick={() => onNavigateView('settings')}
            className={`flex w-full items-center rounded-xl py-2 text-left text-xs font-medium transition-colors ${
              collapsed ? 'justify-center px-0' : 'gap-2.5 px-3'
            } ${
              activeView === 'settings'
                ? 'bg-white/10 font-semibold text-white'
                : 'text-[#A1A1B5] hover:bg-white/5 hover:text-white'
            }`}
          >
            <Settings className="h-4 w-4 shrink-0 text-[#A1A1B5]" />
            {!collapsed && <span className="truncate">Settings</span>}
          </button>
        </div>
      </div>

      {/* Bottom Docked Support Card */}
      <div className="border-t border-white/10 p-2.5">
        {collapsed ? (
          <button
            type="button"
            onClick={onOpenSupport}
            title="Support ProtoX Games (1$ · 10$ · 100$)"
            className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] text-white shadow-md shadow-[#8B5CF6]/25 transition hover:brightness-110"
          >
            <Heart className="h-4 w-4 fill-current" />
          </button>
        ) : (
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <div className="flex items-center gap-1.5">
              <Heart className="h-3.5 w-3.5 fill-[#06B6D4] text-[#06B6D4]" />
              <span className="font-display text-xs font-bold text-white">
                Support ProtoX
              </span>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-[#A1A1B5]">
              {totalSupportedDollars > 0
                ? `Thank you for ${totalSupportedDollars}$ via Stripe.`
                : 'Free & ad-free play. Chip in 1$, 10$, or 100$.'}
            </p>
            <button
              type="button"
              onClick={onOpenSupport}
              className="mt-2.5 w-full rounded-lg bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] px-3 py-1.5 text-xs font-semibold text-white transition hover:brightness-110"
            >
              Support
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
