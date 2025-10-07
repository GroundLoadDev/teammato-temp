import type { Request, Response } from 'express';
import Stripe from 'stripe';
import { IStorage } from '../storage';

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

export async function handleStripeWebhook(
  req: Request,
  res: Response,
  stripe: Stripe,
  storage: IStorage
) {
  if (!STRIPE_WEBHOOK_SECRET) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  const sig = req.headers['stripe-signature'] as string;
  
  let event: Stripe.Event;
  
  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`[Stripe Webhook] ${event.type}:`, event.id);

  try {
    // Idempotency check
    const alreadyProcessed = await storage.isWebhookEventProcessed(event.id);
    if (alreadyProcessed) {
      console.log(`[Stripe Webhook] Event ${event.id} already processed, skipping`);
      return res.json({ received: true, skipped: true });
    }
    
    // Record event
    await storage.recordWebhookEvent({ id: event.id, type: event.type });
    
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session, stripe, storage);
        break;
      }
      
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription, stripe, storage);
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription, storage);
        break;
      }
      
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice, storage);
        break;
      }
      
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice, storage);
        break;
      }
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error(`Error processing webhook ${event.type}:`, error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  stripe: Stripe,
  storage: IStorage
) {
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;
  
  if (!customerId || !subscriptionId) {
    console.error('Checkout session missing customer or subscription');
    return;
  }

  // Find org by customer ID
  const org = await storage.getOrgByStripeCustomerId(customerId);
  
  if (!org) {
    console.error(`No org found for customer ${customerId}`);
    return;
  }

  // Fetch full subscription details
  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ['items.data.price.product']
  });

  await syncSubscriptionToOrg(org.id, subscription, storage);
  
  // Track event
  await storage.trackEvent({
    orgId: org.id,
    eventType: 'trial_checkout_completed',
    metadata: { subscriptionId, customerId },
  });
  
  console.log(`Checkout completed for org ${org.id}`);
}

async function handleSubscriptionUpdate(
  subscription: Stripe.Subscription,
  stripe: Stripe,
  storage: IStorage
) {
  const customerId = subscription.customer as string;
  
  // Find org by customer ID
  const org = await storage.getOrgByStripeCustomerId(customerId);
  
  if (!org) {
    console.error(`No org found for customer ${customerId}`);
    return;
  }

  // Expand subscription if needed
  if (!subscription.items?.data?.[0]?.price?.product) {
    subscription = await stripe.subscriptions.retrieve(subscription.id, {
      expand: ['items.data.price.product']
    });
  }

  await syncSubscriptionToOrg(org.id, subscription, storage);
  console.log(`Subscription updated for org ${org.id}`);
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  storage: IStorage
) {
  const customerId = subscription.customer as string;
  
  const org = await storage.getOrgByStripeCustomerId(customerId);
  
  if (!org) {
    console.error(`No org found for customer ${customerId}`);
    return;
  }

  await storage.updateOrg(org.id, {
    billingStatus: 'canceled',
    stripeSubscriptionId: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
  });
  
  console.log(`Subscription deleted for org ${org.id}`);
}

async function handleInvoicePaid(
  invoice: Stripe.Invoice,
  storage: IStorage
) {
  const customerId = invoice.customer as string;
  
  const org = await storage.getOrgByStripeCustomerId(customerId);
  
  if (!org) {
    console.error(`No org found for customer ${customerId}`);
    return;
  }

  // Update status to active if it was past_due
  if (org.billingStatus === 'past_due') {
    await storage.updateOrg(org.id, {
      billingStatus: 'active',
    });
    console.log(`Invoice paid, org ${org.id} status updated to active`);
  }
}

async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice,
  storage: IStorage
) {
  const customerId = invoice.customer as string;
  
  const org = await storage.getOrgByStripeCustomerId(customerId);
  
  if (!org) {
    console.error(`No org found for customer ${customerId}`);
    return;
  }

  await storage.updateOrg(org.id, {
    billingStatus: 'past_due',
  });
  
  console.log(`Payment failed for org ${org.id}, status set to past_due`);
}

async function syncSubscriptionToOrg(
  orgId: string,
  subscription: Stripe.Subscription,
  storage: IStorage
) {
  const priceItem = subscription.items.data[0];
  const price = priceItem.price;
  const priceId = price.id;
  const productId = typeof price.product === 'string' ? price.product : price.product?.id;
  
  // Extract seat cap and period from metadata
  const metadata = price.metadata || {};
  const seatCap = metadata.cap ? parseInt(metadata.cap, 10) : 250;
  const period = metadata.period === 'annual' ? 'annual' : 'monthly';
  
  // Determine status
  let status = subscription.status;
  if (status === 'trialing') status = 'trialing';
  else if (status === 'active') status = 'active';
  else if (status === 'past_due') status = 'past_due';
  else if (status === 'canceled') status = 'canceled';
  else if (status === 'unpaid') status = 'unpaid';
  else if (status === 'incomplete') status = 'incomplete';
  else if (status === 'paused') status = 'paused';
  
  // Access Stripe properties with type assertion
  const sub = subscription as any;
  
  const updates: any = {
    stripeSubscriptionId: subscription.id,
    stripePriceId: priceId,
    billingStatus: status,
    seatCap,
    billingPeriod: period,
    priceAmount: price.unit_amount || 0,
    currentPeriodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1000) : null,
    cancelAtPeriodEnd: sub.cancel_at_period_end || false,
  };
  
  // Handle trial end
  if (sub.trial_end) {
    updates.trialEnd = new Date(sub.trial_end * 1000);
  }
  
  // Handle cancellation
  if (sub.cancel_at_period_end && sub.current_period_end) {
    updates.cancelsAt = new Date(sub.current_period_end * 1000);
  } else {
    updates.cancelsAt = null;
  }
  
  await storage.updateOrg(orgId, updates);
}
