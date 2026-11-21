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
import {
  Copy,
  Download,
  Heart,
  Search,
  X,
} from 'lucide-react';
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
  NormalizedGame,
  PlayHistoryEntry,
  SupportAmountDollars,
  SupportReceiptEntry,
  UserProfileDoc,
} from './types/game';
import { normalizeGamesInput } from './utils/catalog';
import { BottomNav, type RootTab } from './components/BottomNav';
import { HomeView } from './components/HomeView';
import { GamesView, type OrientationFilter } from './components/GamesView';
import { ProfileView } from './components/ProfileView';
import { GamePlayerPage } from './components/GamePlayerPage';
import { SupportModal } from './components/SupportModal';

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
        <div className="flex min-h-screen items-center justify-center bg-[#070A0F] p-6 text-slate-100">
          <div className="w-full max-w-lg rounded-2xl border border-rose-500/30 bg-[#0F151E] p-8">
            <h1 className="font-display text-2xl font-bold text-white">Something went wrong</h1>
            <p className="mt-2 text-sm text-slate-300">
              A database or runtime error interrupted the session. Please reload the page or sign in again.
            </p>
            <pre className="mt-4 max-h-40 overflow-auto rounded-lg bg-black/50 p-3 font-mono text-xs text-rose-300">
              {this.state.message}
            </pre>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
            >
              Reload protoX Games
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ============================================================================
   CLIENT ROUTER HELPERS (/, /games, /profile, /game/:slug)
   ============================================================================ */
type ParsedRoute =
  | { view: 'home' }
  | { view: 'games' }
  | { view: 'profile' }
  | { view: 'game'; slug: string };

function parsePathname(pathname: string): ParsedRoute {
  const clean = pathname.replace(/\/+$/, '') || '/';
  if (clean === '/games') return { view: 'games' };
  if (clean === '/profile') return { view: 'profile' };
  if (clean.startsWith('/game/')) {
    const slug = decodeURIComponent(clean.slice('/game/'.length));
    if (slug) return { view: 'game', slug };
  }
  return { view: 'home' };
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
  const [authLoading, setAuthLoading] = useState(false);
  const [notice, setNotice] = useState<{ type: 'info' | 'error'; text: string } | null>(null);

  // Catalog Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGenre, setActiveGenre] = useState('All Games');
  const [orientationFilter, setOrientationFilter] = useState<OrientationFilter>('all');

  // Player Fullscreen State
  const [playerFullscreen, setPlayerFullscreen] = useState(false);

  // Support Stripe Checkout & Reminder State
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [selectedSupportAmount, setSelectedSupportAmount] = useState<SupportAmountDollars>(5);
  const [reminderDismissed, setReminderDismissed] = useState(false);
  const [stripeConfigured, setStripeConfigured] = useState<boolean | null>(null);
  const [stripeProductId, setStripeProductId] = useState<string | null>(null);
  const [checkoutBusy, setCheckoutBusy] = useState<SupportAmountDollars | null>(null);

  // Utility Modals
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [pasteError, setPasteError] = useState('');
  const [showExpoModal, setShowExpoModal] = useState(false);
  const [copiedExpo, setCopiedExpo] = useState(false);

  const activeRouteGame = useMemo(() => {
    if (route.view !== 'game') return null;
    const target = route.slug.toLowerCase();
    return (
      games.find((g) => g.slug.toLowerCase() === target || g.id.toLowerCase() === target) || null
    );
  }, [route, games]);

  useEffect(() => {
    if (route.view !== 'game') {
      setPlayerFullscreen(false);
    }
  }, [route.view]);

  useEffect(() => {
    if (route.view === 'game' && activeRouteGame) {
      document.title = `${activeRouteGame.title} — protoX Games`;
    } else {
      document.title = 'protoX Games — Instant Web Games Arcade';
    }
  }, [route.view, activeRouteGame]);

  // Check Stripe server configuration & configured Product ID
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

    return () => {
      unsubProfile();
      unsubFavs();
      unsubHistory();
      unsubSupports();
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
            currency?: string;
            productId?: string | null;
            sessionId?: string;
          }) => {
            if (!data.paid) return;
            const amountCents = Number(data.amountCents || 0);
            const verifiedDollars = data.amountDollars || Math.round(amountCents / 100);
            const safeSessionId = (data.sessionId || sessionId).slice(0, 200);

            if (user && user.emailVerified && [100, 500, 1000, 10000].includes(amountCents)) {
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
              text: `Thank you for supporting protoX Games with ${verifiedDollars}$! Your Stripe receipt (${safeSessionId}) is confirmed.`,
            });
          }
        )
        .catch(() => {
          setNotice({ type: 'error', text: 'Could not verify Stripe support receipt.' });
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
      setNotice({ type: 'info', text: 'Sign in with Google on your Profile to save favorite games.' });
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

  const handleTabChange = useCallback(
    (tab: RootTab) => {
      if (tab === 'home') navigate('/');
      else if (tab === 'games') navigate('/games');
      else navigate('/profile');
    },
    [navigate]
  );

  const openSupportWithAmount = useCallback((amount: SupportAmountDollars = 5) => {
    setSelectedSupportAmount(amount);
    setShowSupportModal(true);
  }, []);

  const handleStripeSupport = async (amount: SupportAmountDollars) => {
    setCheckoutBusy(amount);
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
        sandboxSessionId?: string;
        amountDollars?: number;
        amountCents?: number;
        productId?: string | null;
        error?: string;
      };

      if (!res.ok) {
        throw new Error(data.error || 'Stripe checkout request failed.');
      }

      if (data.configured && data.url) {
        window.location.assign(data.url);
        return;
      }

      // Sandbox fallback when STRIPE_SECRET_KEY is not yet configured in environment
      const amountCents = Number(data.amountCents || amount * 100);
      const sandboxSessionId = (data.sandboxSessionId || `cs_test_support_${amount}_${Date.now()}`).slice(0, 200);

      if (user && user.emailVerified) {
        const supportId = sandboxSessionId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120);
        const supportPath = `users/${user.uid}/supports/${supportId}`;
        try {
          await setDoc(doc(db, 'users', user.uid, 'supports', supportId), {
            userId: user.uid,
            supportId,
            amountCents,
            currency: 'usd',
            stripeSessionId: sandboxSessionId,
            ...(data.productId ? { stripeProductId: data.productId.slice(0, 120) } : {}),
            createdAt: serverTimestamp(),
          });
          await updateDoc(doc(db, 'users', user.uid), {
            totalSupportedCents: Number(profile?.totalSupportedCents || 0) + amountCents,
            lastStripeSessionId: sandboxSessionId,
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, supportPath);
        }
      }

      setShowSupportModal(false);
      setNotice({
        type: 'info',
        text: `Thank you for your ${amount}$ support via Stripe Sandbox (${sandboxSessionId})!`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to process support checkout.';
      setNotice({ type: 'error', text: msg });
    } finally {
      setCheckoutBusy(null);
    }
  };

  const handleLoadPastedObject = () => {
    setPasteError('');
    try {
      const trimmed = pasteText.trim();
      if (!trimmed) {
        setPasteError('Paste a valid JSON or JS object of games first.');
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
        text: `Loaded ${normalized.length.toLocaleString()} games into protoX Games catalog.`,
      });
    } catch {
      setPasteError(
        'Invalid JSON syntax. Ensure keys and strings use double quotes when importing at runtime, or paste any JS object directly into src/data/playgamaCatalog.ts.'
      );
    }
  };

  const activeBottomTab: RootTab | null =
    route.view === 'home'
      ? 'home'
      : route.view === 'games'
      ? 'games'
      : route.view === 'profile'
      ? 'profile'
      : null;

  return (
    <div className="min-h-screen bg-[#070A0F] text-slate-100">
      {/* =====================================================================
          COMPACT TOP BAR (Hidden in player fullscreen)
         ===================================================================== */}
      {!playerFullscreen && (
        <header className="sticky top-0 z-30 border-b border-white/10 bg-[#080C14]/95 backdrop-blur-md">
          <div className="mx-auto flex h-12 max-w-7xl items-center justify-between gap-4 px-4 sm:h-14 sm:px-6 lg:px-8">
            {/* Zone 1: Brand Mark */}
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                navigate('/');
              }}
              className="flex shrink-0 items-center gap-2.5 whitespace-nowrap font-display text-base font-bold tracking-tight text-white sm:text-lg"
            >
              <img
                src="/assets/aistudio/Neon_Gaming_G_Icon_Hub_ec0ff11a.webp"
                alt="protoX Games mark"
                className="h-7 w-7 rounded-md object-cover"
              />
              <span>protoX Games</span>
            </a>

            {/* Zone 2: Quick Search Bar (Desktop & Tablet) */}
            <div className="hidden max-w-md flex-1 md:block">
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (route.view !== 'games') {
                      navigate('/games');
                    }
                  }}
                  placeholder={`Search ${games.length.toLocaleString()} web games...`}
                  className="h-9 w-full rounded-full border border-white/10 bg-[#111824] pr-4 pl-10 text-xs text-white placeholder:text-slate-400 focus:border-emerald-500/60 focus:outline-none"
                />
              </div>
            </div>

            {/* Zone 3: Support CTA + Account */}
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => openSupportWithAmount(5)}
                className="inline-flex min-h-[36px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/25"
              >
                <Heart className="h-3.5 w-3.5 fill-current" />
                <span>Support</span>
              </button>

              {user ? (
                <button
                  type="button"
                  onClick={() => navigate('/profile')}
                  className="inline-flex min-h-[36px] shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border border-white/15 bg-[#0F151E] px-3 py-1.5 text-xs font-semibold text-white transition hover:border-emerald-500/50"
                >
                  <span className="max-w-[90px] truncate sm:max-w-[120px]">
                    {profile?.displayName || user.displayName || 'Profile'}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={authLoading}
                  onClick={handleGoogleSignIn}
                  className="min-h-[36px] shrink-0 whitespace-nowrap rounded-lg bg-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-60"
                >
                  {authLoading ? 'Signing in...' : 'Sign In'}
                </button>
              )}
            </div>
          </div>
        </header>
      )}

      {/* Notification Banner */}
      {notice && !playerFullscreen && (
        <div className="mx-auto mt-3 max-w-7xl px-4 sm:px-6 lg:px-8">
          <div
            className={`flex items-center justify-between gap-4 rounded-xl border px-4 py-2.5 text-xs sm:text-sm ${
              notice.type === 'error'
                ? 'border-rose-500/30 bg-rose-950/30 text-rose-200'
                : 'border-emerald-500/30 bg-emerald-950/30 text-emerald-200'
            }`}
          >
            <span>{notice.text}</span>
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="shrink-0 text-slate-400 hover:text-white"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          ROUTE VIEWS (Home | Games | Profile | /game/:slug)
         ===================================================================== */}
      <main>
        {route.view === 'home' && (
          <HomeView
            games={games}
            favorites={favorites}
            playHistory={playHistory}
            reminderDismissed={reminderDismissed}
            onDismissReminder={() => setReminderDismissed(true)}
            onSelectGame={openGameRoute}
            onToggleFavorite={(g) => void toggleFavorite(g)}
            onBrowseGenre={handleBrowseGenre}
            onOpenSupportModal={openSupportWithAmount}
          />
        )}

        {route.view === 'games' && (
          <GamesView
            games={games}
            favorites={favorites}
            playHistory={playHistory}
            searchQuery={searchQuery}
            activeGenre={activeGenre}
            orientationFilter={orientationFilter}
            reminderDismissed={reminderDismissed}
            onDismissReminder={() => setReminderDismissed(true)}
            onSearchChange={setSearchQuery}
            onGenreChange={setActiveGenre}
            onOrientationChange={setOrientationFilter}
            onSelectGame={openGameRoute}
            onToggleFavorite={(g) => void toggleFavorite(g)}
            onOpenSupportModal={openSupportWithAmount}
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
            authLoading={authLoading}
            checkoutBusy={checkoutBusy}
            stripeConfigured={stripeConfigured}
            stripeProductId={stripeProductId}
            onGoogleSignIn={() => void handleGoogleSignIn()}
            onSignOut={() => void handleSignOut()}
            onSupportAmount={(amt) => void handleStripeSupport(amt)}
            onSelectGame={openGameRoute}
            onToggleFavorite={(g) => void toggleFavorite(g)}
            onOpenPasteModal={() => setShowPasteModal(true)}
            onOpenExpoModal={() => setShowExpoModal(true)}
          />
        )}

        {route.view === 'game' && activeRouteGame && (
          <GamePlayerPage
            game={activeRouteGame}
            allGames={games}
            favorites={favorites}
            playHistory={playHistory}
            reminderDismissed={reminderDismissed}
            onDismissReminder={() => setReminderDismissed(true)}
            onBack={() => navigate('/games')}
            onSelectGame={openGameRoute}
            onSelectGenre={handleBrowseGenre}
            onToggleFavorite={(g) => void toggleFavorite(g)}
            onOpenSupportModal={openSupportWithAmount}
            onFullscreenChange={setPlayerFullscreen}
          />
        )}

        {route.view === 'game' && !activeRouteGame && (
          <div className="mx-auto max-w-xl px-4 py-16 pb-28 text-center">
            <h1 className="font-display text-2xl font-bold text-white">Game Not Found</h1>
            <p className="mt-2 text-sm text-slate-400">
              No title matched route <code className="font-mono text-emerald-400">/game/{route.slug}</code>.
            </p>
            <button
              type="button"
              onClick={() => navigate('/games')}
              className="mt-6 inline-flex min-h-[44px] items-center rounded-lg bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
            >
              Browse All Games
            </button>
          </div>
        )}
      </main>

      {/* =====================================================================
          BOTTOM 3-TAB NAVIGATION (Home | Games | Profile)
         ===================================================================== */}
      {!playerFullscreen && (
        <BottomNav activeTab={activeBottomTab} onNavigateTab={handleTabChange} />
      )}

      {/* =====================================================================
          SUPPORT MODAL (1$, 5$, 10$, 100$ via Stripe Product ID)
         ===================================================================== */}
      <SupportModal
        open={showSupportModal}
        selectedAmount={selectedSupportAmount}
        checkoutBusy={checkoutBusy}
        stripeConfigured={stripeConfigured}
        stripeProductId={stripeProductId}
        userEmail={user?.email}
        onSelectAmount={setSelectedSupportAmount}
        onSubmitSupport={(amt) => void handleStripeSupport(amt)}
        onClose={() => setShowSupportModal(false)}
      />

      {/* =====================================================================
          PASTE / TEST 4,000+ GAMES JSON OBJECT MODAL
         ===================================================================== */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-white/15 bg-[#0F151E] p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-xl font-bold text-white">Load Custom Games Object</h3>
                <p className="mt-1 text-xs text-slate-400">
                  Paste your JSON catalog below to preview live, or update <code className="font-mono text-emerald-400">src/data/playgamaCatalog.ts</code>.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPasteModal(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              rows={9}
              placeholder='{"my-game":{"title":"Space Drift","category":"Racing","url":"https://example.com/game","thumb":"https://..."}}'
              className="mt-4 w-full rounded-xl border border-white/15 bg-[#070A0F] p-3 font-mono text-xs text-slate-200 placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none"
            />
            {pasteError && <p className="mt-2 text-xs text-rose-400">{pasteError}</p>}

            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setRawGamesObj(PROTOX_GAMES_OBJECT);
                  setShowPasteModal(false);
                }}
                className="min-h-[40px] rounded-lg border border-white/15 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/5"
              >
                Reset to Default
              </button>
              <button
                type="button"
                onClick={handleLoadPastedObject}
                className="min-h-[40px] rounded-lg bg-emerald-500 px-5 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400"
              >
                Load Into Catalog
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SINGLE-FILE EXPO ROUTER EXPORT MODAL (app/index.tsx)
         ===================================================================== */}
      {showExpoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl border border-white/15 bg-[#0F151E] p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-xl font-bold text-white">
                  Expo Router Single-File Pack (app/index.tsx)
                </h3>
                <p className="mt-1 text-xs text-slate-400">
                  Single-file Expo Router screen with bottom 3 tabs (Home, Games, Profile), infinite FlatList, Firebase Auth + Firestore, and Stripe Support (1$, 5$, 10$, 100$).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowExpoModal(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <pre className="mt-4 flex-1 overflow-auto rounded-xl border border-white/10 bg-[#070A0F] p-4 font-mono text-xs text-slate-200">
              {EXPO_ROUTER_SINGLE_FILE_CODE}
            </pre>

            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  const blob = new Blob([EXPO_ROUTER_SINGLE_FILE_CODE], { type: 'text/plain;charset=utf-8' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'index.tsx';
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-white/15 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-white/5"
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
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-emerald-500 px-5 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400"
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
