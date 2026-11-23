import { useState } from 'react';
import { Heart, Mail, Shield, X } from 'lucide-react';
import type { AppViewMode } from '../types/game';

interface FooterProps {
  onNavigateView: (view: AppViewMode) => void;
  onOpenSupport: () => void;
  onContactFeedback: () => void;
}

type LegalModalType = 'about' | 'privacy' | 'terms' | null;

export function Footer({ onNavigateView, onOpenSupport, onContactFeedback }: FooterProps) {
  const [legalModal, setLegalModal] = useState<LegalModalType>(null);

  return (
    <>
      <footer className="glass-panel mt-14 rounded-3xl p-6 sm:p-8">
        <div className="grid gap-8 md:grid-cols-12">
          <div className="md:col-span-5">
            <div className="flex items-center gap-2.5">
              <img
                src="/favicon.webp"
                alt="ProtoX Games mark"
                className="h-9 w-9 rounded-xl border border-[#8B5CF6]/40 object-cover"
              />
              <span className="font-display text-lg font-bold text-white">
                ProtoX <span className="text-[#A78BFA]">Games</span>
              </span>
            </div>
            <p className="mt-3 max-w-sm text-xs leading-relaxed text-[#A1A1B5]">
              Instant web gaming platform built for zero-download, zero-ad browser play across thousands of HTML5 and WebGL titles. Support the project anytime via Stripe (1$, 10$, 100$).
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:col-span-7">
            <div>
              <p className="text-xs font-semibold text-white">Platform</p>
              <ul className="mt-3 space-y-2 text-xs text-[#A1A1B5]">
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigateView('home')}
                    className="hover:text-white"
                  >
                    Home
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigateView('games')}
                    className="hover:text-white"
                  >
                    Explore Games
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigateView('categories')}
                    className="hover:text-white"
                  >
                    Categories
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={onOpenSupport}
                    className="inline-flex items-center gap-1 text-[#06B6D4] hover:text-white"
                  >
                    <Heart className="h-3 w-3 fill-current" /> Support (1$ · 10$ · 100$)
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold text-white">Company & Legal</p>
              <ul className="mt-3 space-y-2 text-xs text-[#A1A1B5]">
                <li>
                  <button
                    type="button"
                    onClick={() => setLegalModal('about')}
                    className="hover:text-white"
                  >
                    About ProtoX Games
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setLegalModal('privacy')}
                    className="hover:text-white"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setLegalModal('terms')}
                    className="hover:text-white"
                  >
                    Terms of Service
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold text-white">Contact</p>
              <ul className="mt-3 space-y-2 text-xs text-[#A1A1B5]">
                <li>
                  <button
                    type="button"
                    onClick={onContactFeedback}
                    className="inline-flex items-center gap-1.5 text-[#06B6D4] hover:underline"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    Send Feedback
                  </button>
                </li>
                <li>
                  <a
                    href="mailto:stevenevel003@gmail.com"
                    className="block truncate font-mono text-[11px] hover:text-white"
                  >
                    stevenevel003@gmail.com
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col items-start justify-between gap-3 border-t border-white/10 pt-5 text-[11px] text-[#A1A1B5] sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} ProtoX Games. All rights reserved.</p>
          <p className="inline-flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5 text-[#22C55E]" />
            Secured with Firebase Auth & Stripe Checkout
          </p>
        </div>
      </footer>

      {legalModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
          onClick={() => setLegalModal(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass-panel-deep w-full max-w-lg rounded-3xl p-6"
          >
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-3">
              <h3 className="font-display text-lg font-bold text-white">
                {legalModal === 'about'
                  ? 'About ProtoX Games'
                  : legalModal === 'privacy'
                  ? 'Privacy Policy'
                  : 'Terms of Service'}
              </h3>
              <button
                type="button"
                onClick={() => setLegalModal(null)}
                aria-label="Close dialog"
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/15 text-[#A1A1B5] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 space-y-3 text-xs leading-relaxed text-[#A1A1B5]">
              {legalModal === 'about' && (
                <p>
                  ProtoX Games curates thousands of instant-play HTML5 and WebGL games so players can jump straight into action, racing, puzzle, adventure, sports, and multiplayer worlds with zero ads and zero downloads.
                </p>
              )}
              {legalModal === 'privacy' && (
                <p>
                  Player accounts use Google Sign-In via Firebase Authentication. Your favorites, play history, feedback notes, and Stripe support receipts are isolated strictly to your authenticated UID in Cloud Firestore. Contributions are processed securely by Stripe; ProtoX Games never stores card details.
                </p>
              )}
              {legalModal === 'terms' && (
                <p>
                  All games on ProtoX Games are free and ad-free. Optional support contributions (1$, 10$, 100$) are processed by Stripe Checkout using our registered Stripe Product ID. For assistance or inquiries, contact stevenevel003@gmail.com.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
