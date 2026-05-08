import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

const accountId = process.env.CF_ACCOUNT_ID;
const bucket = process.env.R2_BUCKET;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const endpoint = process.env.R2_ENDPOINT || `https://${accountId}.r2.cloudflarestorage.com`;

let r2Client: S3Client | null = null;

function getR2Client() {
  if (!accountId || !bucket || !accessKeyId || !secretAccessKey) {
    console.warn('[R2] Cloudflare R2 environment variables are not fully configured. R2 upload/download helpers will be disabled.');
    return null;
  }

  if (!r2Client) {
    r2Client = new S3Client({
      endpoint,
      region: 'auto',
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  return r2Client;
}

export function getR2ObjectUrl(key: string) {
  if (!accountId || !bucket) {
    throw new Error('Missing Cloudflare R2 configuration');
  }
  return `${endpoint}/${bucket}/${encodeURIComponent(key)}`;
}

export async function uploadBufferToR2(key: string, buffer: Uint8Array, contentType = 'application/octet-stream') {
  const client = getR2Client();
  if (!client) throw new Error('Missing Cloudflare R2 credentials');

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await client.send(command);
  return getR2ObjectUrl(key);
}

export async function uploadStreamToR2(key: string, stream: Readable, contentType = 'application/octet-stream') {
  const client = getR2Client();
  if (!client) throw new Error('Missing Cloudflare R2 credentials');

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: stream,
    ContentType: contentType,
  });

  await client.send(command);
  return getR2ObjectUrl(key);
}

export async function getObjectFromR2(key: string) {
  const client = getR2Client();
  if (!client) {
    throw new Error('Missing Cloudflare R2 credentials');
  }

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  const response = await client.send(command);
  return response.Body;
}

export async function deleteObjectFromR2(key: string) {
  const client = getR2Client();
  if (!client) {
    throw new Error('Missing Cloudflare R2 credentials');
  }

  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  await client.send(command);
}
