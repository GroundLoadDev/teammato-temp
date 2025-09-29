import { createEdgeLogger } from "../_shared/logger.ts";

const logger = createEdgeLogger("submit_comment");

Deno.serve(async (req) => {
  try {
    const { thread_id, body } = await req.json();
    
    // TODO: Implement comment submission with encryption and pseudonym
    logger.info("Comment submission", { threadId: thread_id });

    return new Response(
      JSON.stringify({ id: "stub-comment-id", render_state: "visible" }),
      { headers: { "Content-Type": "application/json" }, status: 201 }
    );
  } catch (error) {
    logger.error("Comment submission failed", error as Error);
    return new Response("Internal server error", { status: 500 });
  }
});
