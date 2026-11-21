import { Heart, X } from 'lucide-react';
import type { SupportAmountDollars } from '../types/game';

const SUPPORT_AMOUNTS: SupportAmountDollars[] = [1, 5, 10, 100];

interface SupportReminderBannerProps {
  onOpenSupportModal: (initialAmount?: SupportAmountDollars) => void;
  onDismiss?: () => void;
  compact?: boolean;
}

export function SupportReminderBanner({
  onOpenSupportModal,
  onDismiss,
  compact = false,
}: SupportReminderBannerProps) {
  return (
    <aside
      aria-label="Support protoX Games reminder"
      className={compact ? 'my-4' : 'mx-auto my-6 max-w-7xl px-4 sm:px-6 lg:px-8'}
    >
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-emerald-500/25 bg-[#0D1615] px-4 py-4 sm:flex-row sm:items-center sm:px-5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-400">
            <Heart className="h-3.5 w-3.5 fill-current" />
            <span>Keep protoX Games Free</span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-slate-200 sm:text-sm">
            Enjoying the games? Help support hosting and new HTML5 releases with a quick contribution via Stripe.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {SUPPORT_AMOUNTS.map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => onOpenSupportModal(amt)}
              className="min-h-[38px] shrink-0 rounded-lg border border-white/15 bg-[#091012] px-3 py-1.5 font-mono text-xs font-semibold text-white transition hover:border-emerald-500/50 hover:text-emerald-300"
            >
              {amt}$
            </button>
          ))}
          <button
            type="button"
            onClick={() => onOpenSupportModal(5)}
            className="inline-flex min-h-[38px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg bg-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-emerald-400"
          >
            <Heart className="h-3.5 w-3.5" /> Support
          </button>
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss support reminder"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/5 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
