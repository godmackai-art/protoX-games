import { useMemo } from 'react';
import {
  ArrowRight,
  Brain,
  Car,
  Compass,
  Crosshair,
  Gamepad2,
  Layers,
  Puzzle,
  Sparkles,
  Swords,
  Trophy,
  Users,
} from 'lucide-react';
import type { NormalizedGame } from '../types/game';
import { matchesGenreGroup } from '../utils/catalog';

interface CategoriesViewProps {
  games: NormalizedGame[];
  onSelectCategory: (category: string) => void;
}

const CATEGORY_CATALOG = [
  { id: 'Action', title: 'Action Games', icon: Swords, accent: 'from-[#8B5CF6]/30 to-[#EC4899]/20' },
  { id: 'Racing', title: 'Racing & Driving', icon: Car, accent: 'from-[#06B6D4]/30 to-[#3B82F6]/20' },
  { id: 'Adventure', title: 'Adventure Worlds', icon: Compass, accent: 'from-[#8B5CF6]/30 to-[#06B6D4]/20' },
  { id: 'Puzzle', title: 'Puzzle & Logic', icon: Puzzle, accent: 'from-[#06B6D4]/30 to-[#22C55E]/20' },
  { id: 'Sports', title: 'Sports Arenas', icon: Trophy, accent: 'from-[#22C55E]/25 to-[#06B6D4]/20' },
  { id: 'Multiplayer', title: 'Multiplayer', icon: Users, accent: 'from-[#A78BFA]/30 to-[#8B5CF6]/20' },
  { id: 'Arcade', title: 'Arcade Classics', icon: Gamepad2, accent: 'from-[#8B5CF6]/30 to-[#06B6D4]/20' },
  { id: '3D', title: '3D Experiences', icon: Layers, accent: 'from-[#06B6D4]/30 to-[#8B5CF6]/25' },
  { id: 'Strategy', title: 'Strategy & Tactics', icon: Brain, accent: 'from-[#6366F1]/30 to-[#06B6D4]/20' },
  { id: 'Shooting', title: 'Shooting & Combat', icon: Crosshair, accent: 'from-[#EC4899]/25 to-[#8B5CF6]/25' },
  { id: 'Simulation', title: 'Simulation & Tycoon', icon: Sparkles, accent: 'from-[#06B6D4]/25 to-[#A78BFA]/20' },
];

export function CategoriesView({ games, onSelectCategory }: CategoriesViewProps) {
  const categoryCounts = useMemo(() => {
    return CATEGORY_CATALOG.map((cat) => ({
      ...cat,
      slug: cat.id.toLowerCase(),
      count: games.filter((g) => matchesGenreGroup(g, cat.id)).length,
    })).filter((c) => c.count > 0);
  }, [games]);

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-3xl p-6">
        <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Browse by Category
        </h1>
        <p className="mt-1 text-xs text-[#A1A1B5] sm:text-sm">
          Explore {games.length.toLocaleString()} instant browser games grouped across curated genres.
        </p>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categoryCounts.map((cat) => {
          const Icon = cat.icon;
          return (
            <a
              key={cat.id}
              href={`/category/${encodeURIComponent(cat.slug)}`}
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                e.preventDefault();
                onSelectCategory(cat.id);
              }}
              className="glass-card group relative flex items-center justify-between overflow-hidden rounded-2xl p-5 text-left"
            >
              <div
                aria-hidden="true"
                className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${cat.accent} opacity-40 transition-opacity group-hover:opacity-75`}
              />
              <div className="relative z-10 flex items-center gap-3.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-[#080B16]/60 text-[#A78BFA]">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-display text-base font-bold text-white group-hover:text-[#A78BFA]">
                    {cat.title}
                  </h2>
                  <p className="mt-0.5 font-mono text-xs text-[#06B6D4]">
                    {cat.count.toLocaleString()} games
                  </p>
                </div>
              </div>
              <ArrowRight className="relative z-10 h-4 w-4 text-[#A1A1B5] transition-transform group-hover:translate-x-1 group-hover:text-white" />
            </a>
          );
        })}
      </div>
    </div>
  );
}
