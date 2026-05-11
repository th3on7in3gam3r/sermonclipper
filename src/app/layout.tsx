import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

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
import { dark } from '@clerk/themes';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: "Vesper | Cinematic Kingdom Media",
  description: "Neural-powered sermon harvesting and social media kit generation.",
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
  return (
    <ClerkProvider 
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "pk_live_Y2xlcmsudmVzcGVyLmJpYmxlZnVubGFuZC5jb20k"}
      appearance={{ baseTheme: dark }}
    >
      <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
        <head>
          <meta
            httpEquiv="Content-Security-Policy"
            content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://*.clerk.accounts.dev https://clerk.vesper.biblefunland.com https://accounts.vesper.biblefunland.com https://challenges.cloudflare.com; connect-src 'self' https://*.clerk.accounts.dev https://clerk.vesper.biblefunland.com https://accounts.vesper.biblefunland.com https://*.mongodb.net; img-src 'self' data: https://img.clerk.com https://images.clerk.dev; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; frame-src 'self' https://challenges.cloudflare.com https://clerk.vesper.biblefunland.com https://accounts.vesper.biblefunland.com; worker-src 'self' blob:;"
          />
        </head>
        <body className="antialiased">
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
        </body>
      </html>
    </ClerkProvider>
  );
}
