import React, { Component, useCallback, useEffect, useMemo, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { Copy, Download, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from './firebase';
import { PROTOX_GAMES_OBJECT } from './data/playgamaCatalog';
import { EXPO_ROUTER_SINGLE_FILE_CODE } from './expoTemplate';
import type {
  AppPreferences,
  AppViewMode,
  FeedbackEntry,
  GameSortOrder,
  GameTypeFilter,
  NormalizedGame,
  PlayHistoryEntry,
  SupportAmountDollars,
  SupportReceiptEntry,
  UserProfileDoc,
} from './types/game';
import { buildDiscoveryShelves, normalizeGamesInput } from './utils/catalog';
import { TopNavbar } from './components/TopNavbar';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { HeroSection } from './components/HeroSection';
import { DiscoveryShelves } from './components/DiscoveryShelves';
import { ExploreCatalogView } from './components/ExploreCatalogView';
import { CategoriesView } from './components/CategoriesView';
import {
  FavoritesView,
  LeaderboardView,
  RecentlyPlayedView,
  SettingsView,
} from './components/CollectionViews';
import { ProfileView } from './components/ProfileView';
import { GamePlayerPage } from './components/GamePlayerPage';
import { FeedbackSection } from './components/FeedbackSection';
import { SupportReminderBanner } from './components/SupportReminderBanner';
import { SupportModal } from './components/SupportModal';
import { Footer } from './components/Footer';

/* ============================================================================
   ERROR BOUNDARY (Required for Firebase Permission Diagnostics)
   ============================================================================ */
interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

class AppErrorBoundary extends Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message || 'An unexpected error occurred.' };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#080B16] p-6 text-white">
          <div className="glass-panel-deep w-full max-w-lg rounded-3xl border border-rose-500/35 p-8">
            <h1 className="font-display text-2xl font-bold text-white">Something went wrong</h1>
            <p className="mt-2 text-sm text-[#A1A1B5]">
              A database or runtime error interrupted the session. Please reload the page or sign in again.
            </p>
            <pre className="mt-4 max-h-40 overflow-auto rounded-xl bg-black/50 p-3 font-mono text-xs text-rose-300">
              {this.state.message}
            </pre>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] px-5 py-2.5 text-sm font-semibold text-white"
            >
              Reload ProtoX Games
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ============================================================================
   CLIENT ROUTER HELPERS
   ============================================================================ */
type ParsedRoute = { view: AppViewMode; slug?: string };

function parsePathname(pathname: string): ParsedRoute {
  const clean = pathname.replace(/\/+$/, '') || '/';
  if (clean === '/discover') return { view: 'discover' };
  if (clean === '/games' || clean === '/explore') return { view: 'games' };
  if (clean === '/categories') return { view: 'categories' };
  if (clean === '/trending') return { view: 'trending' };
  if (clean === '/favorites') return { view: 'favorites' };
  if (clean === '/recent') return { view: 'recent' };
  if (clean === '/leaderboard') return { view: 'leaderboard' };
  if (clean === '/settings') return { view: 'settings' };
  if (clean === '/profile') return { view: 'profile' };
  if (clean.startsWith('/game/')) {
    const slug = decodeURIComponent(clean.slice('/game/'.length));
    if (slug) return { view: 'game', slug };
  }
  return { view: 'home' };
}

function viewToPath(view: AppViewMode): string {
  if (view === 'home') return '/';
  return `/${view}`;
}

function upsertHeadTag(
  selector: string,
  createFn: () => HTMLElement,
  applyFn: (el: HTMLElement) => void
) {
  let el = document.head.querySelector<HTMLElement>(selector);
  if (!el) {
    el = createFn();
    document.head.appendChild(el);
  }
  applyFn(el);
}

/* ============================================================================
   MAIN APPLICATION COMPONENT
   ============================================================================ */
function ProtoXGamesApp() {
  const [rawGamesObj, setRawGamesObj] = useState<unknown>(() => PROTOX_GAMES_OBJECT);
  const games = useMemo(() => normalizeGamesInput(rawGamesObj), [rawGamesObj]);

  // History API Dynamic Routing
  const [pathname, setPathname] = useState<string>(() => window.location.pathname || '/');
  const route = useMemo(() => parsePathname(pathname), [pathname]);

  const navigate = useCallback((to: string) => {
    const target = to.startsWith('/') ? to : `/${to}`;
    if (window.location.pathname !== target) {
      window.history.pushState({}, '', target);
    }
    setPathname(target);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  const navigateView = useCallback(
    (view: AppViewMode) => {
      navigate(viewToPath(view));
    },
    [navigate]
  );

  useEffect(() => {
    const handlePopState = () => {
      setPathname(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Auth & Firestore Profile State
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [profile, setProfile] = useState<UserProfileDoc | null>(null);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [playHistory, setPlayHistory] = useState<Record<string, PlayHistoryEntry>>({});
  const [supportReceipts, setSupportReceipts] = useState<SupportReceiptEntry[]>([]);
  const [feedbackComments, setFeedbackComments] = useState<FeedbackEntry[]>([]);
  const [authLoading, setAuthLoading] = useState(false);
  const [notice, setNotice] = useState<{ type: 'info' | 'error'; text: string } | null>(null);

  // Catalog Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGenre, setActiveGenre] = useState('All Games');
  const [sortOrder, setSortOrder] = useState<GameSortOrder>('popularity');
  const [typeFilter, setTypeFilter] = useState<GameTypeFilter>('all');

  // Player & UI Preferences
  const [playerFullscreen, setPlayerFullscreen] = useState(false);
  const [preferences, setPreferences] = useState<AppPreferences>({
    ambientEffects: true,
    compactCards: false,
    audioHints: true,
  });

  // Stripe Support Modal & Reminder State (1$, 10$, 100$)
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [selectedSupportAmount, setSelectedSupportAmount] = useState<SupportAmountDollars>(1);
  const [reminderDismissed, setReminderDismissed] = useState(false);
  const [stripeConfigured, setStripeConfigured] = useState<boolean | null>(null);
  const [stripeProductId, setStripeProductId] = useState<string | null>(null);
  const [supportCheckoutBusy, setSupportCheckoutBusy] = useState<SupportAmountDollars | null>(null);

  // Developer Tools Modals
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [pasteError, setPasteError] = useState('');
  const [showExpoModal, setShowExpoModal] = useState(false);
  const [copiedExpo, setCopiedExpo] = useState(false);

  const activeRouteGame = useMemo(() => {
    if (route.view !== 'game' || !route.slug) return null;
    const target = route.slug.toLowerCase();
    return (
      games.find((g) => g.slug.toLowerCase() === target || g.id.toLowerCase() === target) || null
    );
  }, [route, games]);

  const discoveryShelves = useMemo(
    () => buildDiscoveryShelves(games, playHistory),
    [games, playHistory]
  );

  const totalCategories = useMemo(() => {
    const set = new Set<string>();
    games.forEach((g) => g.genres.forEach((gen) => set.add(gen)));
    return set.size;
  }, [games]);

  const totalSessions = useMemo(
    () => Object.values(playHistory).reduce((acc, item) => acc + item.playCount, 0),
    [playHistory]
  );

  const featuredGame = useMemo(() => {
    return discoveryShelves[0]?.games[0] || games[0];
  }, [discoveryShelves, games]);

  useEffect(() => {
    if (route.view !== 'game') {
      setPlayerFullscreen(false);
    }
  }, [route.view]);

  // Dynamic Google Search Console SEO & OpenGraph / Canonical / VideoGame JSON-LD
  useEffect(() => {
    const canonicalUrl = `${window.location.origin}${window.location.pathname}`;
    const defaultTitle = 'ProtoX Games – Play 2,900+ Free Instant Browser Games';
    const defaultDesc =
      'Play 2,900+ free HTML5 and WebGL games instantly on ProtoX Games. Zero downloads, zero ads—just pure browser gaming across action, racing, puzzle, and arcade.';

    let pageTitle = defaultTitle;
    let pageDesc = defaultDesc;
    let pageImage = `${window.location.origin}/assets/aistudio/Neon_Web_Games_Hub__2__1ce608a6.webp`;

    if (route.view === 'game' && activeRouteGame) {
      pageTitle = `Play ${activeRouteGame.title} Free Online – ProtoX Games`;
      pageDesc = activeRouteGame.description.slice(0, 158) || defaultDesc;
      if (activeRouteGame.thumb) pageImage = activeRouteGame.thumb;
    } else if (route.view === 'games') {
      pageTitle = 'Explore All Browser Games – ProtoX Games';
    } else if (route.view === 'categories') {
      pageTitle = 'Game Categories – Action, Racing, Puzzle | ProtoX Games';
    } else if (route.view === 'trending') {
      pageTitle = 'Trending Web Games – ProtoX Games';
    } else if (route.view === 'leaderboard') {
      pageTitle = 'Top Games Leaderboard – ProtoX Games';
    } else if (route.view === 'profile') {
      pageTitle = 'Player Profile & Support – ProtoX Games';
    }

    document.title = pageTitle;

    upsertHeadTag(
      'link[rel="canonical"]',
      () => {
        const link = document.createElement('link');
        link.rel = 'canonical';
        return link;
      },
      (el) => ((el as HTMLLinkElement).href = canonicalUrl)
    );

    upsertHeadTag(
      'meta[name="description"]',
      () => {
        const m = document.createElement('meta');
        m.name = 'description';
        return m;
      },
      (el) => ((el as HTMLMetaElement).content = pageDesc)
    );

    upsertHeadTag(
      'meta[property="og:url"]',
      () => {
        const m = document.createElement('meta');
        m.setAttribute('property', 'og:url');
        return m;
      },
      (el) => ((el as HTMLMetaElement).content = canonicalUrl)
    );

    upsertHeadTag(
      'meta[property="og:title"]',
      () => {
        const m = document.createElement('meta');
        m.setAttribute('property', 'og:title');
        return m;
      },
      (el) => ((el as HTMLMetaElement).content = pageTitle)
    );

    upsertHeadTag(
      'meta[property="og:description"]',
      () => {
        const m = document.createElement('meta');
        m.setAttribute('property', 'og:description');
        return m;
      },
      (el) => ((el as HTMLMetaElement).content = pageDesc)
    );

    upsertHeadTag(
      'meta[property="og:image"]',
      () => {
        const m = document.createElement('meta');
        m.setAttribute('property', 'og:image');
        return m;
      },
      (el) => ((el as HTMLMetaElement).content = pageImage)
    );

    upsertHeadTag(
      'meta[name="twitter:title"]',
      () => {
        const m = document.createElement('meta');
        m.name = 'twitter:title';
        return m;
      },
      (el) => ((el as HTMLMetaElement).content = pageTitle)
    );

    upsertHeadTag(
      'meta[name="twitter:description"]',
      () => {
        const m = document.createElement('meta');
        m.name = 'twitter:description';
        return m;
      },
      (el) => ((el as HTMLMetaElement).content = pageDesc)
    );

    const gscToken = (import.meta.env.VITE_GSC_VERIFICATION as string | undefined)?.trim();
    if (gscToken) {
      upsertHeadTag(
        'meta[name="google-site-verification"]',
        () => {
          const m = document.createElement('meta');
          m.name = 'google-site-verification';
          return m;
        },
        (el) => ((el as HTMLMetaElement).content = gscToken)
      );
    }

    const existingGameLd = document.head.querySelector('#protox-game-jsonld');
    if (route.view === 'game' && activeRouteGame) {
      const ldEl = existingGameLd || document.createElement('script');
      ldEl.id = 'protox-game-jsonld';
      ldEl.setAttribute('type', 'application/ld+json');
      ldEl.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'VideoGame',
        name: activeRouteGame.title,
        description: pageDesc,
        genre: activeRouteGame.genres,
        image: pageImage,
        url: canonicalUrl,
        playMode: 'SinglePlayer',
        applicationCategory: 'Game',
        operatingSystem: 'Web Browser',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
      });
      if (!existingGameLd) document.head.appendChild(ldEl);
    } else if (existingGameLd) {
      existingGameLd.remove();
    }
  }, [route.view, activeRouteGame]);

  // Check Stripe config
  useEffect(() => {
    fetch('/api/stripe/config')
      .then((res) => res.json())
      .then((data: { configured?: boolean; productId?: string | null }) => {
        setStripeConfigured(Boolean(data.configured));
        setStripeProductId(data.productId || null);
      })
      .catch(() => setStripeConfigured(false));
  }, []);

  // Listen to Firebase Auth state and sync/create UserProfile in Firestore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setUser(fbUser);
      setAuthReady(true);

      if (!fbUser) {
        setProfile(null);
        setFavorites({});
        setPlayHistory({});
        setSupportReceipts([]);
        setFeedbackComments([]);
        return;
      }

      if (!fbUser.emailVerified) {
        setNotice({ type: 'error', text: 'Please use a verified Google account to sync your profile.' });
        return;
      }

      const userPath = `users/${fbUser.uid}`;
      const userRef = doc(db, 'users', fbUser.uid);
      try {
        const snap = await getDoc(userRef);
        const safeName = (fbUser.displayName?.trim() || 'Player').slice(0, 100);
        const safeEmail = (fbUser.email || '').slice(0, 160);
        const safePhoto = fbUser.photoURL && fbUser.photoURL.length <= 500 ? fbUser.photoURL : undefined;

        if (!snap.exists()) {
          const newDoc: Record<string, unknown> = {
            uid: fbUser.uid,
            displayName: safeName,
            email: safeEmail,
            totalSupportedCents: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          if (safePhoto) newDoc.photoURL = safePhoto;
          await setDoc(userRef, newDoc);
        } else {
          const existingData = snap.data() as Record<string, unknown>;
          const updatePayload: Record<string, unknown> = {
            displayName: safeName,
            email: safeEmail,
            totalSupportedCents: Number(existingData.totalSupportedCents || 0),
            updatedAt: serverTimestamp(),
          };
          if (safePhoto) updatePayload.photoURL = safePhoto;
          if ('isPro' in existingData) updatePayload.isPro = deleteField();
          if ('plan' in existingData) updatePayload.plan = deleteField();
          if ('stripeSessionId' in existingData) updatePayload.stripeSessionId = deleteField();
          await updateDoc(userRef, updatePayload);
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, userPath);
      }
    });

    return () => unsubscribe();
  }, []);

  // Attach real-time Firestore listeners only when authReady && user
  useEffect(() => {
    if (!authReady || !user) return;

    const userPath = `users/${user.uid}`;
    const unsubProfile = onSnapshot(
      doc(db, 'users', user.uid),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as Partial<UserProfileDoc>;
          setProfile({
            uid: data.uid || user.uid,
            displayName: data.displayName || user.displayName || 'Player',
            email: data.email || user.email || '',
            photoURL: data.photoURL,
            totalSupportedCents: Number(data.totalSupportedCents || 0),
            lastStripeSessionId: data.lastStripeSessionId,
          });
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, userPath)
    );

    const favPath = `users/${user.uid}/favorites`;
    const unsubFavs = onSnapshot(
      collection(db, 'users', user.uid, 'favorites'),
      (snap) => {
        const map: Record<string, boolean> = {};
        snap.docs.forEach((d) => {
          map[d.id] = true;
        });
        setFavorites(map);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, favPath)
    );

    const histPath = `users/${user.uid}/playHistory`;
    const unsubHistory = onSnapshot(
      collection(db, 'users', user.uid, 'playHistory'),
      (snap) => {
        const map: Record<string, PlayHistoryEntry> = {};
        snap.docs.forEach((d) => {
          const data = d.data() as PlayHistoryEntry;
          map[d.id] = {
            gameId: data.gameId || d.id,
            gameTitle: data.gameTitle,
            category: data.category,
            highScore: Number(data.highScore || 0),
            playCount: Number(data.playCount || 0),
          };
        });
        setPlayHistory(map);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, histPath)
    );

    const supportPath = `users/${user.uid}/supports`;
    const unsubSupports = onSnapshot(
      collection(db, 'users', user.uid, 'supports'),
      (snap) => {
        const list: SupportReceiptEntry[] = snap.docs.map((d) => {
          const data = d.data() as SupportReceiptEntry;
          return {
            supportId: data.supportId || d.id,
            amountCents: Number(data.amountCents || 0),
            currency: data.currency || 'usd',
            stripeSessionId: data.stripeSessionId || '',
            stripeProductId: data.stripeProductId,
          };
        });
        setSupportReceipts(list);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, supportPath)
    );

    const feedbackPath = `users/${user.uid}/feedback`;
    const unsubFeedback = onSnapshot(
      collection(db, 'users', user.uid, 'feedback'),
      (snap) => {
        const list: FeedbackEntry[] = snap.docs.map((d) => {
          const data = d.data() as FeedbackEntry;
          return {
            feedbackId: data.feedbackId || d.id,
            authorName: data.authorName || 'Player',
            replyEmail: data.replyEmail || '',
            recipientEmail: data.recipientEmail || 'stevenevel003@gmail.com',
            gameTitle: data.gameTitle,
            message: data.message || '',
          };
        });
        setFeedbackComments(list);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, feedbackPath)
    );

    return () => {
      unsubProfile();
      unsubFavs();
      unsubHistory();
      unsubSupports();
      unsubFeedback();
    };
  }, [authReady, user]);

  // Verify returning Stripe Support Checkout redirect (?stripe_status=success&session_id=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('stripe_status');
    const sessionId = params.get('session_id');
    if (!status) return;

    if (status === 'cancelled') {
      setNotice({ type: 'info', text: 'Support checkout was cancelled. Enjoy playing for free!' });
      window.history.replaceState({}, '', window.location.pathname);
      return;
    }

    if (status === 'success' && sessionId) {
      if (!authReady) return;

      fetch(`/api/stripe/verify-session?session_id=${encodeURIComponent(sessionId)}`)
        .then((r) => r.json())
        .then(
          async (data: {
            paid?: boolean;
            amountCents?: number;
            amountDollars?: number;
            productId?: string | null;
            sessionId?: string;
          }) => {
            if (!data.paid) return;
            const safeSessionId = (data.sessionId || sessionId).slice(0, 200);
            const amountCents = Number(data.amountCents || 0);
            const verifiedDollars = data.amountDollars || Math.round(amountCents / 100);

            if (user && user.emailVerified && [100, 1000, 10000].includes(amountCents)) {
              const supportId = safeSessionId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120);
              const supportPath = `users/${user.uid}/supports/${supportId}`;
              const userPath = `users/${user.uid}`;
              try {
                const existingReceipt = await getDoc(doc(db, 'users', user.uid, 'supports', supportId));
                if (!existingReceipt.exists()) {
                  await setDoc(doc(db, 'users', user.uid, 'supports', supportId), {
                    userId: user.uid,
                    supportId,
                    amountCents,
                    currency: 'usd',
                    stripeSessionId: safeSessionId,
                    ...(data.productId ? { stripeProductId: data.productId.slice(0, 120) } : {}),
                    createdAt: serverTimestamp(),
                  });
                  await updateDoc(doc(db, 'users', user.uid), {
                    totalSupportedCents: Number(profile?.totalSupportedCents || 0) + amountCents,
                    lastStripeSessionId: safeSessionId,
                    updatedAt: serverTimestamp(),
                  });
                }
              } catch (err) {
                handleFirestoreError(err, OperationType.WRITE, `${userPath} / ${supportPath}`);
              }
            }

            setNotice({
              type: 'info',
              text: `Thank you for supporting ProtoX Games with ${verifiedDollars}$! Stripe receipt ${safeSessionId} confirmed.`,
            });
          }
        )
        .catch(() => {
          setNotice({ type: 'error', text: 'Could not verify Stripe session.' });
        })
        .finally(() => {
          window.history.replaceState({}, '', window.location.pathname);
        });
    }
  }, [authReady, user, profile?.totalSupportedCents]);

  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    setNotice(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Google Sign-In failed.';
      setNotice({ type: 'error', text: msg });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setNotice({ type: 'info', text: 'Signed out.' });
  };

  const recordGameLaunch = useCallback(
    async (game: NormalizedGame) => {
      if (!user || !user.emailVerified) return;
      const docPath = `users/${user.uid}/playHistory/${game.id}`;
      const ref = doc(db, 'users', user.uid, 'playHistory', game.id);
      const existing = playHistory[game.id];
      try {
        if (!existing) {
          await setDoc(ref, {
            userId: user.uid,
            gameId: game.id,
            gameTitle: game.title.slice(0, 120),
            category: game.category.slice(0, 50),
            highScore: 0,
            playCount: 1,
            lastPlayedAt: serverTimestamp(),
          });
        } else {
          await updateDoc(ref, {
            gameTitle: game.title.slice(0, 120),
            category: game.category.slice(0, 50),
            playCount: existing.playCount + 1,
            lastPlayedAt: serverTimestamp(),
          });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, docPath);
      }
    },
    [user, playHistory]
  );

  const toggleFavorite = async (game: NormalizedGame) => {
    if (!user) {
      setNotice({ type: 'info', text: 'Sign in with Google to save favorite games.' });
      return;
    }
    if (!user.emailVerified) return;

    const docPath = `users/${user.uid}/favorites/${game.id}`;
    const ref = doc(db, 'users', user.uid, 'favorites', game.id);
    try {
      if (favorites[game.id]) {
        await deleteDoc(ref);
      } else {
        await setDoc(ref, {
          userId: user.uid,
          gameId: game.id,
          gameTitle: game.title.slice(0, 120),
          category: game.category.slice(0, 50),
          createdAt: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, docPath);
    }
  };

  const handleSaveFeedbackToFirestore = useCallback(
    async (entry: {
      authorName: string;
      replyEmail: string;
      gameTitle?: string;
      message: string;
    }) => {
      if (!user || !user.emailVerified) return;
      const feedbackId = `fb_${Date.now()}`;
      const docPath = `users/${user.uid}/feedback/${feedbackId}`;
      try {
        await setDoc(doc(db, 'users', user.uid, 'feedback', feedbackId), {
          userId: user.uid,
          feedbackId,
          authorName: entry.authorName.slice(0, 100),
          replyEmail: entry.replyEmail.slice(0, 160),
          recipientEmail: 'stevenevel003@gmail.com',
          ...(entry.gameTitle ? { gameTitle: entry.gameTitle.slice(0, 120) } : {}),
          message: entry.message.slice(0, 2000),
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, docPath);
      }
    },
    [user]
  );

  const openGameRoute = useCallback(
    (game: NormalizedGame) => {
      navigate(`/game/${game.slug}`);
      void recordGameLaunch(game);
    },
    [navigate, recordGameLaunch]
  );

  const handleBrowseGenre = useCallback(
    (genre: string) => {
      setActiveGenre(genre);
      navigate('/games');
    },
    [navigate]
  );

  const openSupportWithAmount = useCallback((amount: SupportAmountDollars = 1) => {
    setSelectedSupportAmount(amount);
    setShowSupportModal(true);
  }, []);

  const handleStripeSupport = async (amount: SupportAmountDollars) => {
    setSupportCheckoutBusy(amount);
    setNotice(null);
    try {
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          uid: user?.uid || undefined,
          email: user?.email || undefined,
          origin: window.location.origin,
          returnPath: window.location.pathname || '/',
        }),
      });
      const data = (await res.json()) as {
        configured?: boolean;
        url?: string;
        error?: string;
      };
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Unable to start live Stripe support checkout.');
      }
      window.location.assign(data.url);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to process support checkout.';
      setNotice({ type: 'error', text: msg });
    } finally {
      setSupportCheckoutBusy(null);
    }
  };

  const handleLoadPastedObject = () => {
    setPasteError('');
    try {
      const trimmed = pasteText.trim();
      if (!trimmed) {
        setPasteError('Paste a valid JSON catalog object first.');
        return;
      }
      const parsed = JSON.parse(trimmed);
      const normalized = normalizeGamesInput(parsed);
      if (normalized.length === 0) {
        setPasteError('Parsed object contained 0 playable game entries.');
        return;
      }
      setRawGamesObj(parsed);
      setShowPasteModal(false);
      setNotice({
        type: 'info',
        text: `Loaded ${normalized.length.toLocaleString()} games into ProtoX Games catalog.`,
      });
    } catch {
      setPasteError(
        'Invalid JSON syntax. Ensure keys and strings use double quotes when importing at runtime.'
      );
    }
  };

  const favoritesCount = Object.keys(favorites).length;

  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#080B16] pb-24 text-white lg:pb-12">
      {/* Ambient VisionOS Atmospheric Gradients */}
      {preferences.ambientEffects && !playerFullscreen && (
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <div className="absolute -top-40 left-[12%] h-[520px] w-[520px] rounded-full bg-[#8B5CF6]/18 blur-[140px]" />
          <div className="absolute top-[28%] -right-24 h-[460px] w-[460px] rounded-full bg-[#06B6D4]/14 blur-[135px]" />
          <div className="absolute bottom-0 left-[32%] h-[420px] w-[420px] rounded-full bg-[#8B5CF6]/10 blur-[140px]" />
        </div>
      )}

      {/* Floating Frosted-Glass Top Navigation Bar */}
      {!playerFullscreen && (
        <TopNavbar
          activeView={route.view}
          games={games}
          searchQuery={searchQuery}
          user={user}
          profile={profile}
          authLoading={authLoading}
          favoritesCount={favoritesCount}
          playHistory={playHistory}
          onSearchChange={(q) => setSearchQuery(q)}
          onNavigateView={navigateView}
          onSelectGame={openGameRoute}
          onOpenSupport={() => openSupportWithAmount(1)}
          onGoogleSignIn={() => void handleGoogleSignIn()}
        />
      )}

      {/* System Notice Banner */}
      {notice && !playerFullscreen && (
        <div className="relative z-20 mx-auto mt-3 max-w-[1480px] px-3 sm:px-6">
          <div
            className={`glass-panel flex items-center justify-between gap-4 rounded-2xl px-4 py-3 text-xs sm:text-sm ${
              notice.type === 'error'
                ? 'border-rose-500/40 text-rose-200'
                : 'border-[#22C55E]/40 text-white'
            }`}
          >
            <span>{notice.text}</span>
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="shrink-0 text-[#A1A1B5] hover:text-white"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Responsive Workspace */}
      <div
        className={`relative z-10 mx-auto flex max-w-[1480px] gap-6 ${
          playerFullscreen ? '' : 'px-3 pt-5 sm:px-6'
        }`}
      >
        {!playerFullscreen && (
          <Sidebar
            activeView={route.view}
            profile={profile}
            favoritesCount={favoritesCount}
            recentCount={Object.keys(playHistory).length}
            onNavigateView={navigateView}
            onOpenSupport={() => openSupportWithAmount(1)}
          />
        )}

        <main className="min-w-0 flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${route.view}-${route.slug || ''}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22 }}
              className="space-y-10"
            >
              {(route.view === 'home' || route.view === 'discover') && (
                <>
                  {route.view === 'home' && (
                    <HeroSection
                      totalGames={games.length}
                      totalCategories={totalCategories}
                      featuredGame={featuredGame}
                      favoritesCount={favoritesCount}
                      totalSessions={totalSessions}
                      onExploreGames={() => navigateView('games')}
                      onDiscoverTrending={() => navigateView('trending')}
                      onLaunchFeatured={openGameRoute}
                    />
                  )}

                  <SupportReminderBanner
                    dismissed={reminderDismissed}
                    onDismiss={() => setReminderDismissed(true)}
                    onOpenSupport={openSupportWithAmount}
                  />

                  <DiscoveryShelves
                    shelves={discoveryShelves}
                    favorites={favorites}
                    playHistory={playHistory}
                    reminderDismissed={reminderDismissed}
                    compactCards={preferences.compactCards}
                    onDismissReminder={() => setReminderDismissed(true)}
                    onSelectGame={openGameRoute}
                    onToggleFavorite={(g) => void toggleFavorite(g)}
                    onExploreGenre={handleBrowseGenre}
                    onOpenSupport={openSupportWithAmount}
                  />

                  <FeedbackSection
                    defaultName={profile?.displayName || user?.displayName || ''}
                    defaultEmail={profile?.email || user?.email || ''}
                    savedComments={feedbackComments}
                    onSaveToHistory={handleSaveFeedbackToFirestore}
                  />
                </>
              )}

              {(route.view === 'games' || route.view === 'trending') && (
                <ExploreCatalogView
                  title={route.view === 'trending' ? 'Trending Games' : 'Explore All Games'}
                  subtitle={
                    route.view === 'trending'
                      ? 'Highest-rated instant browser experiences sorted by popularity.'
                      : `Browse all ${games.length.toLocaleString()} browser titles with instant search and filtering.`
                  }
                  games={games}
                  favorites={favorites}
                  playHistory={playHistory}
                  searchQuery={searchQuery}
                  activeGenre={activeGenre}
                  sortOrder={route.view === 'trending' ? 'popularity' : sortOrder}
                  typeFilter={typeFilter}
                  reminderDismissed={reminderDismissed}
                  compactCards={preferences.compactCards}
                  onDismissReminder={() => setReminderDismissed(true)}
                  onSearchChange={setSearchQuery}
                  onGenreChange={setActiveGenre}
                  onSortChange={setSortOrder}
                  onTypeFilterChange={setTypeFilter}
                  onSelectGame={openGameRoute}
                  onToggleFavorite={(g) => void toggleFavorite(g)}
                  onOpenSupport={openSupportWithAmount}
                />
              )}

              {route.view === 'categories' && (
                <CategoriesView games={games} onSelectCategory={handleBrowseGenre} />
              )}

              {route.view === 'favorites' && (
                <FavoritesView
                  user={user}
                  games={games}
                  favorites={favorites}
                  playHistory={playHistory}
                  onSelectGame={openGameRoute}
                  onToggleFavorite={(g) => void toggleFavorite(g)}
                  onGoogleSignIn={() => void handleGoogleSignIn()}
                  onExploreGames={() => navigateView('games')}
                />
              )}

              {route.view === 'recent' && (
                <RecentlyPlayedView
                  games={games}
                  favorites={favorites}
                  playHistory={playHistory}
                  onSelectGame={openGameRoute}
                  onToggleFavorite={(g) => void toggleFavorite(g)}
                  onExploreGames={() => navigateView('games')}
                />
              )}

              {route.view === 'leaderboard' && (
                <LeaderboardView
                  games={games}
                  playHistory={playHistory}
                  profile={profile}
                  onSelectGame={openGameRoute}
                />
              )}

              {route.view === 'settings' && (
                <SettingsView
                  profile={profile}
                  preferences={preferences}
                  totalGames={games.length}
                  onUpdatePreferences={setPreferences}
                  onOpenSupport={() => openSupportWithAmount(1)}
                  onOpenPasteModal={() => setShowPasteModal(true)}
                  onOpenExpoModal={() => setShowExpoModal(true)}
                />
              )}

              {route.view === 'profile' && (
                <ProfileView
                  user={user}
                  profile={profile}
                  games={games}
                  favorites={favorites}
                  playHistory={playHistory}
                  supportReceipts={supportReceipts}
                  feedbackComments={feedbackComments}
                  authLoading={authLoading}
                  checkoutBusy={supportCheckoutBusy}
                  stripeConfigured={stripeConfigured}
                  stripeProductId={stripeProductId}
                  onGoogleSignIn={() => void handleGoogleSignIn()}
                  onSignOut={() => void handleSignOut()}
                  onSupportAmount={(amt) => void handleStripeSupport(amt)}
                  onSelectGame={openGameRoute}
                  onToggleFavorite={(g) => void toggleFavorite(g)}
                  onOpenPasteModal={() => setShowPasteModal(true)}
                  onOpenExpoModal={() => setShowExpoModal(true)}
                  onSaveFeedback={handleSaveFeedbackToFirestore}
                />
              )}

              {route.view === 'game' && activeRouteGame && (
                <GamePlayerPage
                  game={activeRouteGame}
                  allGames={games}
                  favorites={favorites}
                  playHistory={playHistory}
                  feedbackComments={feedbackComments}
                  userDisplayName={profile?.displayName || user?.displayName || ''}
                  userEmail={profile?.email || user?.email || ''}
                  reminderDismissed={reminderDismissed}
                  onDismissReminder={() => setReminderDismissed(true)}
                  onBack={() => navigateView('games')}
                  onSelectGame={openGameRoute}
                  onSelectGenre={handleBrowseGenre}
                  onToggleFavorite={(g) => void toggleFavorite(g)}
                  onOpenSupportModal={openSupportWithAmount}
                  onFullscreenChange={setPlayerFullscreen}
                  onSaveFeedback={handleSaveFeedbackToFirestore}
                />
              )}

              {route.view === 'game' && !activeRouteGame && (
                <div className="glass-panel mx-auto max-w-xl rounded-3xl p-10 text-center">
                  <h1 className="font-display text-2xl font-bold text-white">Game Not Found</h1>
                  <p className="mt-2 text-sm text-[#A1A1B5]">
                    No title matched route{' '}
                    <code className="font-mono text-[#06B6D4]">/game/{route.slug}</code>.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigateView('games')}
                    className="mt-6 inline-flex min-h-[44px] items-center rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] px-6 py-2.5 text-sm font-semibold text-white"
                  >
                    Browse All Games
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {!playerFullscreen && (
            <Footer
              onNavigateView={navigateView}
              onOpenSupport={() => openSupportWithAmount(1)}
              onContactFeedback={() => {
                if (route.view !== 'home') {
                  navigateView('profile');
                }
                setTimeout(() => {
                  document.getElementById('feedback')?.scrollIntoView({ behavior: 'smooth' });
                }, 120);
              }}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      {!playerFullscreen && (
        <BottomNav
          activeView={route.view}
          onNavigateView={navigateView}
          onOpenSupport={() => openSupportWithAmount(1)}
        />
      )}

      {/* Support Stripe Modal (1$, 10$, 100$) */}
      <SupportModal
        open={showSupportModal}
        selectedAmount={selectedSupportAmount}
        checkoutBusy={supportCheckoutBusy}
        stripeConfigured={stripeConfigured}
        stripeProductId={stripeProductId}
        userEmail={user?.email}
        onSelectAmount={setSelectedSupportAmount}
        onSubmitSupport={(amt) => void handleStripeSupport(amt)}
        onClose={() => setShowSupportModal(false)}
      />

      {/* Load Custom JSON Modal */}
      {showPasteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
          onClick={() => setShowPasteModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass-panel-deep w-full max-w-2xl rounded-3xl p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-xl font-bold text-white">
                  Load Custom Games Object
                </h3>
                <p className="mt-1 text-xs text-[#A1A1B5]">
                  Paste a JSON catalog below to preview live, or update{' '}
                  <code className="font-mono text-[#06B6D4]">src/data/playgamaCatalog.ts</code>.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPasteModal(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 text-[#A1A1B5] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              rows={9}
              placeholder='{"my-game":{"title":"Space Drift","category":"Racing","url":"https://example.com/game","thumb":"https://..."}}'
              className="glass-input mt-4 w-full rounded-2xl p-3 font-mono text-xs text-white placeholder:text-[#A1A1B5]/50 focus:border-[#8B5CF6] focus:outline-none"
            />
            {pasteError && <p className="mt-2 text-xs text-rose-400">{pasteError}</p>}

            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setRawGamesObj(PROTOX_GAMES_OBJECT);
                  setShowPasteModal(false);
                }}
                className="glass-card min-h-[40px] rounded-xl px-4 py-2 text-xs font-semibold text-white"
              >
                Reset to Default
              </button>
              <button
                type="button"
                onClick={handleLoadPastedObject}
                className="min-h-[40px] rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] px-5 py-2 text-xs font-semibold text-white"
              >
                Load Into Catalog
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expo Router Export Modal */}
      {showExpoModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
          onClick={() => setShowExpoModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass-panel-deep flex max-h-[90vh] w-full max-w-3xl flex-col rounded-3xl p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-xl font-bold text-white">
                  Expo Router Single-File Pack (app/index.tsx)
                </h3>
                <p className="mt-1 text-xs text-[#A1A1B5]">
                  Single-file Expo Router mobile screen with bottom navigation, infinite FlatList, and feedback.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowExpoModal(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 text-[#A1A1B5] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <pre className="glass-input mt-4 flex-1 overflow-auto rounded-2xl p-4 font-mono text-xs text-slate-200">
              {EXPO_ROUTER_SINGLE_FILE_CODE}
            </pre>

            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  const blob = new Blob([EXPO_ROUTER_SINGLE_FILE_CODE], {
                    type: 'text/plain;charset=utf-8',
                  });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'index.tsx';
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="glass-card inline-flex min-h-[40px] items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white"
              >
                <Download className="h-4 w-4" /> Download index.tsx
              </button>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(EXPO_ROUTER_SINGLE_FILE_CODE);
                  setCopiedExpo(true);
                  setTimeout(() => setCopiedExpo(false), 2000);
                }}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] px-5 py-2 text-xs font-semibold text-white"
              >
                <Copy className="h-4 w-4" /> {copiedExpo ? 'Copied' : 'Copy Code'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppErrorBoundary>
      <ProtoXGamesApp />
    </AppErrorBoundary>
  );
}
