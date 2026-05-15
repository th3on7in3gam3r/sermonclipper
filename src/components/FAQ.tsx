'use client';

import { useState } from 'react';

const FAQ_DATA = [
  {
    q: 'How does Vesper work?',
    a: 'Paste a YouTube sermon link or upload an MP4 file. Our AI (GPT-4o) analyzes the full sermon and identifies the most powerful, shareable moments. It generates clip timestamps, captions, and social media content automatically.'
  },
  {
    q: 'Why can\'t I export reels from a YouTube link?',
    a: 'Shotstack (our cloud rendering engine) requires a direct MP4 file URL to produce the final 9:16 reel. YouTube doesn\'t allow direct file access from servers. To export reels, download the sermon from YouTube and re-upload the MP4 file directly.'
  },
  {
    q: 'What\'s the difference between YouTube mode and Upload mode?',
    a: 'YouTube mode: AI analysis works perfectly — you get clips, captions, thumbnails, and the Social Kit. But reel export is unavailable.\n\nUpload mode: Full pipeline — AI analysis + cloud rendering + downloadable 9:16 reels with captions, filters, and animations baked in.'
  },
  {
    q: 'How long does processing take?',
    a: 'AI analysis takes 30–90 seconds depending on sermon length. Cloud rendering (Shotstack) takes 1–3 minutes per clip. You\'ll see real-time progress updates throughout.'
  },
  {
    q: 'What are the file size limits?',
    a: 'Uploaded videos can be up to 100MB. For best results, use MP4 format at 720p resolution. If your sermon file is larger, you can:\n\n• Compress it using HandBrake (free) or similar tools\n• Use a YouTube link for AI analysis (clips, captions, Social Kit)\n• Split longer sermons into parts\n\nWe recommend 720p MP4 which typically keeps a 60-minute sermon under 80MB.'
  },
  {
    q: 'What does the Studio do?',
    a: 'The Studio lets you customize each clip before exporting: choose caption styles (templates), color grades (filters), typography (fonts), and text animations (motion). You can also trim the clip\'s in/out points for precision.'
  },
  {
    q: 'What is the Social Kit?',
    a: 'The Social Kit generates platform-optimized captions for Instagram, TikTok, YouTube Shorts, X/Twitter, and Facebook. Each caption respects the platform\'s character limits and includes relevant hashtags. Tap any card to copy.'
  },
  {
    q: 'How do thumbnails work?',
    a: 'Click "Open Thumbnail Studio" on any clip card. You can customize the prompt, choose a style (Cinematic, Bold Text, Minimal, Abstract), and generate a 16:9 YouTube thumbnail using DALL-E 3. Multiple variants are generated for you to choose from.'
  },
  {
    q: 'What are the plan limits?',
    a: 'Free: 2 sermons/month. Creator ($19/mo): 20 sermons/month with priority rendering. Church Pro ($49/mo): Unlimited sermons with dedicated rendering and white-label branding.'
  },
  {
    q: 'Can I use this for my church team?',
    a: 'Yes! The Church Pro plan supports multi-user access. Each team member signs in with their own account and shares the same sermon archive and rendering queue.'
  },
];

export default function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <section id="faq" style={{ padding: '120px 20px', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '80px' }}>
        <div className="vesper-badge badge-violet" style={{ marginBottom: '24px' }}>SUPPORT</div>
        <h2 className="title-xl" style={{ fontSize: 'clamp(32px, 5vw, 48px)', marginBottom: '16px' }}>Frequently Asked Questions</h2>
      </div>
 
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {FAQ_DATA.map((item, i) => (
          <div
            key={i}
            className="glass-card premium-border"
            style={{
              padding: 0,
              background: openIdx === i ? 'rgba(255,255,255,0.02)' : 'transparent',
              borderColor: openIdx === i ? 'var(--primary)' : 'var(--card-border)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <button
              onClick={() => setOpenIdx(openIdx === i ? null : i)}
              style={{
                width: '100%',
                padding: '24px 32px',
                background: 'none',
                border: 'none',
                color: '#fff',
                fontSize: '16px',
                fontWeight: 800,
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <span style={{ opacity: openIdx === i ? 1 : 0.8 }}>{item.q}</span>
              <span style={{ 
                fontSize: '24px', color: 'var(--primary)', flexShrink: 0, transition: 'all 0.3s', 
                transform: openIdx === i ? 'rotate(135deg)' : 'rotate(0deg)',
                opacity: 0.6
              }}>+</span>
            </button>
            {openIdx === i && (
              <div style={{ padding: '0 32px 32px', fontSize: '15px', color: 'var(--text-muted)', lineHeight: 1.8, whiteSpace: 'pre-line', animation: 'fadeIn 0.3s ease' }}>
                {item.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
