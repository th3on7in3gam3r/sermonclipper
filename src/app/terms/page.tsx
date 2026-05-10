'use client';

import Link from 'next/link';

export default function TermsOfService() {
  return (
    <main style={{ minHeight: '100vh', padding: '120px 20px', background: '#0A0A0F', color: '#fff', position: 'relative' }}>
      <div className="vesper-bg" />
      
      <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
        <Link href="/" style={{ textDecoration: 'none', color: '#8B5CF6', fontSize: '14px', fontWeight: 700, marginBottom: '40px', display: 'block' }}>
          ← BACK TO HOME
        </Link>
        
        <h1 style={{ fontSize: '48px', fontWeight: 900, marginBottom: '24px', letterSpacing: '-0.04em' }}>TERMS OF <span style={{ color: '#8B5CF6' }}>SERVICE</span></h1>
        <p style={{ color: '#A1A1AA', marginBottom: '48px' }}>Last Updated: May 10, 2026</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', fontSize: '16px', lineHeight: '1.8', color: '#D1D5DB' }}>
          <section>
            <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: 700, marginBottom: '16px' }}>1. Acceptance of Terms</h2>
            <p>By accessing Vesper, you agree to be bound by these Terms of Service. Vesper provides cinematic media tools for the purpose of ministry outreach and sermon content distribution.</p>
          </section>

          <section>
            <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: 700, marginBottom: '16px' }}>2. Use of AI Services</h2>
            <p>Vesper uses advanced AI models to analyze sermon content. While we strive for accuracy, AI-generated content may require human oversight. Users are responsible for reviewing and approving all social media assets before distribution.</p>
          </section>

          <section>
            <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: 700, marginBottom: '16px' }}>3. Content Ownership</h2>
            <p>You retain full ownership of the original sermon content processed through Vesper. Vesper claims no ownership over the intellectual property of the ministries using the platform.</p>
          </section>

          <section>
            <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: 700, marginBottom: '16px' }}>4. Prohibited Usage</h2>
            <p>Users agree not to use Vesper for any unlawful purposes or to process content that violates ethical standards or copyright laws. Vesper reserves the right to terminate access for any violation of these terms.</p>
          </section>

          <section style={{ padding: '40px', background: 'rgba(139, 92, 246, 0.05)', borderRadius: '24px', border: '1px solid rgba(139, 92, 246, 0.1)' }}>
            <h2 style={{ color: '#8B5CF6', fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>Legal Inquiries</h2>
            <p style={{ fontSize: '14px', color: '#A1A1AA' }}>For formal legal inquiries or usage questions, please reach out to admin@biblefunland.com</p>
          </section>
        </div>
      </div>
    </main>
  );
}
