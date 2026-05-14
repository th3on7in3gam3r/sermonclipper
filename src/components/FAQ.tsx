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
    <section id="faq" style={{ padding: '80px 20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <div style={{ fontSize: '10px', fontWeight: 900, color: '#8B5CF6', letterSpacing: '0.3em', marginBottom: '12px' }}>SUPPORT</div>
        <h2 style={{ fontSize: '32px', fontWeight: 900, letterSpacing: '-0.03em' }}>Frequently Asked Questions</h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {FAQ_DATA.map((item, i) => (
          <div
            key={i}
            style={{
              background: openIdx === i ? 'rgba(139,92,246,0.05)' : 'rgba(255,255,255,0.02)',
              border: openIdx === i ? '1px solid rgba(139,92,246,0.2)' : '1px solid rgba(255,255,255,0.06)',
              borderRadius: '16px',
              overflow: 'hidden',
              transition: 'all 0.2s',
            }}
          >
            <button
              onClick={() => setOpenIdx(openIdx === i ? null : i)}
              style={{
                width: '100%',
                padding: '20px 24px',
                background: 'none',
                border: 'none',
                color: '#fff',
                fontSize: '15px',
                fontWeight: 700,
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <span>{item.q}</span>
              <span style={{ fontSize: '18px', color: '#8B5CF6', flexShrink: 0, transition: 'transform 0.2s', transform: openIdx === i ? 'rotate(45deg)' : 'rotate(0deg)' }}>+</span>
            </button>
            {openIdx === i && (
              <div style={{ padding: '0 24px 20px', fontSize: '14px', color: '#A1A1AA', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                {item.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
