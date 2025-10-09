import Stripe from 'stripe';
import type { IStorage } from '../storage';

interface SubscriptionState {
  hasSubscription: boolean;
  subId: string | null;
  healed?: boolean;
}

/**
 * Source-of-truth subscription state resolver
 * Handles race condition between checkout completion and webhook processing
 * 
 * @returns Subscription state with DB healing if webhook is lagging
 */
export async function resolveOrgSubscriptionState(
  stripe: Stripe | null,
  storage: IStorage,
  org: { id: string; stripeCustomerId: string | null; stripeSubscriptionId: string | null } | null
): Promise<SubscriptionState> {
  // Fast path: DB knows the sub id
  if (org?.stripeSubscriptionId) {
    return { hasSubscription: true, subId: org.stripeSubscriptionId };
  }

  // If we have a customer in Stripe, confirm directly with Stripe (handles webhook lag)
  if (stripe && org?.stripeCustomerId) {
    try {
      const subs = await stripe.subscriptions.list({
        customer: org.stripeCustomerId,
        status: 'all',
        limit: 10,
        expand: ['data.items'],
      });
      
      // Find any non-canceled subscription
      const current = subs.data.find(s => s.status !== 'canceled');
      
      if (current) {
        // Heal the DB - webhook was slow
        await storage.updateOrg(org.id, { stripeSubscriptionId: current.id });
        console.log(`[Billing] Healed subscription state for org ${org.id}: ${current.id}`);
        return { hasSubscription: true, subId: current.id, healed: true };
      }
    } catch (error) {
      console.error('[Billing] Failed to resolve subscription state from Stripe:', error);
    }
  }

  return { hasSubscription: false, subId: null };
}
