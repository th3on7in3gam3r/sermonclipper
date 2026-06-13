'use client';

import Link from 'next/link';
import SiteFooter from '@/components/layout/SiteFooter';
import { CHANGELOG } from '@/data/changelog';

export default function ChangelogPage() {
  return (
    <main className="changelog-page">
      <div className="vesper-mesh-bg" />
      <div className="changelog-inner">
        <Link href="/dashboard" className="changelog-back">
          ← Back
        </Link>
        <h1>Changelog</h1>
        <p className="changelog-sub">What&apos;s new in Vesper — newest first.</p>
        <div className="changelog-timeline">
          {CHANGELOG.map((entry) => (
            <article key={entry.date} className="changelog-entry">
              <div className="changelog-dot" />
              <div className="changelog-content">
                <header>
                  <time>{entry.date}</time>
                  {entry.version && <span className="changelog-version">{entry.version}</span>}
                </header>
                <h2>{entry.title}</h2>
                <ul>
                  {entry.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
