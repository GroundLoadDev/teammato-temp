import { createEdgeLogger } from "../_shared/logger.ts";

const logger = createEdgeLogger("submit_feedback");

Deno.serve(async (req) => {
  try {
    const { title, body, topic_id } = await req.json();
    
    // TODO: Get user from JWT
    // TODO: Generate pseudonym (anon-{hash})
    // TODO: Encrypt title and body with org key
    // TODO: Insert into threads table
    // TODO: Check moderation flags
    // TODO: Return render_state based on k-anonymity

    logger.info("Feedback submission", { hasTopic: !!topic_id });

    return new Response(
      JSON.stringify({ 
        id: "stub-thread-id",
        render_state: "suppressed",
        created_at: new Date().toISOString()
      }),
      { 
        headers: { "Content-Type": "application/json" },
        status: 201 
      }
    );
  } catch (error) {
    logger.error("Feedback submission failed", error as Error);
    return new Response("Internal server error", { status: 500 });
  }
});
