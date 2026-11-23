import { useMemo } from 'react';
import {
  CheckCircle2,
  Code2,
  Heart,
  LogOut,
  Receipt,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import type { User } from 'firebase/auth';
import type {
  FeedbackEntry,
  NormalizedGame,
  PlayHistoryEntry,
  SupportAmountDollars,
  SupportReceiptEntry,
  UserProfileDoc,
} from '../types/game';
import { FeedbackSection } from './FeedbackSection';
import { GameCard } from './GameCard';

interface ProfileViewProps {
  user: User | null;
  profile: UserProfileDoc | null;
  games: NormalizedGame[];
  favorites: Record<string, boolean>;
  playHistory: Record<string, PlayHistoryEntry>;
  supportReceipts: SupportReceiptEntry[];
  feedbackComments: FeedbackEntry[];
  authLoading: boolean;
  checkoutBusy: SupportAmountDollars | null;
  stripeConfigured: boolean | null;
  stripeProductId: string | null;
  onGoogleSignIn: () => void;
  onSignOut: () => void;
  onSupportAmount: (amount: SupportAmountDollars) => void;
  onSelectGame: (game: NormalizedGame) => void;
  onToggleFavorite: (game: NormalizedGame) => void;
  onOpenPasteModal: () => void;
  onOpenExpoModal: () => void;
  onSaveFeedback: (entry: {
    authorName: string;
    replyEmail: string;
    gameTitle?: string;
    message: string;
  }) => Promise<void>;
}

const SUPPORT_OPTIONS: { amount: SupportAmountDollars; label: string; caption: string }[] = [
  { amount: 1, label: '1$', caption: 'Quick tip' },
  { amount: 10, label: '10$', caption: 'Arcade boost' },
  { amount: 100, label: '100$', caption: 'Patron tier' },
];

export function ProfileView({
  user,
  profile,
  games,
  favorites,
  playHistory,
  supportReceipts,
  feedbackComments,
  authLoading,
  checkoutBusy,
  stripeConfigured,
  stripeProductId,
  onGoogleSignIn,
  onSignOut,
  onSupportAmount,
  onSelectGame,
  onToggleFavorite,
  onOpenPasteModal,
  onOpenExpoModal,
  onSaveFeedback,
}: ProfileViewProps) {
  const favoriteGames = useMemo(
    () => games.filter((g) => Boolean(favorites[g.id])),
    [games, favorites]
  );
  const totalSessions = useMemo(
    () => Object.values(playHistory).reduce((acc, item) => acc + item.playCount, 0),
    [playHistory]
  );

  const totalSupportedDollars = Math.round(Number(profile?.totalSupportedCents || 0) / 100);

  return (
    <div className="space-y-8">
      {/* Account Summary Card */}
      <section className="glass-panel-deep rounded-3xl p-6 sm:p-8">
        {!user ? (
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#A78BFA]">
                <ShieldCheck className="h-4 w-4 text-[#06B6D4]" />
                <span>Player Account</span>
              </div>
              <h1 className="mt-1 font-display text-2xl font-bold text-white sm:text-3xl">
                Sign in with Google
              </h1>
              <p className="mt-1.5 max-w-xl text-sm text-[#A1A1B5]">
                Sync favorites, track play counts, send feedback, and save Stripe support receipts securely in Cloud Firestore.
              </p>
            </div>
            <button
              type="button"
              disabled={authLoading}
              onClick={onGoogleSignIn}
              className="inline-flex min-h-[48px] shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#8B5CF6]/25 transition hover:brightness-110 disabled:opacity-60"
            >
              {authLoading ? 'Signing in...' : 'Sign In with Google'}
            </button>
          </div>
        ) : (
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={profile?.displayName || 'Player avatar'}
                  className="h-16 w-16 rounded-2xl border border-[#8B5CF6]/50 object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#8B5CF6]/25 font-display text-2xl font-bold text-white">
                  {(profile?.displayName || user.displayName || 'P').charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h1 className="font-display text-2xl font-bold text-white">
                  {profile?.displayName || user.displayName || 'Player'}
                </h1>
                <p className="text-xs text-[#A1A1B5]">{user.email}</p>
                <div className="mt-2 flex flex-wrap items-center gap-4 font-mono text-xs text-[#A1A1B5]">
                  <span>{favoriteGames.length} Favorites</span>
                  <span>{totalSessions} Game Launches</span>
                  <span className="text-[#06B6D4]">{totalSupportedDollars}$ Supported</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onSignOut}
              className="glass-card inline-flex min-h-[42px] shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-white hover:border-rose-400/50"
            >
              <LogOut className="h-4 w-4" /> Sign Out
            </button>
          </div>
        )}
      </section>

      {/* Support ProtoX Games (1$, 10$, 100$) via Stripe Product ID */}
      <section className="glass-panel rounded-3xl p-6 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#06B6D4]">
              <Heart className="h-4 w-4 fill-current" />
              <span>Support ProtoX Games</span>
            </div>
            <h2 className="mt-1 font-display text-xl font-bold text-white sm:text-2xl">
              Choose a Support Tier (1$, 10$, 100$)
            </h2>
          </div>
          {stripeProductId && (
            <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 font-mono text-[11px] text-[#06B6D4]">
              Product ID: {stripeProductId}
            </span>
          )}
        </div>

        <p className="mt-1.5 text-xs text-[#A1A1B5]">
          ProtoX Games is 100% free and completely ad-free. Support receipts are processed directly through Stripe Checkout ({stripeConfigured ? 'Live Stripe Ready' : 'Requires STRIPE_SECRET_KEY'}).
        </p>

        <div className="mt-5 grid grid-cols-3 gap-3 sm:gap-4">
          {SUPPORT_OPTIONS.map((tier) => (
            <button
              key={tier.amount}
              type="button"
              disabled={checkoutBusy !== null}
              onClick={() => onSupportAmount(tier.amount)}
              className={`flex flex-col items-center justify-center rounded-2xl p-4 text-center transition disabled:opacity-60 ${
                tier.amount === 10
                  ? 'border border-[#8B5CF6]/60 bg-gradient-to-br from-[#8B5CF6]/20 to-[#06B6D4]/15 hover:brightness-110'
                  : 'glass-card hover:border-[#06B6D4]/60'
              }`}
            >
              <span className="font-mono text-2xl font-bold text-white">{tier.label}</span>
              <span className="mt-1 text-xs text-[#A1A1B5]">
                {checkoutBusy === tier.amount ? 'Opening Stripe...' : tier.caption}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Verified Stripe Receipts */}
      {supportReceipts.length > 0 && (
        <section className="glass-panel rounded-3xl p-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#22C55E]">
            <Receipt className="h-4 w-4" />
            <span>Verified Stripe Receipts</span>
          </div>
          <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
            {supportReceipts.slice(0, 6).map((r) => (
              <div
                key={r.supportId}
                className="glass-card flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-xs"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#22C55E]" />
                  <span className="font-mono font-semibold text-white">
                    {Math.round(r.amountCents / 100)}$ {r.currency.toUpperCase()}
                  </span>
                </div>
                <span className="truncate font-mono text-[11px] text-[#A1A1B5]">
                  {r.stripeSessionId}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Feedback Section */}
      <FeedbackSection
        defaultName={profile?.displayName || user?.displayName || ''}
        defaultEmail={profile?.email || user?.email || ''}
        savedComments={feedbackComments}
        onSaveToHistory={onSaveFeedback}
      />

      {/* Quick Tools + Saved Favorites */}
      <section className="grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={onOpenPasteModal}
          className="glass-card flex items-center justify-between gap-4 rounded-2xl p-5 text-left"
        >
          <div>
            <p className="font-display text-base font-bold text-white">Load Custom Games JSON</p>
            <p className="mt-0.5 text-xs text-[#A1A1B5]">
              Preview custom catalog entries or update src/data/playgamaCatalog.ts
            </p>
          </div>
          <Upload className="h-5 w-5 shrink-0 text-[#A78BFA]" />
        </button>

        <button
          type="button"
          onClick={onOpenExpoModal}
          className="glass-card flex items-center justify-between gap-4 rounded-2xl p-5 text-left"
        >
          <div>
            <p className="font-display text-base font-bold text-white">
              Expo Router Single-File Export
            </p>
            <p className="mt-0.5 text-xs text-[#A1A1B5]">
              Download or copy the single-file mobile template
            </p>
          </div>
          <Code2 className="h-5 w-5 shrink-0 text-[#06B6D4]" />
        </button>
      </section>

      {favoriteGames.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-display text-xl font-bold text-white">Your Favorites</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {favoriteGames.slice(0, 8).map((game, idx) => (
              <GameCard
                key={game.id}
                game={game}
                isFavorite
                stats={playHistory[game.id]}
                index={idx}
                onSelect={onSelectGame}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
