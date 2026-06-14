import { createHash, randomBytes } from 'crypto';
import connectDB from '@/lib/mongodb';
import ApiKey from '@/models/ApiKey';
import { logAuditEvent } from '@/lib/auditLog';

export type ApiKeyMode = 'live' | 'test';

const PREFIX = { live: 'vsp_live_', test: 'vsp_test_' } as const;

export function hashApiKey(rawKey: string): string {
  return createHash('sha256').update(rawKey).digest('hex');
}

export function parseApiKeyPrefix(rawKey: string): ApiKeyMode | null {
  if (rawKey.startsWith(PREFIX.live)) return 'live';
  if (rawKey.startsWith(PREFIX.test)) return 'test';
  return null;
}

/** Generate a new API key — raw value is returned once; only hash is stored. */
export async function createApiKey(
  userId: string,
  options: { name: string; mode?: ApiKeyMode }
): Promise<{ id: string; key: string; prefix: string; last4: string; mode: ApiKeyMode; name: string }> {
  await connectDB();
  const mode = options.mode ?? 'live';
  const secret = randomBytes(24).toString('base64url');
  const rawKey = `${PREFIX[mode]}${secret}`;
  const keyHash = hashApiKey(rawKey);
  const last4 = secret.slice(-4);

  const doc = await ApiKey.create({
    userId,
    name: options.name.trim() || 'Default',
    keyHash,
    prefix: PREFIX[mode],
    last4,
    mode,
  });

  await logAuditEvent({
    userId,
    actorId: userId,
    eventType: 'api_key.created',
    metadata: { keyId: String(doc._id), name: doc.name, mode },
  });

  return {
    id: String(doc._id),
    key: rawKey,
    prefix: PREFIX[mode],
    last4,
    mode,
    name: doc.name,
  };
}

export async function revokeApiKey(userId: string, keyId: string): Promise<boolean> {
  await connectDB();
  const result = await ApiKey.deleteOne({ _id: keyId, userId });
  if (result.deletedCount) {
    await logAuditEvent({
      userId,
      actorId: userId,
      eventType: 'api_key.revoked',
      metadata: { keyId },
    });
  }
  return result.deletedCount > 0;
}

export async function listApiKeys(userId: string) {
  await connectDB();
  const keys = await ApiKey.find({ userId }).sort({ createdAt: -1 }).lean();
  return keys.map((k) => ({
    id: String(k._id),
    name: k.name,
    prefix: k.prefix,
    last4: k.last4,
    mode: k.mode,
    createdAt: k.createdAt,
    lastUsedAt: k.lastUsedAt,
  }));
}

export async function authenticateApiKey(rawKey: string) {
  if (!rawKey || (!rawKey.startsWith(PREFIX.live) && !rawKey.startsWith(PREFIX.test))) {
    return null;
  }
  await connectDB();
  const keyHash = hashApiKey(rawKey);
  const doc = await ApiKey.findOne({ keyHash }).lean();
  if (!doc) return null;

  await ApiKey.updateOne({ _id: doc._id }, { $set: { lastUsedAt: new Date() } });

  return {
    keyId: String(doc._id),
    userId: doc.userId,
    mode: doc.mode as ApiKeyMode,
    name: doc.name,
  };
}
