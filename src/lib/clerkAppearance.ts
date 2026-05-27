import { dark } from '@clerk/themes';

/** Vesper-branded Clerk modals, UserButton popover, and profile UI. */
export const vesperClerkAppearance = {
  baseTheme: dark,
  variables: {
    colorPrimary: '#8B5CF6',
    colorDanger: '#EF4444',
    colorSuccess: '#10B981',
    colorWarning: '#F4B942',
    colorBackground: '#0A0A0F',
    colorInputBackground: '#1A1A24',
    colorInputText: '#FFFFFF',
    colorText: '#FFFFFF',
    colorTextSecondary: '#A1A1AA',
    colorNeutral: '#71717A',
    borderRadius: '12px',
    fontFamily: 'var(--font-outfit), Outfit, sans-serif',
    fontSize: '14px',
  },
  elements: {
    rootBox: { width: '100%' },
    card: {
      background: '#1A1A24',
      border: '1px solid rgba(139, 92, 246, 0.25)',
      boxShadow: '0 40px 120px rgba(0, 0, 0, 0.85), 0 0 80px rgba(139, 92, 246, 0.12)',
    },
    modalContent: {
      background: '#1A1A24',
      border: '1px solid rgba(139, 92, 246, 0.2)',
    },
    modalCloseButton: {
      color: '#A1A1AA',
    },
    headerTitle: {
      fontWeight: '800',
      letterSpacing: '-0.02em',
      color: '#FFFFFF',
    },
    headerSubtitle: {
      color: '#A1A1AA',
    },
    socialButtonsBlockButton: {
      border: '1px solid rgba(255, 255, 255, 0.15)',
      background: 'rgba(255, 255, 255, 0.04)',
      color: '#FFFFFF',
      '&:hover': {
        background: 'rgba(139, 92, 246, 0.12)',
        borderColor: 'rgba(139, 92, 246, 0.35)',
      },
    },
    dividerLine: {
      background: 'rgba(255, 255, 255, 0.12)',
    },
    dividerText: {
      color: '#71717A',
    },
    formFieldLabel: {
      color: '#E4E4E7',
      fontWeight: '700',
    },
    formFieldInput: {
      background: '#1A1A24',
      border: '1px solid rgba(255, 255, 255, 0.22)',
      boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.25)',
      '&:focus-within': {
        borderColor: 'rgba(139, 92, 246, 0.65)',
        boxShadow: '0 0 0 3px rgba(139, 92, 246, 0.2)',
      },
    },
    formFieldInput__input: {
      color: '#FFFFFF',
      '&::placeholder': {
        color: '#71717A',
      },
    },
    formButtonPrimary: {
      background: '#8B5CF6',
      fontWeight: '800',
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
      fontSize: '13px',
      boxShadow: '0 10px 25px rgba(139, 92, 246, 0.35)',
      '&:hover': {
        background: '#7C3AED',
      },
    },
    footerActionLink: {
      color: '#C4B5FD',
      fontWeight: '700',
    },
    footerActionText: {
      color: '#A1A1AA',
    },
    footer: {
      background: 'transparent',
    },
    identityPreview: {
      background: 'rgba(139, 92, 246, 0.08)',
      border: '1px solid rgba(139, 92, 246, 0.2)',
    },
    userButtonPopoverCard: {
      background: '#1A1A24',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6)',
    },
    userButtonPopoverActionButton: {
      '&:hover': {
        background: 'rgba(139, 92, 246, 0.12)',
      },
    },
    userButtonPopoverActionButtonText: {
      fontWeight: '600',
      color: '#FFFFFF',
    },
    userButtonPopoverFooter: {
      background: 'rgba(255, 255, 255, 0.03)',
      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    },
    userButtonPopoverMain: {
      background: '#1A1A24',
    },
    userPreviewMainIdentifier: {
      color: '#FFFFFF',
      fontWeight: '800',
    },
    userPreviewSecondaryIdentifier: {
      color: '#A1A1AA',
    },
    navbar: {
      background: '#0A0A0F',
      borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
    },
    navbarButton: {
      color: '#A1A1AA',
      '&:hover': {
        color: '#FFFFFF',
      },
    },
    pageScrollBox: {
      background: '#0A0A0F',
    },
  },
} as const;

/** Override Clerk dashboard app name ("SermonClipper") with Vesper branding. */
export const vesperClerkLocalization = {
  signIn: {
    start: {
      title: 'Sign in to Vesper',
      subtitle: 'Welcome back! Please sign in to continue',
    },
  },
  signUp: {
    start: {
      title: 'Create your Vesper account',
      subtitle: 'Welcome! Fill in the details below to get started.',
    },
  },
  userProfile: {
    navbar: {
      title: 'Account',
      description: 'Manage your Vesper profile',
      account: 'Profile',
      security: 'Security',
    },
  },
} as const;
