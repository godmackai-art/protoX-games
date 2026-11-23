import { useState } from 'react';
import {
  Clock,
  Gamepad2,
  Grid,
  Heart,
  Home,
  Menu,
  Settings,
  Trophy,
  User,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { AppViewMode } from '../types/game';

interface BottomNavProps {
  activeView: AppViewMode;
  onNavigateView: (view: AppViewMode) => void;
  onOpenSupport: () => void;
}

export function BottomNav({ activeView, onNavigateView, onOpenSupport }: BottomNavProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const primaryTabs: { id: AppViewMode; label: string; icon: typeof Home }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'games', label: 'Explore', icon: Gamepad2 },
    { id: 'categories', label: 'Categories', icon: Grid },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const drawerLinks: { id: AppViewMode; label: string; icon: typeof Home }[] = [
    { id: 'discover', label: 'Discover Shelves', icon: Home },
    { id: 'trending', label: 'Trending Games', icon: Gamepad2 },
    { id: 'favorites', label: 'Favorites', icon: Heart },
    { id: 'recent', label: 'Recently Played', icon: Clock },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-3 bottom-3 z-40 lg:hidden"
      >
        <div className="glass-panel-deep mx-auto grid max-w-md grid-cols-5 rounded-2xl p-1">
          {primaryTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeView === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onNavigateView(tab.id)}
                className={`flex min-h-[48px] flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-semibold transition ${
                  isActive ? 'bg-white/10 text-white' : 'text-[#A1A1B5]'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-[#A78BFA]' : ''}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="flex min-h-[48px] flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-semibold text-[#A1A1B5]"
          >
            <Menu className="h-4 w-4" />
            <span>More</span>
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end bg-black/70 p-3 backdrop-blur-sm lg:hidden"
            onClick={() => setDrawerOpen(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-panel-deep w-full rounded-3xl p-5"
            >
              <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-3">
                <span className="font-display text-base font-bold text-white">Menu</span>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close mobile menu"
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 text-[#A1A1B5] hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {drawerLinks.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setDrawerOpen(false);
                        onNavigateView(item.id);
                      }}
                      className="glass-card flex min-h-[44px] items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-white"
                    >
                      <Icon className="h-4 w-4 text-[#A78BFA]" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => {
                  setDrawerOpen(false);
                  onOpenSupport();
                }}
                className="mt-3 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] px-4 py-2.5 text-xs font-semibold text-white"
              >
                <Heart className="h-4 w-4 fill-current" />
                <span>Support ProtoX Games (1$ · 10$ · 100$)</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
