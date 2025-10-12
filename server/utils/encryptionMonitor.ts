/**
 * Encryption Monitoring & Alerting
 * 
 * Tracks encryption operations, failures, and key issues.
 * Provides structured logging for operational monitoring.
 */

export type EncryptionEventType = 
  | 'ENCRYPTION_SUCCESS'
  | 'DECRYPTION_SUCCESS'
  | 'KEY_MISSING'
  | 'KEY_LOAD_FAILED'
  | 'ENCRYPTION_FAILED'
  | 'DECRYPTION_FAILED'
  | 'DEK_GENERATION_FAILED';

export interface EncryptionEvent {
  type: EncryptionEventType;
  orgId?: string;
  threadId?: string;
  error?: string;
  timestamp: string;
}

// In-memory tracking for basic metrics (could be replaced with external monitoring)
const eventCounts = new Map<EncryptionEventType, number>();

/**
 * Log an encryption-related event with structured data
 */
export function logEncryptionEvent(event: Omit<EncryptionEvent, 'timestamp'>): void {
  const fullEvent: EncryptionEvent = {
    ...event,
    timestamp: new Date().toISOString()
  };

  // Increment counter
  const currentCount = eventCounts.get(event.type) || 0;
  eventCounts.set(event.type, currentCount + 1);

  // Structured logging for monitoring tools
  const logLevel = getLogLevel(event.type);
  const logData = {
    ...fullEvent,
    totalCount: currentCount + 1
  };

  switch (logLevel) {
    case 'CRITICAL':
      console.error('[ENCRYPTION MONITOR - CRITICAL]', JSON.stringify(logData));
      break;
    case 'ERROR':
      console.error('[ENCRYPTION MONITOR - ERROR]', JSON.stringify(logData));
      break;
    case 'WARN':
      console.warn('[ENCRYPTION MONITOR - WARN]', JSON.stringify(logData));
      break;
    case 'INFO':
      console.log('[ENCRYPTION MONITOR - INFO]', JSON.stringify(logData));
      break;
  }
}

/**
 * Get log level for event type
 */
function getLogLevel(type: EncryptionEventType): 'CRITICAL' | 'ERROR' | 'WARN' | 'INFO' {
  switch (type) {
    case 'KEY_MISSING':
      return 'CRITICAL';
    case 'ENCRYPTION_FAILED':
    case 'DEK_GENERATION_FAILED':
      return 'ERROR';
    case 'KEY_LOAD_FAILED':
    case 'DECRYPTION_FAILED':
      return 'WARN';
    case 'ENCRYPTION_SUCCESS':
    case 'DECRYPTION_SUCCESS':
      return 'INFO';
    default:
      return 'INFO';
  }
}

/**
 * Get current event counts for monitoring dashboard
 */
export function getEncryptionMetrics(): Record<EncryptionEventType, number> {
  return {
    ENCRYPTION_SUCCESS: eventCounts.get('ENCRYPTION_SUCCESS') || 0,
    DECRYPTION_SUCCESS: eventCounts.get('DECRYPTION_SUCCESS') || 0,
    KEY_MISSING: eventCounts.get('KEY_MISSING') || 0,
    KEY_LOAD_FAILED: eventCounts.get('KEY_LOAD_FAILED') || 0,
    ENCRYPTION_FAILED: eventCounts.get('ENCRYPTION_FAILED') || 0,
    DECRYPTION_FAILED: eventCounts.get('DECRYPTION_FAILED') || 0,
    DEK_GENERATION_FAILED: eventCounts.get('DEK_GENERATION_FAILED') || 0
  };
}

/**
 * Reset metrics (useful for testing)
 */
export function resetEncryptionMetrics(): void {
  eventCounts.clear();
}
