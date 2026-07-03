'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth, useUser } from '@clerk/nextjs';
import Script from 'next/script';
import { buildBugReportTemplate, detectClientContext } from '@/lib/support/chatHelpers';

type ChatArticle = { title: string; slug: string; href: string };

type ChatMessage = {
  role: 'user' | 'assistant';
  text: string;
  articles?: ChatArticle[];
};

export default function SupportChatWidget() {
  const pathname = usePathname();
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [meta, setMeta] = useState<{
    online: boolean;
    responseExpectation: string;
    priority: boolean;
    tawkPropertyId: string | null;
  } | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetch('/api/support/chat')
      .then((r) => r.json())
      .then(setMeta)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!meta?.tawkPropertyId || !isSignedIn || !user) return;
    const w = window as Window & { Tawk_API?: { setAttributes?: (attrs: Record<string, string>, cb?: () => void) => void } };
    w.Tawk_API = w.Tawk_API || {};
    w.Tawk_API.setAttributes?.({
      name: user.fullName || 'Vesper user',
      email: user.primaryEmailAddress?.emailAddress || '',
      plan: String(user.publicMetadata?.plan || 'unknown'),
    });
  }, [meta?.tawkPropertyId, isSignedIn, user]);

  const sendMessage = async (text: string, mode: 'chat' | 'bug' = 'chat') => {
    if (!text.trim()) return;
    setSending(true);
    setMessages((prev) => [...prev, { role: 'user', text }]);
    setInput('');

    try {
      const res = await fetch('/api/support/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, mode }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: data.reply, articles: data.articles },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: 'Something went wrong. Email support@vesper.biblefunland.com' },
      ]);
    } finally {
      setSending(false);
    }
  };

  const startBugReport = () => {
    const ctx = detectClientContext();
    setInput(buildBugReportTemplate(ctx));
    setOpen(true);
  };

  if (pathname === '/') return null;

  if (!open) {
    return (
      <>
        {meta?.tawkPropertyId && (
          <Script
            id="tawk-widget"
            strategy="lazyOnload"
            src={`https://embed.tawk.to/${meta.tawkPropertyId}/default`}
            charSet="UTF-8"
            crossOrigin="anonymous"
          />
        )}
        <div className="support-chat-launcher">
          <button type="button" className="support-chat-bug-btn" onClick={startBugReport}>
            Report bug
          </button>
          <button type="button" className="support-chat-fab" onClick={() => setOpen(true)} aria-label="Open support chat">
            💬
          </button>
        </div>
      </>
    );
  }

  return (
    <div className="support-chat-panel glass-card">
      <header className="support-chat-header">
        <div>
          <strong>Vesper Support</strong>
          {meta?.priority && <span className="vesper-badge badge-gold" style={{ marginLeft: '8px' }}>Priority</span>}
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
            {meta?.online
              ? `Typical reply within ${meta?.responseExpectation || '24 hours'}`
              : "We're offline — we'll reply within 4 hours"}
          </p>
        </div>
        <button type="button" onClick={() => setOpen(false)} aria-label="Close chat">
          ✕
        </button>
      </header>

      <div className="support-chat-messages">
        {messages.length === 0 && (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Ask anything about uploads, Studio, exports, or billing. We search the Help Center first.
          </p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`support-chat-bubble support-chat-bubble--${msg.role}`}>
            <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{msg.text.replace(/\*\*(.*?)\*\*/g, '$1')}</p>
            {msg.articles?.map((a) => (
              <Link key={a.slug} href={a.href} style={{ display: 'block', marginTop: '8px', color: 'var(--primary)', fontSize: '13px' }}>
                Read: {a.title} →
              </Link>
            ))}
          </div>
        ))}
      </div>

      <footer className="support-chat-footer">
        <button type="button" className="vesper-btn-outline" style={{ marginBottom: '8px', width: '100%' }} onClick={startBugReport}>
          Report a Bug
        </button>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void sendMessage(input);
          }}
          style={{ display: 'flex', gap: '8px' }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="How can we help?"
            className="referral-input"
            style={{ flex: 1 }}
          />
          <button type="submit" className="vesper-btn vesper-btn-primary" disabled={sending}>
            Send
          </button>
        </form>
      </footer>
    </div>
  );
}
