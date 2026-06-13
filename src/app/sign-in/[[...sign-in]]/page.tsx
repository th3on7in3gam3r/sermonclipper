import { SignIn } from '@clerk/nextjs';
import AuthPageShell from '@/components/auth/AuthPageShell';
import { vesperClerkAppearance } from '@/lib/clerkAppearance';

export default function SignInPage() {
  return (
    <AuthPageShell>
      <SignIn
        appearance={vesperClerkAppearance}
        forceRedirectUrl="/dashboard"
        signUpForceRedirectUrl="/dashboard?onboarding=1"
        fallbackRedirectUrl="/dashboard"
      />
    </AuthPageShell>
  );
}
