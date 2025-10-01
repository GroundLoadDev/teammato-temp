import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import crypto from "crypto";

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
  'users:read'
].join(',');

// User scopes (for getting installer email)
const USER_SCOPES = [
  'users:read',
  'users:read.email'
].join(',');

// In-memory state storage (TODO: use Redis/session store in production)
const oauthStates = new Map<string, number>();

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Slack OAuth - Initiate install
  app.get('/api/slack/install', (req, res) => {
    const state = crypto.randomBytes(16).toString('hex');
    
    // Store state with timestamp for CSRF validation (expire after 10 min)
    oauthStates.set(state, Date.now());
    
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
    const stateTimestamp = oauthStates.get(state as string);
    if (!stateTimestamp) {
      return res.redirect('/post-install?error=invalid_state');
    }

    // Check state hasn't expired (10 minutes)
    if (Date.now() - stateTimestamp > 10 * 60 * 1000) {
      oauthStates.delete(state as string);
      return res.redirect('/post-install?error=state_expired');
    }

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
      }

      // Check if this Slack team is already installed
      const existingTeam = await storage.getSlackTeamByTeamId(team.id);

      let orgId: string;

      if (existingTeam) {
        // Reinstall: update access token
        await storage.updateSlackTeamToken(team.id, access_token);
        orgId = existingTeam.orgId;
      } else {
        // First install: auto-provision org
        const newOrg = await storage.createOrg({
          name: team.name,
          verifiedDomains: [],
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
          await storage.createUser({
            orgId: newOrg.id,
            slackUserId: authed_user.id,
            email: installerEmail,
            role: 'owner',
          });
        }
      }

      // Redirect to post-install success page
      res.redirect(`/post-install?success=true&org=${encodeURIComponent(team.name)}`);

    } catch (error) {
      console.error('OAuth callback error:', error);
      res.redirect('/post-install?error=server_error');
    }
  });

  // Slack slash command handler
  app.post('/api/slack/command', async (req, res) => {
    // TODO: Verify Slack signature using SLACK_SIGNING_SECRET
    // TODO: Parse command and respond
    
    res.json({
      response_type: 'ephemeral',
      text: 'Slack command handler - coming soon!'
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
