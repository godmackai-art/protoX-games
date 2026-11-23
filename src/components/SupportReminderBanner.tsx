import { Heart, X } from 'lucide-react';
import type { SupportAmountDollars } from '../types/game';

interface SupportReminderBannerProps {
  dismissed: boolean;
  onDismiss: () => void;
  onOpenSupport: (amount: SupportAmountDollars) => void;
}

const QUICK_TIERS: SupportAmountDollars[] = [1, 10, 100];

export function SupportReminderBanner({
  dismissed,
  onDismiss,
  onOpenSupport,
}: SupportReminderBannerProps) {
  if (dismissed) return null;

  return (
    <aside
      aria-label="Support reminder"
      className="glass-panel relative overflow-hidden rounded-2xl border border-[#8B5CF6]/35 px-4 py-3.5 sm:px-5"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-10 right-12 h-28 w-28 rounded-full bg-[#8B5CF6]/20 blur-2xl"
      />
      <div className="relative z-10 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#8B5CF6]/30 to-[#06B6D4]/25 text-[#A78BFA]">
            <Heart className="h-4 w-4 fill-current" />
          </div>
          <div>
            <p className="font-display text-sm font-bold text-white">
              100% Free & Ad-Free — Support ProtoX Games
            </p>
            <p className="mt-0.5 text-xs text-[#A1A1B5]">
              Enjoying instant browser games with zero ads? Help keep the servers fast with a quick Stripe receipt.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {QUICK_TIERS.map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => onOpenSupport(amt)}
              className={`min-h-[38px] rounded-xl px-3.5 py-1.5 font-mono text-xs font-bold transition ${
                amt === 10
                  ? 'bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] text-white shadow-md shadow-[#8B5CF6]/25 hover:brightness-110'
                  : 'glass-card text-white hover:border-[#8B5CF6]/60'
              }`}
            >
              {amt}$
            </button>
          ))}
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss support reminder"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-[#A1A1B5] hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
