'use client';

import Link from 'next/link';
import { getRelatedArticles, getSectionLabel, type HelpArticle } from '@/data/helpArticles';

type HelpArticleBodyProps = {
  article: HelpArticle;
  linkComponent?: 'link' | 'button';
  onOpen?: (slug: string) => void;
};

export default function HelpArticleBody({ article, linkComponent = 'link', onOpen }: HelpArticleBodyProps) {
  const related = getRelatedArticles(article.slug);

  return (
    <article className="help-article">
      <p className="help-article-section">{getSectionLabel(article.section)}</p>
      <h1>{article.title}</h1>
      <p className="help-article-updated">Last updated: {article.lastUpdated}</p>
      <div className="help-article-body">
        {article.paragraphs.map((p) => (
          <p key={p.slice(0, 40)}>{p}</p>
        ))}
      </div>
      {related.length > 0 && (
        <footer className="help-related">
          <h2>Related articles</h2>
          <ul>
            {related.map((r) => (
              <li key={r.slug}>
                {linkComponent === 'button' && onOpen ? (
                  <button type="button" className="help-article-link" onClick={() => onOpen(r.slug)}>
                    {r.title}
                  </button>
                ) : (
                  <Link href={`/help/${r.slug}`} className="help-article-link">
                    {r.title}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </footer>
      )}
    </article>
  );
}
