import { createEdgeLogger } from "../../_shared/logger.ts";

const logger = createEdgeLogger("slack/command");

Deno.serve(async (req) => {
  try {
    // TODO: Validate Slack signing secret
    // TODO: Parse slash command payload
    // TODO: Map slash command args to topic
    // TODO: Call submit_feedback function
    // TODO: Return ephemeral response to Slack

    logger.info("Slack slash command received");

    return new Response(
      JSON.stringify({ 
        text: "Feedback submitted (stub)" 
      }),
      { 
        headers: { "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (error) {
    logger.error("Slash command failed", error as Error);
    return new Response("Internal server error", { status: 500 });
  }
});
