import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Upload } from '@aws-sdk/lib-storage';
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
      forcePathStyle: true, // R2 requires path-style: account.r2.../bucket/key
    });
  }

  return r2Client;
}

export function getR2ObjectUrl(key: string) {
  if (!accountId || !bucket) {
    throw new Error('Missing Cloudflare R2 configuration');
  }
  // Do NOT encodeURIComponent — slashes in the key must remain as literal /
  // encodeURIComponent would produce %2F which then gets double-encoded when stored/retrieved
  return `${endpoint}/${bucket}/${key}`;
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

/**
 * Generate a presigned PUT URL for direct browser-to-R2 uploads.
 * Bypasses the server entirely — no proxy size limits.
 */
export async function generatePresignedUploadUrl(key: string, contentType = 'video/mp4', expiresIn = 3600) {
  if (!accountId || !bucket || !accessKeyId || !secretAccessKey) {
    throw new Error('Missing Cloudflare R2 credentials');
  }

  // Use a dedicated client with checksum disabled for presigned URLs.
  // Newer AWS SDK adds x-amz-checksum-crc32 which R2 doesn't support in presigned context.
  const presignClient = new S3Client({
    endpoint,
    region: 'auto',
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true, // R2 requires path-style: account.r2.../bucket/key
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  });

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });

  const url = await getSignedUrl(presignClient, command, { expiresIn });
  return { uploadUrl: url, publicUrl: getR2ObjectUrl(key) };
}



/**
 * Generate a presigned GET URL so external services (e.g. Shotstack) can
 * fetch a private R2 object without needing credentials.
 */
export async function generatePresignedGetUrl(key: string, expiresIn = 7200) {
  if (!accountId || !bucket || !accessKeyId || !secretAccessKey) {
    throw new Error('Missing Cloudflare R2 credentials');
  }

  const presignClient = new S3Client({
    endpoint,
    region: 'auto',
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  });

  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(presignClient, command, { expiresIn });
}

export async function uploadStreamToR2(key: string, stream: Readable, contentType = 'application/octet-stream') {
  const client = getR2Client();
  if (!client) throw new Error('Missing Cloudflare R2 credentials');

  const parallelUploads3 = new Upload({
    client,
    params: {
      Bucket: bucket,
      Key: key,
      Body: stream,
      ContentType: contentType,
    },
    // Keep part size small to save memory on Koyeb
    partSize: 5 * 1024 * 1024, // 5MB
    queueSize: 4, // concurrent parts
  });

  await parallelUploads3.done();
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
