import { useMemo } from 'react';
import type { User } from 'firebase/auth';
import {
  Code2,
  CreditCard,
  FileCode2,
  Gamepad2,
  Heart,
  History,
  LogIn,
  LogOut,
  Receipt,
} from 'lucide-react';
import type {
  NormalizedGame,
  PlayHistoryEntry,
  SupportAmountDollars,
  SupportReceiptEntry,
  UserProfileDoc,
} from '../types/game';
import { GameCard } from './GameCard';

const SUPPORT_OPTIONS: { amount: SupportAmountDollars; label: string; note: string }[] = [
  { amount: 1, label: '1$', note: 'Starter Boost' },
  { amount: 5, label: '5$', note: 'Arcade Fan' },
  { amount: 10, label: '10$', note: 'Power Backer' },
  { amount: 100, label: '100$', note: 'Patron Champion' },
];

interface ProfileViewProps {
  user: User | null;
  profile: UserProfileDoc | null;
  games: NormalizedGame[];
  favorites: Record<string, boolean>;
  playHistory: Record<string, PlayHistoryEntry>;
  supportReceipts: SupportReceiptEntry[];
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
}

export function ProfileView({
  user,
  profile,
  games,
  favorites,
  playHistory,
  supportReceipts,
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
}: ProfileViewProps) {
  const favoriteGames = useMemo(
    () => games.filter((g) => Boolean(favorites[g.id])),
    [games, favorites]
  );

  const historyGames = useMemo(() => {
    const byId = new Map(games.map((g) => [g.id, g]));
    return Object.keys(playHistory)
      .map((id) => byId.get(id))
      .filter((g): g is NormalizedGame => Boolean(g))
      .sort((a, b) => (playHistory[b.id]?.playCount || 0) - (playHistory[a.id]?.playCount || 0));
  }, [games, playHistory]);

  const totalSupportedDollars = Math.round((profile?.totalSupportedCents || 0) / 100);

  return (
    <div className="mx-auto max-w-6xl px-4 pt-6 pb-24 sm:px-6 lg:px-8">
      {/* Account Hero Header */}
      <section className="rounded-2xl border border-white/10 bg-[#0F151E] p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={profile?.displayName || user.displayName || 'Player'}
                referrerPolicy="no-referrer"
                className="h-14 w-14 rounded-2xl border border-white/15 object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                <Gamepad2 className="h-7 w-7" />
              </div>
            )}
            <div>
              <h1 className="font-display text-2xl font-bold text-white">
                {user ? profile?.displayName || user.displayName || 'Player Account' : 'Guest Player'}
              </h1>
              <p className="mt-0.5 text-xs text-slate-400">
                {user
                  ? profile?.email || user.email
                  : 'Sign in with Google to save favorites, play history, and Stripe support receipts.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {user ? (
              <button
                type="button"
                onClick={onSignOut}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-rose-500/35 bg-rose-950/20 px-4 py-2.5 text-xs font-semibold text-rose-200 transition hover:bg-rose-950/40"
              >
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            ) : (
              <button
                type="button"
                disabled={authLoading}
                onClick={onGoogleSignIn}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-60"
              >
                <LogIn className="h-4 w-4" />
                {authLoading ? 'Signing in...' : 'Sign In with Google'}
              </button>
            )}
          </div>
        </div>

        {/* Account Summary Row */}
        <div className="mt-6 grid grid-cols-3 gap-4 border-t border-white/10 pt-5">
          <div>
            <p className="text-xs text-slate-400">Favorites</p>
            <p className="mt-1 font-mono text-base font-semibold text-white">{favoriteGames.length}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Games Played</p>
            <p className="mt-1 font-mono text-base font-semibold text-white">{historyGames.length}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Total Supported</p>
            <p className="mt-1 font-mono text-base font-semibold text-emerald-400">
              {totalSupportedDollars}$
            </p>
          </div>
        </div>
      </section>

      {/* Support protoX Games Section (1$, 5$, 10$, 100$ via Stripe Product ID) */}
      <section className="relative mt-6 overflow-hidden rounded-2xl border border-white/10 bg-[#0F151E]">
        <img
          src="/assets/aistudio/Neon_Green_Sci-Fi_Corridor_4ab13889.webp"
          alt="Support protoX Games backdrop"
          className="absolute inset-0 h-full w-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#070A0F]/95 via-[#070A0F]/85 to-[#070A0F]/75" />

        <div className="relative z-10 p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-400">
                <Heart className="h-4 w-4 fill-current" />
                <span>Stripe Receipt Processor{stripeProductId ? ` · Product ${stripeProductId}` : ''}</span>
              </div>
              <h2 className="mt-2 font-display text-2xl font-bold text-white">
                Support protoX Games
              </h2>
              <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-slate-300 sm:text-sm">
                Every game on protoX Games is free with zero ads. If you enjoy playing, support the arcade with a one-time contribution processed securely via Stripe.
              </p>
            </div>
            {stripeConfigured === false && (
              <p className="text-[11px] text-slate-400">
                Stripe Sandbox active until <code className="font-mono text-emerald-400">STRIPE_SECRET_KEY</code> &{' '}
                <code className="font-mono text-emerald-400">STRIPE_PRODUCT_ID</code> are set.
              </p>
            )}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {SUPPORT_OPTIONS.map((opt) => (
              <button
                key={opt.amount}
                type="button"
                disabled={checkoutBusy !== null}
                onClick={() => onSupportAmount(opt.amount)}
                className="flex flex-col justify-between rounded-xl border border-white/15 bg-[#0A0F17]/95 p-4 text-left transition hover:border-emerald-500/50 disabled:opacity-50"
              >
                <div>
                  <span className="font-mono text-2xl font-bold text-white">{opt.label}</span>
                  <p className="mt-1 text-xs text-slate-400">{opt.note}</p>
                </div>
                <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                  <CreditCard className="h-3.5 w-3.5" />
                  {checkoutBusy === opt.amount ? 'Connecting...' : `Support ${opt.label}`}
                </span>
              </button>
            ))}
          </div>

          {supportReceipts.length > 0 && (
            <div className="mt-6 border-t border-white/10 pt-5">
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-200">
                <Receipt className="h-4 w-4 text-emerald-400" />
                <span>Your Stripe Support Receipts</span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {supportReceipts.map((r) => (
                  <div
                    key={r.supportId}
                    className="flex items-center justify-between rounded-lg border border-white/10 bg-[#0A0F17] px-3.5 py-2.5 text-xs"
                  >
                    <span className="font-mono font-semibold text-emerald-400">
                      {Math.round(r.amountCents / 100)}$ {r.currency.toUpperCase()}
                    </span>
                    <span className="max-w-[200px] truncate font-mono text-[11px] text-slate-400">
                      {r.stripeSessionId}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Favorites Section */}
      <section className="mt-8">
        <div className="mb-3 flex items-center gap-2">
          <Heart className="h-4 w-4 text-emerald-400" />
          <h2 className="font-display text-lg font-bold text-white">Saved Favorites</h2>
        </div>
        {favoriteGames.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-[#0F151E] p-6 text-xs text-slate-400">
            {user
              ? 'No favorites saved yet. Tap the heart icon on any game to pin it here.'
              : 'Sign in with Google to save favorites to your profile.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {favoriteGames.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                isFavorite
                stats={playHistory[game.id]}
                onSelect={onSelectGame}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </div>
        )}
      </section>

      {/* Play History Section */}
      <section className="mt-8">
        <div className="mb-3 flex items-center gap-2">
          <History className="h-4 w-4 text-emerald-400" />
          <h2 className="font-display text-lg font-bold text-white">Recent Play History</h2>
        </div>
        {historyGames.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-[#0F151E] p-6 text-xs text-slate-400">
            Launch any game to start tracking your play history.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {historyGames.slice(0, 12).map((game) => (
              <GameCard
                key={game.id}
                game={game}
                isFavorite={Boolean(favorites[game.id])}
                stats={playHistory[game.id]}
                onSelect={onSelectGame}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </div>
        )}
      </section>

      {/* Developer & Catalog Object Utilities */}
      <section className="mt-8 rounded-2xl border border-white/10 bg-[#0F151E] p-6">
        <h2 className="font-display text-base font-bold text-white">Catalog & Expo Pack Tools</h2>
        <p className="mt-1 text-xs text-slate-400">
          Paste a custom 4,000+ games JS/JSON object or export the single-file Expo Router template.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onOpenPasteModal}
            className="inline-flex min-h-[42px] items-center gap-2 rounded-lg border border-white/15 bg-[#0A0F17] px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-emerald-500/40 hover:text-white"
          >
            <Code2 className="h-4 w-4 text-emerald-400" /> Load Custom Games Object
          </button>
          <button
            type="button"
            onClick={onOpenExpoModal}
            className="inline-flex min-h-[42px] items-center gap-2 rounded-lg border border-white/15 bg-[#0A0F17] px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-emerald-500/40 hover:text-white"
          >
            <FileCode2 className="h-4 w-4 text-emerald-400" /> Expo Router Single File (app/index.tsx)
          </button>
        </div>
      </section>
    </div>
  );
}
