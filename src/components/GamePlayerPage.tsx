import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Expand,
  ExternalLink,
  Heart,
  Loader2,
  Minimize2,
  RectangleHorizontal,
  RotateCcw,
  Share2,
  Star,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type {
  FeedbackEntry,
  NormalizedGame,
  PlayHistoryEntry,
  SupportAmountDollars,
} from '../types/game';
import { GameCard } from './GameCard';
import { GameThumbnail } from './GameThumbnail';
import { FeedbackSection } from './FeedbackSection';
import { SupportReminderBanner } from './SupportReminderBanner';

type ViewportMode = 'standard' | 'part-screen' | 'fullscreen';

interface GamePlayerPageProps {
  game: NormalizedGame;
  allGames: NormalizedGame[];
  favorites: Record<string, boolean>;
  playHistory: Record<string, PlayHistoryEntry>;
  feedbackComments: FeedbackEntry[];
  userDisplayName: string;
  userEmail: string;
  reminderDismissed: boolean;
  onDismissReminder: () => void;
  onBack: () => void;
  onSelectGame: (game: NormalizedGame) => void;
  onSelectGenre: (genre: string) => void;
  onToggleFavorite: (game: NormalizedGame) => void;
  onOpenSupportModal: (amount: SupportAmountDollars) => void;
  onFullscreenChange: (isFullscreen: boolean) => void;
  onSaveFeedback: (entry: {
    authorName: string;
    replyEmail: string;
    gameTitle?: string;
    message: string;
  }) => Promise<void>;
}

export function GamePlayerPage({
  game,
  allGames,
  favorites,
  playHistory,
  feedbackComments,
  userDisplayName,
  userEmail,
  reminderDismissed,
  onDismissReminder,
  onBack,
  onSelectGame,
  onSelectGenre,
  onToggleFavorite,
  onOpenSupportModal,
  onFullscreenChange,
  onSaveFeedback,
}: GamePlayerPageProps) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [viewportMode, setViewportMode] = useState<ViewportMode>('standard');
  const [reloadNonce, setReloadNonce] = useState(0);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [muted, setMuted] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  const isFullscreen = viewportMode === 'fullscreen';
  const isPartScreen = viewportMode === 'part-screen';

  useEffect(() => {
    setViewportMode('standard');
    setReloadNonce(0);
    setIframeLoaded(false);
  }, [game.id]);

  useEffect(() => {
    onFullscreenChange(isFullscreen);
    return () => onFullscreenChange(false);
  }, [isFullscreen, onFullscreenChange]);

  useEffect(() => {
    const handleFsChange = () => {
      if (!document.fullscreenElement) {
        setViewportMode((prev) => (prev === 'fullscreen' ? 'standard' : prev));
      }
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const relatedGames = useMemo(() => {
    const tagSet = new Set([...game.genres, ...game.tags].map((x) => x.toLowerCase()));
    return allGames
      .filter((item) => item.id !== game.id)
      .map((item) => {
        const overlap = [...item.genres, ...item.tags].reduce(
          (acc, entry) => (tagSet.has(entry.toLowerCase()) ? acc + 1 : acc),
          0
        );
        return { item, overlap };
      })
      .sort((a, b) => b.overlap - a.overlap)
      .slice(0, 12)
      .map((entry) => entry.item);
  }, [allGames, game]);

  const stats = playHistory[game.id];
  const isFav = Boolean(favorites[game.id]);

  const toggleNativeFullscreen = async () => {
    if (isFullscreen) {
      if (document.fullscreenElement) {
        try {
          await document.exitFullscreen();
        } catch {
          // CSS fallback exit handled below
        }
      }
      setViewportMode('standard');
      return;
    }

    setViewportMode('fullscreen');
    if (stageRef.current?.requestFullscreen) {
      try {
        await stageRef.current.requestFullscreen();
      } catch {
        // CSS fullscreen fills the viewport cleanly when blocked
      }
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/game/${game.slug}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${game.title} — ProtoX Games`,
          text: `Play ${game.title} instantly on ProtoX Games.`,
          url: shareUrl,
        });
        return;
      } catch {
        // Fallback to clipboard copy
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2200);
    } catch {
      // Ignore clipboard permission failure
    }
  };

  return (
    <div className="space-y-6">
      {!isFullscreen && (
        <div className="glass-panel flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-2.5">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex min-h-[36px] items-center gap-2 text-xs font-semibold text-white transition hover:text-[#A78BFA]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Explore</span>
          </button>

          <div className="flex flex-wrap items-center gap-2.5 text-xs text-[#A1A1B5]">
            <button
              type="button"
              onClick={() => onSelectGenre(game.category)}
              className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 font-medium text-white hover:border-[#8B5CF6]/55"
            >
              {game.category}
            </button>
            <span className="inline-flex items-center gap-1 font-mono text-amber-300">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {game.rating}
            </span>
            {stats && (
              <span className="font-mono text-[#06B6D4]">
                {stats.playCount} {stats.playCount === 1 ? 'play' : 'plays'}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Desktop CrazyGames 2-Column Player Layout (Left Stage + Right Related Rail); Mobile Stacked */}
      <div
        className={
          isFullscreen
            ? ''
            : 'grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start lg:gap-5'
        }
      >
        <div
          className={
            isFullscreen
              ? ''
              : `space-y-6 ${isPartScreen ? 'lg:col-span-12' : 'lg:col-span-9'}`
          }
        >
          {/* Playable Frosted Glass Stage */}
          <section
            ref={stageRef}
            className={
              isFullscreen
                ? 'fixed inset-0 z-50 flex flex-col bg-[#080B16]'
                : 'glass-panel-deep relative overflow-hidden rounded-2xl p-1.5 sm:p-2.5'
            }
          >
            <div
              onClick={() => iframeRef.current?.focus()}
              className={`relative w-full overflow-hidden bg-black ${
                isFullscreen
                  ? 'flex-1'
                  : isPartScreen
                  ? 'h-[78vh] min-h-[500px] rounded-xl'
                  : game.orientation.vertical && !game.orientation.horizontal
                  ? 'mx-auto aspect-[9/14] max-h-[76vh] max-w-[460px] rounded-xl'
                  : 'aspect-[16/9] min-h-[360px] max-h-[76vh] rounded-xl lg:min-h-[480px]'
              }`}
            >
              {!iframeLoaded && (
                <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#080B16]/90">
                  <Loader2 className="h-8 w-8 animate-spin text-[#06B6D4]" />
                  <p className="font-display text-sm font-semibold text-white">
                    Launching {game.title}...
                  </p>
                </div>
              )}

              <iframe
                ref={iframeRef}
                key={`${game.id}-${reloadNonce}`}
                title={game.title}
                src={game.url}
                onLoad={() => setIframeLoaded(true)}
                referrerPolicy="no-referrer-when-downgrade"
                className="h-full w-full border-0"
                allow="fullscreen; accelerometer; clipboard-read; clipboard-write; screen-wake-lock; speaker-selection; web-share; gyroscope; xr-spatial-tracking; autoplay; encrypted-media; picture-in-picture; storage-access; gamepad"
                allowFullScreen
              />

              {muted && (
                <div className="pointer-events-none absolute top-3 left-3 z-20 rounded-xl border border-white/15 bg-[#080B16]/85 px-3 py-1.5 text-[11px] font-medium text-[#A1A1B5] backdrop-blur-md">
                  Sound muted preference active — toggle audio inside the game menu if needed
                </div>
              )}
            </div>

            {/* CrazyGames-Style Attached Footer Action Bar */}
            <div
              className={`flex flex-wrap items-center justify-between gap-3 px-2.5 py-3 sm:px-3.5 ${
                isFullscreen ? 'border-t border-white/10 bg-[#101629]/95' : ''
              }`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="hidden h-10 w-14 shrink-0 overflow-hidden rounded-lg border border-white/15 bg-[#080B16] sm:block">
                  <GameThumbnail game={game} hoverZoom={false} />
                </div>
                <div className="min-w-0">
                  <h1 className="truncate font-display text-lg font-bold text-white sm:text-xl">
                    {game.title}
                  </h1>
                  <p className="truncate text-xs text-[#A1A1B5]">
                    {game.genres.slice(0, 3).join(' · ')}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setViewportMode((m) => (m === 'part-screen' ? 'standard' : 'part-screen'))
                  }
                  className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                    isPartScreen
                      ? 'border-[#06B6D4]/55 bg-[#06B6D4]/20 text-white'
                      : 'border-white/15 bg-white/5 text-[#A1A1B5] hover:text-white'
                  }`}
                >
                  <RectangleHorizontal className="h-3.5 w-3.5" />
                  <span>Theater</span>
                </button>

                <button
                  type="button"
                  onClick={() => void toggleNativeFullscreen()}
                  className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                    isFullscreen
                      ? 'border border-[#8B5CF6]/60 bg-[#8B5CF6] text-white'
                      : 'bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] text-white hover:brightness-110'
                  }`}
                >
                  {isFullscreen ? (
                    <>
                      <Minimize2 className="h-3.5 w-3.5" />
                      Exit Fullscreen
                    </>
                  ) : (
                    <>
                      <Expand className="h-3.5 w-3.5" />
                      Fullscreen
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIframeLoaded(false);
                    setReloadNonce((n) => n + 1);
                  }}
                  className="glass-card inline-flex min-h-[38px] items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-white"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-[#06B6D4]" />
                  Restart
                </button>

                <a
                  href={game.playgamaGameUrl || game.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-card inline-flex min-h-[38px] items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-white"
                  title="Open game directly in a new tab"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-[#A78BFA]" />
                  <span className="hidden sm:inline">Direct</span>
                </a>

                <button
                  type="button"
                  onClick={() => setMuted((m) => !m)}
                  aria-label={muted ? 'Unmute game' : 'Mute game'}
                  className="glass-card inline-flex min-h-[38px] items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-white"
                >
                  {muted ? (
                    <VolumeX className="h-3.5 w-3.5 text-rose-400" />
                  ) : (
                    <Volume2 className="h-3.5 w-3.5 text-[#22C55E]" />
                  )}
                  <span className="hidden sm:inline">{muted ? 'Muted' : 'Sound'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onToggleFavorite(game)}
                  className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                    isFav
                      ? 'border-[#8B5CF6]/60 bg-[#8B5CF6]/25 text-white'
                      : 'border-white/15 bg-white/5 text-[#A1A1B5] hover:text-white'
                  }`}
                >
                  <Heart className={`h-3.5 w-3.5 ${isFav ? 'fill-[#A78BFA] text-[#A78BFA]' : ''}`} />
                  <span>{isFav ? 'Favorited' : 'Favorite'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => void handleShare()}
                  className="glass-card inline-flex min-h-[38px] items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-white"
                >
                  {copiedShare ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-[#22C55E]" />
                      Copied Link
                    </>
                  ) : (
                    <>
                      <Share2 className="h-3.5 w-3.5 text-[#A78BFA]" />
                      Share
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>

          {!isFullscreen && (
            <>
              <SupportReminderBanner
                dismissed={reminderDismissed}
                onDismiss={onDismissReminder}
                onOpenSupport={onOpenSupportModal}
              />

              <section className="grid gap-6 lg:grid-cols-12">
                <div className="glass-panel rounded-3xl p-6 lg:col-span-7">
                  <h2 className="font-display text-lg font-bold text-white">About {game.title}</h2>
                  <p className="mt-2.5 text-sm leading-relaxed whitespace-pre-line text-[#A1A1B5]">
                    {game.description}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {game.genres.map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => onSelectGenre(g)}
                        className="rounded-xl border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white hover:border-[#8B5CF6]/60"
                      >
                        {g}
                      </button>
                    ))}
                    {game.tags.slice(0, 6).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-xl border border-white/10 bg-[#080B16]/50 px-2.5 py-1 text-[11px] text-[#A1A1B5]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="glass-panel rounded-3xl p-6 lg:col-span-5">
                  <h2 className="font-display text-lg font-bold text-white">Game Instructions</h2>
                  <p className="mt-2.5 text-sm leading-relaxed whitespace-pre-line text-[#A1A1B5]">
                    {game.howToPlayText ||
                      'Use your mouse, touch screen, or keyboard controls (WASD / Arrow Keys / Spacebar) inside the interactive player stage above. Click Fullscreen or Theater anytime for expanded viewing.'}
                  </p>

                  <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/10 pt-4 text-xs">
                    <div>
                      <span className="text-[#A1A1B5]">Orientation</span>
                      <p className="mt-0.5 font-semibold text-white">
                        {game.orientation.horizontal && game.orientation.vertical
                          ? 'Landscape & Portrait'
                          : game.orientation.vertical
                          ? 'Portrait'
                          : 'Landscape'}
                      </p>
                    </div>
                    <div>
                      <span className="text-[#A1A1B5]">Platforms</span>
                      <p className="mt-0.5 font-semibold text-white">
                        {game.mobileReady.length > 0 ? 'Desktop & Mobile' : 'Desktop Web'}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <FeedbackSection
                defaultName={userDisplayName}
                defaultEmail={userEmail}
                gameTitle={game.title}
                savedComments={feedbackComments}
                onSaveToHistory={onSaveFeedback}
              />

              {/* Mobile & Theater Fallback Related Games Strip */}
              {relatedGames.length > 0 && (
                <section className={`space-y-4 ${isPartScreen ? '' : 'lg:hidden'}`}>
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-xl font-bold text-white">Related Games</h2>
                    <button
                      type="button"
                      onClick={() => onSelectGenre(game.category)}
                      className="text-xs font-semibold text-[#06B6D4] hover:underline"
                    >
                      More in {game.category}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {relatedGames.slice(0, 8).map((rel, idx) => (
                      <GameCard
                        key={rel.id}
                        game={rel}
                        isFavorite={Boolean(favorites[rel.id])}
                        stats={playHistory[rel.id]}
                        index={idx}
                        onSelect={onSelectGame}
                        onToggleFavorite={onToggleFavorite}
                      />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>

        {/* Desktop CrazyGames Right Column: Sticky 2-Column Related Games Rail */}
        {!isFullscreen && !isPartScreen && relatedGames.length > 0 && (
          <aside
            aria-label="More games like this"
            className="hidden space-y-3 lg:sticky lg:top-20 lg:col-span-3 lg:block"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-sm font-bold text-white">More Games</h2>
              <button
                type="button"
                onClick={() => onSelectGenre(game.category)}
                className="text-[11px] font-semibold text-[#06B6D4] hover:underline"
              >
                View all
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {relatedGames.map((rel, idx) => (
                <GameCard
                  key={rel.id}
                  game={rel}
                  variant="tile"
                  isFavorite={Boolean(favorites[rel.id])}
                  stats={playHistory[rel.id]}
                  index={idx}
                  onSelect={onSelectGame}
                  onToggleFavorite={onToggleFavorite}
                />
              ))}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
