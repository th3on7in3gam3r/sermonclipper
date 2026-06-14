import { logAuditEvent } from '@/lib/auditLog';

export async function logSecretAccess(input: {
  secretId: string;
  service: string;
  userId?: string;
}) {
  await logAuditEvent({
    userId: input.userId || 'system',
    actorId: input.userId || 'system',
    eventType: 'secret.accessed',
    metadata: { secretId: input.secretId, service: input.service, at: new Date().toISOString() },
  });
}
