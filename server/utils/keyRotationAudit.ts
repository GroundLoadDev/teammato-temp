/**
 * Key Rotation Audit & Policy
 * 
 * Tracks key rotation events for compliance and security monitoring.
 */

export type KeyRotationEventType = 
  | 'MASTER_KEY_ROTATION_INITIATED'
  | 'MASTER_KEY_ROTATION_SUCCESS'
  | 'MASTER_KEY_ROTATION_FAILED'
  | 'DEK_ACCESS';

export interface KeyRotationEvent {
  type: KeyRotationEventType;
  orgId: string;
  userId?: string;
  error?: string;
  timestamp: string;
  details?: Record<string, any>;
}

// In-memory audit trail (could be replaced with database or external audit service)
const auditTrail: KeyRotationEvent[] = [];
const MAX_AUDIT_ENTRIES = 10000;

/**
 * Log a key rotation event
 */
export function logKeyRotationEvent(event: Omit<KeyRotationEvent, 'timestamp'>): void {
  const fullEvent: KeyRotationEvent = {
    ...event,
    timestamp: new Date().toISOString()
  };

  // Add to audit trail
  auditTrail.push(fullEvent);

  // Trim if exceeds max
  if (auditTrail.length > MAX_AUDIT_ENTRIES) {
    auditTrail.shift();
  }

  // Structured logging for compliance
  const logLevel = getLogLevel(event.type);
  const logData = {
    ...fullEvent,
    auditType: 'KEY_ROTATION'
  };

  switch (logLevel) {
    case 'CRITICAL':
      console.error('[KEY ROTATION AUDIT - CRITICAL]', JSON.stringify(logData));
      break;
    case 'ERROR':
      console.error('[KEY ROTATION AUDIT - ERROR]', JSON.stringify(logData));
      break;
    case 'WARN':
      console.warn('[KEY ROTATION AUDIT - WARN]', JSON.stringify(logData));
      break;
    case 'INFO':
      console.log('[KEY ROTATION AUDIT - INFO]', JSON.stringify(logData));
      break;
  }
}

/**
 * Get log level for event type
 */
function getLogLevel(type: KeyRotationEventType): 'CRITICAL' | 'ERROR' | 'WARN' | 'INFO' {
  switch (type) {
    case 'MASTER_KEY_ROTATION_FAILED':
      return 'CRITICAL';
    case 'MASTER_KEY_ROTATION_INITIATED':
      return 'WARN';
    case 'MASTER_KEY_ROTATION_SUCCESS':
      return 'INFO';
    case 'DEK_ACCESS':
      return 'INFO';
    default:
      return 'INFO';
  }
}

/**
 * Get audit trail for an org
 */
export function getOrgRotationHistory(orgId: string): KeyRotationEvent[] {
  return auditTrail.filter(event => event.orgId === orgId);
}

/**
 * Get all rotation events
 */
export function getAllRotationEvents(): KeyRotationEvent[] {
  return [...auditTrail];
}

/**
 * Get rotation statistics
 */
export function getRotationStats(): {
  totalRotations: number;
  successfulRotations: number;
  failedRotations: number;
  lastRotation?: KeyRotationEvent;
} {
  const successes = auditTrail.filter(e => e.type === 'MASTER_KEY_ROTATION_SUCCESS');
  const failures = auditTrail.filter(e => e.type === 'MASTER_KEY_ROTATION_FAILED');
  const lastRotation = auditTrail.filter(e => 
    e.type === 'MASTER_KEY_ROTATION_SUCCESS' || e.type === 'MASTER_KEY_ROTATION_FAILED'
  ).pop();

  return {
    totalRotations: successes.length + failures.length,
    successfulRotations: successes.length,
    failedRotations: failures.length,
    lastRotation
  };
}

/**
 * Key Rotation Policy
 * 
 * Recommended rotation schedule:
 * - Master Key (MEK): Every 90 days or when compromised
 * - DEK: Only when org-specific compromise suspected
 * 
 * Rotation triggers:
 * 1. Scheduled maintenance (quarterly)
 * 2. Security incident response
 * 3. Compliance requirements
 * 4. Key compromise detection
 */
export const KEY_ROTATION_POLICY = {
  MASTER_KEY_ROTATION_DAYS: 90,
  DEK_ROTATION_DAYS: 365, // Rarely rotated due to re-encryption cost
  REQUIRE_ADMIN_APPROVAL: true,
  ALLOW_EMERGENCY_ROTATION: true
} as const;
