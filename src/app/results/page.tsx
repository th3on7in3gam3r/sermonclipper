'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import SermonBrief from '@/components/results/SermonBrief';
import ClipGrid from '@/components/results/ClipGrid';
import SermonArtGallery from '@/components/results/SermonArtGallery';
import QuoteVerseGallery from '@/components/results/QuoteVerseGallery';
import DevotionalTimeline from '@/components/results/DevotionalTimeline';

function ResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const jobId = searchParams.get('jobId');

  interface ClipData {
    id: string;
    url: string;
    title: string;
    thumbnailUrl?: string;
    hook_title?: string;
    main_quote?: string;
    why_it_works?: string;
    reason?: string;
    hashtags?: string;
    suggested_captions?: string[];
    clip_number?: number;
    start_time: number;
    end_time: number;
    [key: string]: unknown;
  }

  const [clips, setClips] = useState<ClipData[]>([]);
  const [sermonImages, setSermonImages] = useState<Record<string, unknown>[]>([]);
  const [quotesAndVerses, setQuotesAndVerses] = useState<Record<string, unknown>[]>([]);
  const [devotional, setDevotional] = useState<Record<string, unknown>[]>([]);
  const [sermonData, setSermonData] = useState<{
    summaries?: Record<string, unknown>;
    main_theme?: string;
    tone?: string;
  }>({});

  const [activeTab, setActiveTab] = useState<'overview' | 'videos' | 'sermon_imgs' | 'quote_imgs' | 'devotional'>('overview');
  const [summaryTab, setSummaryTab] = useState<'one' | 'bullets' | 'detailed'>('one');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [videoError, setVideoError] = useState('');

  useEffect(() => {
    if (!jobId) {
      Promise.resolve().then(() => {
        setError('No Job ID found.');
        setLoading(false);
      });
      return;
    }

    const fetchData = async () => {
      try {
        const response = await fetch(`/api/clips?jobId=${jobId}`);
        const data = await response.json();

        if (data.success) {
          const mergedClips = (data.clips || []).map((clip: ClipData) => {
            const captionsObj = (data.social_captions || []).find((c: Record<string, unknown>) => c.clip_number === clip.clip_number);
            return {
              ...clip,
              suggested_captions: captionsObj ? captionsObj.captions : (clip.suggested_captions || [])
            };
          });
          setClips(mergedClips);

          const sermonImagePrompts = data.sermon_images || [];
          const quotePrompts = data.quotes_and_verses || [];

          setSermonImages(mergedClips.map((clip: ClipData, index: number) => {
            const prompt = sermonImagePrompts[index] ||
              `Create an attention-grabbing social media graphic for the sermon clip titled "${clip.title}" with a premium cinematic look.`;
            return { title: clip.title, description: (prompt as string).split(' - ')[0] || clip.title, full_image_prompt: prompt };
          }));

          setQuotesAndVerses(mergedClips.map((clip: ClipData, index: number) => {
            const item = quotePrompts[index] as string | undefined;
            const quoteMatch = item?.match(/Typography card: '([^']+)'/);
            const quote = quoteMatch ? quoteMatch[1] : item || clip.main_quote || clip.title;
            const prompt = item || `Typography card: '${quote}' - a premium scripture design using branding colors, modern fonts, and a minimal layout.`;
            return { type: 'scripture', text: quote, reference: clip.title, full_image_prompt: prompt };
          }));

          setDevotional(data.five_day_devotional || []);
          setSermonData({ summaries: data.summaries, main_theme: data.main_theme, tone: data.tone });
        } else {
          setError(data.error || 'Failed to load assets.');
        }
      } catch {
        setError('An error occurred loading your media kit.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [jobId]);

  const handleExportAll = () => {
    if (!jobId) return;
    window.location.href = `/api/export?jobId=${jobId}`;
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'videos', label: 'Clips' },
    { id: 'sermon_imgs', label: 'Art' },
    { id: 'quote_imgs', label: 'Quotes' },
    { id: 'devotional', label: 'Devotional' },
  ] as const;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fdfcf8] flex flex-col items-center justify-center p-6 text-center">
        <div className="relative mb-8">
          <div className="w-16 h-16 border-2 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
        </div>
        <h2 className="text-2xl font-black tracking-tighter text-stone-800 mb-1">
          <span className="text-stone-400">VES</span><span className="gradient-text">PER</span>
        </h2>
        <p className="text-sm text-indigo-500 font-medium animate-pulse">Assembling your media suite…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#fdfcf8] flex flex-col items-center justify-center p-6 text-center">
        <p className="text-red-500 font-semibold">{error}</p>
        <button onClick={() => router.push('/')} className="mt-4 text-sm text-indigo-600 underline">Go back home</button>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#fdfcf8] font-sans">
      {/* Subtle top gradient */}
      <div className="fixed inset-x-0 top-0 h-64 bg-gradient-to-b from-indigo-50/50 to-transparent pointer-events-none z-0" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-stone-200">
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                  Live Kit
                </span>
              </div>
              <h1 className="text-3xl font-black tracking-tighter text-stone-800">
                <span className="text-stone-400">VES</span><span className="gradient-text">PER</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportAll}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-all shadow-sm shadow-emerald-200"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export All
            </button>
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-stone-200 hover:border-stone-300 text-stone-600 rounded-xl text-sm font-semibold transition-all"
            >
              New Sermon
            </button>
          </div>
        </header>

        {/* Tab nav */}
        <nav className="flex gap-1 p-1 bg-stone-100 rounded-xl w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-indigo-600 shadow-sm border border-stone-200'
                  : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <section className="animate-fade-in min-h-[500px]">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-5">
                <div className="relative rounded-2xl overflow-hidden bg-stone-900 aspect-video lg:aspect-auto lg:h-[460px] border border-stone-200 shadow-sm">
                  {clips.length > 0 ? (
                    <>
                      {videoError && (
                        <div className="absolute inset-0 bg-red-900/90 flex flex-col items-center justify-center z-20 p-6 text-center">
                          <p className="text-red-300 font-semibold mb-2">⚠ Video Playback Error</p>
                          <p className="text-red-400 text-xs font-mono break-words">{videoError}</p>
                        </div>
                      )}
                      <video
                        src={clips[0].url}
                        poster={clips[0].thumbnailUrl}
                        controls
                        preload="metadata"
                        playsInline
                        onError={(e) => {
                          const err = e.currentTarget.error;
                          setVideoError(`Code ${err?.code}: ${err?.message || 'Unknown error'}`);
                        }}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-4 left-4 px-3 py-1 bg-indigo-600 text-white text-xs font-semibold rounded-full shadow">
                        Headline Clip
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <p className="text-stone-500 text-sm font-medium">Processing media…</p>
                    </div>
                  )}
                </div>

                <div className="card p-6">
                  <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-2">Main Theme</p>
                  <p className="text-stone-700 leading-relaxed italic text-sm">
                    &quot;{sermonData.main_theme || 'Analyzing sermon theme…'}&quot;
                  </p>
                </div>
              </div>

              <div className="lg:col-span-1">
                <SermonBrief
                  summaries={sermonData.summaries}
                  main_theme={sermonData.main_theme}
                  tone={sermonData.tone}
                  summaryTab={summaryTab}
                  setSummaryTab={setSummaryTab}
                />
              </div>
            </div>
          )}

          {activeTab === 'videos' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-black text-stone-800 tracking-tight">Your Clips</h2>
                <p className="text-sm text-stone-500 mt-1">Preview, review, and download every generated sermon clip.</p>
              </div>
              <ClipGrid clips={clips} />
            </div>
          )}

          {activeTab === 'sermon_imgs' && (
            <SermonArtGallery assets={(sermonImages as unknown) as Parameters<typeof SermonArtGallery>[0]['assets']} />
          )}
          {activeTab === 'quote_imgs' && (
            <QuoteVerseGallery assets={(quotesAndVerses as unknown) as Parameters<typeof QuoteVerseGallery>[0]['assets']} />
          )}
          {activeTab === 'devotional' && (
            <DevotionalTimeline devotional={(devotional as unknown) as Parameters<typeof DevotionalTimeline>[0]['devotional']} />
          )}
        </section>

        <footer className="pt-10 border-t border-stone-100 text-center">
          <p className="text-stone-300 text-xs font-medium tracking-widest uppercase">Vesper · Media Engine</p>
        </footer>
      </div>
    </main>
  );
}

export default function Results() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#fdfcf8] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    }>
      <ResultsContent />
    </Suspense>
  );
}
