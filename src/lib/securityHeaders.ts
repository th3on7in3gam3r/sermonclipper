import type { NextRequest, NextResponse } from 'next/server';
import { normalizeCdnHost } from '@/lib/cdnHost';

const CDN_HOST = normalizeCdnHost(process.env.BUNNY_CDN_HOST);
const isProd = process.env.NODE_ENV === 'production';

export function applySecurityHeaders(response: NextResponse, request?: NextRequest): NextResponse {
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  if (isProd && request?.nextUrl.protocol === 'https:') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  const cdnSrc = CDN_HOST ? ` https://${CDN_HOST}` : '';
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://unpkg.com https://*.clerk.accounts.dev https://clerk.vesper.biblefunland.com https://accounts.vesper.biblefunland.com https://challenges.cloudflare.com https://www.youtube.com https://s.ytimg.com https://vercel.live https://*.vercel.live https://us.i.posthog.com https://us-assets.i.posthog.com https://*.sentry.io",
    "connect-src 'self' blob: https://unpkg.com https://*.clerk.accounts.dev https://clerk.vesper.biblefunland.com https://accounts.vesper.biblefunland.com https://*.mongodb.net https://vercel.live https://*.r2.cloudflarestorage.com https://us.i.posthog.com https://us-assets.i.posthog.com https://api.stripe.com https://*.sentry.io",
    `img-src 'self' data: blob: https://img.clerk.com https://images.clerk.dev https://i.ytimg.com https://img.youtube.com https://oaidalleapiprodscus.blob.core.windows.net https://*.r2.cloudflarestorage.com https://*.r2.dev${cdnSrc}`,
    `media-src 'self' blob: https://*.r2.cloudflarestorage.com https://*.r2.dev https://shotstack-api-v1-output.s3-ap-southeast-2.amazonaws.com${cdnSrc}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "frame-src 'self' https://challenges.cloudflare.com https://clerk.vesper.biblefunland.com https://accounts.vesper.biblefunland.com https://vesper.biblefunland.com https://www.youtube.com https://*.youtube.com https://vercel.live https://js.stripe.com",
    "worker-src 'self' blob:",
  ].join('; ');

  response.headers.set('Content-Security-Policy', csp);
  return response;
}
