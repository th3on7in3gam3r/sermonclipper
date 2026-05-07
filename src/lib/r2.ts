import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';

const accountId = process.env.CF_ACCOUNT_ID;
const bucket = process.env.R2_BUCKET;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const endpoint = process.env.R2_ENDPOINT || `https://${accountId}.r2.cloudflarestorage.com`;

if (!accountId || !bucket || !accessKeyId || !secretAccessKey) {
  console.warn('[R2] Cloudflare R2 environment variables are not fully configured. R2 upload/download helpers will be disabled.');
}

export const r2Client = new S3Client({
  endpoint,
  region: 'auto',
  credentials: {
    accessKeyId: accessKeyId || '',
    secretAccessKey: secretAccessKey || '',
  },
});

export function getR2ObjectUrl(key: string) {
  return `${endpoint}/${bucket}/${encodeURIComponent(key)}`;
}

export async function uploadBufferToR2(key: string, buffer: Uint8Array, contentType = 'application/octet-stream') {
  if (!accountId || !bucket || !accessKeyId || !secretAccessKey) {
    throw new Error('Missing Cloudflare R2 credentials');
  }

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await r2Client.send(command);
  return getR2ObjectUrl(key);
}

export async function getObjectFromR2(key: string) {
  if (!accountId || !bucket || !accessKeyId || !secretAccessKey) {
    throw new Error('Missing Cloudflare R2 credentials');
  }

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  const response = await r2Client.send(command);
  return response.Body;
}

export async function deleteObjectFromR2(key: string) {
  if (!accountId || !bucket || !accessKeyId || !secretAccessKey) {
    throw new Error('Missing Cloudflare R2 credentials');
  }

  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  await r2Client.send(command);
}
