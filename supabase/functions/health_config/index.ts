import { createEdgeLogger } from "../_shared/logger.ts";

const logger = createEdgeLogger("health_config");

Deno.serve(async (_req) => {
  logger.info("Health check");
  return new Response(JSON.stringify({ status: "ok", service: "teammato" }), {
    headers: { "Content-Type": "application/json" }
  });
});
