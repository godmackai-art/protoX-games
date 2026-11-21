export const EXPO_ROUTER_SINGLE_FILE_CODE = `// app/index.tsx — protoX Games (Single-File Expo Router + Web/Native Ready)
// Dependencies: expo-router, react-native-webview, firebase
import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  Linking,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Stack } from 'expo-router';
import { WebView } from 'react-native-webview';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';

// ============================================================================
// PASTE YOUR 4,000+ GAMES OBJECT BELOW (Playgama segments[].hits[] or { [id]: {...} })
// ============================================================================
export const PROTOX_GAMES_OBJECT = {
  segments: [
    {
      title: 'Featured Games',
      hits: [
        {
          id: '97426',
          slug: 'piece-of-cake-merge--bake',
          title: 'Piece of Cake: Merge & Bake',
          genres: ['puzzle', 'merge', 'simulation'],
          gameURL: 'https://playgama.com/export/game/piece-of-cake-merge--bake?clid=p_c7e07b42-9c1f-4ba7-98e7-c1a1fe82781f',
          images: ['https://static.playgama.com/p-img/pg/piece-of-cake-merge--bake/big_preview/b772122937124aa6b59d6e130537c8a8?width=448'],
          description: 'Combine ingredients, restore the cafe, and uncover family secrets.',
          howToPlayText: 'Drag matching items together to merge and unlock new dishes.',
        },
      ],
    },
  ],
};

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);

type TabKey = 'home' | 'games' | 'profile';
type ViewportSize = 'part' | 'fullscreen';
const SUPPORT_AMOUNTS = [1, 5, 10, 100] as const;

export default function ProtoXGamesScreen() {
  const [tab, setTab] = useState<TabKey>('home');
  const [user, setUser] = useState<any>(null);
  const [query, setQuery] = useState('');
  const [visibleLimit, setVisibleLimit] = useState(30);
  const [selectedGame, setSelectedGame] = useState<any | null>(null);
  const [viewportSize, setViewportSize] = useState<ViewportSize>('part');
  const [showSupportModal, setShowSupportModal] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, (fbUser) => {
      setUser(fbUser);
    });
  }, []);

  const allGames = useMemo(() => {
    const rawHits = (PROTOX_GAMES_OBJECT.segments || []).flatMap((s: any) => s.hits || []);
    return rawHits
      .filter((g: any) => Boolean(g.gameURL || g.url))
      .map((g: any) => ({
        id: String(g.slug || g.id),
        slug: String(g.slug || g.id),
        title: g.title,
        category: g.genres?.[0] || 'Arcade',
        url: g.gameURL || g.url,
        thumb: g.images?.[0] || g.thumb || '',
        description: g.description || '',
        howToPlayText: g.howToPlayText || '',
      }));
  }, []);

  const filteredGames = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allGames;
    return allGames.filter(
      (g) => g.title.toLowerCase().includes(q) || g.category.toLowerCase().includes(q)
    );
  }, [allGames, query]);

  const infiniteGames = useMemo(
    () => filteredGames.slice(0, visibleLimit),
    [filteredGames, visibleLimit]
  );

  const handleLaunchGame = (game: any) => {
    setSelectedGame(game);
    setViewportSize('part');
  };

  const startStripeSupport = async (amount: 1 | 5 | 10 | 100) => {
    const res = await fetch(\`\${process.env.EXPO_PUBLIC_API_URL}/api/stripe/create-checkout-session\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, uid: user?.uid, email: user?.email }),
    });
    const data = await res.json();
    if (data.url) await Linking.openURL(data.url);
  };

  return (
    <SafeAreaView style={styles.root}>
      <Stack.Screen options={{ title: 'protoX Games', headerShown: false }} />

      <View style={styles.header}>
        <Text style={styles.brand}>protoX Games</Text>
        <Pressable style={styles.supportBtn} onPress={() => setShowSupportModal(true)}>
          <Text style={styles.supportBtnText}>Support</Text>
        </Pressable>
      </View>

      <Pressable style={styles.reminderBanner} onPress={() => setShowSupportModal(true)}>
        <Text style={styles.reminderText}>
          Enjoying free games with zero ads? Tap to support with 1$, 5$, 10$, or 100$ via Stripe.
        </Text>
      </Pressable>

      {tab === 'profile' ? (
        <ScrollView style={styles.content}>
          <Text style={styles.sectionTitle}>{user ? user.email : 'Guest Player'}</Text>
          <Pressable
            style={styles.supportBtn}
            onPress={() => (user ? signOut(auth) : signInWithPopup(auth, new GoogleAuthProvider()))}
          >
            <Text style={styles.supportBtnText}>{user ? 'Sign Out' : 'Sign In with Google'}</Text>
          </Pressable>
        </ScrollView>
      ) : (
        <View style={styles.content}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search real HTML5 games..."
            placeholderTextColor="#64748B"
            style={styles.search}
          />
          <FlatList
            data={infiniteGames}
            keyExtractor={(item) => item.id}
            numColumns={2}
            onEndReached={() => setVisibleLimit((v) => Math.min(filteredGames.length, v + 30))}
            onEndReachedThreshold={0.4}
            renderItem={({ item }) => (
              <Pressable style={styles.card} onPress={() => handleLaunchGame(item)}>
                {item.thumb ? <Image source={{ uri: item.thumb }} style={styles.thumb} /> : <View style={styles.thumbPlaceholder} />}
                <Text style={styles.meta}>{item.category}</Text>
                <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
              </Pressable>
            )}
          />
        </View>
      )}

      {/* Bottom 3 Tabs: Home, Games, Profile */}
      <View style={styles.bottomNav}>
        {(['home', 'games', 'profile'] as TabKey[]).map((t) => (
          <Pressable key={t} style={styles.tabBtn} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t.toUpperCase()}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Dynamic Game Player Modal with Fullscreen / Part-Screen Options */}
      <Modal visible={Boolean(selectedGame)} animationType="slide">
        <SafeAreaView style={styles.root}>
          <View style={styles.playerTop}>
            <Text style={styles.brand} numberOfLines={1}>{selectedGame?.title}</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable
                style={styles.authBtn}
                onPress={() => setViewportSize((v) => (v === 'part' ? 'fullscreen' : 'part'))}
              >
                <Text style={styles.authBtnText}>
                  {viewportSize === 'part' ? 'Fullscreen' : 'Part Screen'}
                </Text>
              </Pressable>
              <Pressable onPress={() => setSelectedGame(null)}>
                <Text style={styles.supportBtnText}>Close</Text>
              </Pressable>
            </View>
          </View>
          {selectedGame ? (
            <View style={viewportSize === 'fullscreen' ? { flex: 1 } : { height: 380 }}>
              <WebView source={{ uri: selectedGame.url }} style={{ flex: 1 }} />
            </View>
          ) : null}
          {viewportSize === 'part' && selectedGame && (
            <ScrollView style={{ padding: 12 }}>
              <Text style={styles.sectionTitle}>About {selectedGame.title}</Text>
              <Text style={styles.meta}>{selectedGame.description}</Text>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      {/* Support Modal (1$, 5$, 10$, 100$ via Stripe Product ID) */}
      <Modal visible={showSupportModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.brand}>Support protoX Games</Text>
            <Text style={styles.meta}>Receipts processed securely via Stripe</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {SUPPORT_AMOUNTS.map((amt) => (
                <Pressable key={amt} style={styles.supportBtn} onPress={() => startStripeSupport(amt)}>
                  <Text style={styles.supportBtnText}>{amt}$ Support</Text>
                </Pressable>
              ))}
            </View>
            <Pressable onPress={() => setShowSupportModal(false)}>
              <Text style={styles.meta}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#070A0F' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12 },
  content: { flex: 1, paddingHorizontal: 12 },
  brand: { color: '#F8FAFC', fontSize: 18, fontWeight: '700' },
  sectionTitle: { color: '#F8FAFC', fontSize: 16, fontWeight: '700', marginBottom: 6 },
  supportBtn: { backgroundColor: '#10B981', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  supportBtnText: { color: '#04100A', fontWeight: '700', fontSize: 13 },
  authBtn: { borderColor: '#334155', borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  authBtnText: { color: '#E2E8F0', fontSize: 12 },
  reminderBanner: { backgroundColor: '#0D1615', borderColor: '#10B981', borderWidth: 1, padding: 10, marginHorizontal: 12, borderRadius: 8, marginBottom: 8 },
  reminderText: { color: '#A7F3D0', fontSize: 12, textAlign: 'center' },
  search: { backgroundColor: '#0F151E', color: '#F8FAFC', padding: 10, borderRadius: 8, marginBottom: 10 },
  card: { flex: 1, margin: 5, backgroundColor: '#0F151E', borderRadius: 12, padding: 8 },
  thumb: { height: 100, borderRadius: 8, marginBottom: 8 },
  thumbPlaceholder: { height: 100, borderRadius: 8, marginBottom: 8, backgroundColor: '#1E293B' },
  meta: { color: '#94A3B8', fontSize: 12, marginBottom: 4 },
  title: { color: '#F8FAFC', fontSize: 14, fontWeight: '600' },
  bottomNav: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#1E293B', backgroundColor: '#080C14', height: 58 },
  tabBtn: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabText: { color: '#94A3B8', fontSize: 11, fontWeight: '700' },
  tabTextActive: { color: '#10B981' },
  playerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#0F151E', borderRadius: 16, padding: 20, gap: 12 },
});
`;
