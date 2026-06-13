'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import {
  HELP_ARTICLES,
  HELP_SECTIONS,
  getSectionLabel,
  searchHelpArticles,
  type HelpArticle,
} from '@/data/helpArticles';
import HelpArticleBody from '@/components/help/HelpArticleBody';
import HelpFeedback from '@/components/help/HelpFeedback';

type HelpCenterProps = {
  mode?: 'page' | 'panel';
  initialSlug?: string | null;
  onNavigate?: (slug: string | null) => void;
};

export default function HelpCenter({ mode = 'page', initialSlug = null, onNavigate }: HelpCenterProps) {
  const [query, setQuery] = useState('');
  const [activeSlug, setActiveSlug] = useState<string | null>(initialSlug);

  useEffect(() => {
    setActiveSlug(initialSlug);
  }, [initialSlug]);

  const results = useMemo(() => searchHelpArticles(query), [query]);
  const activeArticle = activeSlug ? HELP_ARTICLES.find((a) => a.slug === activeSlug) : null;

  const openArticle = (slug: string) => {
    setActiveSlug(slug);
    setQuery('');
    onNavigate?.(slug);
  };

  const backToIndex = () => {
    setActiveSlug(null);
    onNavigate?.(null);
  };

  if (activeArticle) {
    return (
      <div className={`help-center help-center--${mode}`}>
        <button type="button" className="help-back-btn" onClick={backToIndex}>
          ← All articles
        </button>
        <HelpArticleBody
          article={activeArticle}
          linkComponent={mode === 'panel' ? 'button' : 'link'}
          onOpen={openArticle}
        />
        <HelpFeedback slug={activeArticle.slug} />
      </div>
    );
  }

  return (
    <div className={`help-center help-center--${mode}`}>
      <div className="help-search-wrap">
        <input
          type="search"
          className="help-search-input"
          placeholder="Search help articles…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search help articles"
        />
        {query && (
          <p className="help-search-meta">
            {results.length} result{results.length === 1 ? '' : 's'}
          </p>
        )}
      </div>

      {query ? (
        <SearchResults results={results} onSelect={openArticle} mode={mode} />
      ) : (
        <div className="help-sections-grid">
          {HELP_SECTIONS.map((section) => {
            const articles = HELP_ARTICLES.filter((a) => a.section === section.id);
            return (
              <section key={section.id} className="help-section-block glass-card">
                <h2>{section.label}</h2>
                <ul>
                  {articles.map((article) => (
                    <li key={article.slug}>
                      {mode === 'panel' ? (
                        <button
                          type="button"
                          className="help-article-link"
                          onClick={() => openArticle(article.slug)}
                        >
                          {article.title}
                        </button>
                      ) : (
                        <Link href={`/help/${article.slug}`} className="help-article-link">
                          {article.title}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SearchResults({
  results,
  onSelect,
  mode,
}: {
  results: HelpArticle[];
  onSelect: (slug: string) => void;
  mode: 'page' | 'panel';
}) {
  if (!results.length) {
    return <p className="help-empty">No articles match your search. Try different keywords.</p>;
  }

  return (
    <ul className="help-search-results">
      {results.map((article) => (
        <li key={article.slug} className="help-search-result glass-card">
          <p className="help-search-section">{getSectionLabel(article.section)}</p>
          {mode === 'panel' ? (
            <button type="button" className="help-search-title" onClick={() => onSelect(article.slug)}>
              {article.title}
            </button>
          ) : (
            <Link href={`/help/${article.slug}`} className="help-search-title">
              {article.title}
            </Link>
          )}
          <p className="help-search-snippet">{article.paragraphs[0]}</p>
        </li>
      ))}
    </ul>
  );
}
