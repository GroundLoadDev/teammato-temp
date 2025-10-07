import { storage } from '../storage';
import type { InsertStateTransitionAudit } from '@shared/schema';

/**
 * Log a state transition for topics, threads, or other entities
 */
export async function logStateTransition(params: {
  orgId: string;
  targetType: 'topic' | 'thread' | 'theme' | 'suggestion';
  targetId: string;
  fromState: string | null;
  toState: string;
  actorUserId?: string;
  reason?: string;
  metadata?: Record<string, any>;
}): Promise<void> {
  try {
    const audit: InsertStateTransitionAudit = {
      orgId: params.orgId,
      targetType: params.targetType,
      targetId: params.targetId,
      fromState: params.fromState || undefined,
      toState: params.toState,
      actorUserId: params.actorUserId || undefined,
      reason: params.reason,
      metadata: params.metadata || undefined,
    };

    await storage.createStateTransitionAudit(audit);
  } catch (error) {
    console.error('[State Transition Logger] Failed to log transition:', error);
    // Don't throw - logging should not break the main flow
  }
}

/**
 * Log topic status change
 */
export async function logTopicStatusChange(
  topicId: string,
  orgId: string,
  fromStatus: string | null,
  toStatus: string,
  actorUserId?: string,
  reason?: string
): Promise<void> {
  await logStateTransition({
    orgId,
    targetType: 'topic',
    targetId: topicId,
    fromState: fromStatus,
    toState: toStatus,
    actorUserId,
    reason,
    metadata: { statusChange: true }
  });
}
