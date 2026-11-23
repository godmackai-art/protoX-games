import React, { useEffect, useState } from 'react';
import { CheckCircle2, Mail, MessageSquare, Send } from 'lucide-react';
import type { FeedbackEntry } from '../types/game';

const FEEDBACK_RECIPIENT = 'stevenevel003@gmail.com';

interface FeedbackSectionProps {
  defaultName?: string;
  defaultEmail?: string;
  gameTitle?: string;
  savedComments?: FeedbackEntry[];
  onSaveToHistory?: (entry: {
    authorName: string;
    replyEmail: string;
    gameTitle?: string;
    message: string;
  }) => Promise<void>;
}

export function FeedbackSection({
  defaultName = '',
  defaultEmail = '',
  gameTitle,
  savedComments = [],
  onSaveToHistory,
}: FeedbackSectionProps) {
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [sentResult, setSentResult] = useState<{
    deliveredViaEmail: boolean;
    mailtoUrl: string;
    messagePreview: string;
  } | null>(null);

  useEffect(() => {
    if (defaultName && !name) setName(defaultName);
  }, [defaultName, name]);

  useEffect(() => {
    if (defaultEmail && !email) setEmail(defaultEmail);
  }, [defaultEmail, email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSentResult(null);

    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanMessage = message.trim();

    if (!cleanName) {
      setError('Please enter your name.');
      return;
    }
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (cleanMessage.length < 3) {
      setError('Please write a brief comment or feedback message.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanName,
          email: cleanEmail,
          gameTitle: gameTitle || undefined,
          message: cleanMessage,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        deliveredViaEmail?: boolean;
        mailtoUrl?: string;
        error?: string;
      };

      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Unable to submit feedback.');
      }

      if (onSaveToHistory) {
        await onSaveToHistory({
          authorName: cleanName,
          replyEmail: cleanEmail,
          gameTitle,
          message: cleanMessage,
        });
      }

      setSentResult({
        deliveredViaEmail: Boolean(data.deliveredViaEmail),
        mailtoUrl:
          data.mailtoUrl ||
          `mailto:${FEEDBACK_RECIPIENT}?subject=${encodeURIComponent(
            gameTitle ? `ProtoX Games Feedback (${gameTitle})` : 'ProtoX Games Feedback'
          )}&body=${encodeURIComponent(cleanMessage)}`,
        messagePreview: cleanMessage,
      });
      setMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="feedback"
      aria-label="Comments and feedback"
      className="glass-panel rounded-3xl p-5 sm:p-7"
    >
      <div className="flex flex-col justify-between gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#A78BFA]">
            <MessageSquare className="h-3.5 w-3.5 text-[#06B6D4]" />
            <span>Comments & Feedback</span>
          </div>
          <h2 className="mt-1 font-display text-xl font-bold text-white">
            {gameTitle ? `Feedback on ${gameTitle}` : 'Send Feedback or Comments'}
          </h2>
          <p className="mt-0.5 text-xs text-[#A1A1B5]">
            Messages go to{' '}
            <a
              href={`mailto:${FEEDBACK_RECIPIENT}`}
              className="font-mono text-[#06B6D4] hover:underline"
            >
              {FEEDBACK_RECIPIENT}
            </a>
          </p>
        </div>

        <a
          href={`mailto:${FEEDBACK_RECIPIENT}?subject=${encodeURIComponent(
            gameTitle ? `ProtoX Games Feedback: ${gameTitle}` : 'ProtoX Games Feedback'
          )}`}
          className="glass-card inline-flex min-h-[38px] shrink-0 items-center gap-1.5 self-start rounded-xl px-3.5 py-1.5 text-xs font-semibold text-white hover:border-[#8B5CF6]/55 sm:self-auto"
        >
          <Mail className="h-3.5 w-3.5 text-[#06B6D4]" />
          Email Direct
        </a>
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} className="mt-5 space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label
              htmlFor={`fb-name-${gameTitle || 'global'}`}
              className="mb-1.5 block text-xs font-medium text-[#A1A1B5]"
            >
              Your Name
            </label>
            <input
              id={`fb-name-${gameTitle || 'global'}`}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              placeholder="Alex"
              className="glass-input h-11 w-full rounded-xl px-3.5 text-sm text-white placeholder:text-[#A1A1B5]/60 focus:border-[#8B5CF6]/70 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor={`fb-email-${gameTitle || 'global'}`}
              className="mb-1.5 block text-xs font-medium text-[#A1A1B5]"
            >
              Your Reply Email
            </label>
            <input
              id={`fb-email-${gameTitle || 'global'}`}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={160}
              placeholder="you@example.com"
              className="glass-input h-11 w-full rounded-xl px-3.5 text-sm text-white placeholder:text-[#A1A1B5]/60 focus:border-[#8B5CF6]/70 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor={`fb-msg-${gameTitle || 'global'}`}
            className="mb-1.5 block text-xs font-medium text-[#A1A1B5]"
          >
            Comment / Feedback
          </label>
          <textarea
            id={`fb-msg-${gameTitle || 'global'}`}
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={2000}
            placeholder={
              gameTitle
                ? `Share feedback, bug reports, or thoughts about ${gameTitle}...`
                : 'Share game requests, feedback, or bug reports...'
            }
            className="glass-input w-full rounded-xl p-3.5 text-sm text-white placeholder:text-[#A1A1B5]/60 focus:border-[#8B5CF6]/70 focus:outline-none"
          />
        </div>

        {error && <p className="text-xs font-medium text-rose-400">{error}</p>}

        {sentResult && (
          <div className="flex flex-col justify-between gap-3 rounded-2xl border border-[#22C55E]/35 bg-[#22C55E]/10 p-4 text-xs text-white sm:flex-row sm:items-center">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#22C55E]" />
              <div>
                <p className="font-semibold text-white">
                  {sentResult.deliveredViaEmail
                    ? `Feedback emailed to ${FEEDBACK_RECIPIENT}!`
                    : `Feedback prepared for ${FEEDBACK_RECIPIENT}`}
                </p>
                <p className="mt-0.5 text-[#A1A1B5]">
                  {sentResult.deliveredViaEmail
                    ? 'Thank you for helping improve ProtoX Games.'
                    : 'Click Open in Email App to send directly from your mail client.'}
                </p>
              </div>
            </div>
            <a
              href={sentResult.mailtoUrl}
              className="inline-flex min-h-[38px] shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] px-3.5 py-2 font-semibold text-white"
            >
              <Mail className="h-3.5 w-3.5" /> Open in Email App
            </a>
          </div>
        )}

        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#8B5CF6]/25 transition hover:brightness-110 disabled:opacity-60"
          >
            <Send className="h-4 w-4" />
            {submitting ? 'Sending...' : `Send to ${FEEDBACK_RECIPIENT}`}
          </button>
        </div>
      </form>

      {savedComments.length > 0 && (
        <div className="mt-6 border-t border-white/10 pt-5">
          <p className="mb-3 text-xs font-semibold text-white">Your Recent Feedback Comments</p>
          <div className="space-y-2.5">
            {savedComments.slice(0, 5).map((item) => (
              <div
                key={item.feedbackId}
                className="rounded-2xl border border-white/10 bg-white/5 p-3.5 text-xs"
              >
                <div className="flex items-center justify-between gap-2 text-[#A1A1B5]">
                  <span className="font-semibold text-white">{item.authorName}</span>
                  {item.gameTitle && (
                    <span className="font-mono text-[11px] text-[#06B6D4]">{item.gameTitle}</span>
                  )}
                </div>
                <p className="mt-1.5 whitespace-pre-line text-[#A1A1B5]">{item.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
