import { createEdgeLogger } from "../../_shared/logger.ts";

const logger = createEdgeLogger("slack/oauth");

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    
    if (!code) {
      logger.error("No code provided in OAuth callback");
      return new Response("Missing code", { status: 400 });
    }

    logger.info("Slack OAuth callback received", { hasCode: !!code });

    // TODO: Exchange code for access token
    // TODO: Auto-provision org on first install:
    //   1. Check if slack_teams row exists for team_id
    //   2. If not, create org in orgs table
    //   3. Create slack_teams row with team_id, org_id, access_token
    //   4. Map installer as owner in users table
    // TODO: Redirect to /post-install

    // Placeholder response
    return new Response(
      JSON.stringify({ 
        message: "OAuth callback - auto-provisioning stub", 
        redirectTo: "/post-install" 
      }),
      { 
        headers: { "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (error) {
    logger.error("OAuth callback failed", error as Error);
    return new Response("Internal server error", { status: 500 });
  }
});
