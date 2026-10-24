import 'server-only';
import { OAuth2Client, type Credentials } from 'google-auth-library';
import { youtube, type youtube_v3 } from '@googleapis/youtube';
import { youtubeAnalytics, type youtubeAnalytics_v2 } from '@googleapis/youtubeanalytics';

/**
 * Google OAuth + YouTube clients.
 *
 * Always create a NEW OAuth2Client per request. A shared module-level client
 * whose credentials are swapped with `setCredentials()` is unsafe: two
 * concurrent requests interleave across `await`s, so one user's call can run
 * with another user's token.
 */

function redirectUri() {
  const base = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || '';
  return `${base}/api/youtube/callback`;
}

export function createOAuthClient(tokens?: Credentials | Record<string, unknown>): OAuth2Client {
  const client = new OAuth2Client({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: redirectUri(),
  });
  if (tokens) client.setCredentials(tokens as Credentials);
  return client;
}

export function youtubeFor(tokens: Credentials | Record<string, unknown>): youtube_v3.Youtube {
  return youtube({ version: 'v3', auth: createOAuthClient(tokens) });
}

export function youtubeAnalyticsFor(
  tokens: Credentials | Record<string, unknown>
): youtubeAnalytics_v2.Youtubeanalytics {
  return youtubeAnalytics({ version: 'v2', auth: createOAuthClient(tokens) });
}
