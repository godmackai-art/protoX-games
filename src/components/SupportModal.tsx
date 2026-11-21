import { CreditCard, Heart, ShieldCheck, X } from 'lucide-react';
import type { SupportAmountDollars } from '../types/game';

interface SupportModalProps {
  open: boolean;
  selectedAmount: SupportAmountDollars;
  checkoutBusy: SupportAmountDollars | null;
  stripeConfigured: boolean | null;
  stripeProductId: string | null;
  userEmail?: string | null;
  onSelectAmount: (amount: SupportAmountDollars) => void;
  onSubmitSupport: (amount: SupportAmountDollars) => void;
  onClose: () => void;
}

const SUPPORT_TIERS: {
  amount: SupportAmountDollars;
  displayLabel: string;
  tagline: string;
}[] = [
  { amount: 1, displayLabel: '1$', tagline: 'Starter Boost' },
  { amount: 5, displayLabel: '5$', tagline: 'Arcade Fan' },
  { amount: 10, displayLabel: '10$', tagline: 'Power Backer' },
  { amount: 100, displayLabel: '100$', tagline: 'Patron Champion' },
];

export function SupportModal({
  open,
  selectedAmount,
  checkoutBusy,
  stripeConfigured,
  stripeProductId,
  userEmail,
  onSelectAmount,
  onSubmitSupport,
  onClose,
}: SupportModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-white/15 bg-[#0F151E] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
              <Heart className="h-3.5 w-3.5 fill-current" />
              <span>Support protoX Games</span>
            </div>
            <h3 className="mt-1 font-display text-2xl font-bold text-white">
              Choose a Support Amount
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Receipts and payments are processed securely by Stripe
              {stripeProductId ? ` · Product ${stripeProductId}` : ''}.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close support modal"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {stripeConfigured === false && (
          <div className="mt-4 rounded-xl border border-white/10 bg-[#0A0F17] p-3.5 text-xs text-slate-300">
            Stripe Sandbox Mode: set <code className="font-mono text-emerald-400">STRIPE_SECRET_KEY</code> and{' '}
            <code className="font-mono text-emerald-400">STRIPE_PRODUCT_ID</code> in server secrets for live Stripe receipts.
          </div>
        )}

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {SUPPORT_TIERS.map((tier) => {
            const active = selectedAmount === tier.amount;
            return (
              <button
                key={tier.amount}
                type="button"
                onClick={() => onSelectAmount(tier.amount)}
                className={`flex flex-col items-start rounded-xl border p-3.5 text-left transition ${
                  active
                    ? 'border-emerald-500 bg-emerald-500/15'
                    : 'border-white/15 bg-[#0A0F17] hover:border-white/30'
                }`}
              >
                <span className="font-mono text-2xl font-bold text-white">{tier.displayLabel}</span>
                <span className="mt-1 text-[11px] font-medium text-slate-400">{tier.tagline}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-5 rounded-xl border border-white/10 bg-[#0A0F17] p-3.5 text-xs text-slate-300">
          <div className="flex items-center gap-2 font-semibold text-white">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>One-time USD receipt via Stripe Checkout</span>
          </div>
          <p className="mt-1 text-slate-400">
            {userEmail
              ? `Stripe receipt will be sent to ${userEmail} and saved to your Profile.`
              : 'Stripe generates an instant payment receipt at checkout. Sign in on Profile to also save receipts to your history.'}
          </p>
        </div>

        <button
          type="button"
          disabled={checkoutBusy !== null}
          onClick={() => onSubmitSupport(selectedAmount)}
          className="mt-5 inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-60"
        >
          <CreditCard className="h-4 w-4" />
          {checkoutBusy !== null
            ? 'Connecting to Stripe...'
            : `Support with ${selectedAmount}$ via Stripe`}
        </button>
      </div>
    </div>
  );
}
