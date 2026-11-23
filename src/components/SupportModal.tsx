import { Heart, ShieldCheck, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { SupportAmountDollars } from '../types/game';

interface SupportModalProps {
  open: boolean;
  selectedAmount: SupportAmountDollars;
  checkoutBusy: SupportAmountDollars | null;
  stripeConfigured: boolean | null;
  userEmail?: string | null;
  onSelectAmount: (amount: SupportAmountDollars) => void;
  onSubmitSupport: (amount: SupportAmountDollars) => void;
  onClose: () => void;
}

const SUPPORT_TIERS: { amount: SupportAmountDollars; label: string; caption: string }[] = [
  { amount: 1, label: '1$', caption: 'Quick arcade boost' },
  { amount: 10, label: '10$', caption: 'Community supporter' },
  { amount: 100, label: '100$', caption: 'Lead patron gift' },
];

export function SupportModal({
  open,
  selectedAmount,
  checkoutBusy,
  stripeConfigured,
  userEmail,
  onSelectAmount,
  onSubmitSupport,
  onClose,
}: SupportModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-panel-deep w-full max-w-lg rounded-3xl p-6 sm:p-8"
          >
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#A78BFA]">
                  <Heart className="h-4 w-4 fill-[#06B6D4] text-[#06B6D4]" />
                  <span>Support ProtoX Games</span>
                </div>
                <h2 className="mt-1 font-display text-2xl font-bold text-white">
                  Keep Games Free & Ad-Free
                </h2>
                <p className="mt-1 text-xs text-[#A1A1B5]">
                  Every game is 100% free with zero ads. Choose a support amount processed directly via Stripe.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close support dialog"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/15 text-[#A1A1B5] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* 1$, 10$, 100$ Currency Tier Cards */}
            <div className="mt-5 grid grid-cols-3 gap-3">
              {SUPPORT_TIERS.map((tier) => {
                const selected = selectedAmount === tier.amount;
                return (
                  <button
                    key={tier.amount}
                    type="button"
                    onClick={() => onSelectAmount(tier.amount)}
                    className={`flex flex-col items-center justify-center rounded-2xl border p-4 text-center transition ${
                      selected
                        ? 'border-[#8B5CF6] bg-gradient-to-br from-[#8B5CF6]/25 to-[#06B6D4]/20 shadow-lg shadow-[#8B5CF6]/20'
                        : 'glass-card hover:border-white/30'
                    }`}
                  >
                    <span className="font-mono text-2xl font-bold text-white">{tier.label}</span>
                    <span className="mt-1 text-[11px] text-[#A1A1B5]">{tier.caption}</span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              disabled={checkoutBusy !== null}
              onClick={() => onSubmitSupport(selectedAmount)}
              className="mt-5 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#8B5CF6]/25 transition hover:brightness-110 disabled:opacity-60"
            >
              <Heart className="h-4 w-4 fill-current" />
              {checkoutBusy === selectedAmount
                ? 'Opening Stripe Checkout...'
                : `Support with ${selectedAmount}$ via Stripe`}
            </button>

            <div className="mt-4 flex items-start gap-2 text-[11px] text-[#A1A1B5]">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#22C55E]" />
              <span>
                {stripeConfigured === false
                  ? 'Configure STRIPE_SECRET_KEY in your server environment to enable live Stripe Checkout.'
                  : userEmail
                  ? `Stripe receipt will be sent to ${userEmail} and recorded in your profile.`
                  : 'Processed securely by Stripe Checkout. Sign in with Google to save receipts to your profile.'}
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
