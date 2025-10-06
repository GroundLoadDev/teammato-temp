/**
 * Seat Cap Enforcement Middleware
 * 
 * Enforces seat capacity limits with grace period handling:
 * - Warn at ≥90% capacity
 * - Start 7-day grace period at >100% capacity
 * - Block at >110% or when grace period expires
 */

import type { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';
import { sendSeatCapNotifications } from '../utils/seatCapNotifications';

export interface SeatCapStatus {
  eligibleCount: number;
  seatCap: number;
  percentage: number;
  status: 'ok' | 'warning' | 'grace' | 'blocked';
  message?: string;
  graceEndsAt?: string;
}

/**
 * Calculate seat cap status for an organization
 */
export async function getSeatCapStatus(orgId: string): Promise<SeatCapStatus> {
  const org = await storage.getOrg(orgId);
  if (!org) {
    throw new Error('Organization not found');
  }

  const usage = await storage.getOrgUsage(orgId);
  const eligibleCount = usage?.eligibleCount || 0;
  const seatCap = org.seatCap || 250;
  const percentage = seatCap > 0 ? (eligibleCount / seatCap) * 100 : 0;

  // Check if usage is back under capacity - clear grace period
  if (percentage <= 100 && org.graceEndsAt) {
    await storage.updateOrg(orgId, { graceEndsAt: null });
    org.graceEndsAt = null; // Update local copy immediately
  }

  // Check if grace period expired and still over capacity
  const now = new Date();
  const graceExpired = org.graceEndsAt && new Date(org.graceEndsAt) < now;

  // Determine status
  if (percentage > 110 || (graceExpired && percentage > 100)) {
    // Send blocked notifications (async - don't wait)
    sendSeatCapNotifications(orgId, percentage, 'blocked', org.graceEndsAt || undefined).catch(err => {
      console.error('Failed to send seat-cap blocked notifications:', err);
    });
    
    return {
      eligibleCount,
      seatCap,
      percentage,
      status: 'blocked',
      message: graceExpired 
        ? 'Your grace period has expired and you are still over capacity. Please upgrade your plan to continue.'
        : 'You have exceeded 110% of your seat capacity. Please upgrade your plan to continue.',
      graceEndsAt: org.graceEndsAt?.toISOString(),
    };
  }

  if (percentage > 100) {
    // Start grace period if not already set
    if (!org.graceEndsAt) {
      const graceEnd = new Date();
      graceEnd.setDate(graceEnd.getDate() + 7); // 7 days from now
      await storage.updateOrg(orgId, { graceEndsAt: graceEnd });
      
      // Send grace period notifications (async - don't wait)
      sendSeatCapNotifications(orgId, percentage, 'grace', graceEnd).catch(err => {
        console.error('Failed to send seat-cap grace notifications:', err);
      });
      
      return {
        eligibleCount,
        seatCap,
        percentage,
        status: 'grace',
        message: `You are over your seat capacity. You have a 7-day grace period to upgrade your plan.`,
        graceEndsAt: graceEnd.toISOString(),
      };
    }

    return {
      eligibleCount,
      seatCap,
      percentage,
      status: 'grace',
      message: `You are in a grace period. Please upgrade your plan before ${new Date(org.graceEndsAt).toLocaleDateString()}.`,
      graceEndsAt: org.graceEndsAt.toISOString(),
    };
  }

  if (percentage >= 90) {
    // Send warning notifications (async - don't wait)
    sendSeatCapNotifications(orgId, percentage, 'warning').catch(err => {
      console.error('Failed to send seat-cap warning notifications:', err);
    });
    
    return {
      eligibleCount,
      seatCap,
      percentage,
      status: 'warning',
      message: `You are at ${percentage.toFixed(0)}% of your seat capacity. Consider upgrading your plan.`,
    };
  }

  return {
    eligibleCount,
    seatCap,
    percentage,
    status: 'ok',
  };
}

/**
 * Middleware to check seat cap before allowing feedback submission
 * Blocks if over 110% or grace period expired
 */
export async function enforceSeatCap(req: Request, res: Response, next: NextFunction) {
  try {
    const orgId = req.session.orgId;
    if (!orgId) {
      return next(); // Not authenticated, let other middleware handle it
    }

    const status = await getSeatCapStatus(orgId);

    if (status.status === 'blocked') {
      return res.status(403).json({
        error: 'Seat capacity exceeded',
        message: status.message,
        seatCapStatus: status,
      });
    }

    // Attach status to request for downstream use
    (req as any).seatCapStatus = status;
    
    next();
  } catch (error) {
    console.error('Seat cap enforcement error:', error);
    // Don't block on errors - fail open
    next();
  }
}

/**
 * Middleware to attach seat cap status to response (for warnings)
 * Does not block, just provides information
 */
export async function attachSeatCapStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const orgId = req.session.orgId;
    if (!orgId) {
      return next();
    }

    const status = await getSeatCapStatus(orgId);
    (req as any).seatCapStatus = status;
    
    next();
  } catch (error) {
    console.error('Seat cap status attachment error:', error);
    next();
  }
}
