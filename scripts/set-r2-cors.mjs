/**
 * One-time script to set CORS rules on the R2 bucket.
 * Run with: node scripts/set-r2-cors.mjs
 *
 * Set these env vars first (or add them to .env.local):
 *   CF_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET
 */
import { S3Client, PutBucketCorsCommand } from '@aws-sdk/client-s3';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Manually parse .env.local so we don't need dotenv
try {
  const envPath = resolve(__dirname, '../.env.local');
  const lines = readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
} catch {
  // .env.local not found — rely on environment variables already set
}

const accountId = process.env.CF_ACCOUNT_ID;
const bucket = process.env.R2_BUCKET || 'sermon-clipper';
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

if (!accountId || !accessKeyId || !secretAccessKey) {
  console.error('❌ Missing R2 credentials.');
  console.error('   Add to .env.local: CF_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY');
  process.exit(1);
}

const client = new S3Client({
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  region: 'auto',
  credentials: { accessKeyId, secretAccessKey },
});

const command = new PutBucketCorsCommand({
  Bucket: bucket,
  CORSConfiguration: {
    CORSRules: [
      {
        AllowedOrigins: [
          'https://vesper.biblefunland.com',
          'http://localhost:3000',
          'http://localhost:3001',
        ],
        AllowedMethods: ['GET', 'PUT', 'HEAD'],
        AllowedHeaders: ['*'],
        ExposeHeaders: ['ETag', 'Content-Length', 'Accept-Ranges', 'Content-Range'],
        MaxAgeSeconds: 3600,
      },
    ],
  },
});

try {
  await client.send(command);
  console.log(`✅ CORS configured on bucket "${bucket}"`);
  console.log('   Allowed origins: vesper.biblefunland.com, localhost:3000, localhost:3001');
} catch (err) {
  console.error('❌ Failed to set CORS:', err.message);
  process.exit(1);
}
