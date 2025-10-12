import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import type { User } from "@shared/schema";
import crypto from "crypto";
import { z } from "zod";
import "./types"; // Load session type extensions
import { filterAnonymousFeedback, generateSubmitterHash, coarsenSituation } from "./utils/contentFilter";
import { sendContributionReceipt, postActionNotesToChannel, sendInstallerWelcomeDM } from "./utils/slackMessaging";
import { buildFeedbackModal, buildInputModalA, buildReviewModalB } from "./utils/slackModal";
import { scrubPIIForReview, highlightRedactions } from "./utils/scrub";
import { logSlackEvent } from "./utils/logScrubber";
import { roundTimestampToDay } from "./utils/timestampRounding";
import { prepQuoteForDigest } from "./utils/quotePrep";
import { WebClient } from '@slack/web-api';
import adminKeysRouter from "./routes/admin-keys";
import themesRouter from "./routes/themes";
import Stripe from 'stripe';
import { handleStripeWebhook } from './webhooks/stripe';
import { generateDigest, sendDigestToOrg } from "./cron/digestWeekly";
import { enforceSeatCap, getSeatCapStatus } from "./middleware/seatCap";
import { resolveOrgSubscriptionState } from './lib/billing';

// Slack OAuth configuration
const SLACK_CLIENT_ID = process.env.SLACK_CLIENT_ID;
const SLACK_CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET;
const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET;

if (!SLACK_CLIENT_ID || !SLACK_CLIENT_SECRET || !SLACK_SIGNING_SECRET) {
  console.warn("Missing Slack environment variables");
}

// Use env variable for redirect URI, fallback to dev URL
const REDIRECT_URI = process.env.SLACK_REDIRECT_URI || 
  'https://0b09fc98-cfc3-4134-ae72-a7645228e1f5-00-1li8oza6dfwqq.janeway.replit.dev/api/slack/oauth';

// Bot scopes
const BOT_SCOPES = [
  'commands',
  'chat:write',
  'team:read',
  'users:read',
  'usergroups:read',    // For user groups in Audience feature
  'channels:read',      // For public channels in Audience feature
  'groups:read'         // For private channels in Audience feature
].join(',');

// User scopes (for getting installer email)
const USER_SCOPES = [
  'users:read',
  'users:read.email'
].join(',');

// In-memory state storage (TODO: use Redis/session store in production)
// Store state -> { timestamp, plan? }
const oauthStates = new Map<string, { timestamp: number; plan?: string }>();

// Stripe configuration
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || process.env.TESTING_STRIPE_SECRET_KEY;
const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2025-08-27.basil',
}) : null;

// Pricing plans with lookup keys matching Stripe catalog
const PRICE_PLANS = [
  { cap: 250, monthly: 99, annual: 999, monthlyLookup: 'cap_250_m', annualLookup: 'cap_250_a' },
  { cap: 500, monthly: 149, annual: 1490, monthlyLookup: 'cap_500_m', annualLookup: 'cap_500_a' },
  { cap: 1000, monthly: 199, annual: 1990, monthlyLookup: 'cap_1000_m', annualLookup: 'cap_1000_a' },
  { cap: 2500, monthly: 299, annual: 2990, monthlyLookup: 'cap_2500_m', annualLookup: 'cap_2500_a' },
  { cap: 5000, monthly: 399, annual: 3990, monthlyLookup: 'cap_5000_m', annualLookup: 'cap_5000_a' },
  { cap: 10000, monthly: 599, annual: 5990, monthlyLookup: 'cap_10000_m', annualLookup: 'cap_10000_a' },
  { cap: 25000, monthly: 999, annual: 9990, monthlyLookup: 'cap_25000_m', annualLookup: 'cap_25000_a' },
];

// Helper function to get ISO week number
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

// Auth middleware
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// Role-based access control middleware
function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.userId || !req.session.role) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    if (!roles.includes(req.session.role)) {
      return res.status(403).json({ error: 'Forbidden - insufficient permissions' });
    }
    
    next();
  };
}

// Billing state helper - determines if org can write AND persists state transitions
async function checkAndTransitionBillingState(org: any): Promise<{ allowed: boolean; reason?: string; state?: string }> {
  const now = Date.now();
  const billingStatus = org.billingStatus || 'installed_no_checkout';
  let newState: string | null = null;
  
  // Check trial expiration FIRST - regardless of current status
  // If no active subscription and trial ended, transition to trial_expired_unpaid
  if (!org.stripeSubscriptionId && org.trialEnd && now > org.trialEnd.getTime()) {
    // Don't transition if already in trial_expired_unpaid
    if (billingStatus !== 'trial_expired_unpaid') {
      newState = 'trial_expired_unpaid';
      await storage.updateOrg(org.id, { billingStatus: newState });
    }
    return { 
      allowed: false, 
      reason: 'Trial expired. Please upgrade to continue.',
      state: 'trial_expired_unpaid'
    };
  }
  
  // Check seat cap with grace period
  const usage = org.eligibleCount || 0;
  const cap = org.seatCap || 250;
  const percentUsed = (usage / cap) * 100;
  
  if (percentUsed > 110) {
    // Block immediately if over 110%
    if (billingStatus !== 'over_cap_blocked') {
      await storage.updateOrg(org.id, { 
        billingStatus: 'over_cap_blocked',
        graceEndsAt: null // Clear grace period
      });
    }
    return { 
      allowed: false, 
      reason: 'Over seat capacity limit. Please upgrade your plan.',
      state: 'over_cap_blocked'
    };
  }
  
  if (percentUsed > 100) {
    // If already blocked, stay blocked (requires subscription to clear)
    if (billingStatus === 'over_cap_blocked') {
      // Only clear block if they now have an active subscription
      if (org.stripeSubscriptionId) {
        // Has subscription - start new grace period
        const graceEnd = new Date(now + 7 * 24 * 60 * 60 * 1000);
        await storage.updateOrg(org.id, { 
          billingStatus: 'over_cap_grace',
          graceEndsAt: graceEnd 
        });
        return { allowed: true };
      }
      
      // No subscription yet - stay blocked
      return { 
        allowed: false, 
        reason: 'Over seat capacity limit. Please upgrade your plan.',
        state: 'over_cap_blocked'
      };
    }
    
    // Start or maintain grace period
    if (billingStatus !== 'over_cap_grace' || !org.graceEndsAt) {
      // Start new grace period
      const graceEnd = new Date(now + 7 * 24 * 60 * 60 * 1000); // 7 days from now
      await storage.updateOrg(org.id, { 
        billingStatus: 'over_cap_grace',
        graceEndsAt: graceEnd 
      });
    }
    
    // Check if grace period expired
    if (org.graceEndsAt && now > org.graceEndsAt.getTime()) {
      await storage.updateOrg(org.id, { billingStatus: 'over_cap_blocked' });
      return { 
        allowed: false, 
        reason: 'Grace period expired. Please upgrade your plan.',
        state: 'over_cap_blocked'
      };
    }
    
    // Still in grace period
    return { allowed: true };
  }
  
  // If under capacity and was in grace/blocked, clear it
  if (billingStatus === 'over_cap_grace' || billingStatus === 'over_cap_blocked') {
    // Blocked orgs need a subscription to clear the block
    if (billingStatus === 'over_cap_blocked' && !org.stripeSubscriptionId) {
      return {
        allowed: false,
        reason: 'Please complete your subscription to resume access.',
        state: 'over_cap_blocked'
      };
    }
    
    // Determine correct restored state
    let restoredStatus: string;
    if (org.stripeSubscriptionId) {
      restoredStatus = 'active';
    } else if (org.trialEnd && now > org.trialEnd.getTime()) {
      restoredStatus = 'trial_expired_unpaid';
    } else {
      restoredStatus = 'trialing';
    }
    
    await storage.updateOrg(org.id, { 
      billingStatus: restoredStatus,
      graceEndsAt: null 
    });
    
    // If restored to trial_expired_unpaid, block writes
    if (restoredStatus === 'trial_expired_unpaid') {
      return {
        allowed: false,
        reason: 'Trial expired. Please upgrade to continue.',
        state: restoredStatus
      };
    }
    
    return { allowed: true };
  }
  
  // Allow writes for active statuses
  const writeAllowedStatuses = ['trialing', 'active', 'over_cap_grace'];
  if (writeAllowedStatuses.includes(billingStatus)) {
    return { allowed: true };
  }
  
  // Block writes for other statuses
  const statusMessages: Record<string, string> = {
    'installed_no_checkout': 'Please start your free trial to use Teammato.',
    'trial_expired_unpaid': 'Trial expired. Please upgrade to continue.',
    'past_due': 'Payment failed. Please update your payment method.',
    'canceled': 'Subscription canceled. Please re-subscribe to continue.',
    'unpaid': 'Subscription unpaid. Please update your payment method.',
    'incomplete': 'Payment incomplete. Please complete checkout.',
    'paused': 'Subscription paused. Please contact support.',
  };
  
  return { 
    allowed: false, 
    reason: statusMessages[billingStatus] || 'Subscription required.',
    state: billingStatus
  };
}

// Middleware - require active subscription for writes
async function requireActiveSubscription(req: Request, res: Response, next: NextFunction) {
  if (!req.session.orgId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Get org with usage data
  const org = await storage.getOrg(req.session.orgId);
  if (!org) {
    return res.status(404).json({ error: 'Organization not found' });
  }
  
  // Get usage data
  const usage = await storage.getOrgUsage(req.session.orgId);
  const orgWithUsage = { ...org, eligibleCount: usage?.eligibleCount || 0 };
  
  // Check and transition billing state (persists changes)
  const writeCheck = await checkAndTransitionBillingState(orgWithUsage);
  if (!writeCheck.allowed) {
    return res.status(403).json({ 
      error: 'Write access restricted',
      message: writeCheck.reason,
      billingStatus: writeCheck.state || org.billingStatus,
      requiresSetup: true,
    });
  }

  next();
}

// Slack signature verification
function verifySlackSignature(req: Request): boolean {
  if (!SLACK_SIGNING_SECRET) {
    console.error('SLACK_SIGNING_SECRET not configured');
    return false;
  }

  const slackSignature = req.headers['x-slack-signature'] as string;
  const timestamp = req.headers['x-slack-request-timestamp'] as string;
  
  // express.raw() stores the raw body in req.body as a Buffer
  const body = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : '';

  if (!slackSignature || !timestamp || !body) {
    console.error('Missing signature, timestamp, or body');
    return false;
  }

  // Prevent replay attacks - reject requests older than 5 minutes
  const currentTime = Math.floor(Date.now() / 1000);
  if (Math.abs(currentTime - parseInt(timestamp)) > 300) {
    console.warn('Slack request timestamp too old');
    return false;
  }

  // Compute signature
  const sigBasestring = `v0:${timestamp}:${body}`;
  const mySignature = 'v0=' + crypto
    .createHmac('sha256', SLACK_SIGNING_SECRET)
    .update(sigBasestring)
    .digest('hex');

  // Compare signatures using timing-safe comparison
  try {
    return crypto.timingSafeEqual(
      Buffer.from(mySignature, 'utf8'),
      Buffer.from(slackSignature, 'utf8')
    );
  } catch {
    return false;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Auth API
  app.get('/api/auth/me', async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        req.session.destroy(() => {});
        return res.status(401).json({ error: 'User not found' });
      }

      const org = await storage.getOrg(user.orgId);
      
      res.json({
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          orgId: user.orgId,
        },
        org: org ? {
          id: org.id,
          name: org.name,
        } : null,
      });
    } catch (error) {
      console.error('Get current user error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: 'Logout failed' });
      }
      res.json({ success: true });
    });
  });

  // Dashboard API
  app.get('/api/dashboard/stats', requireAuth, async (req, res) => {
    try {
      const orgId = req.session.orgId!;
      const [stats, newThisWeek, activeParticipants] = await Promise.all([
        storage.getOrgStats(orgId),
        storage.getNewThisWeek(orgId),
        storage.getUniqueParticipantCount(orgId)
      ]);
      res.json({ ...stats, newThisWeek, activeParticipants });
    } catch (error) {
      console.error('Dashboard stats error:', error);
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  });

  app.get('/api/dashboard/recent-threads', requireAuth, async (req, res) => {
    try {
      const orgId = req.session.orgId!;
      let limit = parseInt(req.query.limit as string) || 5;
      
      // Validate and clamp limit
      limit = Math.max(1, Math.min(50, limit));
      
      const threads = await storage.getRecentThreads(orgId, limit);
      res.json(threads);
    } catch (error) {
      console.error('Recent threads error:', error);
      res.status(500).json({ error: 'Failed to fetch recent threads' });
    }
  });

  app.get('/api/dashboard/slack-status', requireAuth, async (req, res) => {
    try {
      const orgId = req.session.orgId!;
      const slackTeam = await storage.getSlackTeamByOrgId(orgId);
      
      if (!slackTeam) {
        return res.json({ connected: false });
      }

      res.json({
        connected: true,
        teamId: slackTeam.teamId,
        botUserId: slackTeam.botUserId,
      });
    } catch (error) {
      console.error('Slack status error:', error);
      res.status(500).json({ error: 'Failed to fetch Slack status' });
    }
  });

  // Stripe Webhook - Must use raw body for signature verification
  app.post('/api/stripe/webhook', async (req, res) => {
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe not configured' });
    }
    await handleStripeWebhook(req, res, stripe, storage);
  });

  // Billing API - Consolidated Status
  app.get('/api/billing/status', requireAuth, async (req, res) => {
    try {
      const orgId = req.session.orgId!;
      const org = await storage.getOrg(orgId);
      const slackTeam = await storage.getSlackTeamByOrgId(orgId);
      
      if (!org) {
        return res.status(404).json({ error: 'Organization not found' });
      }

      // Get eligible member count from org_usage (respects Audience settings)
      let eligibleCount = 0;
      let audienceMode: 'workspace' | 'user_group' | 'channels' = 'workspace';
      let lastSynced: string | undefined;

      if (slackTeam && slackTeam.accessToken) {
        let usage = await storage.getOrgUsage(orgId);
        let audience = await storage.getOrgAudience(orgId);
        
        if (!audience) {
          audience = await storage.upsertOrgAudience({
            orgId,
            mode: 'workspace',
            excludeGuests: true,
          });
        }
        
        if (!usage) {
          const { recomputeEligibleCount } = await import('./services/audience');
          eligibleCount = await recomputeEligibleCount(slackTeam.accessToken, audience);
          usage = await storage.upsertOrgUsage({
            orgId,
            eligibleCount,
          });
        } else {
          eligibleCount = usage.eligibleCount;
        }
        
        audienceMode = audience.mode as any || 'workspace';
        lastSynced = usage.lastSynced?.toISOString();
      }

      // Get billing data from org record
      const status = org.billingStatus || 'trialing';
      const seatCap = org.seatCap || 250;
      const period = org.billingPeriod || 'monthly';
      const price = org.priceAmount || 0;
      const trialEnd = org.trialEnd?.toISOString() || null;
      const cancelsAt = org.cancelsAt?.toISOString() || null;
      const graceEndsAt = org.graceEndsAt?.toISOString() || null;
      const customerEmail = org.billingEmail || null;

      // Calculate usage percentage
      const percent = seatCap > 0 ? Math.round((eligibleCount / seatCap) * 100) : 0;

      // Resolve subscription state (handles webhook lag)
      const { hasSubscription, subId } = await resolveOrgSubscriptionState(stripe, storage, org);

      // Fetch invoices from Stripe if available
      let invoices: any[] = [];
      if (stripe && org.stripeCustomerId) {
        try {
          const invoiceList = await stripe.invoices.list({
            customer: org.stripeCustomerId,
            limit: 20,
          });
          invoices = invoiceList.data.map(inv => ({
            id: inv.id,
            number: inv.number || inv.id,
            date: new Date(inv.created * 1000).toISOString(),
            amount: inv.total,
            status: inv.status,
            hostedInvoiceUrl: inv.hosted_invoice_url,
            pdfUrl: inv.invoice_pdf,
          }));
        } catch (error) {
          console.error('Failed to fetch invoices:', error);
        }
      }

      res.json({
        orgId,
        status,
        seatCap,
        period,
        price,
        trialEnd,
        cancelsAt,
        graceEndsAt,
        eligibleCount,
        percent,
        customerEmail,
        hasSubscription,
        subscriptionId: subId,
        invoices,
        audience: {
          mode: audienceMode,
          eligibleCount,
          lastSynced,
        },
        prices: PRICE_PLANS,
      });
    } catch (error) {
      console.error('Billing status error:', error);
      res.status(500).json({ error: 'Failed to fetch billing status' });
    }
  });

  // Billing API - Create Checkout Session (Owner only) - FIRST SUBSCRIPTION ONLY
  app.post('/api/billing/checkout', requireRole('owner'), async (req, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ error: 'Stripe not configured' });
      }

      const orgId = req.session.orgId!;
      const org = await storage.getOrg(orgId);
      
      if (!org) {
        return res.status(404).json({ error: 'Organization not found' });
      }

      // Guard: block existing subscribers (checks DB + Stripe to handle webhook lag)
      const { hasSubscription } = await resolveOrgSubscriptionState(stripe, storage, org);
      if (hasSubscription) {
        return res.status(409).json({ 
          error: 'SUB_EXISTS',
          message: 'Subscription already exists. Use /api/billing/change-plan to update your plan.' 
        });
      }

      const { priceLookupKey, chargeToday } = req.body;
      if (!priceLookupKey) {
        return res.status(400).json({ error: 'priceLookupKey required' });
      }

      // Extract seat cap from lookup key for validation
      const capMatch = priceLookupKey.match(/cap_(\d+)_/);
      const newSeatCap = capMatch ? parseInt(capMatch[1], 10) : null;
      
      // Validate downgrade against current usage
      if (newSeatCap && newSeatCap < (org.seatCap || 250)) {
        const usage = await storage.getOrgUsage(orgId);
        const eligibleCount = usage?.eligibleCount || 0;
        
        if (eligibleCount > newSeatCap) {
          return res.status(400).json({ 
            error: 'Cannot downgrade below current usage',
            message: `You currently have ${eligibleCount} eligible members, but the plan you selected supports only ${newSeatCap}. Please reduce your audience size or select a higher tier.`,
            eligibleCount,
            newSeatCap,
          });
        }
      }

      // Get or create Stripe customer
      let customerId = org.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: org.billingEmail || undefined,
          metadata: { org_id: orgId },
        });
        customerId = customer.id;
        
        // Update org with customer ID
        await storage.updateOrg(orgId, { stripeCustomerId: customerId });
      }

      // Look up price by lookup key
      const prices = await stripe.prices.list({
        lookup_keys: [priceLookupKey],
        expand: ['data.product'],
      });

      if (prices.data.length === 0) {
        return res.status(404).json({ error: 'Price not found' });
      }

      const priceId = prices.data[0].id;
      
      // Determine success/cancel URLs
      const baseUrl = process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'http://localhost:5000';
      const successUrl = `${baseUrl}/admin/billing?success=1`;
      const cancelUrl = `${baseUrl}/post-install`; // Send to post-install on cancel

      // Calculate trial_end based on org state
      let trialEnd: number | 'now' | undefined;
      
      // R2: One trial per org - if trial already used, charge now
      const hasUsedTrial = org.trialEnd && org.trialEnd.getTime() < Date.now();
      
      if (chargeToday || hasUsedTrial) {
        // Don't set trial_end - Stripe will start subscription immediately
        trialEnd = undefined;
      } else if (org.trialEnd && org.billingStatus === 'trialing') {
        // Keep existing trial period
        trialEnd = Math.floor(org.trialEnd.getTime() / 1000);
      } else if (!org.stripeSubscriptionId && !hasUsedTrial) {
        // New trial - 14 days
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + 14);
        trialEnd = Math.floor(trialEndDate.getTime() / 1000);
      } else {
        // Default to charge now
        trialEnd = undefined;
      }

      // Create checkout session
      const sessionConfig: any = {
        mode: 'subscription',
        customer: customerId,
        line_items: [{ price: priceId, quantity: 1 }],
        allow_promotion_codes: true,
        payment_method_collection: 'always',
        subscription_data: {
          trial_settings: { end_behavior: { missing_payment_method: 'cancel' } },
          metadata: { org_id: orgId },
        },
        success_url: successUrl,
        cancel_url: cancelUrl,
      };

      // Only set trial_end if we have a value (don't set it for immediate charging)
      if (trialEnd !== undefined) {
        sessionConfig.subscription_data.trial_end = trialEnd;
      }

      const session = await stripe.checkout.sessions.create(sessionConfig);

      // Track checkout event
      await storage.trackEvent({
        orgId,
        eventType: 'trial_checkout_opened',
        userId: req.session.userId || null,
        metadata: { priceLookupKey, chargeToday: !!chargeToday },
      });

      res.json({ url: session.url });
    } catch (error) {
      console.error('Checkout error:', error);
      res.status(500).json({ error: 'Failed to create checkout session' });
    }
  });

  // Billing API - Idempotent Checkout/Ensure (Owner only)
  app.post('/api/billing/checkout/ensure', requireRole('owner'), async (req, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ error: 'Stripe not configured' });
      }

      const orgId = req.session.orgId!;
      const org = await storage.getOrg(orgId);
      
      if (!org) {
        return res.status(404).json({ error: 'Organization not found' });
      }

      // Guard: block existing subscribers
      const { hasSubscription } = await resolveOrgSubscriptionState(stripe, storage, org);
      if (hasSubscription) {
        return res.status(409).json({ 
          error: 'SUB_EXISTS',
          message: 'Subscription already exists. Use /api/billing/change-plan to update your plan.' 
        });
      }

      const { priceLookupKey } = req.body;
      if (!priceLookupKey) {
        return res.status(400).json({ error: 'priceLookupKey required' });
      }

      // Check if there's an open checkout session
      if (org.checkoutSessionId && org.checkoutStatus === 'open') {
        try {
          // Verify session still exists and is valid in Stripe
          const existingSession = await stripe.checkout.sessions.retrieve(org.checkoutSessionId);
          
          if (existingSession.status === 'open' && existingSession.url) {
            // Reuse existing session
            console.log(`[Checkout/Ensure] Reusing open session ${org.checkoutSessionId} for org ${orgId}`);
            return res.json({ url: existingSession.url, reused: true });
          } else {
            // Session expired or completed, mark as expired
            await storage.updateOrg(orgId, { checkoutStatus: 'expired' });
          }
        } catch (error: any) {
          // Session not found in Stripe, mark as expired
          if (error.code === 'resource_missing') {
            await storage.updateOrg(orgId, { checkoutStatus: 'expired' });
          } else {
            throw error;
          }
        }
      }

      // Create new checkout session (same logic as /api/billing/checkout)
      let customerId = org.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: org.billingEmail || undefined,
          metadata: { org_id: orgId },
        });
        customerId = customer.id;
        await storage.updateOrg(orgId, { stripeCustomerId: customerId });
      }

      const prices = await stripe.prices.list({
        lookup_keys: [priceLookupKey],
        expand: ['data.product'],
      });

      if (prices.data.length === 0) {
        return res.status(404).json({ error: 'Price not found' });
      }

      const priceId = prices.data[0].id;
      
      const baseUrl = process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'http://localhost:5000';
      const successUrl = `${baseUrl}/admin/billing?success=1`;
      const cancelUrl = `${baseUrl}/post-install`; // Send to post-install on cancel

      // Calculate trial_end
      let trialEnd: number | undefined;
      const hasUsedTrial = org.trialEnd && org.trialEnd.getTime() < Date.now();
      
      if (!hasUsedTrial && !org.stripeSubscriptionId) {
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + 14);
        trialEnd = Math.floor(trialEndDate.getTime() / 1000);
      }

      const sessionConfig: any = {
        mode: 'subscription',
        customer: customerId,
        line_items: [{ price: priceId, quantity: 1 }],
        allow_promotion_codes: true,
        payment_method_collection: 'always',
        subscription_data: {
          trial_settings: { end_behavior: { missing_payment_method: 'cancel' } },
          metadata: { org_id: orgId },
        },
        success_url: successUrl,
        cancel_url: cancelUrl,
      };

      if (trialEnd !== undefined) {
        sessionConfig.subscription_data.trial_end = trialEnd;
      }

      const session = await stripe.checkout.sessions.create(sessionConfig);

      // Store session info in DB
      await storage.updateOrg(orgId, { 
        checkoutSessionId: session.id,
        checkoutStatus: 'open'
      });

      await storage.trackEvent({
        orgId,
        eventType: 'trial_checkout_opened',
        userId: req.session.userId || null,
        metadata: { priceLookupKey, idempotent: true },
      });

      console.log(`[Checkout/Ensure] Created new session ${session.id} for org ${orgId}`);
      res.json({ url: session.url, reused: false });
    } catch (error) {
      console.error('Checkout/Ensure error:', error);
      res.status(500).json({ error: 'Failed to create checkout session' });
    }
  });

  // Billing API - Change Plan on EXISTING subscription (Owner only)
  app.post('/api/billing/change-plan', requireRole('owner'), async (req, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ error: 'Stripe not configured' });
      }

      const orgId = req.session.orgId!;
      const org = await storage.getOrg(orgId);
      
      if (!org) {
        return res.status(404).json({ error: 'Organization not found' });
      }

      // Resolve subscription state (handles webhook lag)
      const { hasSubscription, subId } = await resolveOrgSubscriptionState(stripe, storage, org);
      if (!hasSubscription) {
        return res.status(400).json({
          error: 'NO_SUB',
          message: 'No active subscription. Use /api/billing/checkout to start one.'
        });
      }

      const { priceLookupKey } = req.body;
      if (!priceLookupKey) {
        return res.status(400).json({ error: 'priceLookupKey required' });
      }

      // Extract seat cap from lookup key for downgrade validation
      const capMatch = priceLookupKey.match(/cap_(\d+)_/);
      const newSeatCap = capMatch ? parseInt(capMatch[1], 10) : null;
      
      // Validate downgrade against current usage
      if (newSeatCap && newSeatCap < (org.seatCap || 250)) {
        const usage = await storage.getOrgUsage(orgId);
        const eligibleCount = usage?.eligibleCount || 0;
        
        if (eligibleCount > newSeatCap) {
          return res.status(400).json({ 
            error: 'Cannot downgrade below current usage',
            message: `You currently have ${eligibleCount} eligible members, but the plan you selected supports only ${newSeatCap}. Please reduce your audience size or select a higher tier.`,
            eligibleCount,
            newSeatCap,
          });
        }
      }

      // Resolve target price from lookup key
      const prices = await stripe.prices.list({
        lookup_keys: [priceLookupKey],
        expand: ['data.product'],
      });

      const newPrice = prices.data?.[0];
      if (!newPrice) {
        return res.status(400).json({ error: 'Invalid price lookup key' });
      }

      // Fetch current subscription & primary item
      const sub = await stripe.subscriptions.retrieve(subId!, {
        expand: ['items']
      });
      
      const item = sub.items.data?.[0];
      if (!item) {
        return res.status(400).json({ error: 'Subscription has no items' });
      }

      // Update the item price WITH proration and keep the renewal date
      const updated = await stripe.subscriptions.update(sub.id, {
        items: [{ id: item.id, price: newPrice.id }],
        proration_behavior: 'create_prorations',
        billing_cycle_anchor: 'unchanged',
        payment_behavior: 'allow_incomplete',
        metadata: { org_id: orgId }
      });

      // Track plan change event
      await storage.trackEvent({
        orgId,
        eventType: 'plan_changed',
        userId: req.session.userId || null,
        metadata: { 
          priceLookupKey, 
          oldSeatCap: org.seatCap,
          newSeatCap,
          subscriptionId: updated.id 
        },
      });

      res.json({ subscriptionId: updated.id, status: updated.status });
    } catch (error) {
      console.error('Change plan error:', error);
      res.status(500).json({ error: 'Failed to change plan' });
    }
  });

  // Billing API - Schedule Plan Change (for trial users selecting a plan without skipping trial)
  app.post('/api/billing/schedule-change', requireRole('owner'), async (req, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ error: 'Stripe not configured' });
      }

      const orgId = req.session.orgId!;
      const org = await storage.getOrg(orgId);
      
      if (!org) {
        return res.status(404).json({ error: 'Organization not found' });
      }

      // Resolve subscription state (handles webhook lag)
      const { hasSubscription, subId } = await resolveOrgSubscriptionState(stripe, storage, org);
      if (!hasSubscription) {
        return res.status(400).json({
          error: 'NO_SUB',
          message: 'No active subscription. Use /api/billing/checkout to start one.'
        });
      }

      const { priceLookupKey } = req.body;
      if (!priceLookupKey) {
        return res.status(400).json({ error: 'priceLookupKey required' });
      }

      // Extract seat cap from lookup key for downgrade validation
      const capMatch = priceLookupKey.match(/cap_(\d+)_/);
      const newSeatCap = capMatch ? parseInt(capMatch[1], 10) : null;
      
      // Validate downgrade against current usage
      if (newSeatCap && newSeatCap < (org.seatCap || 250)) {
        const usage = await storage.getOrgUsage(orgId);
        const eligibleCount = usage?.eligibleCount || 0;
        
        if (eligibleCount > newSeatCap) {
          return res.status(400).json({ 
            error: 'Cannot downgrade below current usage',
            message: `You currently have ${eligibleCount} eligible members, but the plan you selected supports only ${newSeatCap}. Please reduce your audience size or select a higher tier.`,
            eligibleCount,
            newSeatCap,
          });
        }
      }

      // Resolve target price from lookup key
      const prices = await stripe.prices.list({
        lookup_keys: [priceLookupKey],
        expand: ['data.product'],
      });

      const newPrice = prices.data?.[0];
      if (!newPrice) {
        return res.status(400).json({ error: 'Invalid price lookup key' });
      }

      // Fetch current subscription & primary item
      const sub = await stripe.subscriptions.retrieve(subId!, {
        expand: ['items']
      });
      
      const item = sub.items.data?.[0];
      if (!item) {
        return res.status(400).json({ error: 'Subscription has no items' });
      }

      // Update the item price WITHOUT proration - will take effect after trial ends
      const updated = await stripe.subscriptions.update(sub.id, {
        items: [{ id: item.id, price: newPrice.id }],
        proration_behavior: 'none',
        metadata: { org_id: orgId }
      });

      // Track plan selection event
      await storage.trackEvent({
        orgId,
        eventType: 'plan_scheduled',
        userId: req.session.userId || null,
        metadata: { 
          priceLookupKey, 
          oldSeatCap: org.seatCap,
          newSeatCap,
          subscriptionId: updated.id 
        },
      });

      res.json({ subscriptionId: updated.id, status: updated.status });
    } catch (error) {
      console.error('Schedule change error:', error);
      res.status(500).json({ error: 'Failed to schedule plan change' });
    }
  });

  // Billing API - Create Portal Session (Owner only)
  app.post('/api/billing/portal', requireRole('owner'), async (req, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ error: 'Stripe not configured' });
      }

      const orgId = req.session.orgId!;
      const org = await storage.getOrg(orgId);
      
      if (!org || !org.stripeCustomerId) {
        return res.status(400).json({ error: 'No billing account found' });
      }

      const baseUrl = process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'http://localhost:5000';
      const returnUrl = `${baseUrl}/admin/billing`;

      const session = await stripe.billingPortal.sessions.create({
        customer: org.stripeCustomerId,
        configuration: 'bpc_1SGKiX8PaOLOdaxJKwEpo6PW',
        return_url: returnUrl,
      });

      res.json({ url: session.url });
    } catch (error) {
      console.error('Portal error:', error);
      res.status(500).json({ error: 'Failed to create portal session' });
    }
  });

  // Keep legacy /api/billing/usage for backwards compatibility
  app.get('/api/billing/usage', requireAuth, async (req, res) => {
    try {
      const orgId = req.session.orgId!;
      const org = await storage.getOrg(orgId);
      const slackTeam = await storage.getSlackTeamByOrgId(orgId);
      
      if (!org) {
        return res.status(404).json({ error: 'Organization not found' });
      }

      const settings = org.settings as any || {};
      const plan = settings.plan || 'trial';
      const trialEndsAt = settings.trialEndsAt;
      
      let detectedMembers = 0;
      if (slackTeam && slackTeam.accessToken) {
        let usage = await storage.getOrgUsage(orgId);
        
        if (!usage) {
          let audience = await storage.getOrgAudience(orgId);
          if (!audience) {
            audience = await storage.upsertOrgAudience({
              orgId,
              mode: 'workspace',
              excludeGuests: true,
            });
          }
          
          const { recomputeEligibleCount } = await import('./services/audience');
          const eligibleCount = await recomputeEligibleCount(slackTeam.accessToken, audience);
          usage = await storage.upsertOrgUsage({
            orgId,
            eligibleCount,
          });
        }
        
        detectedMembers = usage.eligibleCount;
      }
      
      const seatCap = org.seatCap || 250;
      let trialDaysLeft = null;
      if (org.trialEnd) {
        const now = new Date();
        const diff = org.trialEnd.getTime() - now.getTime();
        trialDaysLeft = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
      }
      
      const usagePercent = seatCap > 0 ? Math.round((detectedMembers / seatCap) * 100) : 0;
      
      res.json({
        detectedMembers,
        seatCap,
        plan,
        trialDaysLeft,
        usagePercent,
        isOverCap: detectedMembers > seatCap,
        isNearCap: usagePercent >= 90,
      });
    } catch (error) {
      console.error('Billing usage error:', error);
      res.status(500).json({ error: 'Failed to fetch billing usage' });
    }
  });

  // Slack digest preview
  app.post('/api/slack/digest-preview', requireRole('owner', 'admin'), async (req, res) => {
    try {
      const orgId = req.session.orgId!;
      const slackTeam = await storage.getSlackTeamByOrgId(orgId);
      const settings = await storage.getSlackSettings(orgId);
      
      if (!slackTeam || !settings?.digestChannel) {
        return res.status(400).json({ error: 'Slack not connected or digest channel not configured' });
      }

      const client = new WebClient(slackTeam.accessToken);
      
      // Send a sample digest message
      await client.chat.postMessage({
        channel: settings.digestChannel,
        text: '📊 Sample Daily Digest from Teammato',
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '📊 Sample Daily Digest',
            },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '*This is a preview of your daily digest.* Real digests will include:\n\n• New feedback threads ready for review\n• Recent activity summary\n• Topics that need attention\n\nYou can customize this in your Slack settings.',
            },
          },
        ],
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error('Digest preview error:', error);
      res.status(500).json({ error: 'Failed to send digest preview' });
    }
  });

  // Analytics API (admin-only)
  app.get('/api/analytics/topic-activity', requireRole('owner', 'admin'), requireActiveSubscription, async (req, res) => {
    try {
      const orgId = req.session.orgId!;
      const activity = await storage.getTopicActivity(orgId);
      res.json(activity);
    } catch (error) {
      console.error('Topic activity error:', error);
      res.status(500).json({ error: 'Failed to fetch topic activity' });
    }
  });

  app.get('/api/analytics/weekly-trend', requireRole('owner', 'admin'), requireActiveSubscription, async (req, res) => {
    try {
      const orgId = req.session.orgId!;
      const days = parseInt(req.query.days as string) || 7;
      const trend = await storage.getWeeklyActivityTrend(orgId, days);
      res.json(trend);
    } catch (error) {
      console.error('Weekly trend error:', error);
      res.status(500).json({ error: 'Failed to fetch weekly trend' });
    }
  });

  app.get('/api/analytics/participant-count', requireRole('owner', 'admin'), requireActiveSubscription, async (req, res) => {
    try {
      const orgId = req.session.orgId!;
      const count = await storage.getUniqueParticipantCount(orgId);
      res.json({ count });
    } catch (error) {
      console.error('Participant count error:', error);
      res.status(500).json({ error: 'Failed to fetch participant count' });
    }
  });

  // Export API (admin-only)
  app.post('/api/export/analytics', requireRole('owner', 'admin'), requireActiveSubscription, async (req, res) => {
    try {
      const orgId = req.session.orgId!;
      const { format, timeRange } = req.body;
      
      if (!['csv', 'json'].includes(format)) {
        return res.status(400).json({ error: 'Invalid format. Supported formats: csv, json' });
      }
      
      const activity = await storage.getTopicActivity(orgId);
      const participantCount = await storage.getUniqueParticipantCount(orgId);
      
      let data = '';
      if (format === 'csv') {
        data = 'Topic,Thread Count,Item Count\n';
        activity.forEach((item: any) => {
          const topicName = (item.topicName || 'Unnamed').replace(/"/g, '""');
          data += `"${topicName}",${item.threadCount || 0},${item.itemCount || 0}\n`;
        });
        data += `\nTotal Participants,${participantCount}\n`;
        data += `Time Range,${timeRange}\n`;
      } else if (format === 'json') {
        data = JSON.stringify({ activity, participantCount, timeRange, exportedAt: new Date().toISOString() }, null, 2);
      }
      
      res.json({ data });
    } catch (error) {
      console.error('Export analytics error:', error);
      res.status(500).json({ error: 'Failed to export analytics' });
    }
  });

  app.post('/api/export/threads', requireRole('owner', 'admin'), requireActiveSubscription, async (req, res) => {
    try {
      const orgId = req.session.orgId!;
      // Use k-safe method that only returns threads meeting k-anonymity threshold
      const threads = await storage.getKSafeThreads(orgId);
      
      const exportData = threads.map((thread: any) => ({
        id: thread.id,
        topicId: thread.topicId,
        status: thread.status,
        createdAt: roundTimestampToDay(thread.createdAt),
        participantCount: thread.participantCount || 0,
        renderState: thread.renderState, // Include render_state for transparency
      }));
      
      res.json({ data: JSON.stringify(exportData, null, 2) });
    } catch (error) {
      console.error('Export threads error:', error);
      res.status(500).json({ error: 'Failed to export threads' });
    }
  });

  app.post('/api/export/comments', requireRole('owner', 'admin'), requireActiveSubscription, async (req, res) => {
    try {
      const orgId = req.session.orgId!;
      // Use k-safe method that only returns comments from threads meeting k-anonymity threshold
      const comments = await storage.getKSafeComments(orgId);
      
      const exportData = comments.map((comment: any) => ({
        id: comment.id,
        threadId: comment.threadId,
        status: comment.status,
        createdAt: roundTimestampToDay(comment.createdAt),
        renderState: comment.renderState, // Include render_state for transparency
      }));
      
      res.json({ data: JSON.stringify(exportData, null, 2) });
    } catch (error) {
      console.error('Export comments error:', error);
      res.status(500).json({ error: 'Failed to export feedback items' });
    }
  });

  app.post('/api/export/audit', requireRole('owner', 'admin'), requireActiveSubscription, async (req, res) => {
    try {
      const orgId = req.session.orgId!;
      
      // Only export audit logs for threads and comments that meet k-anonymity threshold
      const threads = await storage.getKSafeThreads(orgId);
      const comments = await storage.getKSafeComments(orgId);
      const allAudit: any[] = [];
      
      // Get audit entries only for k-safe threads
      for (const thread of threads) {
        if (thread.id) {
          const threadAudit = await storage.getModerationAudit('thread', thread.id, orgId);
          allAudit.push(...threadAudit);
        }
      }
      
      // Get audit entries only for k-safe comments
      for (const comment of comments) {
        if (comment.id) {
          const itemAudit = await storage.getModerationAudit('item', comment.id, orgId);
          allAudit.push(...itemAudit);
        }
      }
      
      let data = 'Timestamp,Action Type,Target Type,Target ID,Moderator ID,Reason\n';
      allAudit.forEach((log: any) => {
        const timestamp = roundTimestampToDay(log.createdAt) || 'Unknown';
        const reason = (log.reason || '').replace(/"/g, '""');
        data += `"${timestamp}","${log.actionType}","${log.targetType}","${log.targetId}","${log.moderatorId || 'N/A'}","${reason}"\n`;
      });
      
      res.json({ data });
    } catch (error) {
      console.error('Export audit error:', error);
      res.status(500).json({ error: 'Failed to export audit log' });
    }
  });

  // Slack Settings API (admin-only)
  app.get('/api/slack-settings', requireRole('owner', 'admin'), async (req, res) => {
    try {
      const orgId = req.session.orgId!;
      const settings = await storage.getSlackSettings(orgId);
      res.json(settings || { orgId, digestChannel: null, digestEnabled: false });
    } catch (error) {
      console.error('Get Slack settings error:', error);
      res.status(500).json({ error: 'Failed to fetch Slack settings' });
    }
  });

  app.post('/api/slack-settings', requireRole('owner', 'admin'), async (req, res) => {
    try {
      const orgId = req.session.orgId!;
      
      // Validate request body
      const bodySchema = z.object({
        digestChannel: z.string().nullable().optional(),
        digestEnabled: z.boolean().optional(),
      });
      
      const result = bodySchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: 'Invalid request body', details: result.error });
      }
      
      const { digestChannel, digestEnabled } = result.data;
      
      const settings = await storage.upsertSlackSettings({
        orgId,
        digestChannel: digestChannel || null,
        digestEnabled: digestEnabled || false,
      });
      
      res.json(settings);
    } catch (error) {
      console.error('Update Slack settings error:', error);
      res.status(500).json({ error: 'Failed to update Slack settings' });
    }
  });

  // Topic Suggestions API (admin-only)
  app.get('/api/topic-suggestions', requireRole('owner', 'admin'), async (req, res) => {
    try {
      const orgId = req.session.orgId!;
      const status = req.query.status as string | undefined;
      
      const suggestions = await storage.getTopicSuggestions(orgId, status);
      
      // Enhance with suggester information (supporterCount already included from storage)
      const enhanced = await Promise.all(
        suggestions.map(async (suggestion) => {
          let suggesterEmail = null;
          if (suggestion.suggestedBy) {
            const suggester = await storage.getUser(suggestion.suggestedBy);
            suggesterEmail = suggester?.email || null;
          }
          
          return {
            ...suggestion,
            suggesterEmail,
          };
        })
      );
      
      res.json(enhanced);
    } catch (error) {
      console.error('Get topic suggestions error:', error);
      res.status(500).json({ error: 'Failed to fetch topic suggestions' });
    }
  });

  app.patch('/api/topic-suggestions/:id', requireRole('owner', 'admin'), async (req, res) => {
    try {
      const orgId = req.session.orgId!;
      const { status } = req.body;
      
      if (!status || !['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status. Must be "approved" or "rejected"' });
      }
      
      const suggestion = await storage.updateTopicSuggestionStatus(req.params.id, status, orgId);
      
      if (!suggestion) {
        return res.status(404).json({ error: 'Topic suggestion not found' });
      }
      
      // If approved, create a new topic
      if (status === 'approved') {
        const slug = suggestion.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
        
        await storage.createTopic({
          orgId,
          name: suggestion.title,
          slug,
          description: null,
          slackChannelId: null,
          kThreshold: 5,
          isActive: true,
          windowDays: 21,
          status: 'collecting',
          ownerId: req.session.userId!,
          suggestionId: suggestion.id,
          actionNotes: null,
          parentTopicId: null,
          isParent: false,
          windowStart: null,
          windowEnd: null,
          instanceIdentifier: null,
          expiresAt: null,
        });
      }
      
      res.json(suggestion);
    } catch (error: any) {
      console.error('Update topic suggestion error:', error);
      
      // Handle slug uniqueness violation
      if (error.code === '23505' && error.constraint?.includes('slug')) {
        return res.status(409).json({ 
          error: 'A topic with this name already exists. Please modify the suggestion or reject it.' 
        });
      }
      
      res.status(500).json({ error: 'Failed to update topic suggestion' });
    }
  });

  // User Management API (admin-only)
  app.get('/api/users', requireRole('owner', 'admin'), async (req, res) => {
    try {
      const orgId = req.session.orgId!;
      
      // Get all active users
      const users = await storage.getOrgUsers(orgId);
      
      // Get pending invitations
      const pendingInvitations = await storage.getOrgInvitations(orgId, 'pending');
      
      // Enhance invitations with inviter information
      const enhancedInvitations = await Promise.all(
        pendingInvitations.map(async (invitation) => {
          const inviter = await storage.getUser(invitation.invitedBy);
          return {
            ...invitation,
            inviterEmail: inviter?.email || null,
          };
        })
      );
      
      res.json({
        users,
        pendingInvitations: enhancedInvitations,
      });
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  app.post('/api/invitations', requireRole('owner', 'admin'), async (req, res) => {
    try {
      const orgId = req.session.orgId!;
      const inviterId = req.session.userId!;
      
      // Validate request body
      const bodySchema = z.object({
        slackHandle: z.string().min(1),
        role: z.enum(['owner', 'admin', 'moderator', 'viewer']),
      });
      
      const result = bodySchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: 'Invalid request body', details: result.error });
      }
      
      const { slackHandle, role } = result.data;
      
      // Only owners can invite other owners
      if (role === 'owner' && req.session.role !== 'owner') {
        return res.status(403).json({ error: 'Only owners can invite other owners' });
      }
      
      // Get Slack team to use their access token
      const slackTeam = await storage.getSlackTeamByOrgId(orgId);
      if (!slackTeam) {
        return res.status(400).json({ error: 'Slack team not connected' });
      }
      
      const slackClient = new WebClient(slackTeam.accessToken);
      
      // Remove @ prefix if present
      const cleanHandle = slackHandle.startsWith('@') ? slackHandle.slice(1) : slackHandle;
      
      // Look up Slack user by handle (search all users)
      const usersListResponse = await slackClient.users.list({});
      const slackUser = (usersListResponse.members as any[])?.find(
        (member: any) => member.name === cleanHandle || member.profile?.display_name === cleanHandle
      );
      
      if (!slackUser) {
        return res.status(404).json({ error: 'Slack user not found. Please check the handle.' });
      }
      
      const slackUserId = slackUser.id;
      const email = slackUser.profile?.email || null;
      
      // Check if user is already in the org
      const existingUser = await storage.getUserBySlackId(slackUserId, orgId);
      if (existingUser) {
        return res.status(409).json({ error: 'User is already a member of this organization' });
      }
      
      // Check if there's already a pending invitation
      const existingInvitation = await storage.getPendingInvitationBySlackUserId(slackUserId, orgId);
      if (existingInvitation) {
        return res.status(409).json({ error: 'User already has a pending invitation' });
      }
      
      // Create invitation (expires in 7 days)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      const invitation = await storage.createInvitation({
        orgId,
        slackUserId,
        slackHandle: cleanHandle,
        email,
        role,
        invitedBy: inviterId,
        status: 'pending',
        expiresAt,
      });
      
      // Get inviter info for the DM
      const inviter = await storage.getUser(inviterId);
      const inviterName = inviter?.email || 'An admin';
      
      // Send DM with invitation button
      try {
        await slackClient.chat.postMessage({
          channel: slackUserId,
          text: `You've been invited to join Teammato!`,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `Hi <@${slackUserId}>! ${inviterName} has invited you to be an *${role}* on Teammato.`,
              },
            },
            {
              type: 'actions',
              elements: [
                {
                  type: 'button',
                  text: {
                    type: 'plain_text',
                    text: 'Accept Invitation',
                  },
                  style: 'primary',
                  value: invitation.id,
                  action_id: 'accept_invitation',
                },
              ],
            },
          ],
        });
      } catch (dmError) {
        console.error('Failed to send DM:', dmError);
        // Still return success - invitation is created
      }
      
      res.json(invitation);
    } catch (error) {
      console.error('Create invitation error:', error);
      res.status(500).json({ error: 'Failed to create invitation' });
    }
  });

  app.patch('/api/users/:id/role', requireRole('owner', 'admin'), async (req, res) => {
    try {
      const orgId = req.session.orgId!;
      const userId = req.params.id;
      const currentUserRole = req.session.role!;
      
      // Validate request body
      const bodySchema = z.object({
        role: z.enum(['owner', 'admin', 'moderator', 'viewer']),
      });
      
      const result = bodySchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: 'Invalid request body', details: result.error });
      }
      
      const { role } = result.data;
      
      // Only owners can promote to owner or demote owners
      if ((role === 'owner' || currentUserRole !== 'owner')) {
        const targetUser = await storage.getUser(userId);
        if (targetUser?.role === 'owner' && currentUserRole !== 'owner') {
          return res.status(403).json({ error: 'Only owners can change owner roles' });
        }
      }
      
      if (role === 'owner' && currentUserRole !== 'owner') {
        return res.status(403).json({ error: 'Only owners can promote users to owner' });
      }
      
      // Prevent users from changing their own role
      if (userId === req.session.userId) {
        return res.status(400).json({ error: 'Cannot change your own role' });
      }
      
      const updatedUser = await storage.updateUserRole(userId, role, orgId);
      
      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json(updatedUser);
    } catch (error) {
      console.error('Update user role error:', error);
      res.status(500).json({ error: 'Failed to update user role' });
    }
  });

  app.delete('/api/users/:id', requireRole('owner', 'admin'), async (req, res) => {
    try {
      const orgId = req.session.orgId!;
      const userId = req.params.id;
      
      // Prevent users from deleting themselves
      if (userId === req.session.userId) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
      }
      
      // Check if target user exists and get their role
      const targetUser = await storage.getUser(userId);
      if (!targetUser || targetUser.orgId !== orgId) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Only owners can delete other owners
      if (targetUser.role === 'owner' && req.session.role !== 'owner') {
        return res.status(403).json({ error: 'Only owners can delete other owners' });
      }
      
      await storage.deleteUser(userId, orgId);
      
      res.json({ success: true });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  });

  // Feedback Management API (moderator-only)
  app.get('/api/feedback/threads', requireRole('owner', 'admin', 'moderator'), requireActiveSubscription, async (req, res) => {
    try {
      const orgId = req.session.orgId!;
      const threads = await storage.getFeedbackThreads(orgId);
      res.json(threads);
    } catch (error) {
      console.error('Get threads error:', error);
      res.status(500).json({ error: 'Failed to fetch threads' });
    }
  });

  app.get('/api/feedback/threads/:id', requireRole('owner', 'admin', 'moderator'), requireActiveSubscription, async (req, res) => {
    try {
      const orgId = req.session.orgId!;
      const thread = await storage.getFeedbackThread(req.params.id);
      
      if (!thread) {
        return res.status(404).json({ error: 'Thread not found' });
      }
      
      // Verify thread belongs to user's org
      if (thread.orgId !== orgId) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      const items = await storage.getFeedbackItemsByThread(thread.id);
      
      // Sanitize items to remove PII (slackUserId) and correlation vectors (submitterHash) for moderators
      const sanitizedItems = items.map(item => ({
        id: item.id,
        threadId: item.threadId,
        topicId: item.topicId,
        orgId: item.orgId,
        content: item.content,
        behavior: item.behavior,
        impact: item.impact,
        situationCoarse: item.situationCoarse,
        createdAtDay: item.createdAtDay,
        status: item.status,
        moderationStatus: item.moderationStatus,
        moderationNotes: item.moderationNotes,
        moderatorId: item.moderatorId,
        moderatedAt: item.moderatedAt,
        createdAt: item.createdAt,
        // Explicitly exclude slackUserId, submitterHash, contentCt, behaviorCt, impactCt, nonce, aadHash
      }));
      
      res.json({
        ...thread,
        items: sanitizedItems,
      });
    } catch (error) {
      console.error('Get thread error:', error);
      res.status(500).json({ error: 'Failed to fetch thread' });
    }
  });

  app.post('/api/feedback/items/:id/moderate', requireRole('owner', 'admin', 'moderator'), requireActiveSubscription, async (req, res) => {
    try {
      const { status } = req.body;
      const itemId = req.params.id;
      const moderatorId = req.session.userId!;
      const orgId = req.session.orgId!;
      
      if (!status || !['approved', 'hidden', 'removed', 'pending'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      
      // Update with org scoping for security
      await storage.updateFeedbackItemStatus(itemId, status, moderatorId, orgId);
      res.json({ success: true });
    } catch (error) {
      console.error('Moderate item error:', error);
      res.status(500).json({ error: 'Failed to moderate item' });
    }
  });

  // Zod validation schemas for moderation
  const threadModerationSchema = z.object({
    moderationStatus: z.enum(['auto_approved', 'pending_review', 'flagged', 'approved', 'hidden', 'archived']),
    notes: z.string().optional(),
    reason: z.string().optional(),
  });

  const itemModerationSchema = z.object({
    moderationStatus: z.enum(['auto_approved', 'pending_review', 'flagged', 'approved', 'hidden']),
    notes: z.string().optional(),
    reason: z.string().optional(),
  });

  // Moderation - Update thread moderation status
  app.post('/api/moderation/threads/:id', requireRole('owner', 'admin', 'moderator'), async (req, res) => {
    try {
      const validation = threadModerationSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: 'Invalid request body', details: validation.error });
      }

      const { moderationStatus, notes, reason } = validation.data;
      const threadId = req.params.id;
      const moderatorId = req.session.userId!;
      const orgId = req.session.orgId!;
      
      // Get current thread to log previous status
      const currentThread = await storage.getFeedbackThread(threadId);
      if (!currentThread) {
        return res.status(404).json({ error: 'Thread not found' });
      }
      
      if (currentThread.orgId !== orgId) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      // Update thread moderation status
      const updatedThread = await storage.updateThreadModerationStatus(
        threadId, 
        moderationStatus, 
        moderatorId, 
        orgId, 
        notes
      );
      
      // Create audit trail
      await storage.createModerationAudit({
        orgId,
        targetType: 'thread',
        targetId: threadId,
        action: moderationStatus,
        previousStatus: currentThread.moderationStatus,
        newStatus: moderationStatus,
        reason,
        adminUserId: moderatorId,
      });
      
      res.json(updatedThread);
    } catch (error) {
      console.error('Moderate thread error:', error);
      res.status(500).json({ error: 'Failed to moderate thread' });
    }
  });

  // Moderation - Update item moderation status
  app.post('/api/moderation/items/:id', requireRole('owner', 'admin', 'moderator'), async (req, res) => {
    try {
      const validation = itemModerationSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: 'Invalid request body', details: validation.error });
      }

      const { moderationStatus, notes, reason } = validation.data;
      const itemId = req.params.id;
      const moderatorId = req.session.userId!;
      const orgId = req.session.orgId!;
      
      // Get current item to log previous status and verify org
      const currentItem = await storage.getFeedbackItem(itemId, orgId);
      
      if (!currentItem) {
        return res.status(404).json({ error: 'Item not found or access denied' });
      }
      
      // Update item moderation status
      const updatedItem = await storage.updateItemModerationStatus(
        itemId, 
        moderationStatus, 
        moderatorId, 
        orgId, 
        notes
      );
      
      // Create audit trail
      await storage.createModerationAudit({
        orgId,
        targetType: 'item',
        targetId: itemId,
        action: moderationStatus,
        previousStatus: currentItem.moderationStatus,
        newStatus: moderationStatus,
        reason,
        adminUserId: moderatorId,
      });
      
      // Sanitize response to remove PII (slackUserId) and correlation vectors (submitterHash) for moderators
      const sanitizedItem = updatedItem ? {
        id: updatedItem.id,
        threadId: updatedItem.threadId,
        topicId: updatedItem.topicId,
        orgId: updatedItem.orgId,
        content: updatedItem.content,
        behavior: updatedItem.behavior,
        impact: updatedItem.impact,
        situationCoarse: updatedItem.situationCoarse,
        createdAtDay: updatedItem.createdAtDay,
        status: updatedItem.status,
        moderationStatus: updatedItem.moderationStatus,
        moderationNotes: updatedItem.moderationNotes,
        moderatorId: updatedItem.moderatorId,
        moderatedAt: updatedItem.moderatedAt,
        createdAt: updatedItem.createdAt,
        // Explicitly exclude slackUserId, submitterHash, contentCt, behaviorCt, impactCt, nonce, aadHash
      } : null;
      
      res.json(sanitizedItem);
    } catch (error) {
      console.error('Moderate item error:', error);
      res.status(500).json({ error: 'Failed to moderate item' });
    }
  });

  // Moderation - Get audit trail
  app.get('/api/moderation/audit/:targetType/:targetId', requireRole('owner', 'admin', 'moderator'), async (req, res) => {
    try {
      const { targetType, targetId } = req.params;
      const orgId = req.session.orgId!;
      
      if (!['thread', 'item'].includes(targetType)) {
        return res.status(400).json({ error: 'Invalid target type' });
      }
      
      const audit = await storage.getModerationAudit(targetType, targetId, orgId);
      res.json(audit);
    } catch (error) {
      console.error('Get audit error:', error);
      res.status(500).json({ error: 'Failed to fetch audit trail' });
    }
  });

  // Slack Slash Command - Submit anonymous feedback
  app.post('/api/slack/command', async (req, res) => {
    try {
      // Verify Slack signature
      if (!verifySlackSignature(req)) {
        console.error('Invalid Slack signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }

      // Parse form-urlencoded body (Slack sends this format)
      // express.raw() stored the body as a Buffer in req.body
      const bodyString = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : '';
      const body = new URLSearchParams(bodyString);
      const teamId = body.get('team_id');
      const userId = body.get('user_id');
      const text = body.get('text')?.trim();

      if (!teamId || !userId) {
        return res.json({
          response_type: 'ephemeral',
          text: '❌ Missing required parameters from Slack.',
        });
      }

      // Look up org from Slack team
      const slackTeam = await storage.getSlackTeamByTeamId(teamId);
      if (!slackTeam) {
        return res.json({
          response_type: 'ephemeral',
          text: '❌ Your Slack workspace is not connected. Please install the Teammato app first.',
        });
      }

      const orgId = slackTeam.orgId;

      // Billing gate: check if org has active subscription
      const org = await storage.getOrg(orgId);
      if (!org) {
        return res.json({
          response_type: 'ephemeral',
          text: '❌ Organization not found.',
        });
      }

      // Get usage data for seat cap checking
      const usage = await storage.getOrgUsage(orgId);
      const orgWithUsage = { ...org, eligibleCount: usage?.eligibleCount || 0 };
      
      // Check and transition billing state (persists changes)
      const writeCheck = await checkAndTransitionBillingState(orgWithUsage);
      if (!writeCheck.allowed) {
        const baseUrl = process.env.REPLIT_DOMAINS 
          ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` 
          : 'http://localhost:5000';
        const billingUrl = `${baseUrl}/admin/billing`;
        
        return res.json({
          response_type: 'ephemeral',
          text: `🔒 *Teammato isn't fully set up*\n\n${writeCheck.reason}\n\n<${billingUrl}|Complete setup →>`,
        });
      }

      // Handle special commands
      if (!text || text === 'list' || text === 'help') {
        // Get active topics for this org
        const topics = await storage.getTopics(orgId);
        const activeTopics = topics.filter(t => t.isActive);
        
        if (activeTopics.length === 0) {
          return res.json({
            response_type: 'ephemeral',
            text: '📋 No active topics available.\n\nPlease contact your admin to set up feedback topics.',
          });
        }
        
        const topicList = activeTopics
          .map(t => {
            const expiryInfo = t.expiresAt 
              ? ` (expires ${new Date(t.expiresAt).toLocaleDateString()})`
              : '';
            const statusIcon = t.status === 'collecting' ? '📝' : 
                              t.status === 'in_review' ? '👀' :
                              t.status === 'action_decided' ? '✅' : '🎯';
            return `• ${statusIcon} \`${t.slug}\` - ${t.name}${expiryInfo}`;
          })
          .join('\n');
        
        return res.json({
          response_type: 'ephemeral',
          text: `🎯 *Teammato - Anonymous Team Feedback*\nShare honest feedback without revealing your identity. All submissions are anonymous and protected by k-anonymity (minimum 5 people).\n\n📋 *Active Topics*\n${topicList}\n\n💬 *Submit Feedback*\n\`/teammato <topic-slug>\` - Submit to specific topic\n\`/teammato <your message>\` - Submit general feedback\n\n*Examples:*\n• \`/teammato testing\` (case-insensitive ✓)\n• \`/teammato TESTING\` (same result)\n• \`/teammato My general feedback here\`\n\n💡 *Suggest a Topic*\n\`/teammato suggest "Topic Name"\` - Propose new feedback topic\n_Note: Your name is attached to suggestions (not to feedback)_\n\n🔒 *Privacy Tips*\n• Avoid identifying details (team names, specific projects, dates)\n• Don't mention your role or location\n• Use general language to maintain anonymity`,
        });
      }

      // Handle 'suggest' command with anti-spam guardrails
      if (text === 'suggest' || text.startsWith('suggest ')) {
        const topicName = text === 'suggest' ? '' : text.slice(8).trim();
        
        // Validate topic name
        if (topicName.length === 0) {
          return res.json({
            response_type: 'ephemeral',
            text: '❌ Please provide a topic name.\n\nUsage: `/teammato suggest "Your Topic Name"`\n\nExample: `/teammato suggest "Improve code review process"`',
          });
        }
        
        if (topicName.length < 5) {
          return res.json({
            response_type: 'ephemeral',
            text: '❌ Topic title must be at least 5 characters.\n\nUsage: `/teammato suggest "Your Topic Name"`',
          });
        }
        
        if (topicName.length > 60) {
          return res.json({
            response_type: 'ephemeral',
            text: '❌ Topic title must be 60 characters or less.\n\nUsage: `/teammato suggest "Your Topic Name"`',
          });
        }
        
        // Find or create user for suggested_by
        let userRecord = await storage.getUserBySlackId(userId, orgId);
        if (!userRecord) {
          userRecord = await storage.createUser({
            orgId,
            slackUserId: userId,
            email: null,
            role: 'viewer',
          });
        }
        
        // Guardrail 1: Check 24-hour cooldown
        if (userRecord.lastSuggestionAt) {
          const timeSinceLastSuggestion = Date.now() - userRecord.lastSuggestionAt.getTime();
          const cooldownPeriod = 24 * 60 * 60 * 1000; // 24 hours in ms
          
          if (timeSinceLastSuggestion < cooldownPeriod) {
            const remainingMs = cooldownPeriod - timeSinceLastSuggestion;
            const remainingHours = Math.ceil(remainingMs / (60 * 60 * 1000));
            const remainingMinutes = Math.ceil((remainingMs % (60 * 60 * 1000)) / (60 * 1000));
            
            return res.json({
              response_type: 'ephemeral',
              text: `⏳ You can suggest one topic every 24 hours.\n\nTry again in ${remainingHours}h ${remainingMinutes}m.`,
            });
          }
        }
        
        // Guardrail 2: Check org-wide pending limit (50)
        const pendingCount = await storage.getPendingSuggestionCount(orgId);
        if (pendingCount >= 50) {
          return res.json({
            response_type: 'ephemeral',
            text: '📥 The suggestion queue is full right now. Please try again later or ask an admin.',
          });
        }
        
        // Normalize title for similarity detection
        const normalizedTitle = topicName
          .toLowerCase()
          .trim()
          .replace(/[^\w\s]/g, '') // Remove punctuation
          .replace(/\s+/g, ' '); // Collapse spaces
        
        // Guardrail 3: Check for similar/duplicate suggestions
        const similarSuggestions = await storage.findSimilarSuggestions(orgId, normalizedTitle);
        
        if (similarSuggestions.length > 0) {
          const existing = similarSuggestions[0];
          // Add support to existing suggestion instead of creating duplicate
          await storage.addSuggestionSupport(existing.id, userRecord.id);
          
          return res.json({
            response_type: 'ephemeral',
            text: `🔁 Looks similar to an existing suggestion: "${existing.title}".\n\nWe've added your support to that suggestion instead.\n\n_Heads-up: Your name is attached to topic suggestions (feedback remains anonymous)._`,
          });
        }
        
        // Create new suggestion
        await storage.createTopicSuggestion({
          orgId,
          suggestedBy: userRecord.id,
          title: topicName,
          normalizedTitle,
          status: 'pending',
        });
        
        // Update user's last suggestion timestamp
        await storage.updateUser(userRecord.id, {
          lastSuggestionAt: new Date(),
        });
        
        return res.json({
          response_type: 'ephemeral',
          text: `✅ *Suggestion submitted:* "${topicName}"\n\n_Heads-up: Your name is attached to topic suggestions (feedback remains anonymous)._\n\nWe'll notify you if it's approved.`,
        });
      }

      // Parse topic slug and optional prefill text
      const parts = text.split(/\s+/);
      const topicSlug = parts[0].toLowerCase();
      const prefillText = parts.slice(1).join(' ');

      // Try to find topic by slug first
      let topic = await storage.getTopicBySlug(topicSlug, orgId);
      let isGeneralFeedback = false;
      let freeText = '';
      
      if (!topic) {
        // No matching topic - treat entire text as free text for general feedback
        freeText = text;
        isGeneralFeedback = true;
        
        // Get or create current general feedback instance
        let currentInstance = await storage.getCurrentGeneralFeedbackInstance(orgId);
        
        if (!currentInstance) {
          // Get first user in org to use as owner (or create system user)
          let ownerId: string | undefined;
          try {
            const user = await storage.getUserBySlackId(userId, orgId);
            ownerId = user?.id;
          } catch {
            // If no user found, pass undefined and let getOrCreateParentTopic handle it
            ownerId = undefined;
          }
          
          // Create parent topic if it doesn't exist
          const parent = await storage.getOrCreateParentTopic(orgId, ownerId || '');
          
          // Create first instance
          const now = new Date();
          const windowEnd = new Date(now);
          windowEnd.setDate(windowEnd.getDate() + parent.windowDays);
          
          // Generate instance identifier (e.g., "2025-W41")
          const weekNumber = getWeekNumber(now);
          const year = now.getFullYear();
          const instanceIdentifier = `${year}-W${weekNumber}`;
          
          currentInstance = await storage.createGeneralFeedbackInstance(
            parent.id,
            orgId,
            now,
            windowEnd,
            instanceIdentifier
          );
        }
        
        topic = currentInstance;
      }

      if (!topic.isActive) {
        return res.json({
          response_type: 'ephemeral',
          text: `❌ Topic "${topicSlug}" is currently inactive.`,
        });
      }

      // Check if topic has expired
      if (topic.expiresAt && new Date(topic.expiresAt) < new Date()) {
        return res.json({
          response_type: 'ephemeral',
          text: `❌ Topic "${topic.name}" has closed. Please contact your admin if you have questions.`,
        });
      }

      // Anti-gamification checks BEFORE opening modal
      // Check if user is the topic creator (cannot submit to own topic)
      if (topic.ownerId) {
        const userRecord = await storage.getUserBySlackId(userId, orgId);
        if (userRecord && userRecord.id === topic.ownerId) {
          return res.json({
            response_type: 'ephemeral',
            text: `*You created this topic and cannot submit feedback to it.*\n\nThis protects the integrity of anonymous feedback. Ask a colleague to submit instead, or create a different topic for mutual feedback.\n\n_Privacy tip: Topic creators can't submit to prevent self-selection bias._`,
          });
        }
      }

      // Check if user already submitted to this topic
      const hasSubmitted = await storage.hasUserSubmittedToTopic(topic.id, userId, orgId);
      if (hasSubmitted) {
        return res.json({
          response_type: 'ephemeral',
          text: `*You've already submitted feedback to this topic.*\n\nMultiple submissions are blocked to protect k-anonymity. Each person can only contribute once per topic.\n\n_Privacy tip: This prevents attackers from gaming the anonymity threshold._`,
        });
      }

      // Get trigger_id to open modal
      const triggerId = body.get('trigger_id');
      if (!triggerId) {
        return res.json({
          response_type: 'ephemeral',
          text: '❌ Failed to open feedback form. Please try again.',
        });
      }

      // Fetch topic owner info if available
      let ownerEmail: string | undefined;
      if (topic.ownerId) {
        const owner = await storage.getUser(topic.ownerId);
        if (owner) {
          ownerEmail = owner.email || undefined;
        }
      }

      // Calculate days remaining
      let daysRemaining: number | undefined;
      if (topic.windowEnd) {
        const msRemaining = new Date(topic.windowEnd).getTime() - new Date().getTime();
        daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
      }

      // Get participant count (how many have already submitted)
      const participantCount = await storage.getTopicParticipantCount(topic.id, orgId);

      // Build and open Modal A (two-step review flow)
      const client = new WebClient(slackTeam.accessToken);
      const modalA = buildInputModalA({
        topicName: topic.name,
        topicId: topic.id,
        orgId,
        prefill: {
          behavior: isGeneralFeedback ? freeText : (prefillText || undefined),
        },
        ownerEmail,
        daysRemaining,
        participantCount,
        kThreshold: topic.kThreshold,
      });

      try {
        await client.views.open({
          trigger_id: triggerId,
          view: modalA as any,
        });

        // If text was provided, acknowledge prefill
        if (prefillText) {
          return res.json({
            response_type: 'ephemeral',
            text: `✅ Feedback form opened with your text prefilled. Please review and submit when ready.`,
          });
        }

        // Return 200 OK for modal opening (Slack requires this)
        return res.status(200).send();
      } catch (error: any) {
        console.error('Failed to open modal:', error);
        return res.json({
          response_type: 'ephemeral',
          text: '❌ Failed to open feedback form. Please try again or contact your admin.',
        });
      }

    } catch (error) {
      console.error('Slack command error:', error);
      return res.json({
        response_type: 'ephemeral',
        text: '❌ An error occurred while processing your feedback. Please try again.',
      });
    }
  });

  // Helper function to build and publish App Home view
  async function publishAppHomeView(
    userId: string, 
    teamId: string, 
    orgId: string, 
    accessToken: string,
    errorMessage?: string
  ) {
    const client = new WebClient(accessToken);
    
    // Get active topics for this org
    const topics = await storage.getActiveTopics(orgId);
    
    // Build blocks for App Home
    const blocks: any[] = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: 'Teammato - Anonymous Feedback',
        }
      }
    ];
    
    // Add error message if provided
    if (errorMessage) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Notice:* ${errorMessage}`,
        }
      });
    }
    
    blocks.push(
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*Submit anonymous feedback to active topics below.*\n\nYour identity is protected by k-anonymity. Feedback is only revealed when enough participants contribute.',
        }
      },
      {
        type: 'divider'
      }
    );
    
    if (topics.length === 0) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*No active topics right now.*\n\nCheck back later or ask your admin to create a feedback topic.',
        }
      });
    } else {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*Active Topics:*',
        }
      });
      
      // Add each topic as a section with button
      for (const topic of topics) {
        const daysLeft = topic.expiresAt 
          ? Math.ceil((new Date(topic.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
          : null;
        
        const expiryText = daysLeft !== null && daysLeft >= 0
          ? `Closes in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`
          : topic.expiresAt ? 'Closed' : 'Open-ended';
        
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${topic.name}*\n${topic.description || ''}\n_${expiryText}_`,
          },
          accessory: {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Submit Feedback',
            },
            value: topic.slug,
            action_id: `submit_feedback_${topic.id}`,
          }
        });
      }
    }
    
    // Add help section
    blocks.push(
      {
        type: 'divider'
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: '*Quick Start:* Use `/teammato <topic>` to submit feedback from anywhere in Slack.',
          }
        ]
      }
    );
    
    // Publish the view
    await client.views.publish({
      user_id: userId,
      view: {
        type: 'home',
        blocks,
      }
    });
    
    console.log(`[App Home] Published view for user ${userId} in team ${teamId}${errorMessage ? ' with error message' : ''}`);
  }

  // Slack Events API - Handle events like app_uninstalled
  app.post('/api/slack/events', async (req, res) => {
    try {
      const event = req.body;
      
      // Handle URL verification challenge
      if (event.type === 'url_verification') {
        return res.json({ challenge: event.challenge });
      }
      
      // Acknowledge receipt immediately (Slack requires <3s response)
      res.status(200).send();
      
      // Process event asynchronously
      if (event.type === 'event_callback') {
        const eventData = event.event;
        
        if (eventData.type === 'app_uninstalled') {
          // Handle app uninstall
          const teamId = event.team_id;
          
          try {
            const slackTeam = await storage.getSlackTeamByTeamId(teamId);
            if (slackTeam) {
              const orgId = slackTeam.orgId;
              
              // 1. Mark org as disconnected by removing Slack team access token
              await storage.updateSlackTeamToken(teamId, '');
              
              // 2. Disable daily digests
              const slackSettings = await storage.getSlackSettings(orgId);
              if (slackSettings) {
                await storage.upsertSlackSettings({
                  orgId,
                  digestEnabled: false,
                  digestChannel: slackSettings.digestChannel, // Preserve channel for potential reinstall
                });
                console.log(`[Slack Events] Disabled digests for org ${orgId}`);
              }
              
              // 3. Create audit log entry
              // Find an owner or admin user to attribute this system event to
              const orgUsers = await storage.getOrgUsers(orgId);
              const ownerUser = orgUsers.find((u: User) => u.role === 'owner') || orgUsers.find((u: User) => u.role === 'admin') || orgUsers[0];
              
              if (ownerUser) {
                await storage.createModerationAudit({
                  orgId,
                  targetType: 'slack_integration',
                  targetId: slackTeam.id,
                  action: 'app_uninstalled',
                  reason: `Slack app uninstalled from team ${teamId}`,
                  adminUserId: ownerUser.id,
                  previousStatus: 'active',
                  newStatus: 'disconnected',
                });
                console.log(`[Slack Events] Created audit log for app uninstall`);
              }
              
              console.log(`[Slack Events] App uninstalled from team ${teamId}, org ${orgId}`);
            }
          } catch (error) {
            console.error('[Slack Events] Error handling app_uninstalled:', error);
          }
        }
        
        if (eventData.type === 'app_home_opened') {
          // Handle App Home view
          const { user, tab } = eventData;
          const teamId = event.team_id;
          
          // Only respond to 'home' tab, not 'messages' or 'about'
          if (tab !== 'home') {
            return;
          }
          
          try {
            const slackTeam = await storage.getSlackTeamByTeamId(teamId);
            if (!slackTeam) {
              console.error(`[App Home] No Slack team found for ${teamId}`);
              return;
            }
            
            await publishAppHomeView(user, teamId, slackTeam.orgId, slackTeam.accessToken);
          } catch (error) {
            console.error('[App Home] Error publishing home view:', error);
          }
        }
      }
    } catch (error) {
      console.error('[Slack Events] Error processing event:', error);
      // Still return 200 to avoid retries
      res.status(200).send();
    }
  });

  // Slack Modal Submission - Handle feedback modal submissions
  app.post('/api/slack/modal', async (req, res) => {
    console.log('[MODAL] Received modal submission');
    try {
      // Verify Slack signature
      if (!verifySlackSignature(req)) {
        console.error('[MODAL] Invalid Slack signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }

      // Parse the modal submission payload
      const bodyString = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : '';
      const body = new URLSearchParams(bodyString);
      const payloadStr = body.get('payload');
      
      if (!payloadStr) {
        console.error('[MODAL] Missing payload');
        return res.status(400).json({ error: 'Missing payload' });
      }

      const payload = JSON.parse(payloadStr);
      
      // Handle button actions (invitation acceptance, etc.)
      if (payload.type === 'block_actions') {
        const { user, team, actions } = payload;
        logSlackEvent(`Button action: ${actions[0]?.action_id}`);
        
        const action = actions[0];
        
        // Handle invitation acceptance
        if (action.action_id === 'accept_invitation') {
          const invitationId = action.value;
          
          try {
            // Get the invitation (without org scoping for now)
            const invitation = await storage.getInvitationById(invitationId);
            
            if (!invitation) {
              return res.json({
                text: '❌ Invitation not found. It may have expired or been revoked.',
              });
            }
            
            // Verify the invitation's org matches the Slack team sending this action
            const slackTeamForOrg = await storage.getSlackTeamByOrgId(invitation.orgId);
            if (!slackTeamForOrg || slackTeamForOrg.teamId !== team.id) {
              return res.json({
                text: '❌ This invitation is not valid for your Slack workspace.',
              });
            }
            
            if (invitation.status !== 'pending') {
              return res.json({
                text: '❌ This invitation has already been processed.',
              });
            }
            
            if (invitation.expiresAt < new Date()) {
              await storage.updateInvitationStatus(invitationId, 'expired', invitation.orgId);
              return res.json({
                text: '❌ This invitation has expired. Please ask your admin for a new invitation.',
              });
            }
            
            // Verify the invitation is for this user
            if (invitation.slackUserId !== user.id) {
              return res.json({
                text: '❌ This invitation is not for you.',
              });
            }
            
            // Get Slack user info to get email
            const slackTeam = await storage.getSlackTeamByOrgId(invitation.orgId);
            if (!slackTeam) {
              return res.json({
                text: '❌ Slack workspace not connected. Please contact your admin.',
              });
            }
            
            const slackClient = new WebClient(slackTeam.accessToken);
            const userInfo = await slackClient.users.info({ user: user.id });
            const email = (userInfo.user as any)?.profile?.email || invitation.email || null;
            
            // Create the user account
            await storage.createUser({
              orgId: invitation.orgId,
              slackUserId: user.id,
              email,
              role: invitation.role,
              profile: null,
            });
            
            // Mark invitation as accepted
            await storage.updateInvitationStatus(invitationId, 'accepted', invitation.orgId);
            
            logSlackEvent(`User accepted invitation and created as ${invitation.role}`);
            
            return res.json({
              text: `✅ Welcome to Teammato! You now have *${invitation.role}* access. You can start using \`/teammato\` commands in Slack.`,
            });
          } catch (error) {
            console.error('[MODAL] Error accepting invitation:', error);
            return res.json({
              text: '❌ Failed to process invitation. Please try again or contact your admin.',
            });
          }
        }
        
        // Handle "Go Back" button in Modal B (review)
        if (action.action_id === 'go_back_to_edit') {
          const pmB = JSON.parse(payload.view.private_metadata || "{}");
          const { orgId, topicId, topicName, beforeText } = pmB;
          
          // Parse SBI from beforeText to prefill Modal A
          const prefill = {
            situation: (beforeText.match(/Situation:\s*([\s\S]*?)(?:\n\nBehavior:|$)/)?.[1] ?? "").trim(),
            behavior: (beforeText.match(/Behavior:\s*([\s\S]*?)(?:\n\nImpact:|$)/)?.[1] ?? "").trim(),
            impact: (beforeText.match(/Impact:\s*([\s\S]*?)$/)?.[1] ?? "").trim(),
          };
          
          // Build Modal A with prefilled fields
          const modalA = buildInputModalA({ orgId, topicId, topicName, prefill });
          
          console.log('[MODAL] User went back to edit from review modal');
          return res.json({
            response_action: 'update',
            view: modalA,
          });
        }
        
        // Handle "Cancel" button in Modal B (review)
        if (action.action_id === 'cancel_review') {
          console.log('[MODAL] User cancelled review modal');
          return res.json({
            response_action: 'clear',
          });
        }
        
        // Handle App Home "Submit Feedback" button clicks
        if (action.action_id && action.action_id.startsWith('submit_feedback_')) {
          const topicId = action.action_id.replace('submit_feedback_', '');
          const topicSlug = action.value; // The slug is stored in the button value
          
          // Acknowledge the button click immediately
          res.status(200).send();
          
          // Process asynchronously to avoid timeout
          (async () => {
            try {
              // Get the Slack team and org
              const slackTeam = await storage.getSlackTeamByTeamId(team.id);
              if (!slackTeam) {
                console.error('[App Home] No Slack team found, cannot publish error view');
                return;
              }
              
              const orgId = slackTeam.orgId;
              
              // Get the topic
              const topic = await storage.getTopic(topicId, orgId);
              if (!topic || !topic.isActive) {
                await publishAppHomeView(
                  user.id,
                  team.id,
                  orgId,
                  slackTeam.accessToken,
                  '*This topic is no longer active.*'
                );
                return;
              }
              
              // Check if topic has expired
              if (topic.expiresAt && new Date(topic.expiresAt) < new Date()) {
                await publishAppHomeView(
                  user.id,
                  team.id,
                  orgId,
                  slackTeam.accessToken,
                  `*Topic "${topic.name}" has closed.*`
                );
                return;
              }
              
              // Anti-gamification checks
              // Check if user is the topic creator
              if (topic.ownerId) {
                const userRecord = await storage.getUserBySlackId(user.id, orgId);
                if (userRecord && userRecord.id === topic.ownerId) {
                  await publishAppHomeView(
                    user.id,
                    team.id,
                    orgId,
                    slackTeam.accessToken,
                    '*You created this topic and cannot submit feedback to it.*\n\nThis protects the integrity of anonymous feedback. Ask a colleague to submit instead.'
                  );
                  return;
                }
              }
              
              // Check if user already submitted
              const hasSubmitted = await storage.hasUserSubmittedToTopic(topic.id, user.id, orgId);
              if (hasSubmitted) {
                await publishAppHomeView(
                  user.id,
                  team.id,
                  orgId,
                  slackTeam.accessToken,
                  '*You\'ve already submitted feedback to this topic.*\n\nMultiple submissions are blocked to protect k-anonymity.'
                );
                return;
              }
              
              // Get trigger_id from the action payload
              const triggerId = payload.trigger_id;
              if (!triggerId) {
                await publishAppHomeView(
                  user.id,
                  team.id,
                  orgId,
                  slackTeam.accessToken,
                  `*Failed to open feedback form.* Please try the \`/teammato ${topicSlug}\` command instead.`
                );
                return;
              }
              
              // Fetch topic owner info
              let ownerEmail: string | undefined;
              if (topic.ownerId) {
                const owner = await storage.getUser(topic.ownerId);
                if (owner) {
                  ownerEmail = owner.email || undefined;
                }
              }

              // Calculate days remaining
              let daysRemaining: number | undefined;
              if (topic.windowEnd) {
                const msRemaining = new Date(topic.windowEnd).getTime() - new Date().getTime();
                daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
              }

              // Get participant count
              const participantCount = await storage.getTopicParticipantCount(topic.id, orgId);
              
              // Build and open Modal A (two-step review flow)
              const client = new WebClient(slackTeam.accessToken);
              const modalA = buildInputModalA({
                topicName: topic.name,
                topicId: topic.id,
                orgId,
                prefill: {},
                ownerEmail,
                daysRemaining,
                participantCount,
                kThreshold: topic.kThreshold,
              });
              
              await client.views.open({
                trigger_id: triggerId,
                view: modalA as any,
              });
              
              console.log(`[App Home] Opened feedback modal for topic ${topic.slug}`);
            } catch (error: any) {
              console.error('[App Home] Error opening modal from App Home:', error);
              // Try to show error in App Home
              try {
                const slackTeam = await storage.getSlackTeamByTeamId(team.id);
                if (slackTeam) {
                  await publishAppHomeView(
                    user.id,
                    team.id,
                    slackTeam.orgId,
                    slackTeam.accessToken,
                    '*Failed to open feedback form.* Please try the `/teammato` command instead.'
                  );
                }
              } catch (innerError) {
                console.error('[App Home] Failed to show error message:', innerError);
              }
            }
          })();
          
          return;
        }
        
        // Unknown action
        return res.json({
          text: '❌ Unknown action.',
        });
      }
      
      // Handle modal view submissions
      const { user, view, team } = payload;
      logSlackEvent(`Modal view submission`, { callback_id: view.callback_id });

      // TWO-STEP MODAL FLOW
      // A) From Modal A (teammato_input) → push Review Modal B
      if (view.callback_id === "teammato_input") {
        const pm = JSON.parse(view.private_metadata || "{}");
        const { topicId, orgId, topicName } = pm;

        // Extract SBI fields
        const situation = view.state.values?.["situation_b"]?.["situation"]?.value?.trim() ?? "";
        const behavior = view.state.values?.["behavior_b"]?.["behavior"]?.value?.trim() ?? "";
        const impact = view.state.values?.["impact_b"]?.["impact"]?.value?.trim() ?? "";

        // Validate (soft minimums)
        const errors: Record<string, Record<string, string>> = {};
        if (!behavior || behavior.length < 20) {
          errors["behavior_b"] = { behavior: "Please add at least a short description (≥ 20 chars)." };
        }
        if (!impact || impact.length < 15) {
          errors["impact_b"] = { impact: "Please add why it matters (≥ 15 chars)." };
        }
        if (Object.keys(errors).length > 0) {
          return res.json({ response_action: "errors", errors });
        }

        // Compose SBI for review
        const beforeText = [
          situation ? `Situation: ${situation}` : null,
          behavior ? `Behavior: ${behavior}` : null,
          impact ? `Impact: ${impact}` : null,
        ].filter(Boolean).join("\n\n");

        // SCRUB (replace, don't block)
        const scrub = scrubPIIForReview(beforeText);
        const scrubbedHighlighted = highlightRedactions(scrub.scrubbed);

        // Get topic for k-threshold
        const topic = await storage.getTopic(topicId, orgId);
        const k = topic?.kThreshold ?? 5;

        // REWRITE preview (coarsen for digest)
        const rewrittenPreview = prepQuoteForDigest(scrub.scrubbed, 240);

        // Build Modal B (review)
        const modalB = buildReviewModalB({
          topicName: topicName,
          topicId,
          orgId,
          k,
          beforeText,
          scrub,
          scrubbedHighlighted,
          rewrittenPreview,
        });

        // PUSH Modal B
        return res.json({
          response_action: "push",
          view: modalB,
        });
      }

      // B) From Modal B (teammato_review_send) → Final submission
      if (view.callback_id === "teammato_review_send") {
        const pmB = JSON.parse(view.private_metadata || "{}");
        const { orgId, topicId, topicName, scrubbed, rewritten, k } = pmB;

        // Check seat cap before accepting feedback
        const seatCapStatus = await getSeatCapStatus(orgId);
        if (seatCapStatus.status === 'blocked') {
          return res.json({
            response_action: 'errors',
            errors: {
              general: seatCapStatus.message || 'Seat capacity exceeded. Please contact your administrator.',
            },
          });
        }

        // Look up org from Slack team
        const slackTeam = await storage.getSlackTeamByTeamId(team.id);
        if (!slackTeam) {
          return res.json({
            response_action: 'errors',
            errors: {
              general: 'Your Slack workspace is not connected.',
            },
          });
        }

        // Get topic
        const topic = await storage.getTopic(topicId, orgId);
        if (!topic || !topic.isActive) {
          return res.json({
            response_action: 'errors',
            errors: {
              general: 'This topic is no longer active.',
            },
          });
        }

        // Anti-gamification checks
        if (topic.ownerId) {
          const userRecord = await storage.getUserBySlackId(user.id, orgId);
          if (userRecord && userRecord.id === topic.ownerId) {
            return res.json({
              response_action: 'errors',
              errors: {
                general: 'You created this topic and cannot submit feedback to it.',
              },
            });
          }
        }

        const hasSubmitted = await storage.hasUserSubmittedToTopic(topic.id, user.id, orgId);
        if (hasSubmitted) {
          return res.json({
            response_action: 'errors',
            errors: {
              general: "You've already submitted feedback to this topic.",
            },
          });
        }

        // Find or create collecting thread
        let thread = await storage.getActiveCollectingThread(topic.id, orgId);
        if (!thread) {
          try {
            thread = await storage.createFeedbackThread({
              orgId,
              topicId: topic.id,
              title: `${topic.name} Feedback`,
              status: 'collecting',
              kThreshold: topic.kThreshold,
              participantCount: 0,
              slackChannelId: topic.slackChannelId || null,
              slackMessageTs: null,
            });
          } catch (error: any) {
            if (error.code === '23505') {
              thread = await storage.getActiveCollectingThread(topic.id, orgId);
              if (!thread) {
                throw new Error('Failed to create or retrieve collecting thread');
              }
            } else {
              throw error;
            }
          }
        }

        // Generate submitter hash and coarsen situation (extract from scrubbed)
        const submitterHash = generateSubmitterHash(user.id, orgId, thread.id);
        const situationMatch = scrubbed.match(/Situation:\s*([\s\S]*?)(?:\n\nBehavior:|$)/);
        const behaviorMatch = scrubbed.match(/Behavior:\s*([\s\S]*?)(?:\n\nImpact:|$)/);
        const impactMatch = scrubbed.match(/Impact:\s*([\s\S]*?)$/);
        
        const situation = situationMatch?.[1]?.trim() || '';
        const behavior = behaviorMatch?.[1]?.trim() || '';
        const impact = impactMatch?.[1]?.trim() || '';
        
        const situationCoarse = coarsenSituation(situation);
        const createdAtDay = new Date().toISOString().slice(0, 10);

        // Submit feedback with SCRUBBED content
        try {
          await storage.createFeedbackItem({
            threadId: thread.id,
            topicId: topic.id,
            orgId,
            slackUserId: user.id,
            content: null,
            behavior,
            impact,
            situationCoarse,
            submitterHash,
            createdAtDay,
            status: 'pending',
            moderatorId: null,
            moderatedAt: null,
          });

          // Update participant count
          const participants = await storage.getUniqueParticipants(thread.id);
          await storage.updateThreadParticipantCount(thread.id, participants.length);

          if (participants.length >= thread.kThreshold && thread.status === 'collecting') {
            await storage.updateThreadStatus(thread.id, 'ready');
            console.log(`Thread ${thread.id} reached k-anonymity threshold (${participants.length}/${thread.kThreshold})`);
          }

          // Optional: post to channel (feature flag)
          const shouldPostToChannel = process.env.FEATURE_POST_TO_CHANNEL === "1";
          if (shouldPostToChannel && thread.slackChannelId) {
            const client = new WebClient(slackTeam.accessToken);
            try {
              await client.chat.postMessage({
                channel: thread.slackChannelId,
                blocks: [
                  { type: "header", text: { type: "plain_text", text: `New anonymous feedback: ${topicName}` } },
                  { type: "section", text: { type: "mrkdwn", text: `> ${rewritten}` } },
                  { type: "context", elements: [{ type: "mrkdwn", text: `Quotes appear only when ≥ *k=${k}* teammates contribute similar feedback.` }] },
                ],
              });
              console.log(`[MODAL] Posted feedback to channel ${thread.slackChannelId}`);
            } catch (err) {
              console.error('[MODAL] Failed to post to channel:', err);
            }
          }

          // Send contribution receipt
          sendContributionReceipt(slackTeam.accessToken, user.id, topic.id, topic.name)
            .catch(err => console.error('Failed to send receipt:', err));

          // Success - close modal stack
          return res.json({
            response_action: 'clear',
          });

        } catch (error: any) {
          if (error.code === '23505') {
            return res.json({
              response_action: 'errors',
              errors: {
                general: 'You have already submitted feedback to this topic.',
              },
            });
          }
          throw error;
        }
      }

      // LEGACY: Handle old feedback_modal for backward compatibility (topic suggestions)
      const metadata = JSON.parse(view.private_metadata);
      const { topicId, orgId } = metadata;
      console.log(`[MODAL] Legacy modal - TopicId: ${topicId}, OrgId: ${orgId}`);

      // Check seat cap before accepting feedback
      const seatCapStatus = await getSeatCapStatus(orgId);
      if (seatCapStatus.status === 'blocked') {
        return res.json({
          response_action: 'errors',
          errors: {
            behavior_block: {
              behavior_input: seatCapStatus.message || 'Seat capacity exceeded. Please contact your administrator.',
            },
          },
        });
      }

      // Extract form values
      const values = view.state.values;
      const suggestTopic = values.suggest_topic_block?.suggest_topic_input?.value?.trim();
      const situation = values.situation_block?.situation_input?.value?.trim() || '';
      const behavior = values.behavior_block?.behavior_input?.value?.trim();
      const impact = values.impact_block?.impact_input?.value?.trim();

      // Look up org from Slack team
      const slackTeam = await storage.getSlackTeamByTeamId(team.id);
      if (!slackTeam) {
        return res.json({
          response_action: 'errors',
          errors: {
            behavior_block: {
              behavior_input: 'Your Slack workspace is not connected.',
            },
          },
        });
      }

      // Handle topic suggestion if provided
      if (suggestTopic && suggestTopic.length > 0) {
        // Validate topic suggestion title
        if (suggestTopic.length < 5) {
          return res.json({
            response_action: 'errors',
            errors: {
              suggest_topic_block: {
                suggest_topic_input: 'Topic title must be at least 5 characters',
              },
            },
          });
        }

        // Find or create user for suggested_by
        let user_record = await storage.getUserBySlackId(user.id, orgId);
        if (!user_record) {
          user_record = await storage.createUser({
            orgId,
            slackUserId: user.id,
            email: null,
            role: 'member',
            profile: null,
          });
        }

        await storage.createTopicSuggestion({
          orgId,
          suggestedBy: user_record.id,
          title: suggestTopic,
          status: 'pending',
        });

        // Success - close modal
        return res.json({
          response_action: 'clear',
        });
      }

      // If no topic suggestion, validate feedback fields are provided
      if (!behavior || !impact) {
        const errors: any = {};
        if (!behavior) {
          errors.behavior_block = {
            behavior_input: 'Behavior is required when submitting feedback',
          };
        }
        if (!impact) {
          errors.impact_block = {
            impact_input: 'Impact is required when submitting feedback',
          };
        }
        return res.json({
          response_action: 'errors',
          errors,
        });
      }

      // Validate field lengths
      if (behavior.length < 20) {
        return res.json({
          response_action: 'errors',
          errors: {
            behavior_block: {
              behavior_input: 'Behavior must be at least 20 characters. What specifically occurred?',
            },
          },
        });
      }

      if (impact.length < 15) {
        return res.json({
          response_action: 'errors',
          errors: {
            impact_block: {
              impact_input: 'Impact must be at least 15 characters. How did this affect work or people?',
            },
          },
        });
      }

      // Check for @mentions and PII
      const behaviorCheck = filterAnonymousFeedback(behavior);
      if (!behaviorCheck.isValid) {
        return res.json({
          response_action: 'errors',
          errors: {
            behavior_block: {
              behavior_input: behaviorCheck.error,
            },
          },
        });
      }

      const impactCheck = filterAnonymousFeedback(impact);
      if (!impactCheck.isValid) {
        return res.json({
          response_action: 'errors',
          errors: {
            impact_block: {
              impact_input: impactCheck.error,
            },
          },
        });
      }

      if (situation.length > 0) {
        const situationCheck = filterAnonymousFeedback(situation);
        if (!situationCheck.isValid) {
          return res.json({
            response_action: 'errors',
            errors: {
              situation_block: {
                situation_input: situationCheck.error,
              },
            },
          });
        }
      }

      // Get topic
      console.log(`[MODAL] Fetching topic ${topicId} for org ${orgId}`);
      const topic = await storage.getTopic(topicId, orgId);
      console.log(`[MODAL] Topic found:`, topic ? `${topic.name} (isActive: ${topic.isActive})` : 'null');
      if (!topic || !topic.isActive) {
        console.error(`[MODAL] Topic validation failed - exists: ${!!topic}, isActive: ${topic?.isActive}`);
        return res.json({
          response_action: 'errors',
          errors: {
            behavior_block: {
              behavior_input: 'This topic is no longer active.',
            },
          },
        });
      }
      console.log(`[MODAL] Topic validated, proceeding with anti-gamification checks`);

      // Check if user is the topic creator (cannot submit to own topic)
      if (topic.ownerId) {
        const userRecord = await storage.getUserBySlackId(user.id, orgId);
        if (userRecord && userRecord.id === topic.ownerId) {
          console.log(`[MODAL] Blocked: User is the topic creator for topic ${topic.id}`);
          return res.json({
            response_action: 'errors',
            errors: {
              behavior_block: {
                behavior_input: 'You created this topic and cannot submit feedback to it. This protects the integrity of anonymous feedback.',
              },
            },
          });
        }
      }

      // Check if user already submitted to this topic (across all threads)
      const hasSubmitted = await storage.hasUserSubmittedToTopic(topic.id, user.id, orgId);
      if (hasSubmitted) {
        console.log(`[MODAL] Blocked: User already submitted to topic ${topic.id}`);
        return res.json({
          response_action: 'errors',
          errors: {
            behavior_block: {
              behavior_input: "You've already submitted feedback to this topic. Multiple submissions are blocked to protect k-anonymity.",
            },
          },
        });
      }

      console.log(`[MODAL] Anti-gamification checks passed, proceeding with thread creation`);

      // Find or create collecting thread
      let thread = await storage.getActiveCollectingThread(topic.id, orgId);
      if (!thread) {
        try {
          thread = await storage.createFeedbackThread({
            orgId,
            topicId: topic.id,
            title: `${topic.name} Feedback`,
            status: 'collecting',
            kThreshold: topic.kThreshold,
            participantCount: 0,
            slackChannelId: topic.slackChannelId || null,
            slackMessageTs: null,
          });
        } catch (error: any) {
          if (error.code === '23505') {
            thread = await storage.getActiveCollectingThread(topic.id, orgId);
            if (!thread) {
              throw new Error('Failed to create or retrieve collecting thread');
            }
          } else {
            throw error;
          }
        }
      }

      // Generate submitter hash and coarsen situation
      const submitterHash = generateSubmitterHash(user.id, orgId, thread.id);
      const situationCoarse = coarsenSituation(situation);
      const createdAtDay = new Date().toISOString().slice(0, 10);

      // Submit feedback
      try {
        await storage.createFeedbackItem({
          threadId: thread.id,
          topicId: topic.id,
          orgId,
          slackUserId: user.id,
          content: null,
          behavior,
          impact,
          situationCoarse,
          submitterHash,
          createdAtDay,
          status: 'pending',
          moderatorId: null,
          moderatedAt: null,
        });

        // Update participant count
        const participants = await storage.getUniqueParticipants(thread.id);
        await storage.updateThreadParticipantCount(thread.id, participants.length);

        if (participants.length >= thread.kThreshold && thread.status === 'collecting') {
          await storage.updateThreadStatus(thread.id, 'ready');
          console.log(`Thread ${thread.id} reached k-anonymity threshold (${participants.length}/${thread.kThreshold})`);
        }

        // Send contribution receipt
        sendContributionReceipt(slackTeam.accessToken, user.id, topic.id, topic.name)
          .catch(err => console.error('Failed to send receipt:', err));

        // Success - close modal
        return res.json({
          response_action: 'clear',
        });

      } catch (error: any) {
        if (error.code === '23505') {
          return res.json({
            response_action: 'errors',
            errors: {
              behavior_block: {
                behavior_input: 'You have already submitted feedback to this topic.',
              },
            },
          });
        }
        throw error;
      }

    } catch (error) {
      console.error('[MODAL] Modal submission error:', error);
      console.error('[MODAL] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      return res.json({
        response_action: 'errors',
        errors: {
          behavior_block: {
            behavior_input: 'An error occurred. Please try again.',
          },
        },
      });
    }
  });

  // Topic Management API (admin-only)
  // More specific routes first to avoid matching issues
  app.get('/api/topics/categorized', requireRole('owner', 'admin'), requireActiveSubscription, async (req, res) => {
    try {
      const orgId = req.session.orgId!;
      const categorized = await storage.getCategorizedTopics(orgId);
      
      // Enhance each category with owner information, participant count, and suggestion details
      const enhanceTopics = async (topicsList: any[]) => {
        return await Promise.all(
          topicsList.map(async (topic) => {
            let ownerEmail = null;
            if (topic.ownerId) {
              const owner = await storage.getUser(topic.ownerId);
              ownerEmail = owner?.email || null;
            }
            const participantCount = await storage.getTopicParticipantCount(topic.id, orgId);
            
            let suggesterEmail = null;
            let approvedByEmail = null;
            if (topic.suggestionId) {
              const allSuggestions = await storage.getTopicSuggestions(orgId);
              const suggestion = allSuggestions.find(s => s.id === topic.suggestionId);
              if (suggestion) {
                const suggester = await storage.getUser(suggestion.suggestedBy);
                suggesterEmail = suggester?.email || null;
                approvedByEmail = ownerEmail; // ownerId is the approver
              }
            }
            
            return {
              ...topic,
              ownerEmail,
              participantCount,
              suggesterEmail,
              approvedByEmail,
            };
          })
        );
      };
      
      const enhanced = {
        created: await enhanceTopics(categorized.created),
        instances: await enhanceTopics(categorized.instances),
        archived: await enhanceTopics(categorized.archived),
      };
      
      res.json(enhanced);
    } catch (error) {
      console.error('Get categorized topics error:', error);
      res.status(500).json({ error: 'Failed to fetch categorized topics' });
    }
  });

  app.get('/api/topics', requireRole('owner', 'admin'), requireActiveSubscription, async (req, res) => {
    try {
      const orgId = req.session.orgId!;
      const topicsList = await storage.getTopics(orgId);
      
      // Enhance topics with owner information
      const enhancedTopics = await Promise.all(
        topicsList.map(async (topic) => {
          let ownerEmail = null;
          if (topic.ownerId) {
            const owner = await storage.getUser(topic.ownerId);
            ownerEmail = owner?.email || null;
          }
          return {
            ...topic,
            ownerEmail,
          };
        })
      );
      
      res.json(enhancedTopics);
    } catch (error) {
      console.error('Get topics error:', error);
      res.status(500).json({ error: 'Failed to fetch topics' });
    }
  });

  app.get('/api/topics/:id', requireRole('owner', 'admin'), async (req, res) => {
    try {
      const orgId = req.session.orgId!;
      const topic = await storage.getTopic(req.params.id, orgId);
      
      if (!topic) {
        return res.status(404).json({ error: 'Topic not found' });
      }
      
      res.json(topic);
    } catch (error) {
      console.error('Get topic error:', error);
      res.status(500).json({ error: 'Failed to fetch topic' });
    }
  });

  app.post('/api/topics', requireRole('owner', 'admin'), requireActiveSubscription, async (req, res) => {
    try {
      const orgId = req.session.orgId!;
      const userId = req.session.userId!;
      const { name, slug, description, slackChannelId, kThreshold, isActive, windowDays } = req.body;
      
      if (!name || !slug) {
        return res.status(400).json({ error: 'Name and slug are required' });
      }
      
      // Validate k-threshold minimum
      const kThresholdValue = kThreshold !== undefined ? parseInt(kThreshold) : 5;
      if (kThresholdValue < 5) {
        return res.status(400).json({ error: 'K-threshold must be at least 5 for anonymity protection' });
      }
      
      // Calculate expiresAt based on windowDays
      const windowDaysValue = windowDays !== undefined ? parseInt(windowDays) : 21;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + windowDaysValue);
      
      const topic = await storage.createTopic({
        orgId,
        name,
        slug: slug.toLowerCase().trim(),
        description: description || null,
        slackChannelId: slackChannelId || null,
        kThreshold: kThresholdValue,
        isActive: isActive !== undefined ? isActive : true,
        windowDays: windowDaysValue,
        expiresAt,
        ownerId: userId,
      });
      
      res.json(topic);
    } catch (error: any) {
      console.error('Create topic error:', error);
      
      // Check for unique constraint violation on slug
      if (error.code === '23505' && error.constraint?.includes('slug')) {
        const slugValue = req.body.slug?.toLowerCase().trim() || 'this';
        return res.status(409).json({ 
          error: `A topic with the slug "${slugValue}" already exists. Please choose a different name or slug.` 
        });
      }
      
      res.status(500).json({ error: 'Failed to create topic' });
    }
  });

  app.patch('/api/topics/:id', requireRole('owner', 'admin'), requireActiveSubscription, async (req, res) => {
    try {
      const orgId = req.session.orgId!;
      const { name, slug, slackChannelId, kThreshold, isActive, status, actionNotes, expiresAt, windowDays, ownerId } = req.body;
      
      // Get current topic state to check for status change
      const currentTopic = await storage.getTopic(req.params.id, orgId);
      if (!currentTopic) {
        return res.status(404).json({ error: 'Topic not found' });
      }
      
      // Validate status transitions if status is being changed
      if (status !== undefined && status !== currentTopic.status) {
        const validTransitions: Record<string, string[]> = {
          'collecting': ['in_review', 'archived'],
          'in_review': ['collecting', 'action_decided', 'archived'],
          'action_decided': ['actioned', 'archived'],
          'actioned': ['archived'], // Can archive after actioned
          'archived': [] // Terminal state - no further transitions
        };
        
        const allowedNextStates = validTransitions[currentTopic.status] || [];
        if (!allowedNextStates.includes(status)) {
          return res.status(400).json({ 
            error: `Invalid status transition: ${currentTopic.status} → ${status}. Allowed: ${allowedNextStates.join(', ') || 'none'}` 
          });
        }

        // Check k-anonymity BEFORE updating to 'actioned'
        if (status === 'actioned') {
          const participantCount = await storage.getTopicParticipantCount(req.params.id, orgId);
          
          if (participantCount < currentTopic.kThreshold) {
            return res.status(400).json({ 
              error: `Cannot mark topic as actioned: k-anonymity threshold not met (${participantCount}/${currentTopic.kThreshold} participants)` 
            });
          }
        }
      }
      
      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (slug !== undefined) updateData.slug = slug.toLowerCase().trim();
      if (slackChannelId !== undefined) updateData.slackChannelId = slackChannelId || null;
      // kThreshold and windowDays cannot be edited after creation for privacy protection
      // if (kThreshold !== undefined) updateData.kThreshold = parseInt(kThreshold);
      // if (windowDays !== undefined) updateData.windowDays = parseInt(windowDays);
      if (isActive !== undefined) updateData.isActive = isActive;
      if (status !== undefined) updateData.status = status;
      if (actionNotes !== undefined) updateData.actionNotes = actionNotes;
      if (expiresAt !== undefined) updateData.expiresAt = expiresAt;
      if (windowDays !== undefined) updateData.windowDays = parseInt(windowDays);
      if (ownerId !== undefined) updateData.ownerId = ownerId;
      
      const topic = await storage.updateTopic(req.params.id, updateData, orgId);
      
      if (!topic) {
        return res.status(404).json({ error: 'Topic not found' });
      }
      
      // Log state transition if status changed
      if (status !== undefined && status !== currentTopic.status) {
        const { logTopicStatusChange } = await import('./utils/stateTransitionLogger');
        await logTopicStatusChange(
          topic.id,
          orgId,
          currentTopic.status,
          status,
          req.session.userId,
          `Manual status update via admin dashboard`
        );
      }
      
      // Auto-post action notes when status changed to 'actioned'
      if (status === 'actioned' && actionNotes && topic.slackChannelId) {
        const slackTeam = await storage.getSlackTeamByOrgId(orgId);
        if (slackTeam) {
          // Post to Slack but don't fail the update if Slack fails
          postActionNotesToChannel(slackTeam.accessToken, topic.slackChannelId, topic.name, actionNotes)
            .catch(err => {
              console.error('Failed to post action notes to Slack (continuing):', err);
            });
        }
      }
      
      res.json(topic);
    } catch (error) {
      console.error('Update topic error:', error);
      res.status(500).json({ error: 'Failed to update topic' });
    }
  });

  app.delete('/api/topics/:id', requireRole('owner', 'admin'), requireActiveSubscription, async (req, res) => {
    try {
      const orgId = req.session.orgId!;
      await storage.deleteTopic(req.params.id, orgId);
      res.json({ success: true });
    } catch (error) {
      console.error('Delete topic error:', error);
      res.status(500).json({ error: 'Failed to delete topic' });
    }
  });
  
  // Slack OAuth - Initiate install
  app.get('/api/slack/install', (req, res) => {
    const state = crypto.randomBytes(16).toString('hex');
    const plan = req.query.plan as string | undefined;
    
    // Store state with timestamp and optional plan for CSRF validation (expire after 10 min)
    oauthStates.set(state, { 
      timestamp: Date.now(),
      plan: plan 
    });
    
    const slackAuthUrl = new URL('https://slack.com/oauth/v2/authorize');
    slackAuthUrl.searchParams.set('client_id', SLACK_CLIENT_ID!);
    slackAuthUrl.searchParams.set('scope', BOT_SCOPES);
    slackAuthUrl.searchParams.set('user_scope', USER_SCOPES);
    slackAuthUrl.searchParams.set('redirect_uri', REDIRECT_URI);
    slackAuthUrl.searchParams.set('state', state);
    
    res.redirect(slackAuthUrl.toString());
  });

  // Slack OAuth - Handle callback
  app.get('/api/slack/oauth', async (req, res) => {
    const { code, state, error } = req.query;

    if (error) {
      return res.redirect(`/post-install?error=${error}`);
    }

    if (!code || !state) {
      return res.redirect('/post-install?error=missing_parameters');
    }

    // Validate state for CSRF protection
    const stateData = oauthStates.get(state as string);
    if (!stateData) {
      return res.redirect('/post-install?error=invalid_state');
    }

    // Check state hasn't expired (10 minutes)
    if (Date.now() - stateData.timestamp > 10 * 60 * 1000) {
      oauthStates.delete(state as string);
      return res.redirect('/post-install?error=state_expired');
    }

    // Extract plan from state
    const selectedPlan = stateData.plan;

    // Remove used state
    oauthStates.delete(state as string);

    try {
      // Exchange code for access tokens
      const tokenResponse = await fetch('https://slack.com/api/oauth.v2.access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: SLACK_CLIENT_ID!,
          client_secret: SLACK_CLIENT_SECRET!,
          code: code as string,
          redirect_uri: REDIRECT_URI,
        }),
      });

      const tokenData = await tokenResponse.json();

      if (!tokenData.ok) {
        console.error('Slack OAuth error:', tokenData.error);
        return res.redirect(`/post-install?error=${tokenData.error}`);
      }

      const {
        access_token,
        team,
        authed_user,
        bot_user_id
      } = tokenData;

      // Get installer's user info using USER token (not bot token)
      const userToken = authed_user.access_token;
      let installerEmail: string | undefined;
      let installerProfile: any = {};

      if (userToken) {
        const userInfoResponse = await fetch(
          `https://slack.com/api/users.info?user=${authed_user.id}`,
          {
            headers: {
              Authorization: `Bearer ${userToken}`,
            },
          }
        );

        const userInfo = await userInfoResponse.json();
        installerEmail = userInfo.user?.profile?.email;
        
        // Store Slack profile information
        installerProfile = {
          slackUsername: userInfo.user?.name,
          slackDisplayName: userInfo.user?.profile?.display_name || userInfo.user?.real_name,
          slackRealName: userInfo.user?.real_name,
        };
      }

      // Check if this Slack team is already installed
      const existingTeam = await storage.getSlackTeamByTeamId(team.id);

      let orgId: string;
      let user;
      let userAlreadyExisted = false;

      console.log('[OAuth Debug] Team ID:', team.id);
      console.log('[OAuth Debug] Authed User ID:', authed_user.id);
      console.log('[OAuth Debug] Existing Team:', existingTeam ? 'Found' : 'Not Found');

      if (existingTeam) {
        // Reinstall: update access token
        await storage.updateSlackTeamToken(team.id, access_token);
        orgId = existingTeam.orgId;
        
        console.log('[OAuth Debug] Org ID:', orgId);
        
        // Get or create user
        let existingUser = await storage.getUserBySlackId(authed_user.id, existingTeam.orgId);
        userAlreadyExisted = existingUser !== null;
        
        console.log('[OAuth Debug] Existing User:', existingUser ? 'Found' : 'Not Found');
        console.log('[OAuth Debug] userAlreadyExisted:', userAlreadyExisted);
        
        if (!existingUser && installerEmail) {
          // New user in existing org - create as admin
          existingUser = await storage.createUser({
            orgId: existingTeam.orgId,
            slackUserId: authed_user.id,
            email: installerEmail,
            role: 'admin',
            profile: installerProfile,
          });
          console.log('[OAuth Debug] Created new user in existing org');
        }
        
        user = existingUser;
      } else {
        // First install: auto-provision org (no trial yet - must complete Stripe Checkout)
        const newOrg = await storage.createOrg({
          name: team.name,
          verifiedDomains: [],
          billingStatus: 'installed_no_checkout',
        });
        
        orgId = newOrg.id;

        // Create slack_teams record
        await storage.createSlackTeam({
          orgId: newOrg.id,
          teamId: team.id,
          accessToken: access_token,
          botUserId: bot_user_id,
        });

        // Create user record for installer as owner
        if (installerEmail && authed_user.id) {
          user = await storage.createUser({
            orgId: newOrg.id,
            slackUserId: authed_user.id,
            email: installerEmail,
            role: 'owner',
            profile: installerProfile,
          });
        }
      }

      // Recompute eligible count on install/reinstall
      try {
        let audience = await storage.getOrgAudience(orgId);
        if (!audience) {
          // Create default audience settings
          audience = await storage.upsertOrgAudience({
            orgId,
            mode: 'workspace',
            excludeGuests: true,
          });
        }
        
        const { recomputeEligibleCount } = await import('./services/audience');
        const eligibleCount = await recomputeEligibleCount(access_token, audience);
        
        await storage.upsertOrgUsage({
          orgId,
          eligibleCount,
        });
      } catch (error) {
        console.error('Failed to recompute eligible count on install:', error);
        // Don't block installation if recount fails
      }

      // Send welcome DM to installer
      if (authed_user?.id) {
        const dashboardUrl = `${process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000'}/admin/get-started`;
        sendInstallerWelcomeDM(access_token, authed_user.id, team.name, dashboardUrl).catch(err => {
          console.error('Failed to send installer welcome DM:', err);
        });
      }

      // Create session for the installer with session regeneration
      if (user) {
        req.session.regenerate((err) => {
          if (err) {
            console.error('Session regeneration error:', err);
            return res.redirect('/post-install?error=session_error');
          }
          
          req.session.userId = user.id;
          req.session.orgId = user.orgId;
          req.session.role = user.role;
          
          req.session.save((err) => {
            if (err) {
              console.error('Session save error:', err);
              return res.redirect('/post-install?error=session_error');
            }
            
            // New install: Enforce checkout flow
            if (!existingTeam) {
              console.log('[OAuth Debug] Redirect: New install -> pricing/checkout');
              if (selectedPlan) {
                // Plan provided - proceed to checkout
                return res.redirect(`/billing/checkout-redirect?plan=${selectedPlan}`);
              } else {
                // No plan - redirect to pricing for selection
                return res.redirect(`/pricing?new_install=true`);
              }
            }
            
            // Existing team - check if user already existed
            console.log('[OAuth Debug] Existing team - userAlreadyExisted:', userAlreadyExisted);
            if (userAlreadyExisted) {
              // User sign-in: redirect to dashboard
              console.log('[OAuth Debug] Redirect: Existing user -> /admin/dashboard');
              return res.redirect('/admin/dashboard');
            } else {
              // New user in existing org (reinstall): check subscription status
              console.log('[OAuth Debug] Redirect: New user in existing org -> /post-install');
              return res.redirect('/post-install');
            }
          });
        });
      } else {
        res.redirect('/post-install?error=user_creation_failed');
      }

    } catch (error) {
      console.error('OAuth callback error:', error);
      res.redirect('/post-install?error=server_error');
    }
  });

  // Admin encryption key management endpoints
  app.use('/api/admin/keys', adminKeysRouter);

  // Themes API endpoints
  app.use('/api/themes', themesRouter);

  // Seat Cap API endpoint
  app.get('/api/billing/seat-cap-status', requireAuth, async (req, res) => {
    try {
      const orgId = req.session.orgId!;
      const status = await getSeatCapStatus(orgId);
      res.json(status);
    } catch (error) {
      console.error('Seat cap status error:', error);
      res.status(500).json({ error: 'Failed to get seat cap status' });
    }
  });

  // Weekly Digest API endpoints
  app.get('/api/digests/preview', requireRole('owner', 'admin'), async (req, res) => {
    try {
      const orgId = req.session.orgId!;
      
      const digest = await generateDigest(orgId);
      if (!digest) {
        return res.json({
          hasContent: false,
          message: 'No feedback has met k-anonymity thresholds yet.',
        });
      }
      
      res.json({
        hasContent: true,
        ...digest,
      });
    } catch (error) {
      console.error('Preview digest error:', error);
      res.status(500).json({ error: 'Failed to generate digest preview' });
    }
  });

  app.post('/api/digests/sendNow', requireRole('owner', 'admin'), async (req, res) => {
    try {
      const orgId = req.session.orgId!;
      
      const success = await sendDigestToOrg(orgId);
      if (!success) {
        return res.status(400).json({ 
          error: 'Failed to send digest. Make sure Slack is connected and there is content available.' 
        });
      }
      
      res.json({ success: true, message: 'Digest sent to all admins' });
    } catch (error) {
      console.error('Send digest error:', error);
      res.status(500).json({ error: 'Failed to send digest' });
    }
  });

  // Contact form endpoint (public)
  app.post('/api/contact', async (req, res) => {
    try {
      const schema = z.object({
        topic: z.enum(['security', 'privacy', 'billing', 'incident', 'product', 'other']),
        email: z.string().email(),
        message: z.string().min(1),
      });

      const { topic, email, message } = schema.parse(req.body);

      // TODO: Add Cloudflare Recaptcha validation here
      
      // Log contact request
      console.log('[CONTACT]', {
        topic,
        email,
        messageLength: message.length,
        timestamp: new Date().toISOString(),
      });

      // TODO: Send email notification or store in database
      // For now, just return success

      res.json({ success: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid contact form data' });
      }
      console.error('Contact form error:', error);
      res.status(500).json({ error: 'Failed to submit contact form' });
    }
  });

  // Audience Management API
  app.get('/api/audience', requireAuth, async (req, res) => {
    try {
      const orgId = req.session.orgId!;
      
      // Get audience settings (create default if not exists)
      let audience = await storage.getOrgAudience(orgId);
      if (!audience) {
        audience = await storage.upsertOrgAudience({
          orgId,
          mode: 'workspace',
          excludeGuests: true,
        });
      }
      
      // Get usage stats
      let usage = await storage.getOrgUsage(orgId);
      if (!usage) {
        usage = await storage.upsertOrgUsage({
          orgId,
          eligibleCount: 0,
        });
      }
      
      res.json({
        mode: audience.mode,
        usergroupId: audience.usergroupId || null,
        channelIds: audience.channelIds || [],
        excludeGuests: audience.excludeGuests,
        preview: {
          eligibleCount: usage.eligibleCount,
          lastSynced: usage.lastSynced.toISOString(),
        },
      });
    } catch (error) {
      console.error('Get audience error:', error);
      res.status(500).json({ error: 'Failed to get audience settings' });
    }
  });

  app.put('/api/audience', requireRole('owner', 'admin'), async (req, res) => {
    try {
      const orgId = req.session.orgId!;
      
      const schema = z.object({
        mode: z.enum(['workspace', 'user_group', 'channels']),
        usergroupId: z.string().optional().nullable(),
        channelIds: z.array(z.string()).optional().default([]),
        excludeGuests: z.boolean().default(true),
      });
      
      const data = schema.parse(req.body);
      
      // Save audience settings
      const audience = await storage.upsertOrgAudience({
        orgId,
        mode: data.mode,
        usergroupId: data.usergroupId || null,
        channelIds: data.channelIds || [],
        excludeGuests: data.excludeGuests,
      });
      
      // Trigger recount
      const slackTeam = await storage.getSlackTeamByOrgId(orgId);
      if (!slackTeam) {
        return res.status(400).json({ error: 'Slack team not found' });
      }
      
      const { recomputeEligibleCount } = await import('./services/audience');
      const eligibleCount = await recomputeEligibleCount(slackTeam.accessToken, audience);
      
      // Save usage
      const usage = await storage.upsertOrgUsage({
        orgId,
        eligibleCount,
      });
      
      res.json({
        mode: audience.mode,
        usergroupId: audience.usergroupId || null,
        channelIds: audience.channelIds || [],
        excludeGuests: audience.excludeGuests,
        preview: {
          eligibleCount: usage.eligibleCount,
          lastSynced: usage.lastSynced.toISOString(),
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid audience data' });
      }
      console.error('Update audience error:', error);
      res.status(500).json({ error: 'Failed to update audience settings' });
    }
  });

  app.post('/api/audience/recount', requireAuth, async (req, res) => {
    try {
      const orgId = req.session.orgId!;
      
      // Get audience settings
      const audience = await storage.getOrgAudience(orgId);
      if (!audience) {
        return res.status(404).json({ error: 'Audience settings not found' });
      }
      
      // Get Slack token
      const slackTeam = await storage.getSlackTeamByOrgId(orgId);
      if (!slackTeam) {
        return res.status(400).json({ error: 'Slack team not found' });
      }
      
      // Recompute count
      const { recomputeEligibleCount } = await import('./services/audience');
      const eligibleCount = await recomputeEligibleCount(slackTeam.accessToken, audience);
      
      // Save usage
      const usage = await storage.upsertOrgUsage({
        orgId,
        eligibleCount,
      });
      
      res.json({
        eligibleCount: usage.eligibleCount,
        lastSynced: usage.lastSynced.toISOString(),
      });
    } catch (error) {
      console.error('Recount audience error:', error);
      res.status(500).json({ error: 'Failed to recount audience' });
    }
  });

  // Slack resource endpoints for Audience configuration
  // Simple in-memory cache with TTL
  const slackResourceCache = new Map<string, { data: any; expires: number }>();
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  app.get('/api/slack/user-groups', requireAuth, async (req, res) => {
    try {
      const orgId = req.session.orgId!;
      const cacheKey = `usergroups:${orgId}`;
      
      // Check cache
      const cached = slackResourceCache.get(cacheKey);
      if (cached && cached.expires > Date.now()) {
        return res.json(cached.data);
      }
      
      const slackTeam = await storage.getSlackTeamByOrgId(orgId);
      if (!slackTeam) {
        return res.status(400).json({ error: 'Slack team not found' });
      }
      
      const { WebClient } = await import('@slack/web-api');
      const client = new WebClient(slackTeam.accessToken);
      
      const resp = await client.usergroups.list({
        include_count: true,
        include_disabled: false,
      });
      
      const userGroups = (resp.usergroups || []).map((ug: any) => ({
        id: ug.id,
        handle: ug.handle,
        name: ug.name,
        description: ug.description || '',
        userCount: ug.user_count || 0,
      }));
      
      // Cache the result
      slackResourceCache.set(cacheKey, {
        data: userGroups,
        expires: Date.now() + CACHE_TTL,
      });
      
      res.json(userGroups);
    } catch (error) {
      console.error('Get user groups error:', error);
      res.status(500).json({ error: 'Failed to fetch user groups' });
    }
  });

  app.get('/api/slack/channels', requireAuth, async (req, res) => {
    try {
      const orgId = req.session.orgId!;
      const cacheKey = `channels:${orgId}`;
      
      // Check cache
      const cached = slackResourceCache.get(cacheKey);
      if (cached && cached.expires > Date.now()) {
        return res.json(cached.data);
      }
      
      const slackTeam = await storage.getSlackTeamByOrgId(orgId);
      if (!slackTeam) {
        return res.status(400).json({ error: 'Slack team not found' });
      }
      
      const { WebClient } = await import('@slack/web-api');
      const client = new WebClient(slackTeam.accessToken);
      
      const channels: any[] = [];
      let cursor: string | undefined;
      let pageCount = 0;
      const MAX_PAGES = 5; // Limit to first 1000 channels (200 * 5) to prevent excessive API calls
      
      do {
        const resp = await client.conversations.list({
          types: 'public_channel,private_channel',
          exclude_archived: true,
          limit: 200,
          cursor,
        });
        
        channels.push(...(resp.channels || []));
        cursor = (resp.response_metadata?.next_cursor || '') || undefined;
        pageCount++;
      } while (cursor && pageCount < MAX_PAGES);
      
      const channelList = channels.map((ch: any) => ({
        id: ch.id,
        name: ch.name,
        isPrivate: ch.is_private || false,
        memberCount: ch.num_members || 0,
      }));
      
      // Cache the result
      slackResourceCache.set(cacheKey, {
        data: channelList,
        expires: Date.now() + CACHE_TTL,
      });
      
      res.json(channelList);
    } catch (error) {
      console.error('Get channels error:', error);
      res.status(500).json({ error: 'Failed to fetch channels' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
