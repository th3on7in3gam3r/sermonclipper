'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SignUp } from '@clerk/nextjs';
import AuthPageShell from '@/components/auth/AuthPageShell';
import SignUpPasswordStrength from '@/components/auth/SignUpPasswordStrength';
import { vesperClerkAppearance } from '@/lib/clerkAppearance';

export default function SignUpPage() {
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  return (
    <AuthPageShell>
      <label className="signup-terms" style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '16px', fontSize: '13px', color: 'var(--text-muted)' }}>
        <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} />
        <span>
          I agree to the{' '}
          <Link href="/terms" target="_blank" style={{ color: 'var(--secondary)' }}>
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" target="_blank" style={{ color: 'var(--secondary)' }}>
            Privacy Policy
          </Link>
          .
        </span>
      </label>
      {acceptedTerms ? (
        <SignUp
          appearance={vesperClerkAppearance}
          forceRedirectUrl="/dashboard?onboarding=1"
          signInForceRedirectUrl="/dashboard"
          fallbackRedirectUrl="/dashboard?onboarding=1"
        />
      ) : (
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>
          Accept the terms above to create your account.
        </p>
      )}
      <SignUpPasswordStrength />
    </AuthPageShell>
  );
}
