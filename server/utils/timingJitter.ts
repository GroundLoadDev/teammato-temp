/**
 * Timing Jitter Utilities
 * 
 * Adds randomized delays to operations to prevent timing correlation attacks.
 * Helps protect anonymity by breaking predictable timing patterns.
 */

/**
 * Generate a random delay in milliseconds
 * 
 * @param minMs - Minimum delay in milliseconds
 * @param maxMs - Maximum delay in milliseconds
 * @returns Random delay value
 */
function randomDelay(minMs: number, maxMs: number): number {
  return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
}

/**
 * Sleep for a specified number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Add random jitter delay before executing a function
 * Used for notifications to prevent timing correlation
 * 
 * @param fn - Async function to execute after delay
 * @param minDelayMs - Minimum delay (default: 5000ms = 5 seconds)
 * @param maxDelayMs - Maximum delay (default: 30000ms = 30 seconds)
 */
export async function withJitter<T>(
  fn: () => Promise<T>,
  minDelayMs: number = 5000,
  maxDelayMs: number = 30000
): Promise<T> {
  const jitter = randomDelay(minDelayMs, maxDelayMs);
  console.log(`[Jitter] Adding ${Math.round(jitter / 1000)}s delay to prevent timing correlation`);
  await sleep(jitter);
  return fn();
}

/**
 * Execute a notification with jitter delay
 * Specifically for DM receipts and channel notifications
 */
export async function sendWithJitter<T>(
  fn: () => Promise<T>
): Promise<void> {
  // Run in background with jitter (don't await)
  withJitter(fn, 5000, 30000).catch(err => {
    console.error('[Jitter] Background notification failed:', err);
  });
}
