'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CHANGELOG } from '@/data/changelog';

export default function WhatsNewBell() {
  const [hasUnread, setHasUnread] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch('/api/changelog/seen')
      .then((r) => r.json())
      .then((d) => setHasUnread(Boolean(d.hasUnread)))
      .catch(() => {});
  }, []);

  const markSeen = async () => {
    await fetch('/api/changelog/seen', { method: 'PATCH' });
    setHasUnread(false);
  };

  const openPanel = () => {
    setOpen(true);
    void markSeen();
  };

  return (
    <>
      <button type="button" className="whats-new-btn" onClick={openPanel} aria-label="What's new">
        ✦{hasUnread && <span className="whats-new-badge" />}
      </button>
      {open && (
        <div className="whats-new-overlay" onClick={() => setOpen(false)}>
          <div className="whats-new-panel glass-card" onClick={(e) => e.stopPropagation()}>
            <h3>What&apos;s New</h3>
            {CHANGELOG.slice(0, 3).map((entry) => (
              <article key={entry.date} className="whats-new-entry">
                <time>{entry.date}</time>
                <h4>{entry.title}</h4>
                <ul>
                  {entry.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </article>
            ))}
            <Link href="/changelog" className="vesper-btn-outline" onClick={() => setOpen(false)}>
              View full changelog
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
