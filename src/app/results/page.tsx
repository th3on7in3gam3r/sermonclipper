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
  
  const [clips, setClips] = useState<any[]>([]);
  const [sermonImages, setSermonImages] = useState<any[]>([]);
  const [quotesAndVerses, setQuotesAndVerses] = useState<any[]>([]);
  const [devotional, setDevotional] = useState<any[]>([]);
  const [sermonData, setSermonData] = useState<{
    summaries?: any;
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
      setError('No Job ID found.');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        console.log(`[DEBUG] Fetching Media Kit for Job ID: ${jobId}`);
        const response = await fetch(`/api/clips?jobId=${jobId}`);
        const data = await response.json();
        
        console.log('[DEBUG] Media Kit Data Received:', data);

        if (data.success) {
          if (data.clips) {
            setClips(data.clips);
          } else {
            console.warn('[DEBUG] No clips found in Media Kit response.');
          }

          const mergedClips = (data.clips || []).map((clip: any) => {
            const captionsObj = (data.social_captions || []).find((c: any) => c.clip_number === clip.clip_number);
            return {
              ...clip,
              suggested_captions: captionsObj ? captionsObj.captions : (clip.suggested_captions || [])
            };
          });

          setClips(mergedClips);

          const clipSource = mergedClips;
          const sermonImagePrompts = data.sermon_images || [];
          const quotePrompts = data.quotes_and_verses || [];

          // Ensure Art and Quote tabs always render one card per clip.
          const transformedSermonImages = clipSource.map((clip: any, index: number) => {
            const prompt = sermonImagePrompts[index] ||
              `Create an attention-grabbing social media graphic for the sermon clip titled "${clip.title}" with a premium cinematic look and the sermon theme woven in.`;

            return {
              title: clip.title,
              description: prompt.split(' - ')[0] || clip.title,
              full_image_prompt: prompt
            };
          });

          const transformedQuotesAndVerses = clipSource.map((clip: any, index: number) => {
            const item = quotePrompts[index];
            const quoteMatch = item?.match(/Typography card: '([^']+)'/);
            const quote = quoteMatch ? quoteMatch[1] : item || clip.main_quote || clip.title;
            const prompt = item ||
              `Typography card: '${quote}' - a premium scripture design using branding colors, modern fonts, and a minimal layout.`;

            return {
              type: 'scripture',
              text: quote,
              reference: clip.title,
              full_image_prompt: prompt
            };
          });

          setSermonImages(transformedSermonImages);
          setQuotesAndVerses(transformedQuotesAndVerses);
          setDevotional(data.five_day_devotional || []);
          setSermonData({
            summaries: data.summaries,
            main_theme: data.main_theme,
            tone: data.tone
          });
        } else {
          setError(data.error || 'Failed to load assets.');
        }
      } catch (err) {
        setError('An error occurred.');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="relative mb-10">
          <div className="w-32 h-32 border-t-2 border-violet-500 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-violet-500/20 rounded-full animate-pulse" />
          </div>
        </div>
        <h2 className="text-4xl font-black tracking-tighter uppercase mb-2">
          <span className="font-extralight tracking-widest opacity-30">VES</span>PER
        </h2>
        <p className="text-sm font-black uppercase tracking-[0.35em] text-violet-400 animate-pulse">Assembling Your Media Suite</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black text-zinc-100 selection:bg-violet-500/30 font-sans">
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-violet-600/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-emerald-600/5 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 space-y-8">
        
        {/* Unified Suite Header */}
        <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 border-b border-white/5 xl:h-[128px] xl:pb-0">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-black uppercase tracking-widest">
              Live Media Kit
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter uppercase leading-none">
              <span className="font-extralight tracking-widest opacity-30">VES</span>PER
            </h1>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between w-full xl:gap-6">
            <nav className="min-w-0 w-full sm:flex-1 h-full bg-zinc-950/50 p-2 rounded-2xl border border-white/5 flex flex-wrap sm:flex-nowrap gap-2 overflow-x-auto items-center">
              {[
                { id: 'overview', label: 'Overview', color: 'bg-zinc-800' },
                { id: 'videos', label: 'Videos', color: 'bg-violet-600' },
                { id: 'sermon_imgs', label: 'Art', color: 'bg-amber-600' },
                { id: 'quote_imgs', label: 'Quotes', color: 'bg-violet-600' },
                { id: 'devotional', label: 'Devotional', color: 'bg-emerald-600' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-none min-w-[80px] px-3 py-2 rounded-xl text-sm font-black transition-all uppercase tracking-[0.12em] ${
                    activeTab === tab.id ? `${tab.color} text-white shadow-xl` : 'text-zinc-500 hover:text-zinc-300'
                  }`}>
                  {tab.label}
                </button>
              ))}
            </nav>
            <div className="flex flex-wrap gap-2 justify-end w-full sm:w-auto items-center">
              <button
                onClick={handleExportAll}
                className="min-h-[44px] px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all font-black text-sm uppercase tracking-[0.12em] shadow-xl flex items-center gap-2 justify-center h-11"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export Suite
              </button>
              <button
                onClick={() => router.push('/')}
                className="min-h-[44px] px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl transition-all font-black text-sm uppercase tracking-[0.12em] border border-white/5 h-11"
              >
                New Mission
              </button>
            </div>
          </div>
        </header>

        {/* Content Stages */}
        <section className="animate-fade-in min-h-[600px]">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Left Side: Headline Clip */}
              <div className="lg:col-span-2 space-y-8">
                <div className="relative group rounded-3xl overflow-hidden border border-white/10 aspect-video lg:aspect-auto lg:h-[500px]">
                  {clips.length > 0 ? (
                    <>
                      {videoError && (
                        <div className="absolute inset-0 bg-red-950/80 flex flex-col items-center justify-center z-20 rounded-3xl p-6 text-center">
                          <div className="text-red-400 font-bold mb-3">⚠️ Video Playback Error</div>
                          <p className="text-red-300 text-sm font-mono break-words mb-4">{videoError}</p>
                          <p className="text-sm text-red-200">The video file may be corrupted. Try re-processing the sermon.</p>
                        </div>
                      )}
                      <video 
                        src={clips[0].url} 
                        poster={clips[0].thumbnailUrl}
                        controls
                        preload="metadata"
                        playsInline
                        onLoadStart={() => console.log(`[DEBUG] Headline Video Load Start: ${clips[0].url}`)}
                        onLoadedMetadata={(e) => console.log(`[DEBUG] Headline Video Metadata Loaded. Duration: ${e.currentTarget.duration}`)}
                        onError={(e) => {
                          const error = e.currentTarget.error;
                          const errorMessages: { [key: number]: string } = {
                            1: 'Video aborted by user',
                            2: 'Network error - video failed to load',
                            3: 'Video decoding failed - file may be corrupted or invalid',
                            4: 'Video format not supported or has no valid streams'
                          };
                          const errorMsg = `[DEBUG] Headline Video Error! Code: ${error?.code} | Message: ${error?.message || errorMessages[error?.code || 0] || 'Unknown error'} | URL: ${clips[0].url}`;
                          console.error(errorMsg);
                          setVideoError(errorMsg);
                        }}
                        onStalled={() => console.warn(`[DEBUG] Headline Video Playback Stalled: ${clips[0].url}`)}
                        className="w-full h-full object-cover"
                      />
                    </>
                  ) : (
                    <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                      <p className="text-zinc-700 font-black uppercase tracking-widest">Processing Media...</p>
                    </div>
                  )}
                  <div className="absolute top-6 left-6 px-4 py-2 bg-violet-600 text-white text-sm font-black uppercase tracking-widest rounded-full shadow-2xl">
                    Headline Media
                  </div>
                </div>

                <div className="p-8 rounded-3xl bg-zinc-900/30 border border-white/5">
                  <h3 className="text-xl font-bold mb-4">Main Sermon Theme</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed italic">"{sermonData.main_theme || 'Analyzing main theme...'}"</p>
                  <p className="text-sm text-zinc-600 mt-4 uppercase tracking-widest">[DEBUG] Active Tab: {activeTab} | Clips: {clips.length}</p>
                </div>
              </div>

              {/* Right Side: Sermon Brief */}
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
            <div className="space-y-8">
              <div className="space-y-3">
                <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight">Your Clips</h2>
                <p className="text-sm text-zinc-400 max-w-2xl">Review every generated sermon clip, preview the best cut, and download the media for social sharing.</p>
              </div>
              <ClipGrid clips={clips} />
            </div>
          )}
          {activeTab === 'sermon_imgs' && <SermonArtGallery assets={sermonImages} />}
          {activeTab === 'quote_imgs' && <QuoteVerseGallery assets={quotesAndVerses} />}
          {activeTab === 'devotional' && <DevotionalTimeline devotional={devotional} />}
        </section>

        {/* Footer Actions */}
        <footer className="pt-20 border-t border-white/5 text-center">
          <p className="text-zinc-600 text-sm font-black uppercase tracking-[0.4em] mb-8">VESPER / MEDIA ENGINE V2.0</p>
        </footer>
      </div>
    </main>
  );
}

export default function Results() {
  return (
    <Suspense fallback={<div>Loading Suite...</div>}>
      <ResultsContent />
    </Suspense>
  );
}
