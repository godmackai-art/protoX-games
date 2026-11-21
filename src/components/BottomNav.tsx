import { Gamepad2, Home, User } from 'lucide-react';

export type RootTab = 'home' | 'games' | 'profile';

interface BottomNavProps {
  activeTab: RootTab | null;
  onNavigateTab: (tab: RootTab) => void;
}

export function BottomNav({ activeTab, onNavigateTab }: BottomNavProps) {
  const items: { id: RootTab; label: string; href: string; icon: typeof Home }[] = [
    { id: 'home', label: 'Home', href: '/', icon: Home },
    { id: 'games', label: 'Games', href: '/games', icon: Gamepad2 },
    { id: 'profile', label: 'Profile', href: '/profile', icon: User },
  ];

  return (
    <nav
      aria-label="Primary bottom navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#080C14]/95 backdrop-blur-md"
    >
      <div className="mx-auto grid h-[60px] max-w-3xl grid-cols-3 items-center sm:h-16">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <a
              key={item.id}
              href={item.href}
              onClick={(e) => {
                e.preventDefault();
                onNavigateTab(item.id);
              }}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex h-full min-h-[44px] flex-col items-center justify-center gap-1 transition ${
                isActive ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute top-0 h-0.5 w-10 rounded-full bg-emerald-400"
                />
              )}
              <Icon className="h-[22px] w-[22px]" strokeWidth={isActive ? 2.4 : 1.9} />
              <span className="text-[11px] font-semibold tracking-tight">{item.label}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}
