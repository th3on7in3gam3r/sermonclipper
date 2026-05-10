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
  title: "Vesper - Cinematic Sermon Media Kits",
  description: "Transform your sermons into high-impact social media clips and professional art with the power of AI.",
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
