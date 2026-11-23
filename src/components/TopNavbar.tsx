import { useMemo, useRef, useState } from 'react';
import {
  Bell,
  Gamepad2,
  Heart,
  Play,
  Search,
  User as UserIcon,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { User } from 'firebase/auth';
import type { AppViewMode, NormalizedGame, PlayHistoryEntry, UserProfileDoc } from '../types/game';
import { GameThumbnail } from './GameThumbnail';

interface TopNavbarProps {
  activeView: AppViewMode;
  games: NormalizedGame[];
  searchQuery: string;
  user: User | null;
  profile: UserProfileDoc | null;
  authLoading: boolean;
  favoritesCount: number;
  playHistory: Record<string, PlayHistoryEntry>;
  onSearchChange: (q: string) => void;
  onNavigateView: (view: AppViewMode) => void;
  onSelectGame: (game: NormalizedGame) => void;
  onOpenSupport: () => void;
  onGoogleSignIn: () => void;
}

const CENTER_LINKS: { id: AppViewMode; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'games', label: 'Explore' },
  { id: 'categories', label: 'Categories' },
  { id: 'trending', label: 'Trending' },
  { id: 'recent', label: 'Recently Played' },
];

export function TopNavbar({
  activeView,
  games,
  searchQuery,
  user,
  profile,
  authLoading,
  favoritesCount,
  playHistory,
  onSearchChange,
  onNavigateView,
  onSelectGame,
  onOpenSupport,
  onGoogleSignIn,
}: TopNavbarProps) {
  const [searchFocused, setSearchFocused] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);

  const suggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return games
      .filter(
        (g) =>
          g.title.toLowerCase().includes(q) ||
          g.category.toLowerCase().includes(q) ||
          g.genres.some((gen) => gen.toLowerCase().includes(q))
      )
      .slice(0, 6);
  }, [games, searchQuery]);

  const recentPlays = useMemo(
    () => Object.values(playHistory).sort((a, b) => b.playCount - a.playCount).slice(0, 3),
    [playHistory]
  );

  const totalSupportedDollars = Math.round(Number(profile?.totalSupportedCents || 0) / 100);

  const notifications = useMemo(() => {
    const list: { id: string; title: string; detail: string; actionLabel?: string; onAction?: () => void }[] = [];
    list.push({
      id: 'support-reminder',
      title: totalSupportedDollars > 0 ? `Thank You! ${totalSupportedDollars}$ Supported` : '100% Free & Ad-Free Arcade',
      detail: 'Enjoy instant browser play. Support ProtoX Games anytime with 1$, 10$, or 100$.',
      actionLabel: 'Support',
      onAction: () => {
        setShowNotifications(false);
        onOpenSupport();
      },
    });

    if (recentPlays.length > 0) {
      list.push({
        id: 'recent-play',
        title: `Most played: ${recentPlays[0].gameTitle || recentPlays[0].gameId}`,
        detail: `${recentPlays[0].playCount} recorded sessions synced to your profile.`,
        actionLabel: 'History',
        onAction: () => {
          setShowNotifications(false);
          onNavigateView('recent');
        },
      });
    }

    list.push({
      id: 'library-count',
      title: `${games.length.toLocaleString()} Playable Browser Games`,
      detail: `${favoritesCount} favorites saved to your library.`,
      actionLabel: 'Explore',
      onAction: () => {
        setShowNotifications(false);
        onNavigateView('games');
      },
    });
    return list;
  }, [totalSupportedDollars, recentPlays, games.length, favoritesCount, onOpenSupport, onNavigateView]);

  return (
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-6">
      <div className="glass-panel-deep mx-auto flex h-16 max-w-[1480px] items-center justify-between gap-3 rounded-2xl px-3.5 sm:px-5">
        {/* Left: Futuristic Logo & Wordmark */}
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            onNavigateView('home');
          }}
          className="flex shrink-0 items-center gap-2.5 whitespace-nowrap"
        >
          <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-[#8B5CF6]/45 bg-[#101629] shadow-md shadow-[#8B5CF6]/25">
            <img
              src="/favicon.webp"
              alt="ProtoX Games icon"
              className="h-full w-full object-cover"
            />
          </div>
          <span className="font-display text-base font-bold tracking-tight text-white sm:text-lg">
            ProtoX <span className="bg-gradient-to-r from-[#A78BFA] to-[#06B6D4] bg-clip-text text-transparent">Games</span>
          </span>
        </a>

        {/* Center Navigation Links */}
        <nav aria-label="Primary navigation" className="hidden items-center gap-1 xl:flex">
          {CENTER_LINKS.map((link) => {
            const isActive =
              activeView === link.id || (link.id === 'home' && activeView === 'discover');
            return (
              <button
                key={link.id}
                type="button"
                onClick={() => onNavigateView(link.id)}
                className={`relative rounded-xl px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-colors ${
                  isActive ? 'text-white' : 'text-[#A1A1B5] hover:text-white'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="topbar-active-pill"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    className="absolute inset-0 rounded-xl border border-white/15 bg-white/10"
                  />
                )}
                <span className="relative z-10">{link.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: Search Field + Notifications + Support + Profile */}
        <div className="flex flex-1 items-center justify-end gap-2 sm:gap-2.5 xl:flex-none">
          {/* Search Bar with Live Dropdown Suggestions */}
          <div ref={searchContainerRef} className="relative hidden w-full max-w-[260px] md:block lg:w-64">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#A1A1B5]" />
            <input
              type="search"
              value={searchQuery}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 180)}
              onChange={(e) => {
                onSearchChange(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  setSearchFocused(false);
                  onNavigateView('games');
                }
              }}
              placeholder={`Search ${games.length.toLocaleString()} games...`}
              className="glass-input h-10 w-full rounded-xl pr-8 pl-9 text-xs text-white placeholder:text-[#A1A1B5] focus:border-[#8B5CF6]/70 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="Clear search"
                className="absolute top-1/2 right-2.5 -translate-y-1/2 text-[#A1A1B5] hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}

            <AnimatePresence>
              {searchFocused && suggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  className="glass-panel-deep absolute top-12 right-0 left-0 z-50 overflow-hidden rounded-2xl p-1.5"
                >
                  {suggestions.map((game) => (
                    <button
                      key={game.id}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setSearchFocused(false);
                        onSelectGame(game);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl p-2 text-left transition hover:bg-white/10"
                    >
                      <div className="h-9 w-12 shrink-0 overflow-hidden rounded-lg bg-[#080B16]">
                        <GameThumbnail game={game} hoverZoom={false} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-white">{game.title}</p>
                        <p className="truncate text-[11px] text-[#A1A1B5]">{game.category}</p>
                      </div>
                      <Play className="h-3.5 w-3.5 shrink-0 text-[#06B6D4]" />
                    </button>
                  ))}
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setSearchFocused(false);
                      onNavigateView('games');
                    }}
                    className="mt-1 w-full rounded-xl border-t border-white/10 py-2 text-center text-[11px] font-semibold text-[#A78BFA] hover:bg-white/5"
                  >
                    See all results in Explore
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile Search Icon Button */}
          <button
            type="button"
            onClick={() => onNavigateView('games')}
            aria-label="Search games"
            className="glass-card flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[#A1A1B5] hover:text-white md:hidden"
          >
            <Search className="h-4 w-4" />
          </button>

          {/* Notifications Popover Trigger */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications((v) => !v)}
              aria-label="Notifications"
              className="glass-card relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[#A1A1B5] hover:text-white"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#06B6D4]" />
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  className="glass-panel-deep absolute top-12 right-0 z-50 w-80 rounded-2xl p-3.5"
                >
                  <div className="mb-2.5 flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="font-display text-xs font-bold tracking-wide text-white">
                      Activity & Support
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowNotifications(false)}
                      className="text-[#A1A1B5] hover:text-white"
                      aria-label="Close notifications"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {notifications.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-xs"
                      >
                        <p className="font-semibold text-white">{item.title}</p>
                        <p className="mt-0.5 text-[11px] text-[#A1A1B5]">{item.detail}</p>
                        {item.actionLabel && item.onAction && (
                          <button
                            type="button"
                            onClick={item.onAction}
                            className="mt-1.5 text-[11px] font-semibold text-[#06B6D4] hover:underline"
                          >
                            {item.actionLabel}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Support Button (Replaces PRO button) */}
          <button
            type="button"
            onClick={onOpenSupport}
            className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] px-3.5 text-xs font-semibold whitespace-nowrap text-white shadow-md shadow-[#8B5CF6]/25 transition hover:brightness-110"
          >
            <Heart className="h-3.5 w-3.5 fill-current" />
            <span>Support</span>
          </button>

          {/* User Profile / Sign-In Button */}
          {user ? (
            <button
              type="button"
              onClick={() => onNavigateView('profile')}
              className="glass-card inline-flex h-10 shrink-0 items-center gap-2 rounded-xl px-3 text-xs font-semibold text-white"
            >
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={profile?.displayName || 'Player'}
                  className="h-6 w-6 rounded-lg object-cover"
                />
              ) : (
                <UserIcon className="h-4 w-4 text-[#A78BFA]" />
              )}
              <span className="hidden max-w-[95px] truncate sm:inline">
                {profile?.displayName || user.displayName || 'Profile'}
              </span>
            </button>
          ) : (
            <button
              type="button"
              disabled={authLoading}
              onClick={onGoogleSignIn}
              className="glass-card inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl px-3.5 text-xs font-semibold whitespace-nowrap text-white hover:border-[#8B5CF6]/60 disabled:opacity-60"
            >
              <Gamepad2 className="h-4 w-4 text-[#06B6D4]" />
              <span>{authLoading ? 'Signing in...' : 'Sign In'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
