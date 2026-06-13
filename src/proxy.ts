import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { applySecurityHeaders } from '@/lib/securityHeaders';
import { checkApiRateLimit, RATE_LIMIT_MESSAGE } from '@/lib/rateLimit';

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/',
  '/how-it-works',
  '/for-churches',
  '/blog(.*)',
  '/resources(.*)',
  '/privacy',
  '/terms',
  '/api/(.*)',
]);

export const proxy = clerkMiddleware(async (auth, request) => {
  const { userId } = await auth();
  const path = request.nextUrl.pathname;

  if (path.startsWith('/api/')) {
    const limit = await checkApiRateLimit(request, userId);
    if (!limit.success) {
      const res = NextResponse.json({ error: RATE_LIMIT_MESSAGE }, { status: 429 });
      if (limit.retryAfterSec) {
        res.headers.set('Retry-After', String(limit.retryAfterSec));
      }
      return applySecurityHeaders(res, request);
    }
  }

  if (path.startsWith('/admin')) {
    await auth.protect();
  } else if (!isPublicRoute(request)) {
    await auth.protect();
  }

  return applySecurityHeaders(NextResponse.next(), request);
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc|__clerk)(.*)',
  ],
};
