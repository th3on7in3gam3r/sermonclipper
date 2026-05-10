'use client';

import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <main style={{ minHeight: '100vh', padding: '120px 20px', background: '#0A0A0F', color: '#fff', position: 'relative' }}>
      <div className="vesper-bg" />
      
      <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
        <Link href="/" style={{ textDecoration: 'none', color: '#8B5CF6', fontSize: '14px', fontWeight: 700, marginBottom: '40px', display: 'block' }}>
          ← BACK TO HOME
        </Link>
        
        <h1 style={{ fontSize: '48px', fontWeight: 900, marginBottom: '24px', letterSpacing: '-0.04em' }}>PRIVACY <span style={{ color: '#8B5CF6' }}>POLICY</span></h1>
        <p style={{ color: '#A1A1AA', marginBottom: '48px' }}>Last Updated: May 10, 2026</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', fontSize: '16px', lineHeight: '1.8', color: '#D1D5DB' }}>
          <section>
            <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: 700, marginBottom: '16px' }}>1. Information We Collect</h2>
            <p>At Vesper, we prioritize the sanctity of your ministry data. We collect information you provide directly to us when you create an account, process a sermon, or communicate with us. This includes your name, email address, and the metadata associated with the sermons you harvest.</p>
          </section>

          <section>
            <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: 700, marginBottom: '16px' }}>2. How We Use Your Information</h2>
            <p>We use the information we collect to provide, maintain, and improve our cinematic processing services. Your sermon data is processed through our neural engines (OpenAI and Gemini) solely for the purpose of generating clips, quotes, and social media assets for your ministry.</p>
          </section>

          <section>
            <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: 700, marginBottom: '16px' }}>3. Data Security</h2>
            <p>We implement industry-standard security measures to protect your information from unauthorized access, alteration, or destruction. Your media is stored securely in our private cloud infrastructure (Cloudflare R2 and MongoDB).</p>
          </section>

          <section>
            <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: 700, marginBottom: '16px' }}>4. Third-Party Services</h2>
            <p>Vesper utilizes Clerk for authentication and various AI models for content analysis. These third parties have their own privacy policies governing how they handle your data.</p>
          </section>

          <section style={{ padding: '40px', background: 'rgba(139, 92, 246, 0.05)', borderRadius: '24px', border: '1px solid rgba(139, 92, 246, 0.1)' }}>
            <h2 style={{ color: '#8B5CF6', fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>Contact Our Team</h2>
            <p style={{ fontSize: '14px', color: '#A1A1AA' }}>For any questions regarding your privacy or data, please contact us at support@biblefunland.com</p>
          </section>
        </div>
      </div>
    </main>
  );
}
