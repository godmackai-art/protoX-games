import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Columns2,
  Copy,
  ExternalLink,
  Globe,
  Heart,
  HelpCircle,
  Maximize2,
  Minimize2,
  Monitor,
  MoreHorizontal,
  RectangleHorizontal,
  RotateCw,
  Share2,
  Smartphone,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { NormalizedGame, PlayHistoryEntry, SupportAmountDollars } from '../types/game';
import { GameCard } from './GameCard';
import { SupportReminderBanner } from './SupportReminderBanner';

export type ViewportMode = 'part' | 'theater' | 'fullscreen';

interface GamePlayerPageProps {
  game: NormalizedGame;
  allGames: NormalizedGame[];
  favorites: Record<string, boolean>;
  playHistory: Record<string, PlayHistoryEntry>;
  reminderDismissed: boolean;
  onDismissReminder: () => void;
  onBack: () => void;
  onSelectGame: (game: NormalizedGame) => void;
  onSelectGenre: (genre: string) => void;
  onToggleFavorite: (game: NormalizedGame) => void;
  onOpenSupportModal: (amount?: SupportAmountDollars) => void;
  onFullscreenChange: (isFullscreen: boolean) => void;
}

export function GamePlayerPage({
  game,
  allGames,
  favorites,
  playHistory,
  reminderDismissed,
  onDismissReminder,
  onBack,
  onSelectGame,
  onSelectGenre,
  onToggleFavorite,
  onOpenSupportModal,
  onFullscreenChange,
}: GamePlayerPageProps) {
  const [viewportMode, setViewportMode] = useState<ViewportMode>('part');
  const [muted, setMuted] = useState(false);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [moreOpen, setMoreOpen] = useState(false);
  const [showControlsPanel, setShowControlsPanel] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const stageContainerRef = useRef<HTMLDivElement | null>(null);
  const moreMenuRef = useRef<HTMLDivElement | null>(null);
  const controlsSectionRef = useRef<HTMLDivElement | null>(null);

  const isFav = Boolean(favorites[game.id]);
  const stats = playHistory[game.id];

  // Reset per-game UI state when slug changes
  useEffect(() => {
    setReloadNonce(0);
    setMoreOpen(false);
    setShowControlsPanel(false);
    setViewportMode('part');
    onFullscreenChange(false);
  }, [game.id, onFullscreenChange]);

  // Sync native browser fullscreen exit (e.g., user presses Esc)
  useEffect(() => {
    const handleNativeFullscreen = () => {
      const activeEl = document.fullscreenElement;
      if (!activeEl && viewportMode === 'fullscreen') {
        setViewportMode('part');
        onFullscreenChange(false);
      }
    };
    document.addEventListener('fullscreenchange', handleNativeFullscreen);
    return () => document.removeEventListener('fullscreenchange', handleNativeFullscreen);
  }, [viewportMode, onFullscreenChange]);

  // Close More Options popover when clicking outside
  useEffect(() => {
    if (!moreOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [moreOpen]);

  // Esc exits CSS fullscreen fallback too
  useEffect(() => {
    if (viewportMode !== 'fullscreen') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        void applyViewportMode('part');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const applyViewportMode = async (mode: ViewportMode) => {
    setViewportMode(mode);
    onFullscreenChange(mode === 'fullscreen');

    if (mode === 'fullscreen') {
      const el = stageContainerRef.current;
      if (el && el.requestFullscreen) {
        try {
          await el.requestFullscreen();
        } catch {
          // Preview iframe or browser blocked native fullscreen; CSS fixed fullscreen fallback handles it seamlessly
        }
      }
    } else if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch {
        // Ignore if already exited
      }
    }
  };

  const handleCopyShareLink = async () => {
    const shareUrl = `${window.location.origin}/game/${game.slug}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // Fallback ignore
    }
  };

  const similarGames = useMemo(() => {
    const primaryGenres = new Set(game.genres.map((g) => g.toLowerCase()));
    const scored: { item: NormalizedGame; score: number }[] = [];
    for (const candidate of allGames) {
      if (candidate.id === game.id) continue;
      let score = 0;
      for (const g of candidate.genres) {
        if (primaryGenres.has(g.toLowerCase())) score += 2;
      }
      if (candidate.category === game.category) score += 1;
      if (score > 0) {
        scored.push({ item: candidate, score });
      }
      if (scored.length >= 40) break;
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 12).map((s) => s.item);
  }, [allGames, game]);

  const isFullscreen = viewportMode === 'fullscreen';
  const isTheater = viewportMode === 'theater';

  return (
    <div className="mx-auto max-w-7xl px-3 pt-4 pb-24 sm:px-6 lg:px-8">
      {/* Top Breadcrumb & Back Bar */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 text-xs text-slate-400">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-white/10 bg-[#0F151E] px-3 py-1.5 font-semibold text-slate-200 transition hover:border-emerald-500/45 hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </button>
          <span className="hidden text-slate-600 sm:inline">/</span>
          <button
            type="button"
            onClick={() => onSelectGenre(game.category)}
            className="hidden truncate font-medium text-slate-300 hover:text-emerald-400 sm:inline"
          >
            {game.category}
          </button>
          <span className="hidden text-slate-600 sm:inline">/</span>
          <span className="truncate font-semibold text-white">{game.title}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void handleCopyShareLink()}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-white/10 bg-[#0F151E] px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-white/25"
          >
            {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Share2 className="h-3.5 w-3.5" />}
            {copiedLink ? 'Link Copied' : 'Share'}
          </button>
        </div>
      </div>

      {/* Main Split / Theater Layout */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Player Column (8 cols in Part Screen, 12 cols in Theater) */}
        <div className={isTheater ? 'lg:col-span-12' : 'lg:col-span-8'}>
          <div
            ref={stageContainerRef}
            className={
              isFullscreen
                ? 'fixed inset-0 z-50 flex flex-col bg-[#05070B]'
                : 'flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0B1018] shadow-2xl'
            }
          >
            {/* Game Stage Viewport (Instant Launch — Zero Pre-Roll Ads) */}
            <div
              className={`relative w-full bg-black ${
                isFullscreen
                  ? 'flex-1'
                  : isTheater
                  ? 'h-[62vh] min-h-[420px] max-h-[760px]'
                  : 'aspect-[16/10] min-h-[300px] sm:min-h-[450px]'
              }`}
            >
              <iframe
                key={`${game.id}_${reloadNonce}_${muted ? 'm' : 'u'}`}
                src={game.url}
                title={game.title}
                className="h-full w-full border-0 bg-black"
                allowFullScreen
                allow="fullscreen; accelerometer; autoplay; camera; clipboard-read; clipboard-write; encrypted-media; gamepad; gyroscope; microphone; picture-in-picture; screen-wake-lock; speaker-selection; web-share; xr-spatial-tracking"
              />
            </div>

            {/* Realistic CrazyGames-Style Player Control Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-[#0F151E] px-3.5 py-2.5 sm:px-5">
              {/* Left: Game Identity */}
              <div className="flex min-w-0 items-center gap-3">
                <img
                  src={game.icon || game.thumb}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="h-9 w-9 shrink-0 rounded-lg border border-white/10 object-cover"
                />
                <div className="min-w-0">
                  <p className="truncate font-display text-sm font-bold text-white sm:text-base">
                    {game.title}
                  </p>
                  <p className="truncate text-[11px] text-slate-400">
                    {game.category}
                    <span className="mx-1.5" aria-hidden="true">·</span>
                    <span>Instant HTML5</span>
                    {stats && stats.playCount > 0 && (
                      <>
                        <span className="mx-1.5" aria-hidden="true">·</span>
                        <span>{stats.playCount} plays</span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Right: Viewport Modes (Part Screen / Theater / Fullscreen) + More Options */}
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                {/* Screen Size Selector */}
                <div
                  role="group"
                  aria-label="Player viewport size"
                  className="flex items-center rounded-lg border border-white/10 bg-[#090D14] p-0.5"
                >
                  <button
                    type="button"
                    onClick={() => void applyViewportMode('part')}
                    title="Part Screen (Standard)"
                    aria-label="Part screen mode"
                    className={`inline-flex h-9 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold transition ${
                      viewportMode === 'part'
                        ? 'bg-emerald-500 text-slate-950'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <Columns2 className="h-3.5 w-3.5" />
                    <span className="hidden md:inline">Part Screen</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => void applyViewportMode('theater')}
                    title="Theater Wide Mode"
                    aria-label="Theater wide mode"
                    className={`inline-flex h-9 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold transition ${
                      viewportMode === 'theater'
                        ? 'bg-emerald-500 text-slate-950'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <RectangleHorizontal className="h-3.5 w-3.5" />
                    <span className="hidden md:inline">Theater</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      void applyViewportMode(isFullscreen ? 'part' : 'fullscreen')
                    }
                    title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                    aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                    className={`inline-flex h-9 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold transition ${
                      isFullscreen
                        ? 'bg-emerald-500 text-slate-950'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {isFullscreen ? (
                      <Minimize2 className="h-3.5 w-3.5" />
                    ) : (
                      <Maximize2 className="h-3.5 w-3.5" />
                    )}
                    <span className="hidden sm:inline">
                      {isFullscreen ? 'Exit Full' : 'Fullscreen'}
                    </span>
                  </button>
                </div>

                {/* Quick Utility Buttons */}
                <button
                  type="button"
                  onClick={() => setMuted((m) => !m)}
                  aria-label={muted ? 'Unmute frame' : 'Mute frame'}
                  title={muted ? 'Unmute' : 'Mute'}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-[#090D14] text-slate-300 transition hover:border-white/25 hover:text-white"
                >
                  {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => setReloadNonce((n) => n + 1)}
                  aria-label="Reload game"
                  title="Reload game"
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-[#090D14] text-slate-300 transition hover:border-white/25 hover:text-white"
                >
                  <RotateCw className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => onToggleFavorite(game)}
                  aria-label={isFav ? 'Remove from favorites' : 'Save to favorites'}
                  title={isFav ? 'Saved in Favorites' : 'Save to Favorites'}
                  className={`flex h-10 w-10 items-center justify-center rounded-lg border transition ${
                    isFav
                      ? 'border-emerald-500/45 bg-emerald-500/15 text-emerald-400'
                      : 'border-white/10 bg-[#090D14] text-slate-300 hover:border-white/25 hover:text-white'
                  }`}
                >
                  <Heart className={`h-4 w-4 ${isFav ? 'fill-current' : ''}`} />
                </button>

                {/* More Options Dropdown */}
                <div ref={moreMenuRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setMoreOpen((o) => !o)}
                    aria-expanded={moreOpen}
                    aria-label="More game options"
                    title="More options"
                    className="inline-flex h-10 items-center gap-1 rounded-lg border border-white/10 bg-[#090D14] px-2.5 text-xs font-semibold text-slate-200 transition hover:border-white/25 hover:text-white"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="hidden sm:inline">More</span>
                  </button>

                  {moreOpen && (
                    <div className="absolute right-0 bottom-12 z-50 w-56 rounded-xl border border-white/15 bg-[#121926] p-1.5 shadow-2xl">
                      <button
                        type="button"
                        onClick={() => {
                          setShowControlsPanel((s) => !s);
                          setMoreOpen(false);
                          controlsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs font-medium text-slate-200 hover:bg-white/10"
                      >
                        <HelpCircle className="h-4 w-4 text-emerald-400" />
                        How to Play & Controls
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          void handleCopyShareLink();
                          setMoreOpen(false);
                        }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs font-medium text-slate-200 hover:bg-white/10"
                      >
                        <Copy className="h-4 w-4 text-emerald-400" />
                        Copy Direct Route Link
                      </button>

                      <a
                        href={game.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setMoreOpen(false)}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs font-medium text-slate-200 hover:bg-white/10"
                      >
                        <ExternalLink className="h-4 w-4 text-emerald-400" />
                        Open Game in New Tab
                      </a>

                      <button
                        type="button"
                        onClick={() => {
                          setReloadNonce((n) => n + 1);
                          setMoreOpen(false);
                        }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs font-medium text-slate-200 hover:bg-white/10"
                      >
                        <RotateCw className="h-4 w-4 text-emerald-400" />
                        Restart / Reload Embed
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setMoreOpen(false);
                          onOpenSupportModal(5);
                        }}
                        className="mt-1 flex w-full items-center gap-2.5 rounded-lg bg-emerald-500/15 px-3 py-2.5 text-left text-xs font-semibold text-emerald-300 hover:bg-emerald-500/25"
                      >
                        <Heart className="h-4 w-4" />
                        Support protoX Games
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Conditional Controls Pop-Down Banner when toggled from More Menu */}
          {showControlsPanel && game.howToPlayText && (
            <div className="mt-3 rounded-xl border border-emerald-500/30 bg-[#0F1816] p-4 text-xs leading-relaxed text-slate-200">
              <p className="font-display text-sm font-bold text-emerald-300">Controls & Tips</p>
              <p className="mt-1 whitespace-pre-line">{game.howToPlayText}</p>
            </div>
          )}

          {/* Support Reminder below the game player */}
          {!reminderDismissed && (
            <SupportReminderBanner
              compact
              onOpenSupportModal={onOpenSupportModal}
              onDismiss={onDismissReminder}
            />
          )}

          {/* Game Details & Controls Card */}
          <section
            ref={controlsSectionRef}
            className="mt-5 rounded-2xl border border-white/10 bg-[#0F151E] p-5 sm:p-7"
          >
            <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-start">
              <div>
                <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
                  {game.title}
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-300">
                  {game.genres.map((genre, i) => (
                    <span key={genre} className="inline-flex items-center gap-3">
                      {i > 0 && <span className="text-slate-600" aria-hidden="true">·</span>}
                      <button
                        type="button"
                        onClick={() => onSelectGenre(genre)}
                        className="font-medium text-emerald-400 hover:underline"
                      >
                        {genre}
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Technical Specs Summary */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                <span className="inline-flex items-center gap-1.5">
                  {game.orientation.horizontal ? (
                    <Monitor className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Smartphone className="h-3.5 w-3.5 text-emerald-400" />
                  )}
                  {game.orientation.horizontal && game.orientation.vertical
                    ? 'Desktop & Mobile'
                    : game.orientation.horizontal
                    ? 'Landscape'
                    : 'Portrait'}
                </span>
                {game.supportedLanguages.length > 0 && (
                  <span className="inline-flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-emerald-400" />
                    {game.supportedLanguages.length} Languages
                  </span>
                )}
              </div>
            </div>

            <div className="mt-5 space-y-5">
              <div>
                <h2 className="font-display text-sm font-bold tracking-wide text-slate-200 uppercase">
                  About {game.title}
                </h2>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-300">
                  {game.description}
                </p>
              </div>

              {game.howToPlayText && (
                <div className="rounded-xl border border-white/10 bg-[#0A0F17] p-4">
                  <h2 className="font-display text-sm font-bold tracking-wide text-emerald-400 uppercase">
                    How to Play
                  </h2>
                  <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-slate-200">
                    {game.howToPlayText}
                  </p>
                </div>
              )}

              {game.mobileReady.length > 0 && (
                <div className="text-xs text-slate-400">
                  <span className="font-semibold text-slate-200">Platforms: </span>
                  {game.mobileReady.join(' · ')}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Sidebar (Part Screen) or Full Row Below (Theater Mode): Similar Games */}
        <aside className={isTheater ? 'lg:col-span-12' : 'lg:col-span-4'}>
          <div className="rounded-2xl border border-white/10 bg-[#0F151E] p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-white">Similar Games</h2>
              <button
                type="button"
                onClick={() => onSelectGenre(game.category)}
                className="text-xs font-semibold text-emerald-400 hover:underline"
              >
                More {game.category}
              </button>
            </div>

            <div
              className={
                isTheater
                  ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'
                  : 'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1'
              }
            >
              {similarGames.map((sim) => (
                <GameCard
                  key={sim.id}
                  game={sim}
                  isFavorite={Boolean(favorites[sim.id])}
                  stats={playHistory[sim.id]}
                  onSelect={onSelectGame}
                  onToggleFavorite={onToggleFavorite}
                />
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
