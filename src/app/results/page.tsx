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
  const [sermonImages, setSermonImages] = useState<any[]>([]);
  const [quotesAndVerses, setQuotesAndVerses] = useState<any[]>([]);
  const [devotional, setDevotional] = useState<any[]>([]);
  const [sermonData, setSermonData] = useState<any>({});
  const [activeTab, setActiveTab] = useState<'overview' | 'videos' | 'sermon_imgs' | 'quote_imgs' | 'devotional'>('overview');
  const [summaryTab, setSummaryTab] = useState<'one' | 'bullets' | 'detailed'>('one');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!jobId) {
      setError('Neural Job ID not found.');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const response = await fetch(`/api/clips?jobId=${jobId}`);
        const data = await response.json();

        if (data.success) {
          const mergedClips = (data.clips || []).map((clip: ClipData) => {
            const captionsObj = (data.social_captions || []).find((c: any) => c.clip_number === clip.clip_number);
            return {
              ...clip,
              suggested_captions: captionsObj ? captionsObj.captions : (clip.suggested_captions || [])
            };
          });
          setClips(mergedClips);
          setSermonImages(data.sermon_images || []);
          setQuotesAndVerses(data.quotes_and_verses || []);
          setDevotional(data.five_day_devotional || []);
          setSermonData({ summaries: data.summaries, main_theme: data.main_theme, tone: data.tone });
        } else {
          setError(data.error || 'The engine failed to assemble the media kit.');
        }
      } catch (err) {
        setError('Connection interrupted during suite assembly.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [jobId]);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'videos', label: 'Clips' },
    { id: 'sermon_imgs', label: 'Art' },
    { id: 'quote_imgs', label: 'Quotes' },
    { id: 'devotional', label: 'Growth' },
  ] as const;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-8 animate-fade">
        <div className="relative">
          <div className="w-20 h-20 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 bg-primary/10 rounded-full animate-pulse" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black tracking-tighter text-white uppercase">Assembling Suite</h2>
          <p className="text-[10px] font-bold text-primary uppercase tracking-[0.4em] animate-pulse">Establishing Secure Stream…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="p-6 glass border-red-500/20 max-w-md">
          <p className="text-red-400 font-bold mb-4">{error}</p>
          <button onClick={() => router.push('/')} className="btn-primary !py-2.5 !text-xs">
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-6 sm:p-12 lg:p-24 space-y-16 animate-fade">
      {/* Background Decor */}
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[150px] rounded-full pointer-events-none -z-10" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/5 blur-[150px] rounded-full pointer-events-none -z-10" />

      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-12 border-b border-white/5">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Media Kit
            </span>
            <span className="text-white/20 text-[10px] font-bold uppercase tracking-widest">Job: {jobId?.slice(0, 8)}</span>
          </div>
          <h1 className="text-6xl sm:text-7xl font-black tracking-tighter leading-none text-white">
            Sermon<span className="gradient-text">Clipper</span>
          </h1>
        </div>

        <div className="flex gap-4">
          <button onClick={() => router.push('/')} className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all border border-white/5">
            New Generation
          </button>
          <button onClick={() => window.print()} className="btn-primary !py-3 !px-8 !text-[10px]">
            Export Media Guide
          </button>
        </div>
      </header>

      {/* Navigation */}
      <nav className="flex flex-wrap gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/5 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-8 py-3 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all ${
              activeTab === tab.id
                ? 'bg-primary text-white shadow-xl'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Content Engine */}
      <section className="min-h-[600px] animate-fade">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-8">
              <div className="glass-card !p-0 aspect-video lg:h-[540px] overflow-hidden border-primary/20 shadow-2xl">
                {clips.length > 0 ? (
                  <video
                    src={clips[0].url}
                    poster={clips[0].thumbnailUrl}
                    controls
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-black/40">
                    <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/20 animate-pulse">Initializing Stream…</span>
                  </div>
                )}
                <div className="absolute top-6 left-6 px-4 py-1.5 bg-primary/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-2xl">
                  Featured Clip
                </div>
              </div>

              <div className="glass-card bg-primary/5 border-primary/10">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary mb-3">Neural Core Theme</p>
                <p className="text-white/70 leading-relaxed italic text-xl font-medium tracking-tight">
                  &quot;{sermonData.main_theme || 'Extracting core theme…'}&quot;
                </p>
              </div>
            </div>

            <div className="lg:col-span-1 h-full">
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

        {activeTab === 'videos' && <ClipGrid clips={clips} />}
        {activeTab === 'sermon_imgs' && <SermonArtGallery assets={sermonImages} />}
        {activeTab === 'quote_imgs' && <QuoteVerseGallery assets={quotesAndVerses} />}
        {activeTab === 'devotional' && <DevotionalTimeline devotional={devotional} />}
      </section>

      <footer className="pt-24 border-t border-white/5 text-center">
        <p className="text-white/10 text-[10px] font-bold tracking-[0.5em] uppercase">Professional Edition · SermonClipper Engine 2.3</p>
      </footer>
    </main>
  );
}

export default function Results() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-12 h-12 border-2 border-primary/20 border-t-primary rounded-full animate-spin" /></div>}>
      <ResultsContent />
    </Suspense>
  );
}
