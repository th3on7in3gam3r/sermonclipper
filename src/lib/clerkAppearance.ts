import { dark } from '@clerk/themes';

/** Vesper-branded Clerk modals, UserButton popover, and profile UI. */
export const vesperClerkAppearance = {
  baseTheme: dark,
  variables: {
    colorPrimary: '#8B5CF6',
    colorDanger: '#EF4444',
    colorSuccess: '#10B981',
    colorWarning: '#F4B942',
    colorBackground: '#14141D',
    colorInputBackground: '#212130',
    colorInputText: '#FFFFFF',
    colorText: '#FFFFFF',
    colorTextSecondary: '#E5E7EB',
    colorNeutral: '#D1D5DB',
    borderRadius: '12px',
    fontFamily: 'var(--font-outfit), Outfit, sans-serif',
    fontSize: '14px',
  },
  elements: {
    rootBox: { width: '100%' },
    card: {
      background: '#20202D',
      border: '1px solid rgba(139, 92, 246, 0.25)',
      boxShadow: '0 40px 120px rgba(0, 0, 0, 0.85), 0 0 80px rgba(139, 92, 246, 0.12)',
    },
    modalContent: {
      background: '#20202D',
      border: '1px solid rgba(139, 92, 246, 0.2)',
    },
    modalCloseButton: {
      color: '#D4D4D8',
    },
    headerTitle: {
      fontWeight: '800',
      letterSpacing: '-0.02em',
      color: '#FFFFFF',
    },
    headerSubtitle: {
      color: '#E5E7EB',
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
      color: '#D4D4D8',
    },
    formFieldLabel: {
      color: '#E4E4E7',
      fontWeight: '700',
    },
    formFieldInput: {
      background: '#242436',
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
        color: '#C4C4CF',
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
      color: '#E5E7EB',
    },
    footer: {
      background: 'transparent',
    },
    identityPreview: {
      background: 'rgba(139, 92, 246, 0.08)',
      border: '1px solid rgba(139, 92, 246, 0.2)',
    },
    userButtonPopoverCard: {
      background: '#20202D',
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
      background: '#20202D',
    },
    userPreviewMainIdentifier: {
      color: '#FFFFFF',
      fontWeight: '800',
    },
    userPreviewSecondaryIdentifier: {
      color: '#E5E7EB',
    },
    navbar: {
      background: '#1A1A24',
      borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
    },
    navbarButton: {
      color: '#E5E7EB',
      '&:hover': {
        color: '#FFFFFF',
      },
    },
    navbarButtonIcon: {
      color: '#E5E7EB',
    },
    navbarButtonText: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    profileSectionTitleText: {
      color: '#FFFFFF',
      fontWeight: '800',
    },
    profileSectionContent: {
      color: '#F3F4F6',
    },
    accordionTriggerButton: {
      color: '#FFFFFF',
    },
    badge: {
      color: '#FFFFFF',
      background: 'rgba(139, 92, 246, 0.2)',
    },
    tableHead: {
      color: '#FFFFFF',
    },
    tableRow: {
      color: '#F3F4F6',
    },
    pageScrollBox: {
      background: '#14141D',
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
