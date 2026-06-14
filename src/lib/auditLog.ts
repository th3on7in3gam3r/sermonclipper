import connectDB from '@/lib/mongodb';
import AuditLog from '@/models/AuditLog';

export type AuditEventType =
  | 'user.login'
  | 'api_key.created'
  | 'api_key.revoked'
  | 'plan.upgraded'
  | 'plan.downgraded'
  | 'subscription.cancelled'
  | 'clip.deleted'
  | 'account.deleted'
  | 'team.member_invited'
  | 'team.member_removed'
  | 'admin.plan_changed'
  | 'moderation.flagged'
  | 'moderation.blocked'
  | 'moderation.approved'
  | 'data.export_requested'
  | 'social.published';

export async function logAuditEvent(event: {
  userId: string;
  actorId?: string;
  eventType: AuditEventType | string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await connectDB();
    await AuditLog.create({
      userId: event.userId,
      actorId: event.actorId ?? event.userId,
      eventType: event.eventType,
      metadata: event.metadata ?? {},
    });
  } catch (err) {
    console.error('[AuditLog] Failed to write:', err);
  }
}

export async function getUserAuditLog(userId: string, days = 90) {
  await connectDB();
  const since = new Date();
  since.setDate(since.getDate() - days);
  const rows = await AuditLog.find({ userId, createdAt: { $gte: since } })
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();
  return rows.map((r) => ({
    id: String(r._id),
    eventType: r.eventType,
    actorId: r.actorId,
    metadata: r.metadata,
    createdAt: r.createdAt,
  }));
}
