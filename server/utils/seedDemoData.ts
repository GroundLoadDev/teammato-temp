import { db } from "../db";
import { orgs, users, topics, feedbackThreads, feedbackItems, slackTeams, slackSettings } from "@shared/schema";
import { sql } from "drizzle-orm";
import { eq } from "drizzle-orm";

const DEMO_ORG_NAME = "Acme Corp (Demo)";
const DEMO_EMAIL = "demo@teammato.app";

// Helper to generate realistic timestamps
const daysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

const hoursAgo = (hours: number) => {
  const date = new Date();
  date.setHours(date.getHours() - hours);
  return date;
};

export async function seedDemoData() {
  // Check if demo org already exists
  const existingOrg = await db
    .select()
    .from(orgs)
    .where(eq(orgs.name, DEMO_ORG_NAME))
    .limit(1);

  if (existingOrg.length > 0) {
    console.log('Demo org already exists');
    return existingOrg[0];
  }

  console.log('Creating demo organization...');

  // Create demo org with 500 plan
  const [demoOrg] = await db
    .insert(orgs)
    .values({
      name: DEMO_ORG_NAME,
      verifiedDomains: ['acmecorp.com'],
      settings: {
        k_anonymity: 5,
        profanity_policy: 'strict',
        redact_ui: true,
        enable_oidc: false,
        enable_llm_moderation: true,
        enable_theming: true,
        plan: 'team_500',
        retention_days: 365,
        legal_hold: false
      },
      stripeCustomerId: 'cus_demo_acme',
      stripeSubscriptionId: 'sub_demo_acme',
      stripePriceId: 'price_team_500_monthly',
      billingStatus: 'active',
      seatCap: 500,
      billingPeriod: 'monthly',
      priceAmount: 100000, // $1000 in cents
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      cancelAtPeriodEnd: false,
      billingEmail: 'billing@acmecorp.com',
      createdAt: daysAgo(120), // 4 months old
    })
    .returning();

  console.log('Creating demo admin user...');

  // Create demo admin user
  const [demoAdmin] = await db
    .insert(users)
    .values({
      orgId: demoOrg.id,
      email: DEMO_EMAIL,
      role: 'admin',
      profile: {
        name: 'Demo Admin',
        real_name: 'Demo Admin',
        display_name: 'Demo Admin',
        image_72: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
      },
      createdAt: daysAgo(120),
    })
    .returning();

  console.log('Creating additional users...');

  // Create a diverse set of users (we'll create 20 sample users, representing 500 total)
  const roles = ['owner', 'admin', 'moderator', 'viewer'];
  const userNames = [
    'Sarah Chen', 'Marcus Johnson', 'Priya Patel', 'Alex Rodriguez', 
    'Emma Thompson', 'David Kim', 'Lisa Anderson', 'James Wilson',
    'Maya Singh', 'Tom Brown', 'Jessica Lee', 'Ryan Martinez',
    'Sophia Davis', 'Chris Taylor', 'Olivia White', 'Daniel Harris',
    'Ava Jackson', 'Ethan Moore', 'Isabella Martin', 'Noah Garcia'
  ];

  const demoUsersArrays = await Promise.all(
    userNames.map((name, idx) => 
      db.insert(users).values({
        orgId: demoOrg.id,
        email: `${name.toLowerCase().replace(' ', '.')}@acmecorp.com`,
        role: roles[idx % 4],
        slackUserId: `U0${idx.toString().padStart(6, '0')}`,
        profile: {
          name,
          real_name: name,
          display_name: name,
          image_72: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
        },
        createdAt: daysAgo(Math.floor(Math.random() * 90) + 30),
      }).returning()
    )
  );
  const demoUsers = demoUsersArrays.flat();

  console.log('Creating Slack connection...');

  // Create Slack team
  await db.insert(slackTeams).values({
    orgId: demoOrg.id,
    teamId: 'T_DEMO_ACME',
    accessToken: 'xoxb-demo-token',
    botUserId: 'U_DEMO_BOT',
    createdAt: daysAgo(115),
  });

  // Create Slack settings
  await db.insert(slackSettings).values({
    orgId: demoOrg.id,
    digestChannel: 'C_GENERAL',
    digestEnabled: true,
    createdAt: daysAgo(115),
  });

  console.log('Creating topics...');

  // Create diverse, realistic topics
  const topicData = [
    {
      name: 'Engineering Process Improvements',
      slug: 'eng-process',
      description: 'Share ideas to streamline our development workflow and reduce friction',
      status: 'active',
      participantCount: 23,
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      createdAt: daysAgo(45),
    },
    {
      name: 'Remote Work Experience',
      slug: 'remote-work',
      description: 'How can we improve our remote/hybrid work policies?',
      status: 'active',
      participantCount: 47,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: daysAgo(30),
    },
    {
      name: 'Benefits & Perks Feedback',
      slug: 'benefits',
      description: 'What benefits matter most to you? What would you like to see added?',
      status: 'active',
      participantCount: 31,
      expiresAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      createdAt: daysAgo(20),
    },
    {
      name: 'Q1 Performance Review Process',
      slug: 'q1-reviews',
      description: 'Feedback on our performance review cycle',
      status: 'locked',
      participantCount: 18,
      expiresAt: daysAgo(5),
      createdAt: daysAgo(60),
    },
    {
      name: 'Office Space & Amenities',
      slug: 'office-space',
      description: 'How can we make our office more productive and comfortable?',
      status: 'active',
      participantCount: 12,
      expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      createdAt: daysAgo(15),
    },
    {
      name: 'Learning & Development',
      slug: 'learning-dev',
      description: 'What training or growth opportunities would help you most?',
      status: 'active',
      participantCount: 28,
      expiresAt: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
      createdAt: daysAgo(25),
    },
    {
      name: 'Product Roadmap Input',
      slug: 'product-roadmap',
      description: 'Share your thoughts on our product direction',
      status: 'active',
      participantCount: 35,
      expiresAt: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
      createdAt: daysAgo(18),
    },
    {
      name: 'Team Communication',
      slug: 'team-comm',
      description: 'How can we improve cross-team collaboration and information sharing?',
      status: 'active',
      participantCount: 41,
      expiresAt: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000),
      createdAt: daysAgo(12),
    },
    {
      name: 'Onboarding Experience',
      slug: 'onboarding',
      description: 'Help us improve the new hire experience',
      status: 'active',
      participantCount: 9,
      expiresAt: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      createdAt: daysAgo(8),
    },
    {
      name: 'Diversity & Inclusion Initiatives',
      slug: 'diversity',
      description: 'Share your thoughts on making Acme more inclusive',
      status: 'active',
      participantCount: 26,
      expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      createdAt: daysAgo(22),
    },
  ];

  const createdTopicsArrays = await Promise.all(
    topicData.map(topic =>
      db.insert(topics).values({
        orgId: demoOrg.id,
        name: topic.name,
        slug: topic.slug,
        description: topic.description,
        slackChannelId: `C_${topic.slug.toUpperCase().replace('-', '_')}`,
        kThreshold: 5,
        isActive: topic.status === 'active',
        status: topic.status as any,
        windowDays: 21,
        createdAt: topic.createdAt,
        expiresAt: topic.expiresAt,
      }).returning()
    )
  );
  const createdTopics = createdTopicsArrays.flat();

  console.log('Creating feedback threads...');

  // Create realistic feedback threads
  const feedbackData = [
    // Engineering Process
    {
      topicId: createdTopics[0].id,
      title: 'Code review turnaround is too slow',
      participantCount: 8,
      status: 'ready',
      createdAt: daysAgo(40),
    },
    {
      topicId: createdTopics[0].id,
      title: 'Need better deployment automation',
      participantCount: 12,
      status: 'ready',
      createdAt: daysAgo(38),
    },
    {
      topicId: createdTopics[0].id,
      title: 'Sprint planning takes too long',
      participantCount: 6,
      status: 'ready',
      createdAt: daysAgo(35),
    },
    // Remote Work
    {
      topicId: createdTopics[1].id,
      title: 'Async communication needs improvement',
      participantCount: 15,
      status: 'ready',
      createdAt: daysAgo(28),
    },
    {
      topicId: createdTopics[1].id,
      title: 'Time zone differences causing meeting fatigue',
      participantCount: 11,
      status: 'ready',
      createdAt: daysAgo(26),
    },
    {
      topicId: createdTopics[1].id,
      title: 'Home office equipment stipend is insufficient',
      participantCount: 9,
      status: 'ready',
      createdAt: daysAgo(24),
    },
    // Benefits
    {
      topicId: createdTopics[2].id,
      title: 'Would like mental health support options',
      participantCount: 18,
      status: 'ready',
      createdAt: daysAgo(18),
    },
    {
      topicId: createdTopics[2].id,
      title: 'Parental leave policy could be more generous',
      participantCount: 7,
      status: 'ready',
      createdAt: daysAgo(16),
    },
    {
      topicId: createdTopics[2].id,
      title: 'Health insurance options are limited',
      participantCount: 13,
      status: 'ready',
      createdAt: daysAgo(14),
    },
    // Q1 Reviews (locked)
    {
      topicId: createdTopics[3].id,
      title: 'Self-assessment template was confusing',
      participantCount: 8,
      status: 'locked',
      createdAt: daysAgo(55),
    },
    {
      topicId: createdTopics[3].id,
      title: 'Timeline was too compressed',
      participantCount: 10,
      status: 'locked',
      createdAt: daysAgo(52),
    },
    // Office Space
    {
      topicId: createdTopics[4].id,
      title: 'Need more quiet focus areas',
      participantCount: 7,
      status: 'ready',
      createdAt: daysAgo(12),
    },
    {
      topicId: createdTopics[4].id,
      title: 'Conference rooms are always booked',
      participantCount: 5,
      status: 'collecting',
      createdAt: daysAgo(10),
    },
    // Learning & Development
    {
      topicId: createdTopics[5].id,
      title: 'Would love leadership training opportunities',
      participantCount: 14,
      status: 'ready',
      createdAt: daysAgo(23),
    },
    {
      topicId: createdTopics[5].id,
      title: 'Conference budget is too limited',
      participantCount: 9,
      status: 'ready',
      createdAt: daysAgo(21),
    },
    // Product Roadmap
    {
      topicId: createdTopics[6].id,
      title: 'Need better mobile app experience',
      participantCount: 16,
      status: 'ready',
      createdAt: daysAgo(16),
    },
    {
      topicId: createdTopics[6].id,
      title: 'API documentation needs work',
      participantCount: 11,
      status: 'ready',
      createdAt: daysAgo(14),
    },
    {
      topicId: createdTopics[6].id,
      title: 'Performance issues on large datasets',
      participantCount: 8,
      status: 'ready',
      createdAt: daysAgo(11),
    },
    // Team Communication
    {
      topicId: createdTopics[7].id,
      title: 'Too many meetings, not enough documentation',
      participantCount: 19,
      status: 'ready',
      createdAt: daysAgo(10),
    },
    {
      topicId: createdTopics[7].id,
      title: 'Engineering and Product need better sync',
      participantCount: 12,
      status: 'ready',
      createdAt: daysAgo(8),
    },
    {
      topicId: createdTopics[7].id,
      title: 'Weekly all-hands could be more engaging',
      participantCount: 10,
      status: 'ready',
      createdAt: daysAgo(6),
    },
    // Onboarding (below threshold)
    {
      topicId: createdTopics[8].id,
      title: 'First week was overwhelming',
      participantCount: 4,
      status: 'collecting',
      createdAt: daysAgo(6),
    },
    {
      topicId: createdTopics[8].id,
      title: 'Buddy system was really helpful',
      participantCount: 5,
      status: 'ready',
      createdAt: daysAgo(4),
    },
    // Diversity & Inclusion
    {
      topicId: createdTopics[9].id,
      title: 'Need more diverse hiring practices',
      participantCount: 13,
      status: 'ready',
      createdAt: daysAgo(20),
    },
    {
      topicId: createdTopics[9].id,
      title: 'ERGs would be valuable',
      participantCount: 8,
      status: 'ready',
      createdAt: daysAgo(17),
    },
    {
      topicId: createdTopics[9].id,
      title: 'Inclusive language training needed',
      participantCount: 5,
      status: 'collecting',
      createdAt: daysAgo(15),
    },
  ];

  const createdThreadsArrays = await Promise.all(
    feedbackData.map(thread =>
      db.insert(feedbackThreads).values({
        orgId: demoOrg.id,
        topicId: thread.topicId,
        title: thread.title,
        status: thread.status as any,
        kThreshold: 5,
        participantCount: thread.participantCount,
        slackMessageTs: `${Date.now()}.${Math.random()}`,
        slackChannelId: 'C_GENERAL',
        moderationStatus: 'auto_approved',
        createdAt: thread.createdAt,
      }).returning()
    )
  );
  const createdThreads = createdThreadsArrays.flat();

  console.log('Creating feedback items (comments)...');

  // Create sample feedback items for the threads
  const feedbackItemsData = [
    // Code review thread
    { threadId: createdThreads[0].id, content: 'Waiting 2-3 days for reviews blocks progress', createdAt: daysAgo(40) },
    { threadId: createdThreads[0].id, content: 'Agree, maybe we need more reviewers on rotation', createdAt: daysAgo(39) },
    { threadId: createdThreads[0].id, content: 'Could we set SLAs for review turnaround?', createdAt: daysAgo(39) },
    { threadId: createdThreads[0].id, content: 'Sometimes PRs are just too big to review quickly', createdAt: daysAgo(38) },
    { threadId: createdThreads[0].id, content: 'Smaller PRs would definitely help', createdAt: daysAgo(38) },
    
    // Deployment automation thread
    { threadId: createdThreads[1].id, content: 'Manual deployment steps are error-prone', createdAt: daysAgo(38) },
    { threadId: createdThreads[1].id, content: 'Would love to see one-click deployments', createdAt: daysAgo(37) },
    { threadId: createdThreads[1].id, content: 'CI/CD pipeline needs major upgrade', createdAt: daysAgo(37) },
    
    // Async communication thread
    { threadId: createdThreads[3].id, content: 'Too many urgent DMs instead of using async channels', createdAt: daysAgo(28) },
    { threadId: createdThreads[3].id, content: 'People expect immediate responses even for non-urgent items', createdAt: daysAgo(27) },
    { threadId: createdThreads[3].id, content: 'Need better norms around response time expectations', createdAt: daysAgo(27) },
    { threadId: createdThreads[3].id, content: 'Notion/wiki could help reduce Slack noise', createdAt: daysAgo(26) },
    
    // Mental health support thread
    { threadId: createdThreads[6].id, content: 'Current EAP is not well advertised', createdAt: daysAgo(18) },
    { threadId: createdThreads[6].id, content: 'Would love to see therapy/counseling stipend', createdAt: daysAgo(17) },
    { threadId: createdThreads[6].id, content: 'Mental health days separate from PTO would be great', createdAt: daysAgo(17) },
    { threadId: createdThreads[6].id, content: 'Meditation app subscriptions could be a simple win', createdAt: daysAgo(16) },
    
    // Too many meetings thread
    { threadId: createdThreads[18].id, content: 'Back-to-back meetings leave no time for deep work', createdAt: daysAgo(10) },
    { threadId: createdThreads[18].id, content: 'Many meetings could be a doc or async update', createdAt: daysAgo(9) },
    { threadId: createdThreads[18].id, content: 'No-meeting Fridays would be amazing', createdAt: daysAgo(9) },
    { threadId: createdThreads[18].id, content: 'Better meeting agendas would help efficiency', createdAt: daysAgo(8) },
  ];

  await Promise.all(
    feedbackItemsData.map(item =>
      db.insert(feedbackItems).values({
        orgId: demoOrg.id,
        threadId: item.threadId,
        content: Buffer.from(item.content), // In production this would be encrypted
        itemType: 'comment',
        status: 'approved',
        submitterHash: `hash_${Math.random().toString(36).substring(7)}`,
        createdAt: item.createdAt,
      })
    )
  );

  console.log('Demo data seeded successfully!');
  return demoOrg;
}
