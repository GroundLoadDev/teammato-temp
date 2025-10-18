import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
// NOTE: do NOT import "pg" here; we'll load it dynamically in production only.

import { registerRoutes } from "./routes";
import { setupVite, log } from "./vite";
import { startTopicExpiryCron, startInstanceRotationCron } from "./cron/topicExpiry";
import { startAudienceSyncCron } from "./cron/audienceSync";
import { startWeeklyDigestCron } from "./cron/digestWeekly";

const app = express();

// ===== BOOT MARKER (watch for this in Railway logs) =====
console.log("[BOOTMARK v2] NODE_ENV=%s PORT=%s", process.env.NODE_ENV, process.env.PORT);

// ---- CORS (allow Replit/Vite + your Pages origin via env) --------------------
const ALLOWED_ORIGINS = new Set<string>([
  "https://teammatodev.github.io",
  "http://localhost:5173",
  "http://localhost:5000",
]);
if (process.env.FRONTEND_ORIGIN) ALLOWED_ORIGINS.add(process.env.FRONTEND_ORIGIN);

app.use((req, res, next) => {
  const origin = req.headers.origin as string | undefined;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, x-admin-token, Stripe-Signature, X-Slack-Signature, X-Slack-Request-Timestamp"
    );
  }
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// ---- Trust proxy for secure cookies in prod ----------------------------------
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// ---- Early health + version routes (DB-free) ---------------------------------
app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true, service: "teammato-api", ts: Date.now() });
});
app.get("/__version", (_req, res) => {
  res.status(200).json({ bootmark: "v2", env: process.env.NODE_ENV, port: process.env.PORT || "5000" });
});

// ---- Sessions: Postgres store in prod (dynamic import), memory in dev --------
const PgSession = connectPg(session);

if (!process.env.SESSION_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("SESSION_SECRET environment variable is required in production");
}

async function attachSessionMiddleware() {
  if (process.env.NODE_ENV !== "production") {
    app.use(
      session({
        secret: process.env.SESSION_SECRET || "dev-secret-change-in-production",
        resave: false,
        saveUninitialized: false,
        cookie: { secure: false, httpOnly: true, sameSite: "lax", maxAge: 7 * 24 * 60 * 60 * 1000 },
        name: "tm.sid",
      })
    );
    return;
  }

  const { Pool } = await import("pg");
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) throw new Error("DATABASE_URL is required in production");

  const store = new PgSession({
    pool: new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } }),
    tableName: "user_sessions",
    createTableIfMissing: true,
  });

  app.use(
    session({
      store,
      secret: process.env.SESSION_SECRET as string,
      resave: false,
      saveUninitialized: false,
      cookie: { secure: true, httpOnly: true, sameSite: "none", maxAge: 7 * 24 * 60 * 60 * 1000 },
      name: "tm.sid",
    })
  );
}

// ---- Raw bodies for Slack/Stripe signatures, then normal parsers -------------
app.use("/api/slack/command", express.raw({ type: "application/x-www-form-urlencoded" }));
app.use("/api/slack/modal", express.raw({ type: "application/x-www-form-urlencoded" }));
app.use("/api/stripe/webhook", express.raw({ type: "application/json" }));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ---- Request logging for API routes ------------------------------------------
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;
  const originalResJson = res.json.bind(res);
  (res as any).json = (bodyJson: any, ...args: any[]) => {
    capturedJsonResponse = bodyJson;
    return originalResJson(bodyJson, ...args);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) { try { logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`; } catch {} }
      if (logLine.length > 120) logLine = logLine.slice(0, 119) + "…";
      log(logLine);
    }
  });
  next();
});

// ---- Main bootstrap -----------------------------------------------------------
(async () => {
  await attachSessionMiddleware();

  const server = await registerRoutes(app);

  // Error handler (after routes)
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    app.get("/", (_req, res) => {
      res.json({ ok: true, service: "teammato-api" });
    });
  }

  // --- Listening: dev uses Node server; prod uses app.listen ------------------
  const port = parseInt(process.env.PORT || "5000", 10);

  if (app.get("env") === "development") {
    server.listen({ port, host: "0.0.0.0" }, () => {
      log(`serving (dev) on port ${port}`);
      if (process.env.DISABLE_CRON_JOBS !== "true") {
        log("Starting in-process cron jobs...");
        startTopicExpiryCron();
        startInstanceRotationCron();
        startAudienceSyncCron();
        startWeeklyDigestCron();
      } else {
        log("Cron jobs disabled (DISABLE_CRON_JOBS=true). Use external cron service.");
      }
    });
  } else {
    app.listen(port, "0.0.0.0", () => {
      log(`serving (prod) on port ${port}`);
      if (process.env.DISABLE_CRON_JOBS !== "true") {
        log("Starting in-process cron jobs...");
        startTopicExpiryCron();
        startInstanceRotationCron();
        startAudienceSyncCron();
        startWeeklyDigestCron();
      } else {
        log("Cron jobs disabled (DISABLE_CRON_JOBS=true). Use external cron service.");
      }
    });
  }
})();

export { app };
