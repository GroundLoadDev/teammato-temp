import type { Request, Response } from 'express';
import Stripe from 'stripe';
import { IStorage } from '../storage';

export async function handleStripeWebhook(
  req: Request,
  res: Response,
  stripe: Stripe,
  storage: IStorage
) {
  console.log("[wh] hit", req.method, req.originalUrl);
  console.log("[wh] hdr sig:", (req.headers["stripe-signature"] || "").toString().slice(0,16), "..."); 
  console.log("[wh] body is Buffer:", Buffer.isBuffer(req.body), "len:", Buffer.isBuffer(req.body) ? req.body.length : (req.body ? JSON.stringify(req.body).length : 0));
  console.log("[wh] mode:", process.env.NODE_ENV, "cliFlag:", process.env.USE_STRIPE_CLI);
  console.log("[wh] secret mode:", (process.env.USE_STRIPE_CLI === "1") ? "TEST" : "LIVE");
  
  const sig = req.headers['stripe-signature'] as string;
  const useCli = process.env.USE_STRIPE_CLI === "1";
  const secret = useCli
    ? process.env.STRIPE_WEBHOOK_SECRET_TEST
    : process.env.STRIPE_WEBHOOK_SECRET;

  console.log("Using webhook secret:", useCli ? "TEST" : "LIVE");

  if (!secret) {
    console.error('Webhook secret not configured');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  let event: Stripe.Event;
  
  try {
    // When using express.raw(), req.body is a Buffer
    // Stripe needs it as a string for signature verification
    const payload = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : req.body;
    
    event = stripe.webhooks.constructEvent(
      payload,
      sig,
      secret
    );
  } catch (err: any) {
    console.error('⚠️ Webhook signature verification failed:', err.message);
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

  // Mark checkout as completed (don't activate trial yet - wait for subscription webhook)
  await storage.updateOrg(org.id, { 
    checkoutStatus: 'completed',
    checkoutSessionId: session.id
  });
  
  // Track event
  await storage.trackEvent({
    orgId: org.id,
    eventType: 'trial_checkout_completed',
    metadata: { subscriptionId, customerId, sessionId: session.id },
  });
  
  console.log(`Checkout session completed for org ${org.id}, waiting for subscription webhook`);
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
  
  // Founding pricing: Set grandfatheredUntil for first-time subscribers before GA
  const GA_DATE = new Date('2026-04-13T00:00:00Z');
  const org = await storage.getOrg(orgId);
  
  if (org && !org.grandfatheredUntil) {
    const subscriptionStart = sub.start_date ? new Date(sub.start_date * 1000) : new Date();
    
    if (subscriptionStart < GA_DATE) {
      const grandfatheredUntil = new Date(subscriptionStart);
      grandfatheredUntil.setMonth(grandfatheredUntil.getMonth() + 24);
      updates.grandfatheredUntil = grandfatheredUntil;
      
      console.log(`[Founding Pricing] Org ${orgId} grandfathered until ${grandfatheredUntil.toISOString()}`);
    }
  }
  
  await storage.updateOrg(orgId, updates);
}
