'use client';

import { useState } from 'react';
import { useAsyncData } from '@/hooks/useFetch';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser, SignInButton } from '@/lib/auth-stub.client';
import { SITE_NAME } from '@/app/constants/organization';
import LlmKeyControl from '../llm/LlmKeyControl';
import { useLlmKey } from '../llm/useLlmKey';

const MAX_BODY_LENGTH = 1000;

// A model's reply to a thought posted in this session (#396): shown, not saved
type Reply = { status: 'waiting' } | { status: 'done'; text: string; via: 'visitor' | 'owner' } | { status: 'failed'; error: string };

interface Thought {
  id: string;
  author: string;
  body: string;
  source: 'WEB' | 'UNSEEN';
  createdAt: string;
  canDelete?: boolean; // Yours, or you're an admin
}

function timeLabel(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const deltaSeconds = (date.getTime() - Date.now()) / 1000;
  const divisions: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, 'seconds'],
    [60, 'minutes'],
    [24, 'hours'],
    [7, 'days'],
    [4.34524, 'weeks'],
    [12, 'months'],
    [Number.POSITIVE_INFINITY, 'years'],
  ];
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  let duration = deltaSeconds;
  for (const [amount, unit] of divisions) {
    if (Math.abs(duration) < amount) return rtf.format(Math.round(duration), unit);
    duration /= amount;
  }
  return '';
}

/**
 * THOUGHTS. — a quiet message board attached to an editorial article.
 * Bodies are plain text end-to-end; never render them as HTML/markdown.
 *
 * When a model is connected (the reader's own key, or the owner's: see
 * src/lib/llm.ts), a thought the reader just posted gets a short reply under
 * it. Replies aren't saved; with no model there's simply no reply.
 *
 * A reader can delete their own thoughts (an admin, any), after a yes/no, and
 * remove a reply from the page.
 */
export default function Thoughts({ articleSlug }: { articleSlug: string }) {
  const { isSignedIn } = useUser();
  const { data, loading, error: loadError } = useAsyncData<{ thoughts?: Thought[]; noThread?: boolean }>(
    `/api/articles/${encodeURIComponent(articleSlug)}/thoughts`,
    async (url, signal) => {
      const res = await fetch(url, { signal });
      // A page can name an article that isn't published: that's no thread, not a failure
      if (res.status === 404) return { noThread: true };
      if (!res.ok) throw new Error(`Thoughts failed (${res.status})`);
      return res.json();
    }
  );
  // Thoughts posted in this session, per article, appended after the fetched list
  const [posted, setPosted] = useState<Record<string, Thought[]>>({});
  // Thoughts deleted in this session, gone from the list right away
  const [deleted, setDeleted] = useState<Set<string>>(new Set());
  const thoughts = [...(data?.thoughts ?? []), ...(posted[articleSlug] ?? [])].filter((thought) => !deleted.has(thought.id));
  const [confirming, setConfirming] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const error = postError ?? (loadError ? 'thoughts unavailable right now.' : null);
  const [replies, setReplies] = useState<Record<string, Reply>>({});
  const llmKey = useLlmKey();

  const askForReply = async (thought: Thought) => {
    setReplies(prev => ({ ...prev, [thought.id]: { status: 'waiting' } }));
    try {
      const res = await fetch(`/api/articles/${encodeURIComponent(articleSlug)}/thoughts/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...llmKey.headers() },
        body: JSON.stringify({ body: thought.body }),
      });
      const data = await res.json().catch(() => null);
      if (res.status === 501) {
        // No model connected: no reply, and nothing to say about it
        setReplies(prev => {
          const next = { ...prev };
          delete next[thought.id];
          return next;
        });
        return;
      }
      if (!res.ok || !data?.reply) throw new Error(data?.error ?? 'no reply this time.');
      setReplies(prev => ({ ...prev, [thought.id]: { status: 'done', text: data.reply, via: data.via } }));
    } catch (err) {
      setReplies(prev => ({ ...prev, [thought.id]: { status: 'failed', error: err instanceof Error ? err.message : 'no reply this time.' } }));
    }
  };

  const removeThought = async (thought: Thought) => {
    setConfirming(null);
    setPostError(null);
    try {
      const res = await fetch(`/api/articles/${encodeURIComponent(articleSlug)}/thoughts/${encodeURIComponent(thought.id)}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 404) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? 'failed to delete.');
      }
      setDeleted((prev) => new Set(prev).add(thought.id));
      dismissReply(thought.id);
    } catch (err) {
      setPostError(err instanceof Error ? err.message : 'failed to delete.');
    }
  };

  // A reply isn't saved anywhere, so removing it only takes it off the page
  const dismissReply = (thoughtId: string) =>
    setReplies((prev) => {
      const next = { ...prev };
      delete next[thoughtId];
      return next;
    });

  const submit = async () => {
    const body = draft.trim();
    if (!body || posting) return;
    setPosting(true);
    setPostError(null);
    try {
      const res = await fetch(`/api/articles/${encodeURIComponent(articleSlug)}/thoughts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? 'failed to post.');
      }
      const data = await res.json();
      setPosted((prev) => ({ ...prev, [articleSlug]: [...(prev[articleSlug] ?? []), data.thought] }));
      setDraft('');
      void askForReply(data.thought);
    } catch (err) {
      setPostError(err instanceof Error ? err.message : 'failed to post.');
    } finally {
      setPosting(false);
    }
  };

  if (data?.noThread) return null;

  return (
    <section className="mt-16 border-t border-border pt-10" aria-label="thoughts">
      <h2
        className="mb-8 font-vt323 text-2xl leading-none sm:text-3xl"
        style={{ color: 'var(--theme-color)' }}
      >
        THOUGHTS.
      </h2>

      {loading ? (
        <p className="font-vt323 text-lg" style={{ color: 'var(--text-muted)' }}>
          …
        </p>
      ) : thoughts.length === 0 ? (
        <p className="font-vt323 text-lg" style={{ color: 'var(--text-muted)' }}>
          no thoughts yet.
        </p>
      ) : (
        <div className="space-y-6">
          <AnimatePresence initial={false}>
            {thoughts.map((thought, index) => (
              <motion.div
                key={thought.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.5) }}
                className="border-l-2 pl-4"
                style={{ borderColor: 'color-mix(in srgb, var(--theme-color) 40%, transparent)' }}
              >
                <p
                  className="mb-1 font-google-sans-code text-xs uppercase tracking-wider"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {thought.author}
                  <span className="normal-case tracking-normal"> · {timeLabel(thought.createdAt)}</span>
                  {thought.canDelete && (
                    confirming === thought.id ? (
                      <span className="normal-case tracking-normal">
                        {' · '}delete?{' '}
                        <button type="button" onClick={() => removeThought(thought)} className="underline decoration-dotted underline-offset-4" style={{ color: 'var(--theme-color)' }}>
                          yes
                        </button>
                        {' / '}
                        <button type="button" onClick={() => setConfirming(null)} className="underline decoration-dotted underline-offset-4">
                          no
                        </button>
                      </span>
                    ) : (
                      <span className="normal-case tracking-normal">
                        {' · '}
                        <button type="button" onClick={() => setConfirming(thought.id)} className="underline decoration-dotted underline-offset-4" aria-label="Delete this thought">
                          delete
                        </button>
                      </span>
                    )
                  )}
                </p>
                <p className="whitespace-pre-wrap font-space-grotesk text-base leading-relaxed">
                  {thought.body}
                </p>
                {replies[thought.id] && <ReplyLine reply={replies[thought.id]} onRemove={() => dismissReply(thought.id)} />}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <div className="mt-10">
        {isSignedIn ? (
          <div>
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value.slice(0, MAX_BODY_LENGTH))}
              placeholder="add a thought…"
              rows={3}
              className="w-full resize-y rounded border border-border bg-transparent p-3 font-space-grotesk text-base leading-relaxed outline-none transition-colors focus:border-[var(--theme-color)]"
            />
            <div className="mt-2 flex items-center justify-between">
              <span className="font-google-sans-code text-xs" style={{ color: 'var(--text-muted)' }}>
                {draft.length}/{MAX_BODY_LENGTH}
              </span>
              <LlmKeyControl className="ml-auto mr-4" />
              <button
                type="button"
                onClick={submit}
                disabled={!draft.trim() || posting}
                className="vh-secondary-interactive rounded px-4 py-2 font-google-sans-code text-xs uppercase tracking-wider disabled:cursor-not-allowed disabled:opacity-40"
                style={{ color: 'var(--theme-color)' }}
              >
                {posting ? 'POSTING…' : 'POST.'}
              </button>
            </div>
          </div>
        ) : (
          <p className="font-vt323 text-lg" style={{ color: 'var(--text-muted)' }}>
            <SignInButton mode="modal">
              <button type="button" className="underline decoration-dotted underline-offset-4">
                party to leave a thought.
              </button>
            </SignInButton>
          </p>
        )}
        {error && (
          <p className="mt-2 font-google-sans-code text-xs text-red-400">{error}</p>
        )}
      </div>
    </section>
  );
}

/** A model's reply under a thought: plain text, labelled with whose key answered, removable */
function ReplyLine({ reply, onRemove }: { reply: Reply; onRemove: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="ml-4 mt-3 border-l pl-4"
      style={{ borderColor: 'color-mix(in srgb, var(--theme-color) 25%, transparent)' }}
      aria-live="polite"
    >
      {reply.status === 'waiting' ? (
        <p className="font-vt323 text-lg" style={{ color: 'var(--text-muted)' }}>…</p>
      ) : reply.status === 'failed' ? (
        <p className="font-google-sans-code text-xs" style={{ color: 'var(--text-muted)' }}>
          {reply.error}{' · '}
          <button type="button" onClick={onRemove} className="underline decoration-dotted underline-offset-4" aria-label="Remove this message">
            remove
          </button>
        </p>
      ) : (
        <>
          <p className="mb-1 font-google-sans-code text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            reply <span className="normal-case tracking-normal">· {reply.via === 'visitor' ? 'with your key' : `from ${SITE_NAME}'s model`} · </span>
            <button type="button" onClick={onRemove} className="normal-case tracking-normal underline decoration-dotted underline-offset-4" aria-label="Remove this reply">
              remove reply
            </button>
          </p>
          <p className="whitespace-pre-wrap font-space-grotesk text-sm leading-relaxed" style={{ color: 'var(--foreground)' }}>
            {reply.text}
          </p>
        </>
      )}
    </motion.div>
  );
}
