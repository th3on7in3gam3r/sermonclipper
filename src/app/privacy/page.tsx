'use client';

import Link from 'next/link';
import SiteFooter from '@/components/layout/SiteFooter';
import { SUPPORT_EMAIL } from '@/lib/siteConfig';

export default function PrivacyPolicy() {
  return (
    <main style={{ minHeight: '100vh', padding: '120px 20px', background: '#0A0A0F', color: '#fff', position: 'relative' }}>
      <div className="vesper-bg" />

      <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
        <Link href="/" style={{ textDecoration: 'none', color: '#8B5CF6', fontSize: '14px', fontWeight: 700, marginBottom: '40px', display: 'block' }}>
          ← BACK TO HOME
        </Link>

        <h1 style={{ fontSize: '48px', fontWeight: 900, marginBottom: '24px', letterSpacing: '-0.04em' }}>
          PRIVACY <span style={{ color: '#8B5CF6' }}>POLICY</span>
        </h1>
        <p style={{ color: '#A1A1AA', marginBottom: '48px' }}>Last Updated: June 13, 2026</p>
        <p style={{ color: '#71717A', fontSize: '14px', marginBottom: '32px' }}>
          This is a starting structure only. Have a qualified attorney review before launch.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', fontSize: '16px', lineHeight: '1.8', color: '#D1D5DB' }}>
          <section>
            <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: 700, marginBottom: '16px' }}>1. Information We Collect</h2>
            <p>We collect information you provide when you create an account and use Vesper, including:</p>
            <ul style={{ marginTop: '12px', paddingLeft: '20px' }}>
              <li>Email address and account profile (via Clerk authentication)</li>
              <li>Uploaded sermon videos and audio files</li>
              <li>YouTube links you submit for processing</li>
              <li>Clip metadata (titles, speakers, captions, export settings)</li>
              <li>Usage data (clips created, plan tier, feature usage, analytics events if you consent)</li>
              <li>Billing information processed by Stripe (we do not store full card numbers)</li>
            </ul>
          </section>

          <section>
            <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: 700, marginBottom: '16px' }}>2. How We Use Your Information</h2>
            <p>
              We use your data to provide sermon analysis, clip generation, exports, billing, support, and product
              improvements. AI providers analyze sermon content solely to generate clips and related assets for your
              ministry.
            </p>
          </section>

          <section>
            <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: 700, marginBottom: '16px' }}>3. Data Retention</h2>
            <p>
              Source sermon files uploaded to Vesper are retained while your account is active and deleted within{' '}
              <strong>30 days</strong> after you delete them or your account. Clip metadata and billing records may be
              kept longer where required for legal, tax, or fraud-prevention purposes.
            </p>
          </section>

          <section>
            <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: 700, marginBottom: '16px' }}>4. Third-Party Services</h2>
            <p>We share data with service providers only as needed to operate Vesper:</p>
            <ul style={{ marginTop: '12px', paddingLeft: '20px' }}>
              <li><strong>Stripe</strong> — subscription billing and payments</li>
              <li><strong>OpenAI / Google (Gemini)</strong> — sermon transcription and AI analysis</li>
              <li><strong>Cloudflare R2 & Bunny CDN</strong> — secure media storage and delivery</li>
              <li><strong>Clerk</strong> — authentication</li>
              <li><strong>PostHog</strong> — product analytics (only if you accept analytics cookies)</li>
              <li><strong>Resend</strong> — transactional email</li>
              <li><strong>Sentry</strong> — error monitoring (may include technical metadata, not sermon content)</li>
            </ul>
          </section>

          <section>
            <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: 700, marginBottom: '16px' }}>5. Your Rights</h2>
            <p>
              Depending on your location (including GDPR and CCPA), you may request access, correction, export, or
              deletion of your personal data. You can export your data or permanently delete your account from{' '}
              <Link href="/dashboard/settings" style={{ color: '#8B5CF6' }}>
                Account Settings
              </Link>{' '}
              using &ldquo;Export My Data&rdquo; or &ldquo;Delete My Account.&rdquo; We aim to complete deletion
              requests within 30 days.
            </p>
          </section>

          <section>
            <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: 700, marginBottom: '16px' }}>6. Cookies</h2>
            <p>
              We use essential cookies for authentication and security. Analytics cookies are optional — use the cookie
              banner or footer link to manage preferences.
            </p>
          </section>

          <section style={{ padding: '40px', background: 'rgba(139, 92, 246, 0.05)', borderRadius: '24px', border: '1px solid rgba(139, 92, 246, 0.1)' }}>
            <h2 style={{ color: '#8B5CF6', fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>Privacy Contact</h2>
            <p style={{ fontSize: '14px', color: '#A1A1AA' }}>
              For privacy requests, email{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: '#A78BFA' }}>
                {SUPPORT_EMAIL}
              </a>
            </p>
          </section>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
