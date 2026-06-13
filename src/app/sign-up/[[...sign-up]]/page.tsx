import { SignUp } from '@clerk/nextjs';
import AuthPageShell from '@/components/auth/AuthPageShell';
import SignUpPasswordStrength from '@/components/auth/SignUpPasswordStrength';
import { vesperClerkAppearance } from '@/lib/clerkAppearance';

export default function SignUpPage() {
  return (
    <AuthPageShell>
      <SignUp
        appearance={vesperClerkAppearance}
        forceRedirectUrl="/dashboard?onboarding=1"
        signInForceRedirectUrl="/dashboard"
        fallbackRedirectUrl="/dashboard?onboarding=1"
      />
      <SignUpPasswordStrength />
    </AuthPageShell>
  );
}
