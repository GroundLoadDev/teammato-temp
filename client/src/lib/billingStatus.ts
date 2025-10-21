export type CanonicalStatus = 
  | 'installed_no_checkout'
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'trial_expired_unpaid'
  | 'grace_period';

export function statusBadge(status: CanonicalStatus, trialEnd?: string | null) {
  if (status === 'trialing') {
    const daysLeft = trialEnd 
      ? Math.max(0, Math.ceil((new Date(trialEnd).getTime() - Date.now()) / (24 * 60 * 60 * 1000))) 
      : null;
    if (daysLeft !== null && daysLeft <= 3) {
      return { variant: 'destructive' as const, text: `Trial: ${daysLeft}d left` };
    }
    return { variant: 'secondary' as const, text: daysLeft ? `Trial: ${daysLeft}d left` : 'Trial' };
  }
  if (status === 'active' || status === 'past_due') {
    return { variant: 'default' as const, text: 'Active' };
  }
  return { variant: 'outline' as const, text: 'No subscription' };
}
