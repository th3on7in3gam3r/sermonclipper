import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import {
  OG_IMAGE_PATH,
  SITE_DESCRIPTION,
  SITE_TITLE,
  SITE_URL,
} from '@/lib/siteConfig';

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter',
  display: 'swap',
});

const outfit = Outfit({ 
  subsets: ["latin"],
  variable: '--font-outfit',
  display: 'swap',
});

import { ClerkProvider } from '@clerk/nextjs';
import { Toaster } from 'react-hot-toast';
import { Suspense } from 'react';
import AnalyticsProvider from '@/components/providers/AnalyticsProvider';
import VesperErrorBoundary from '@/components/shared/VesperErrorBoundary';
import CookieConsent from '@/components/consent/CookieConsent';
import { vesperClerkAppearance, vesperClerkLocalization } from '@/lib/clerkAppearance';

let hasWarnedMissingClerkKey = false;

export const viewport: Viewport = {
  themeColor: '#0A0A0F',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  manifest: '/manifest.webmanifest',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: 'Vesper Studio',
    type: 'website',
    images: [
      {
        url: OG_IMAGE_PATH,
        width: 1200,
        height: 630,
        alt: SITE_TITLE,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE_PATH],
  },
  icons: {
    icon: '/favicon.png',
    apple: '/vesper-logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev && !clerkPublishableKey && !hasWarnedMissingClerkKey) {
    // Dev-only startup warning to avoid silent auth failures on localhost.
    console.warn(
      '[Auth] NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is missing. Clerk auth modals will not initialize in development.'
    );
    hasWarnedMissingClerkKey = true;
  }

  return (
    <ClerkProvider
      publishableKey={clerkPublishableKey}
      appearance={vesperClerkAppearance}
      localization={vesperClerkLocalization}
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard?onboarding=1"
    >
      <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
        <head>
          <link rel="icon" href="/favicon.png" />
          <link rel="shortcut icon" href="/favicon.png" />
          <link rel="apple-touch-icon" href="/vesper-logo.png" />
          <link rel="preload" href="/vesper-logo.png" as="image" type="image/png" />
        </head>
        <body className="antialiased">
          <Suspense fallback={null}>
            <AnalyticsProvider>
              <VesperErrorBoundary>
                <Toaster 
            position="bottom-center"
            toastOptions={{
              style: {
                background: '#1A1A1A',
                color: '#fff',
                border: '1px solid #333',
                borderRadius: '99px',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: 500,
              },
              success: {
                iconTheme: {
                  primary: '#8B5CF6',
                  secondary: '#fff',
                },
              },
            }}
          />
          {children}
                <CookieConsent />
              </VesperErrorBoundary>
            </AnalyticsProvider>
          </Suspense>
        </body>
      </html>
    </ClerkProvider>
  );
}
