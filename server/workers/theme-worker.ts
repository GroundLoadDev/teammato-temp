import { pipeline } from '@xenova/transformers';
// @ts-ignore - no types available
import similarity from 'cosine-similarity';
import { db } from '../db';
import { feedbackItems, postEmbeddings, themes, themePosts } from '../../shared/schema';
import { eq, and, gte, lt, sql, inArray } from 'drizzle-orm';
import { decryptFeedbackFields } from '../utils/encryptFeedback';

type Post = {
  id: string;
  orgId: string;
  threadId: string;
  slackUserId: string;
  content: string | null;
  behavior: string | null;
  impact: string | null;
  contentCt: Buffer | null;
  behaviorCt: Buffer | null;
  impactCt: Buffer | null;
  nonce: Buffer | null;
  createdAt: Date;
};

type BuiltTheme = {
  label: string;
  summary: string;
  topTerms: string[];
  postIndices: number[];
  channels: string[];
  deptHits: Record<string, number>;
};

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'from', 'this', 'that', 'have', 'has', 'are', 'was', 'but',
  'you', 'your', 'our', 'into', 'over', 'again', 'after', 'before', 'about', 'onto',
  'because', 'while', 'where', 'when', 'been', 'were', 'they', 'their', 'there', 'would',
  'could', 'should', 'will', 'can', 'did', 'does', 'doing', 'done'
]);

const LABEL_ALIASES: Record<string, string> = {
  'scope': 'scope creep',
  'burnout': 'burnout & load',
  'handoff': 'handoff gaps',
  'communication': 'communication gaps',
  'deadline': 'deadline pressure',
  'resource': 'resource constraints',
  'unclear': 'unclear expectations',
  'feedback': 'feedback delays',
  'meeting': 'meeting overhead',
  'process': 'process friction',
};

let embedder: any = null;

export async function runTheming(
  orgId: string,
  periodStart: string,
  periodEnd: string,
  kThreshold = 10
) {
  console.log(`[THEMING] Starting for org ${orgId}, period ${periodStart} to ${periodEnd}`);

  // 1) Load k-eligible posts (decrypt in memory)
  const rawPosts = await db
    .select()
    .from(feedbackItems)
    .where(
      and(
        eq(feedbackItems.orgId, orgId),
        gte(feedbackItems.createdAt, new Date(periodStart)),
        lt(feedbackItems.createdAt, new Date(periodEnd)),
        eq(feedbackItems.moderationStatus, 'auto_approved')
      )
    );

  if (rawPosts.length === 0) {
    console.log('[THEMING] No posts found for period');
    return;
  }

  // Decrypt posts
  const posts: Post[] = [];
  for (const raw of rawPosts) {
    let content = raw.content;
    let behavior = raw.behavior;
    let impact = raw.impact;

    if (raw.contentCt || raw.behaviorCt || raw.impactCt) {
      const decrypted = await decryptFeedbackFields(
        raw.orgId,
        raw.threadId,
        raw.contentCt,
        raw.behaviorCt,
        raw.impactCt,
        raw.nonce
      );
      content = decrypted.content || content;
      behavior = decrypted.behavior || behavior;
      impact = decrypted.impact || impact;
    }

    posts.push({
      id: raw.id,
      orgId: raw.orgId,
      threadId: raw.threadId,
      slackUserId: raw.slackUserId,
      content,
      behavior,
      impact,
      contentCt: raw.contentCt,
      behaviorCt: raw.behaviorCt,
      impactCt: raw.impactCt,
      nonce: raw.nonce,
      createdAt: raw.createdAt,
    });
  }

  // Combine content for embedding
  const texts = posts.map(p => {
    const parts = [p.content, p.behavior, p.impact].filter(Boolean);
    return parts.join(' ');
  });

  console.log(`[THEMING] Processing ${texts.length} posts`);

  // 2) Embed
  const vectors = await getEmbeddings(texts);

  // 3) Cluster
  const clusters = clusterByThreshold(vectors, 0.72);
  console.log(`[THEMING] Found ${clusters.length} clusters`);

  // 4) Build themes
  const builtThemes = buildThemes(posts, texts, vectors, clusters, { k: kThreshold });
  console.log(`[THEMING] Built ${builtThemes.length} themes`);

  // 5) Persist themes
  await saveThemes(orgId, periodStart, periodEnd, posts, builtThemes);
  console.log('[THEMING] Themes saved successfully');
}

/* ----------------- Embeddings ----------------- */
async function getEmbeddings(texts: string[]): Promise<number[][]> {
  if (!embedder) {
    console.log('[THEMING] Loading embedding model (all-MiniLM-L6-v2)...');
    embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    console.log('[THEMING] Model loaded');
  }

  const vectors: number[][] = [];
  for (const text of texts) {
    const output = await embedder(text, { pooling: 'mean', normalize: true });
    vectors.push(Array.from(output.data as Float32Array));
  }

  return vectors;
}

/* ----------------- Clustering ----------------- */
function clusterByThreshold(vectors: number[][], threshold: number): number[][] {
  const n = vectors.length;
  const adj: number[][] = Array.from({ length: n }, () => []);

  // Build adjacency graph
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const sim = similarity(vectors[i], vectors[j]);
      if (sim >= threshold) {
        adj[i].push(j);
        adj[j].push(i);
      }
    }
  }

  // Find connected components
  const visited = new Array(n).fill(false);
  const components: number[][] = [];

  for (let i = 0; i < n; i++) {
    if (visited[i]) continue;

    const component: number[] = [];
    const stack = [i];

    while (stack.length > 0) {
      const v = stack.pop()!;
      if (visited[v]) continue;

      visited[v] = true;
      component.push(v);

      for (const w of adj[v]) {
        if (!visited[w]) stack.push(w);
      }
    }

    components.push(component);
  }

  return components;
}

/* ----------------- Tokenization & Keywords ----------------- */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));
}

function topTerms(texts: string[], indices: number[], topN = 5): string[] {
  const df = new Map<string, number>();
  const tf = new Map<string, number>();

  // Calculate document frequency and term frequency
  for (const i of indices) {
    const terms = new Set(tokenize(texts[i]));
    const termsArray = Array.from(terms);
    for (const t of termsArray) {
      df.set(t, (df.get(t) || 0) + 1);
    }
    for (const t of tokenize(texts[i])) {
      tf.set(t, (tf.get(t) || 0) + 1);
    }
  }

  const N = indices.length;
  const scored: [string, number][] = Array.from(tf.entries()).map(([term, freq]) => {
    const idf = Math.log(1 + N / (1 + (df.get(term) || 1)));
    return [term, freq * idf];
  });

  scored.sort((a, b) => b[1] - a[1]);
  return scored.slice(0, topN).map(([term]) => term);
}

function labelFromTerms(terms: string[]): string {
  if (terms.length === 0) return 'General feedback';

  const primary = LABEL_ALIASES[terms[0]] || terms[0];
  const secondary = terms[1] || '';

  if (!secondary) return capitalize(primary);
  return `${capitalize(primary)} & ${secondary}`;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/* ----------------- Theme Building ----------------- */
function buildThemes(
  posts: Post[],
  texts: string[],
  vectors: number[][],
  clusters: number[][],
  opts: { k: number }
): BuiltTheme[] {
  const result: BuiltTheme[] = [];

  for (const cluster of clusters) {
    // Drop tiny clusters
    if (cluster.length < Math.max(3, Math.floor(opts.k * 0.5))) continue;

    const terms = topTerms(texts, cluster, 6);
    const label = labelFromTerms(terms);

    // Extract metadata (channels would come from thread lookup - simplified here)
    const channels = ['general']; // TODO: lookup from threads
    const deptHits: Record<string, number> = { unknown: cluster.length };

    // Templated summary
    const channelsLine = channels.length ? ` Most mentions came from #${channels.slice(0, 2).join(', #')}.` : '';
    const summary = `${cluster.length} posts raised concerns around ${label.toLowerCase()}. Common terms include ${terms.slice(0, 3).join(', ')}.${channelsLine}`;

    result.push({
      label,
      summary,
      topTerms: terms.slice(0, 5),
      postIndices: cluster,
      channels,
      deptHits,
    });
  }

  // Merge leftovers into "General friction"
  const covered = new Set(result.flatMap(t => t.postIndices));
  const remaining = posts.map((_, i) => i).filter(i => !covered.has(i));

  if (remaining.length >= Math.max(5, Math.floor(opts.k))) {
    const terms = topTerms(texts, remaining, 5);
    const channels = ['general'];
    const deptHits: Record<string, number> = { unknown: remaining.length };

    result.push({
      label: 'General friction & one-offs',
      summary: `A mix of smaller issues across ${terms.slice(0, 3).join(', ')}. No single sub-topic meets k this period.`,
      topTerms: terms.slice(0, 5),
      postIndices: remaining,
      channels,
      deptHits,
    });
  }

  return result;
}

/* ----------------- Histogram Helper ----------------- */
function histogram(arr: string[]): { map: Record<string, number>; sorted: string[] } {
  const map = new Map<string, number>();
  for (const item of arr) {
    map.set(item, (map.get(item) || 0) + 1);
  }
  const sorted = Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => k);
  return { map: Object.fromEntries(map), sorted };
}

/* ----------------- Persistence ----------------- */
async function saveThemes(
  orgId: string,
  periodStart: string,
  periodEnd: string,
  posts: Post[],
  builtThemes: BuiltTheme[]
) {
  // Delete existing themes for this period
  await db
    .delete(themes)
    .where(
      and(
        eq(themes.orgId, orgId),
        sql`${themes.periodStart} = ${periodStart}::date`,
        sql`${themes.periodEnd} = ${periodEnd}::date`
      )
    );

  // Insert new themes
  for (const theme of builtThemes) {
    const [inserted] = await db
      .insert(themes)
      .values({
        orgId,
        periodStart: periodStart,
        periodEnd: periodEnd,
        label: theme.label,
        summary: theme.summary,
        postsCount: theme.postIndices.length,
        topTerms: theme.topTerms,
        channels: theme.channels,
        deptHits: theme.deptHits,
        trendDelta: 0,
      })
      .returning();

    // Insert theme-post mappings
    for (const idx of theme.postIndices) {
      await db.insert(themePosts).values({
        themeId: inserted.id,
        postId: posts[idx].id,
      });
    }
  }
}
