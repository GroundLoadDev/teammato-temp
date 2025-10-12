/**
 * Differential Privacy Utilities
 * 
 * Adds statistical noise to aggregated data to prevent exact inference attacks.
 * Uses Laplace mechanism which is standard for differential privacy.
 */

/**
 * Generate Laplace noise with scale parameter b (sensitivity/epsilon)
 * epsilon controls privacy-utility tradeoff (smaller = more privacy, less accuracy)
 */
function sampleLaplace(scale: number): number {
  // Sample from uniform distribution
  const u = Math.random() - 0.5;
  
  // Laplace distribution: -b * sign(u) * ln(1 - 2|u|)
  return -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
}

/**
 * Add differential privacy noise to a count
 * 
 * @param count - The true count
 * @param sensitivity - How much one individual can change the result (default: 1)
 * @param epsilon - Privacy parameter (default: 1.0, smaller = more privacy)
 * @returns Noised count (rounded to integer, minimum 0)
 */
export function addNoiseToCount(
  count: number, 
  sensitivity: number = 1, 
  epsilon: number = 1.0
): number {
  const scale = sensitivity / epsilon;
  const noise = sampleLaplace(scale);
  const noisedCount = Math.round(count + noise);
  
  // Ensure non-negative
  return Math.max(0, noisedCount);
}

/**
 * Add noise to participant count with privacy guarantees
 * Uses epsilon=0.5 for stronger privacy (typical range: 0.1 to 1.0)
 */
export function addNoiseToParticipantCount(count: number): number {
  return addNoiseToCount(count, 1, 0.5);
}

/**
 * Add noise to aggregated theme counts
 * Uses slightly higher epsilon since themes are already aggregated
 */
export function addNoiseToThemeCount(count: number): number {
  return addNoiseToCount(count, 1, 0.8);
}
