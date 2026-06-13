'use client';

import { useEffect, useState } from 'react';

const RULES = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One number', test: (p: string) => /\d/.test(p) },
  { label: 'One symbol', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

function scorePassword(password: string) {
  const passed = RULES.filter((r) => r.test(password)).length;
  if (!password) return 0;
  if (passed <= 1) return 1;
  if (passed === 2) return 2;
  if (passed === 3) return 3;
  return 4;
}

const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLORS = ['', '#EF4444', '#F59E0B', '#8B5CF6', '#10B981'];

/** Live password strength feedback for Clerk sign-up forms. */
export default function SignUpPasswordStrength() {
  const [password, setPassword] = useState('');

  useEffect(() => {
    const onInput = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target?.name === 'password' || target?.autocomplete === 'new-password') {
        setPassword(target.value);
      }
    };
    document.addEventListener('input', onInput, true);
    return () => document.removeEventListener('input', onInput, true);
  }, []);

  const score = scorePassword(password);
  if (!password) return null;

  return (
    <div className="signup-password-strength" aria-live="polite">
      <div className="signup-password-strength-bar" role="progressbar" aria-valuenow={score} aria-valuemin={0} aria-valuemax={4}>
        {[1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className="signup-password-strength-segment"
            style={{ background: i <= score ? STRENGTH_COLORS[score] : 'rgba(255,255,255,0.08)' }}
          />
        ))}
      </div>
      <p className="signup-password-strength-label" style={{ color: STRENGTH_COLORS[score] }}>
        {STRENGTH_LABELS[score]}
      </p>
      <ul className="signup-password-strength-rules">
        {RULES.map((rule) => (
          <li key={rule.label} style={{ color: rule.test(password) ? '#10B981' : '#71717A' }}>
            {rule.test(password) ? '✓' : '○'} {rule.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
