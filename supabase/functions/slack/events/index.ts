import { createEdgeLogger } from "../../_shared/logger.ts";

const logger = createEdgeLogger("slack/events");

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    
    // Handle URL verification challenge
    if (payload.type === "url_verification") {
      return new Response(
        JSON.stringify({ challenge: payload.challenge }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // TODO: Validate Slack signing secret
    // TODO: Handle event types (message reactions, etc.)
    
    logger.info("Slack event received", { type: payload.type });

    return new Response(
      JSON.stringify({ ok: true }),
      { 
        headers: { "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (error) {
    logger.error("Event handling failed", error as Error);
    return new Response("Internal server error", { status: 500 });
  }
});
