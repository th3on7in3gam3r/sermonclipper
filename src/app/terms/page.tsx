'use client';

import Link from 'next/link';
import SiteFooter from '@/components/layout/SiteFooter';
import { SUPPORT_EMAIL } from '@/lib/siteConfig';

export default function TermsOfService() {
  return (
    <main style={{ minHeight: '100vh', padding: '120px 20px', background: '#0A0A0F', color: '#fff', position: 'relative' }}>
      <div className="vesper-bg" />

      <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
        <Link href="/" style={{ textDecoration: 'none', color: '#8B5CF6', fontSize: '14px', fontWeight: 700, marginBottom: '40px', display: 'block' }}>
          ← BACK TO HOME
        </Link>

        <h1 style={{ fontSize: '48px', fontWeight: 900, marginBottom: '24px', letterSpacing: '-0.04em' }}>
          TERMS OF <span style={{ color: '#8B5CF6' }}>SERVICE</span>
        </h1>
        <p style={{ color: '#A1A1AA', marginBottom: '48px' }}>Last Updated: June 13, 2026</p>
        <p style={{ color: '#71717A', fontSize: '14px', marginBottom: '32px' }}>
          This is a starting structure only. Have a qualified attorney review before launch.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', fontSize: '16px', lineHeight: '1.8', color: '#D1D5DB' }}>
          <section>
            <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: 700, marginBottom: '16px' }}>1. Acceptance of Terms</h2>
            <p>
              By creating an account or using Vesper, you agree to these Terms of Service and our{' '}
              <Link href="/privacy" style={{ color: '#8B5CF6' }}>
                Privacy Policy
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: 700, marginBottom: '16px' }}>2. Acceptable Use</h2>
            <p>You agree not to use Vesper to:</p>
            <ul style={{ marginTop: '12px', paddingLeft: '20px' }}>
              <li>Process copyrighted sermon content without proper rights or permission</li>
              <li>Upload harmful, illegal, abusive, or deceptive content</li>
              <li>Attempt to bypass plan limits, security controls, or rate limits</li>
              <li>Reverse engineer or resell the service without authorization</li>
            </ul>
            <p style={{ marginTop: '12px' }}>
              You are responsible for reviewing all AI-generated clips before publishing.
            </p>
          </section>

          <section>
            <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: 700, marginBottom: '16px' }}>3. Plan Limits</h2>
            <p>
              Each plan includes a monthly clip allowance (see{' '}
              <Link href="/#pricing" style={{ color: '#8B5CF6' }}>
                Pricing
              </Link>
              ). When you exceed your limit, processing is blocked until your quota resets or you upgrade. Unused clips
              do not roll over unless stated in your plan.
            </p>
          </section>

          <section>
            <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: 700, marginBottom: '16px' }}>4. Content Ownership</h2>
            <p>
              You retain ownership of your original sermon content. Vesper claims no ownership over your ministry
              intellectual property. You grant Vesper a limited license to process your content solely to provide the
              service.
            </p>
          </section>

          <section>
            <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: 700, marginBottom: '16px' }}>5. Refund Policy</h2>
            <p>
              Paid subscriptions may be cancelled at any time. Refunds are provided at our discretion for billing errors
              or significant service outages. Contact {SUPPORT_EMAIL} within 14 days of a charge if you believe a refund
              is warranted.
            </p>
          </section>

          <section>
            <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: 700, marginBottom: '16px' }}>6. Limitation of Liability</h2>
            <p>
              Vesper is provided &ldquo;as is.&rdquo; To the maximum extent permitted by law, Vesper and its operators
              are not liable for indirect, incidental, or consequential damages, including lost reach, revenue, or
              ministry outcomes. Our total liability is limited to the amount you paid us in the 12 months before the
              claim.
            </p>
          </section>

          <section>
            <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: 700, marginBottom: '16px' }}>7. Governing Law</h2>
            <p>
              These terms are governed by the laws of the State of Tennessee, United States, without regard to conflict
              of law principles. Disputes shall be resolved in courts located in Tennessee unless otherwise required by
              applicable law.
            </p>
          </section>

          <section style={{ padding: '40px', background: 'rgba(139, 92, 246, 0.05)', borderRadius: '24px', border: '1px solid rgba(139, 92, 246, 0.1)' }}>
            <h2 style={{ color: '#8B5CF6', fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>Legal Inquiries</h2>
            <p style={{ fontSize: '14px', color: '#A1A1AA' }}>
              Questions about these terms:{' '}
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
