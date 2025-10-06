import { Router, Request, Response } from 'express';
import { db } from '../db';
import { orgs, themes, themePosts, feedbackItems } from '../../shared/schema';
import { eq, and, gte, lte, desc, inArray } from 'drizzle-orm';
import { runTheming } from '../workers/theme-worker';
import { z } from 'zod';

const router = Router();

// Middleware to check if user is authenticated
function requireAuth(req: Request, res: Response, next: Function) {
  if (!req.session.userId || !req.session.orgId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// Helper to check if org is on paid plan
async function isPaidPlan(orgId: string): Promise<boolean> {
  const [org] = await db
    .select()
    .from(orgs)
    .where(eq(orgs.id, orgId))
    .limit(1);

  if (!org) return false;
  
  // Consider 'active' billing status as paid plan
  return org.billingStatus === 'active';
}

// Sample themes for preview (non-paid plans)
const SAMPLE_THEMES = [
  {
    id: 'sample-1',
    label: 'Work-Life Balance',
    posts_count: 23,
    top_terms: ['flexibility', 'remote', 'schedule', 'burnout', 'wellness'],
    summary: 'Team members are requesting more flexible work arrangements and expressing concerns about workload balance.',
    trend_delta: 5,
    channels: ['#general', '#team-feedback'],
    dept_hits: { Engineering: 12, Product: 6, Design: 5 },
    k_threshold: 5,
    isSample: true,
  },
  {
    id: 'sample-2',
    label: 'Communication & Clarity',
    posts_count: 18,
    top_terms: ['communication', 'updates', 'transparency', 'meetings', 'clarity'],
    summary: 'Feedback highlights the need for clearer communication on project priorities and organizational updates.',
    trend_delta: -2,
    channels: ['#general', '#product-updates'],
    dept_hits: { Product: 8, Engineering: 6, Marketing: 4 },
    k_threshold: 5,
    isSample: true,
  },
  {
    id: 'sample-3',
    label: 'Recognition & Growth',
    posts_count: 15,
    top_terms: ['recognition', 'career', 'growth', 'appreciation', 'development'],
    summary: 'Team members are seeking more recognition for their contributions and clarity on career advancement paths.',
    trend_delta: 3,
    channels: ['#general', '#career-dev'],
    dept_hits: { Engineering: 7, Design: 4, Product: 4 },
    k_threshold: 5,
    isSample: true,
  },
];

// Generate themes for a period
router.post('/generate', requireAuth, async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    });

    const { periodStart, periodEnd } = schema.parse(req.body);

    if (!req.session.orgId) {
      return res.status(401).json({ error: 'No organization selected' });
    }

    // Check if org is on paid plan
    const paid = await isPaidPlan(req.session.orgId);

    if (!paid) {
      // Return sample themes for non-paid users with explanatory message
      return res.json({ 
        success: true, 
        isSample: true,
        message: 'Themes are only available for paid plans. Here are some sample themes based on what typical themes may look like.',
        themes: SAMPLE_THEMES,
      });
    }

    // Get org's k-anonymity threshold
    const [org] = await db
      .select()
      .from(orgs)
      .where(eq(orgs.id, req.session.orgId))
      .limit(1);

    const settings = (org.settings ?? {}) as any;
    const kThreshold = settings.k_anonymity || 5;

    // Trigger theme generation (async) for paid users
    runTheming(req.session.orgId, periodStart, periodEnd, kThreshold)
      .catch(err => console.error('[THEMING] Error:', err));

    res.json({ success: true, message: 'Theme generation started' });
  } catch (error) {
    console.error('[THEMES API] Generate error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to generate themes' });
  }
});

// Get themes for a period
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const { periodStart, periodEnd } = req.query;

    if (!req.session.orgId) {
      return res.status(401).json({ error: 'No organization selected' });
    }

    // Check if org is on paid plan
    const paid = await isPaidPlan(req.session.orgId);

    if (!paid) {
      // Return sample themes for non-paid users
      return res.json(SAMPLE_THEMES);
    }

    // Get org's k-anonymity threshold
    const [org] = await db
      .select()
      .from(orgs)
      .where(eq(orgs.id, req.session.orgId))
      .limit(1);

    const settings = (org.settings ?? {}) as any;
    const kThreshold = settings.k_anonymity || 5;

    let query = db
      .select()
      .from(themes)
      .where(eq(themes.orgId, req.session.orgId))
      .orderBy(desc(themes.createdAt));

    if (periodStart && periodEnd) {
      query = db
        .select()
        .from(themes)
        .where(
          and(
            eq(themes.orgId, req.session.orgId),
            gte(themes.periodStart, String(periodStart)),
            lte(themes.periodEnd, String(periodEnd))
          )
        )
        .orderBy(desc(themes.createdAt));
    }

    const result = await query;

    // Map to ThemeCard format
    const themeCards = result.map(theme => ({
      id: theme.id,
      label: theme.label,
      posts_count: theme.postsCount,
      top_terms: theme.topTerms,
      summary: theme.summary,
      trend_delta: theme.trendDelta,
      channels: theme.channels,
      dept_hits: theme.deptHits as Record<string, number>,
      k_threshold: kThreshold,
      // Don't include quotes yet - will be fetched separately if k is met
    }));

    res.json(themeCards);
  } catch (error) {
    console.error('[THEMES API] List error:', error);
    res.status(500).json({ error: 'Failed to fetch themes' });
  }
});

// Get a single theme with posts (k-anonymity enforced)
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!req.session.orgId) {
      return res.status(401).json({ error: 'No organization selected' });
    }

    // Check if org is on paid plan
    const paid = await isPaidPlan(req.session.orgId);

    if (!paid) {
      // Return sample theme if ID matches
      const sampleTheme = SAMPLE_THEMES.find(t => t.id === id);
      if (sampleTheme) {
        return res.json({
          ...sampleTheme,
          exemplar_quotes: undefined, // No quotes for sample themes
        });
      }
      return res.status(404).json({ error: 'Theme not found' });
    }

    // Get org's k-anonymity threshold
    const [org] = await db
      .select()
      .from(orgs)
      .where(eq(orgs.id, req.session.orgId))
      .limit(1);

    const settings = (org.settings ?? {}) as any;
    const kThreshold = settings.k_anonymity || 5;

    // Get theme
    const [theme] = await db
      .select()
      .from(themes)
      .where(and(eq(themes.id, id), eq(themes.orgId, req.session.orgId)))
      .limit(1);

    if (!theme) {
      return res.status(404).json({ error: 'Theme not found' });
    }

    // Fetch posts if k is met
    let exemplarQuotes: { text: string }[] | undefined = undefined;

    if (theme.postsCount >= kThreshold) {
      // Get post IDs for this theme
      const themePosts_ = await db
        .select()
        .from(themePosts)
        .where(eq(themePosts.themeId, id))
        .limit(5); // Sample 5 quotes

      const postIds = themePosts_.map(tp => tp.postId);

      if (postIds.length > 0) {
        const posts = await db
          .select()
          .from(feedbackItems)
          .where(inArray(feedbackItems.id, postIds));

        // Extract text (encrypted content would need decryption, simplified here)
        exemplarQuotes = posts.map(p => ({
          text: p.content || p.behavior || p.impact || 'No content',
        }));
      }
    }

    const themeCard = {
      id: theme.id,
      label: theme.label,
      posts_count: theme.postsCount,
      top_terms: theme.topTerms,
      summary: theme.summary,
      trend_delta: theme.trendDelta,
      channels: theme.channels,
      dept_hits: theme.deptHits as Record<string, number>,
      k_threshold: kThreshold,
      exemplar_quotes: exemplarQuotes,
    };

    res.json(themeCard);
  } catch (error) {
    console.error('[THEMES API] Get error:', error);
    res.status(500).json({ error: 'Failed to fetch theme' });
  }
});

export default router;
