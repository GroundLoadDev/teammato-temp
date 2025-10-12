// Content filtering utilities for privacy protection
import crypto from 'crypto';
import { nanoid } from 'nanoid';

export interface FilterResult {
  isValid: boolean;
  error?: string;
  filteredContent?: string;
}

// Block @mentions and common PII patterns
export function filterAnonymousFeedback(content: string): FilterResult {
  // Check for @mentions (Slack format)
  const mentionPattern = /@[\w\-._]+/g;
  if (mentionPattern.test(content)) {
    return {
      isValid: false,
      error: 'Please avoid mentioning specific individuals (@username) to protect anonymity. Focus on behaviors and situations instead.',
    };
  }

  // Check for email addresses
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  if (emailPattern.test(content)) {
    return {
      isValid: false,
      error: 'Please avoid including email addresses to protect privacy.',
    };
  }

  // Check for phone numbers (basic patterns)
  const phonePattern = /(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  if (phonePattern.test(content)) {
    return {
      isValid: false,
      error: 'Please avoid including phone numbers to protect privacy.',
    };
  }

  // Check for Slack user IDs (<@U12345>)
  const slackUserIdPattern = /<@[UW][A-Z0-9]+>/g;
  if (slackUserIdPattern.test(content)) {
    return {
      isValid: false,
      error: 'Please avoid mentioning specific individuals to protect anonymity.',
    };
  }

  return {
    isValid: true,
    filteredContent: content.trim(),
  };
}

// Validate SBI (Situation-Behavior-Impact) structure
export function validateSBI(situation: string, behavior: string, impact: string): FilterResult {
  // Minimum character requirements
  const MIN_SITUATION = 10;
  const MIN_BEHAVIOR = 20;
  const MIN_IMPACT = 15;

  if (situation.length < MIN_SITUATION) {
    return {
      isValid: false,
      error: `Situation should be at least ${MIN_SITUATION} characters. Help us understand when/where this happened.`,
    };
  }

  if (behavior.length < MIN_BEHAVIOR) {
    return {
      isValid: false,
      error: `Behavior description should be at least ${MIN_BEHAVIOR} characters. What specifically occurred?`,
    };
  }

  if (impact.length < MIN_IMPACT) {
    return {
      isValid: false,
      error: `Impact should be at least ${MIN_IMPACT} characters. How did this affect work or people?`,
    };
  }

  // Run PII checks on each field
  const situationCheck = filterAnonymousFeedback(situation);
  if (!situationCheck.isValid) return situationCheck;

  const behaviorCheck = filterAnonymousFeedback(behavior);
  if (!behaviorCheck.isValid) return behaviorCheck;

  const impactCheck = filterAnonymousFeedback(impact);
  if (!impactCheck.isValid) return impactCheck;

  return { isValid: true };
}

// Generate contribution receipt hash
export function generateReceiptHash(userId: string, topicId: string, timestamp: number): string {
  // Use nanoid for guaranteed unique receipts
  // nanoid generates URL-safe unique IDs (A-Za-z0-9_-)
  const receiptId = nanoid(8); // 8 characters, URL-safe
  return `#${receiptId.toUpperCase()}`;
}

// Generate submitter hash for deduplication - per-thread unique to prevent cross-topic correlation
export function generateSubmitterHash(userId: string, orgId: string, threadId: string): string {
  const secret = process.env.SESSION_SECRET || 'default-secret';
  const data = `${userId}:${orgId}:${threadId}`;
  return crypto.createHmac('sha256', secret)
    .update(data)
    .digest('hex');
}

// Coarsen situation to remove identifying details
export function coarsenSituation(situation: string | null): string | null {
  if (!situation || situation.trim().length === 0) {
    return null;
  }

  const text = situation.trim();
  
  // Extract week numbers, months, quarters
  const weekMatch = text.match(/week\s+(\d+)/i);
  const monthMatch = text.match(/(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)/i);
  const quarterMatch = text.match(/q[1-4]/i);
  
  // Build coarsened version
  const parts: string[] = [];
  
  if (weekMatch) {
    parts.push(`Week ${weekMatch[1]}`);
  }
  if (monthMatch) {
    const month = monthMatch[1].charAt(0).toUpperCase() + monthMatch[1].slice(1);
    parts.push(month);
  }
  if (quarterMatch) {
    parts.push(quarterMatch[0].toUpperCase());
  }
  
  // If no temporal markers found, return generic description
  if (parts.length === 0) {
    return "Recent period";
  }
  
  // Limit to 120 chars
  return parts.join(', ').substring(0, 120);
}
