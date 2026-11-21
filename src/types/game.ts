export interface ScreenOrientationInfo {
  horizontal?: boolean;
  vertical?: boolean;
}

export interface RawGameEntry {
  id?: string;
  slug?: string;
  title?: string;
  name?: string;
  category?: string;
  genre?: string;
  genres?: string[];
  tags?: string[];
  url?: string;
  gameURL?: string;
  playgamaGameUrl?: string;
  embedUrl?: string;
  iframeUrl?: string;
  embed?: string;
  thumb?: string;
  thumbnail?: string;
  image?: string;
  images?: string[];
  description?: string;
  howToPlayText?: string;
  mobileReady?: string[];
  supportedLanguages?: string[];
  screenOrientation?: ScreenOrientationInfo;
  inGamePurchases?: string;
}

export interface NormalizedGame {
  id: string;
  slug: string;
  title: string;
  category: string;
  genres: string[];
  tags: string[];
  url: string;
  playgamaGameUrl?: string;
  thumb: string;
  icon: string;
  description: string;
  howToPlayText?: string;
  mobileReady: string[];
  supportedLanguages: string[];
  orientation: {
    horizontal: boolean;
    vertical: boolean;
  };
  inGamePurchases?: string;
}

export type SupportAmountDollars = 1 | 5 | 10 | 100;

export interface UserProfileDoc {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  totalSupportedCents: number;
  lastStripeSessionId?: string;
}

export interface SupportReceiptEntry {
  supportId: string;
  amountCents: number;
  currency: string;
  stripeSessionId: string;
  stripeProductId?: string;
}

export interface PlayHistoryEntry {
  gameId: string;
  gameTitle?: string;
  category?: string;
  highScore: number;
  playCount: number;
}
