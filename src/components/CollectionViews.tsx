import { useMemo } from 'react';
import {
  Clock,
  Code2,
  Gamepad2,
  Heart,
  Play,
  Sliders,
  Sparkles,
  Trophy,
  Upload,
} from 'lucide-react';
import type { User } from 'firebase/auth';
import type {
  AppPreferences,
  NormalizedGame,
  PlayHistoryEntry,
  UserProfileDoc,
} from '../types/game';
import { GameCard } from './GameCard';
import { GameThumbnail } from './GameThumbnail';

interface FavoritesViewProps {
  user: User | null;
  games: NormalizedGame[];
  favorites: Record<string, boolean>;
  playHistory: Record<string, PlayHistoryEntry>;
  onSelectGame: (game: NormalizedGame) => void;
  onToggleFavorite: (game: NormalizedGame) => void;
  onGoogleSignIn: () => void;
  onExploreGames: () => void;
}

export function FavoritesView({
  user,
  games,
  favorites,
  playHistory,
  onSelectGame,
  onToggleFavorite,
  onGoogleSignIn,
  onExploreGames,
}: FavoritesViewProps) {
  const favoriteGames = useMemo(
    () => games.filter((g) => Boolean(favorites[g.id])),
    [games, favorites]
  );

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-3xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
              Favorite Games
            </h1>
            <p className="mt-1 text-xs text-[#A1A1B5] sm:text-sm">
              Your personal bookmarked titles synced with Cloud Firestore.
            </p>
          </div>
          <span className="font-mono text-sm font-semibold text-[#A78BFA]">
            {favoriteGames.length} saved
          </span>
        </div>
      </section>

      {!user ? (
        <div className="glass-panel rounded-3xl p-10 text-center">
          <Heart className="mx-auto h-9 w-9 text-[#A78BFA]" />
          <h2 className="mt-3 font-display text-lg font-bold text-white">
            Sign in to save your favorites
          </h2>
          <p className="mt-1 text-xs text-[#A1A1B5]">
            Connect your Google account to sync bookmarked games across sessions.
          </p>
          <button
            type="button"
            onClick={onGoogleSignIn}
            className="mt-5 inline-flex min-h-[44px] items-center rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] px-6 py-2.5 text-xs font-semibold text-white"
          >
            Sign In with Google
          </button>
        </div>
      ) : favoriteGames.length === 0 ? (
        <div className="glass-panel rounded-3xl p-10 text-center">
          <Heart className="mx-auto h-9 w-9 text-[#A1A1B5]" />
          <h2 className="mt-3 font-display text-lg font-bold text-white">No favorites yet</h2>
          <p className="mt-1 text-xs text-[#A1A1B5]">
            Tap the heart icon on any game card to add it to your quick-launch library.
          </p>
          <button
            type="button"
            onClick={onExploreGames}
            className="mt-5 inline-flex min-h-[44px] items-center rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] px-6 py-2.5 text-xs font-semibold text-white"
          >
            Explore Games
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {favoriteGames.map((game, idx) => (
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
      )}
    </div>
  );
}

interface RecentlyPlayedViewProps {
  games: NormalizedGame[];
  favorites: Record<string, boolean>;
  playHistory: Record<string, PlayHistoryEntry>;
  onSelectGame: (game: NormalizedGame) => void;
  onToggleFavorite: (game: NormalizedGame) => void;
  onExploreGames: () => void;
}

export function RecentlyPlayedView({
  games,
  favorites,
  playHistory,
  onSelectGame,
  onToggleFavorite,
  onExploreGames,
}: RecentlyPlayedViewProps) {
  const recentGames = useMemo(() => {
    const entries = Object.values(playHistory).sort((a, b) => b.playCount - a.playCount);
    return entries
      .map((entry) => games.find((g) => g.id === entry.gameId))
      .filter((g): g is NormalizedGame => Boolean(g));
  }, [games, playHistory]);

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-3xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
              Recently Played
            </h1>
            <p className="mt-1 text-xs text-[#A1A1B5] sm:text-sm">
              Jump right back into games you launched from your ProtoX account.
            </p>
          </div>
          <span className="font-mono text-sm font-semibold text-[#06B6D4]">
            {recentGames.length} played
          </span>
        </div>
      </section>

      {recentGames.length === 0 ? (
        <div className="glass-panel rounded-3xl p-10 text-center">
          <Clock className="mx-auto h-9 w-9 text-[#06B6D4]" />
          <h2 className="mt-3 font-display text-lg font-bold text-white">No play history yet</h2>
          <p className="mt-1 text-xs text-[#A1A1B5]">
            Launch any game while signed in to track your play counts and resume instantly.
          </p>
          <button
            type="button"
            onClick={onExploreGames}
            className="mt-5 inline-flex min-h-[44px] items-center rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] px-6 py-2.5 text-xs font-semibold text-white"
          >
            Browse Games
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {recentGames.map((game, idx) => (
            <GameCard
              key={game.id}
              game={game}
              isFavorite={Boolean(favorites[game.id])}
              stats={playHistory[game.id]}
              index={idx}
              onSelect={onSelectGame}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface LeaderboardViewProps {
  games: NormalizedGame[];
  playHistory: Record<string, PlayHistoryEntry>;
  profile: UserProfileDoc | null;
  onSelectGame: (game: NormalizedGame) => void;
}

export function LeaderboardView({
  games,
  playHistory,
  profile,
  onSelectGame,
}: LeaderboardViewProps) {
  const totalSessions = useMemo(
    () => Object.values(playHistory).reduce((acc, item) => acc + item.playCount, 0),
    [playHistory]
  );

  const totalSupportedDollars = Math.round(Number(profile?.totalSupportedCents || 0) / 100);

  const rankedRows = useMemo(() => {
    const personalMap = playHistory;
    return [...games]
      .sort((a, b) => {
        const scoreA =
          (personalMap[a.id]?.playCount || 0) * 50 +
          Number(a.rating) * 10 +
          a.supportedLanguages.length;
        const scoreB =
          (personalMap[b.id]?.playCount || 0) * 50 +
          Number(b.rating) * 10 +
          b.supportedLanguages.length;
        return scoreB - scoreA;
      })
      .slice(0, 15);
  }, [games, playHistory]);

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-3xl p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#A78BFA]">
              <Trophy className="h-4 w-4 text-[#06B6D4]" />
              <span>Arcade Rankings</span>
            </div>
            <h1 className="mt-1 font-display text-2xl font-bold text-white sm:text-3xl">
              Top Games Leaderboard
            </h1>
            <p className="mt-1 text-xs text-[#A1A1B5]">
              Ranked by your recorded session launches combined with catalog rating and language reach.
            </p>
          </div>

          <div className="glass-card rounded-2xl px-4 py-3 text-right">
            <p className="text-[11px] text-[#A1A1B5]">Your Total Launches</p>
            <p className="font-mono text-xl font-bold text-white">
              {totalSessions.toLocaleString()}
              {totalSupportedDollars > 0 && (
                <span className="ml-2 text-xs font-semibold text-[#06B6D4]">
                  · {totalSupportedDollars}$ Supporter
                </span>
              )}
            </p>
          </div>
        </div>
      </section>

      <div className="glass-panel overflow-hidden rounded-3xl">
        <div className="divide-y divide-white/10">
          {rankedRows.map((game, index) => {
            const plays = playHistory[game.id]?.playCount || 0;
            return (
              <div
                key={game.id}
                className="flex items-center justify-between gap-4 px-4 py-3.5 transition hover:bg-white/5 sm:px-6"
              >
                <div className="flex min-w-0 items-center gap-3.5">
                  <span
                    className={`w-7 shrink-0 text-center font-mono text-sm font-bold ${
                      index === 0
                        ? 'text-amber-300'
                        : index === 1
                        ? 'text-slate-200'
                        : index === 2
                        ? 'text-amber-600'
                        : 'text-[#A1A1B5]'
                    }`}
                  >
                    #{index + 1}
                  </span>
                  <div className="h-11 w-16 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-[#080B16]">
                    <GameThumbnail game={game} hoverZoom={false} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-display text-sm font-bold text-white">
                      {game.title}
                    </p>
                    <p className="truncate text-xs text-[#A1A1B5]">
                      {game.category} · {game.supportedLanguages.length} languages
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-4">
                  <div className="hidden text-right sm:block">
                    <p className="font-mono text-xs font-semibold text-white">
                      Rating {game.rating}
                    </p>
                    <p className="font-mono text-[11px] text-[#06B6D4]">
                      {plays > 0 ? `${plays} your plays` : 'Catalog top pick'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectGame(game)}
                    className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] px-3.5 py-1.5 text-xs font-semibold text-white hover:brightness-110"
                  >
                    <Play className="h-3 w-3 fill-current" />
                    Play
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface SettingsViewProps {
  profile: UserProfileDoc | null;
  preferences: AppPreferences;
  totalGames: number;
  onUpdatePreferences: (next: AppPreferences) => void;
  onOpenSupport: () => void;
  onOpenPasteModal: () => void;
  onOpenExpoModal: () => void;
}

export function SettingsView({
  profile,
  preferences,
  totalGames,
  onUpdatePreferences,
  onOpenSupport,
  onOpenPasteModal,
  onOpenExpoModal,
}: SettingsViewProps) {
  const totalSupportedDollars = Math.round(Number(profile?.totalSupportedCents || 0) / 100);

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-3xl p-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#A78BFA]">
          <Sliders className="h-4 w-4 text-[#06B6D4]" />
          <span>Platform Preferences</span>
        </div>
        <h1 className="mt-1 font-display text-2xl font-bold text-white sm:text-3xl">Settings</h1>
        <p className="mt-1 text-xs text-[#A1A1B5]">
          Customize glass interface density, ambient lighting, community support, and catalog utilities.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="glass-panel space-y-4 rounded-3xl p-6">
          <h2 className="font-display text-lg font-bold text-white">Interface & Player</h2>

          <label className="glass-card flex cursor-pointer items-center justify-between gap-4 rounded-2xl p-4">
            <div>
              <p className="text-sm font-semibold text-white">Ambient Purple & Cyan Glow</p>
              <p className="text-xs text-[#A1A1B5]">
                Atmospheric radial lighting behind frosted glass surfaces.
              </p>
            </div>
            <input
              type="checkbox"
              checked={preferences.ambientEffects}
              onChange={(e) =>
                onUpdatePreferences({ ...preferences, ambientEffects: e.target.checked })
              }
              className="h-5 w-5 accent-[#8B5CF6]"
            />
          </label>

          <label className="glass-card flex cursor-pointer items-center justify-between gap-4 rounded-2xl p-4">
            <div>
              <p className="text-sm font-semibold text-white">Compact Game Cards</p>
              <p className="text-xs text-[#A1A1B5]">
                Slightly denser grid layout for faster catalog scanning.
              </p>
            </div>
            <input
              type="checkbox"
              checked={preferences.compactCards}
              onChange={(e) =>
                onUpdatePreferences({ ...preferences, compactCards: e.target.checked })
              }
              className="h-5 w-5 accent-[#8B5CF6]"
            />
          </label>

          <label className="glass-card flex cursor-pointer items-center justify-between gap-4 rounded-2xl p-4">
            <div>
              <p className="text-sm font-semibold text-white">Player Audio Hints</p>
              <p className="text-xs text-[#A1A1B5]">
                Show helpful mute and keyboard focus tips inside game stages.
              </p>
            </div>
            <input
              type="checkbox"
              checked={preferences.audioHints}
              onChange={(e) =>
                onUpdatePreferences({ ...preferences, audioHints: e.target.checked })
              }
              className="h-5 w-5 accent-[#8B5CF6]"
            />
          </label>
        </section>

        <section className="glass-panel space-y-4 rounded-3xl p-6">
          <h2 className="font-display text-lg font-bold text-white">Support & Catalog Tools</h2>

          <div className="glass-card flex items-center justify-between gap-4 rounded-2xl p-4">
            <div>
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 fill-[#06B6D4] text-[#06B6D4]" />
                <p className="text-sm font-semibold text-white">Support ProtoX Games</p>
              </div>
              <p className="mt-0.5 text-xs text-[#A1A1B5]">
                {totalSupportedDollars > 0
                  ? `${totalSupportedDollars}$ contributed via Stripe.`
                  : 'Every game is free with zero ads. Contribute 1$, 10$, or 100$.'}
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenSupport}
              className="shrink-0 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] px-4 py-2 text-xs font-semibold text-white"
            >
              Support
            </button>
          </div>

          <div className="glass-card flex items-center justify-between gap-4 rounded-2xl p-4">
            <div>
              <div className="flex items-center gap-2">
                <Gamepad2 className="h-4 w-4 text-[#06B6D4]" />
                <p className="text-sm font-semibold text-white">Custom Games Catalog</p>
              </div>
              <p className="mt-0.5 font-mono text-xs text-[#A1A1B5]">
                {totalGames.toLocaleString()} titles currently active
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenPasteModal}
              className="glass-card inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold text-white"
            >
              <Upload className="h-3.5 w-3.5 text-[#A78BFA]" />
              Load JSON
            </button>
          </div>

          <div className="glass-card flex items-center justify-between gap-4 rounded-2xl p-4">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#A78BFA]" />
                <p className="text-sm font-semibold text-white">Expo Router Single-File Pack</p>
              </div>
              <p className="mt-0.5 text-xs text-[#A1A1B5]">
                View or download the mobile Expo Router template.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenExpoModal}
              className="glass-card inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold text-white"
            >
              <Code2 className="h-3.5 w-3.5 text-[#06B6D4]" />
              Export
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
