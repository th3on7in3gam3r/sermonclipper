'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SignUp } from '@clerk/nextjs';
import AuthPageShell from '@/components/auth/AuthPageShell';
import SignUpPasswordStrength from '@/components/auth/SignUpPasswordStrength';
import { vesperClerkAppearance } from '@/lib/clerkAppearance';

const TERMS_KEY = 'vesper_signup_terms_accepted';

function readTermsAccepted(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.location.hash.includes('sso-callback')) return true;
  return sessionStorage.getItem(TERMS_KEY) === '1';
}

function isSsoCallback(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.hash.includes('sso-callback');
}

export default function SignUpPage() {
  const [acceptedTerms, setAcceptedTerms] = useState(readTermsAccepted);
  const signUpActive = acceptedTerms || isSsoCallback();

  const handleTermsChange = (checked: boolean) => {
    setAcceptedTerms(checked);
    if (checked) sessionStorage.setItem(TERMS_KEY, '1');
    else sessionStorage.removeItem(TERMS_KEY);
  };

  return (
    <AuthPageShell>
      <label
        className="signup-terms"
        style={{
          display: 'flex',
          gap: '10px',
          alignItems: 'flex-start',
          marginBottom: '16px',
          fontSize: '13px',
          color: 'var(--text-muted)',
        }}
      >
        <input
          type="checkbox"
          checked={acceptedTerms}
          onChange={(e) => handleTermsChange(e.target.checked)}
        />
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
      {!signUpActive && (
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '16px' }}>
          Accept the terms above to create your account.
        </p>
      )}
      {/* Keep SignUp mounted so Google/OAuth sso-callback can finish after redirect. */}
      <div
        style={{
          pointerEvents: signUpActive ? 'auto' : 'none',
          opacity: signUpActive ? 1 : 0,
          maxHeight: signUpActive ? 'none' : 0,
          overflow: signUpActive ? 'visible' : 'hidden',
        }}
      >
        <SignUp
          appearance={vesperClerkAppearance}
          forceRedirectUrl="/dashboard?onboarding=1"
          signInForceRedirectUrl="/dashboard"
          fallbackRedirectUrl="/dashboard?onboarding=1"
        />
      </div>
      <SignUpPasswordStrength />
    </AuthPageShell>
  );
}
