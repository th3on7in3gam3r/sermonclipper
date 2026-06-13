'use client';
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import EmptyState from '@/components/shared/EmptyState';
import ExportFlowModal from '@/components/dashboard/ExportFlowModal';
import ShareExportModal from '@/components/dashboard/ShareExportModal';
import ClipPreviewPanel from '@/components/dashboard/ClipPreviewPanel';
import { parseTime } from '@/lib/parseTime';

export type SermonRecord = {
  _id: string;
  jobId: string;
  title: string;
  mainTheme?: string;
  videoUrl: string;
  finalPath?: string;
  createdAt: string;
  createdByName?: string;
  analysis?: { clips?: ClipAnalysis[]; source_type?: string };
};

type ClipAnalysis = {
  start: string | number;
  end: string | number;
  hook_title?: string;
  main_quote?: string;
  suggested_captions?: string[];
  is_audio?: boolean;
};

export type LibraryItem = {
  key: string;
  sermonId: string;
  jobId: string;
  clipIndex: number;
  title: string;
  sermonTitle: string;
  createdAt: string;
  durationSec: number;
  clipStart: string | number;
  clipEnd: string | number;
  videoUrl: string;
  finalPath?: string;
  createdByName?: string;
  exportStatus: 'none' | 'complete' | 'pending';
  isAudio?: boolean;
};

function buildResultsHref(item: LibraryItem) {
  const params = new URLSearchParams({
    jobId: item.jobId,
    videoUrl: item.videoUrl,
  });
  if (item.finalPath) params.set('finalPath', item.finalPath);
  params.set('clip', String(item.clipIndex));
  return `/results?${params.toString()}`;
}

function getYoutubeId(url: string) {
  try {
    if (url.includes('youtube.com')) return new URL(url).searchParams.get('v');
    if (url.includes('youtu.be')) return url.split('/').pop()?.split('?')[0];
  } catch {
    return null;
  }
  return null;
}

function flattenSermons(sermons: SermonRecord[]): LibraryItem[] {
  const items: LibraryItem[] = [];
  for (const sermon of sermons) {
    const clips = sermon.analysis?.clips;
    if (clips?.length) {
      clips.forEach((clip, clipIndex) => {
        const start = parseTime(clip.start);
        const end = parseTime(clip.end);
        items.push({
          key: `${sermon._id}-${clipIndex}`,
          sermonId: sermon._id,
          jobId: sermon.jobId,
          clipIndex,
          title: clip.hook_title || clip.main_quote?.slice(0, 60) || sermon.title,
          sermonTitle: sermon.title,
          createdAt: sermon.createdAt,
          durationSec: Math.max(0, end - start),
          clipStart: clip.start,
          clipEnd: clip.end,
          videoUrl: sermon.videoUrl,
          finalPath: sermon.finalPath,
          createdByName: sermon.createdByName,
          exportStatus: 'none',
          isAudio: Boolean(clip.is_audio || sermon.analysis?.source_type === 'audio'),
        });
      });
    } else {
      items.push({
        key: sermon._id,
        sermonId: sermon._id,
        jobId: sermon.jobId,
        clipIndex: 0,
        title: sermon.title,
        sermonTitle: sermon.title,
        createdAt: sermon.createdAt,
        durationSec: 0,
        clipStart: 0,
        clipEnd: 0,
        videoUrl: sermon.videoUrl,
        finalPath: sermon.finalPath,
        createdByName: sermon.createdByName,
        exportStatus: 'none',
      });
    }
  }
  return items;
}

function formatDuration(sec: number) {
  if (!sec) return '—';
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s}s`;
}

interface ClipLibraryProps {
  sermons: SermonRecord[];
  plan?: string;
  onDelete: (sermonIds: string[]) => Promise<void>;
  isPhone?: boolean;
  registerActions?: (actions: {
    exportSelected?: () => void;
    deleteSelected?: () => void;
    focusIndex?: (delta: number) => void;
  }) => void;
}

const PAGE_SIZE = 12;

export default function ClipLibrary({
  sermons,
  plan,
  onDelete,
  isPhone = false,
  registerActions,
}: ClipLibraryProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'date-desc' | 'date-asc' | 'sermon' | 'export'>('date-desc');
  const [sermonFilter, setSermonFilter] = useState('');
  const [exportFilter, setExportFilter] = useState<'all' | 'complete' | 'none'>('all');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [exportItem, setExportItem] = useState<LibraryItem | null>(null);
  const [shareItem, setShareItem] = useState<{ item: LibraryItem; renderUrl: string } | null>(null);
  const [previewItem, setPreviewItem] = useState<LibraryItem | null>(null);

  const allItems = useMemo(() => flattenSermons(sermons), [sermons]);

  const sermonTitles = useMemo(() => [...new Set(allItems.map((i) => i.sermonTitle))].sort(), [allItems]);

  const filtered = useMemo(() => {
    let list = allItems;
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((i) => i.title.toLowerCase().includes(q) || i.sermonTitle.toLowerCase().includes(q));
    }
    if (sermonFilter) list = list.filter((i) => i.sermonTitle === sermonFilter);
    if (exportFilter !== 'all') {
      list = list.filter((i) =>
        exportFilter === 'complete' ? i.exportStatus === 'complete' : i.exportStatus === 'none'
      );
    }
    list = [...list].sort((a, b) => {
      if (sort === 'sermon') return a.sermonTitle.localeCompare(b.sermonTitle);
      if (sort === 'export') return a.exportStatus.localeCompare(b.exportStatus);
      const da = new Date(a.createdAt).getTime();
      const db = new Date(b.createdAt).getTime();
      return sort === 'date-asc' ? da - db : db - da;
    });
    return list;
  }, [allItems, search, sermonFilter, exportFilter, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSelect = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === pageItems.length) setSelected(new Set());
    else setSelected(new Set(pageItems.map((i) => i.key)));
  };

  const bulkDelete = async () => {
    if (!selected.size) return;
    if (!confirm(`Delete ${selected.size} selected item(s)? This cannot be undone.`)) return;
    const sermonIds = [...new Set(pageItems.filter((i) => selected.has(i.key)).map((i) => i.sermonId))];
    await onDelete(sermonIds);
    setSelected(new Set());
    toast.success('Deleted selected clips');
  };

  const openStudio = (item: LibraryItem) => {
    router.push(buildResultsHref(item));
  };

  const openPreview = (item: LibraryItem) => {
    setPreviewItem(item);
  };

  const deleteOne = async (item: LibraryItem) => {
    if (!confirm('Delete this clip project?')) return;
    await onDelete([item.sermonId]);
    toast.success('Clip deleted');
  };

  useEffect(() => {
    registerActions?.({
      exportSelected: () => {
        const item = pageItems[focusedIndex] || pageItems.find((i) => selected.has(i.key));
        if (item) setExportItem(item);
      },
      deleteSelected: () => {
        const item = pageItems[focusedIndex] || pageItems.find((i) => selected.has(i.key));
        if (item) void deleteOne(item);
      },
      focusIndex: (delta) => {
        setFocusedIndex((i) => Math.max(0, Math.min(pageItems.length - 1, i + delta)));
      },
    });
  }, [registerActions, pageItems, focusedIndex, selected, onDelete]);

  if (!allItems.length) {
    return (
      <EmptyState
        icon="🎬"
        headline="No clips yet"
        subtext="Upload a sermon or paste a YouTube link to generate your first cinematic reel."
        ctaLabel="Create Your First Clip"
        ctaHref="/#upload"
      />
    );
  }

  return (
    <div className="clip-library">
      <div className="clip-library-toolbar">
        <input
          type="search"
          className="clip-library-search"
          placeholder="Search clips or sermon titles…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          aria-label="Search clips"
        />
        <select
          className="clip-library-select"
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
          aria-label="Sort clips"
        >
          <option value="date-desc">Newest first</option>
          <option value="date-asc">Oldest first</option>
          <option value="sermon">By sermon</option>
          <option value="export">By export status</option>
        </select>
        <select
          className="clip-library-select"
          value={sermonFilter}
          onChange={(e) => {
            setSermonFilter(e.target.value);
            setPage(1);
          }}
          aria-label="Filter by sermon"
        >
          <option value="">All sermons</option>
          {sermonTitles.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          className="clip-library-select"
          value={exportFilter}
          onChange={(e) => setExportFilter(e.target.value as typeof exportFilter)}
          aria-label="Filter by export status"
        >
          <option value="all">All export status</option>
          <option value="complete">Exported</option>
          <option value="none">Not exported</option>
        </select>
      </div>

      {selected.size > 0 && (
        <div className="clip-library-bulk-bar">
          <span>{selected.size} selected</span>
          <button type="button" className="vesper-btn-outline" onClick={toggleSelectAll}>
            {selected.size === pageItems.length ? 'Deselect page' : 'Select page'}
          </button>
          <button
            type="button"
            className="vesper-btn-outline"
            style={{ color: '#EF4444' }}
            onClick={bulkDelete}
          >
            Delete selected
          </button>
        </div>
      )}

      <div className="clip-library-grid">
        {pageItems.map((item, index) => {
          const ytId = getYoutubeId(item.videoUrl);
          const thumb = ytId ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg` : null;
          return (
            <article
              key={item.key}
              className={`clip-library-card glass-card premium-border${focusedIndex === index ? ' clip-library-card--focused' : ''}`}
            >
              <div className="clip-library-card-select" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={selected.has(item.key)}
                  onChange={() => toggleSelect(item.key)}
                  aria-label={`Select ${item.title}`}
                />
              </div>
              <div
                className="clip-library-card-main"
                role="button"
                tabIndex={0}
                onClick={() => openPreview(item)}
                onKeyDown={(e) => e.key === 'Enter' && openPreview(item)}
              >
                <div className="clip-library-thumb">
                  {thumb ? (
                    <img src={thumb} alt="" />
                  ) : (
                    <span className="clip-library-thumb-fallback">VESPER</span>
                  )}
                  <span className="clip-library-duration">{formatDuration(item.durationSec)}</span>
                </div>
                <div className="clip-library-body">
                  <h3>
                    {item.title}
                    {item.isAudio && (
                      <span title="Audio sermon" style={{ marginLeft: 6 }}>
                        🎙️
                      </span>
                    )}
                  </h3>
                  <p className="clip-library-sermon">{item.sermonTitle}</p>
                  <div className="clip-library-meta">
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    {item.createdByName && <span>· {item.createdByName}</span>}
                  </div>
                </div>
              </div>
              <div className="clip-library-actions">
                <button
                  type="button"
                  className="vesper-btn-outline clip-library-action"
                  onClick={() => setExportItem(item)}
                >
                  Download
                </button>
                <button
                  type="button"
                  className="vesper-btn-outline clip-library-action"
                  onClick={() => openStudio(item)}
                >
                  Studio
                </button>
                <button
                  type="button"
                  className="vesper-btn-outline clip-library-action"
                  onClick={() => setShareItem({ item, renderUrl: '' })}
                >
                  Share
                </button>
                <button
                  type="button"
                  className="vesper-btn-outline clip-library-action clip-library-action-danger"
                  onClick={() => deleteOne(item)}
                >
                  Delete
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="clip-library-pagination">
          <button
            type="button"
            className="vesper-btn-outline"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            className="vesper-btn-outline"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}

      {exportItem && (
        <ExportFlowModal
          item={exportItem}
          plan={plan}
          onClose={() => setExportItem(null)}
          onComplete={(renderUrl) => {
            setExportItem(null);
            setShareItem({ item: exportItem, renderUrl });
          }}
        />
      )}

      {shareItem && (
        <ShareExportModal
          clipTitle={shareItem.item.title}
          renderUrl={shareItem.renderUrl}
          onClose={() => setShareItem(null)}
        />
      )}

      {previewItem && (
        <ClipPreviewPanel
          item={previewItem}
          resultsHref={buildResultsHref(previewItem)}
          captionText={
            sermons.find((s) => s._id === previewItem.sermonId)?.analysis?.clips?.[previewItem.clipIndex]
              ?.suggested_captions?.[0]
          }
          onClose={() => setPreviewItem(null)}
          onDelete={(item) => void deleteOne(item)}
          onExport={(item) => setExportItem(item)}
          onShare={(item) => setShareItem({ item, renderUrl: '' })}
        />
      )}
    </div>
  );
}
