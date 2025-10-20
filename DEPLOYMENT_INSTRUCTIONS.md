# Teammato Production Deployment Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      DEVELOPMENT (Replit)                        │
│  - Local testing & building                                      │
│  - DATABASE_URL → Dev Neon database (ep-billowing-hat-...)     │
│  - Push to GitHub on merge                                       │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                         GitHub (main)                            │
│  - Version control & CI/CD trigger                              │
└──────┬──────────────────────────────────────┬───────────────────┘
       │                                      │
       ▼                                      ▼
┌──────────────────────┐            ┌─────────────────────────┐
│  GitHub Pages        │            │  Railway                │
│  (Frontend)          │            │  (Backend API)          │
│  ✓ teammato.com      │◄───────────┤  ✓ Backend server       │
│  ✓ Static files      │   CORS     │  ✓ Session mgmt         │
│  ✓ React SPA         │            │  ✓ Webhooks             │
└──────────────────────┘            └───────┬─────────────────┘
                                            │
                                            ▼
                                    ┌───────────────────┐
                                    │  Neon PostgreSQL  │
                                    │  (Production DB)  │
                                    │  ep-aged-surf-... │
                                    └───────────────────┘
```

---

## 🗄️ Database Configuration

### Two Separate Neon Databases

You maintain **two independent Neon PostgreSQL databases**:

#### Development Database (Replit)
```
postgresql://neondb_owner:npg_CEp0hXb3PRmK@ep-billowing-hat-adzdqmmd.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
```
- Used by Replit for local development
- Safe for testing, breaking changes, data resets
- Has full schema + test data

#### Production Database (Railway)
```
postgresql://neondb_owner:npg_ftPdHmj95SxT@ep-aged-surf-aengyu41-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```
- Used by Railway for production
- Contains REAL customer data
- Never modified directly - only via migrations

### Initial Schema Setup (One-Time)

Your production database is currently **empty**. You need to apply the schema:

**Option 1: Quick Setup (Run Once)**
```bash
# From Replit terminal
DATABASE_URL="postgresql://neondb_owner:npg_ftPdHmj95SxT@ep-aged-surf-aengyu41-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require" npm run db:push
```

This creates all tables and views in your Railway production database.

**Option 2: SQL Migration (Manual)**
Run the SQL from `migrations/0000_init.sql` directly in Neon's SQL editor against your production database.

### Future Schema Changes

When you modify `shared/schema.ts`:

1. **Test in Replit** (dev database):
   ```bash
   npm run db:push
   ```

2. **Apply to Production** (after testing):
   ```bash
   # Set Railway's production DATABASE_URL temporarily
   DATABASE_URL="<railway-prod-url>" npm run db:push
   ```

3. **Commit changes** to git so Railway stays in sync

**⚠️ CRITICAL: Keep Replit's DATABASE_URL pointing to DEV database**

Check Replit Secrets to ensure `DATABASE_URL` is the development database URL (ep-billowing-hat-...), NOT the production one.

---

## 🔧 Environment Configuration

### Replit (Development)

**Required Secrets:**
```bash
DATABASE_URL=postgresql://neondb_owner:npg_CEp0hXb3PRmK@ep-billowing-hat-adzdqmmd.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
TM_MASTER_KEY_V1=<your-base64-encryption-key>
SESSION_SECRET=<random-32-char-string>
SLACK_CLIENT_ID=<from-slack-app-dashboard>
SLACK_CLIENT_SECRET=<from-slack-app-dashboard>
SLACK_SIGNING_SECRET=<from-slack-app-dashboard>
SLACK_REDIRECT_URI=https://<your-replit-domain>.replit.dev/api/slack/oauth
TESTING_STRIPE_SECRET_KEY=<test-mode-key-from-stripe>
STRIPE_WEBHOOK_SECRET=<test-mode-webhook-secret>
```

**Environment Variables (Replit auto-sets):**
- `PGHOST`, `PGPORT`, `PGUSER`, `PGDATABASE` - Ignored by your app
- `NODE_ENV=development` - Set by npm scripts

---

### Railway (Production Backend)

**Required Environment Variables:**

```bash
# Database
DATABASE_URL=postgresql://neondb_owner:npg_ftPdHmj95SxT@ep-aged-surf-aengyu41-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# Application
NODE_ENV=production
SESSION_SECRET=<different-from-replit-random-32-chars>

# Encryption
TM_MASTER_KEY_V1=<same-as-replit>

# Cron Jobs (disabled - use external service)
DISABLE_CRON_JOBS=true

# Slack OAuth
SLACK_CLIENT_ID=<from-slack-app-dashboard>
SLACK_CLIENT_SECRET=<from-slack-app-dashboard>
SLACK_SIGNING_SECRET=<from-slack-app-dashboard>
SLACK_REDIRECT_URI=https://teammato-production.up.railway.app/api/slack/oauth

# Stripe (Production Keys)
# NOTE: App uses STRIPE_SECRET_KEY first, falls back to TESTING_STRIPE_SECRET_KEY
# For production, set STRIPE_SECRET_KEY (live key from Stripe dashboard)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=<production-webhook-signing-secret>

# CORS (allow frontend)
# NOTE: Verify this matches your actual Railway domain
FRONTEND_ORIGIN=https://www.teammato.com
```

**Important Notes:**
- **Stripe Keys**: Set `STRIPE_SECRET_KEY` (not `TESTING_STRIPE_SECRET_KEY`) for production
  - The app prefers `STRIPE_SECRET_KEY`, falls back to `TESTING_STRIPE_SECRET_KEY`
  - Use live keys (sk_live_...) for production payments
- **Railway Domain**: Verify your actual Railway domain matches `teammato-production.up.railway.app`
  - Update `SLACK_REDIRECT_URI` and `FRONTEND_ORIGIN` if different

**⚠️ DO NOT SET:**
- `PORT` - Railway sets this automatically
- `PGHOST`, `PGUSER`, etc. - Not used by your app

**Railway Service Configuration:**
- Build Command: `npm install --no-audit --no-fund && npm run build`
- Start Command: `npm start`
- Health Check Path: `/health`

---

### GitHub Actions (Frontend Build)

**Create `.github/workflows/deploy.yml`:**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci --no-audit --no-fund
      
      - name: Build frontend
        run: npm run build
        env:
          VITE_API_BASE_URL: https://teammato-production.up.railway.app
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist/public

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

**Important:** Update `VITE_API_BASE_URL` if your Railway domain differs from `teammato-production.up.railway.app`

**Commit this file to your repository:**
```bash
mkdir -p .github/workflows
# Create the file above
git add .github/workflows/deploy.yml
git commit -m "Add GitHub Pages deployment workflow"
git push origin main
```

---

## 🔗 External Service Webhooks

After Railway is live, update these webhook URLs:

### Slack App Dashboard

Navigate to: https://api.slack.com/apps → Your App → Features

**OAuth & Permissions:**
- Redirect URL: `https://teammato-production.up.railway.app/api/slack/oauth`

**Slash Commands:**
- Command: `/teammato`
- Request URL: `https://teammato-production.up.railway.app/api/slack/command`

**Interactivity & Shortcuts:**
- Request URL: `https://teammato-production.up.railway.app/api/slack/modal`
- Note: This handles both button actions and modal submissions

**Event Subscriptions:**
- Request URL: `https://teammato-production.up.railway.app/api/slack/events`
- Subscribe to: `app_uninstalled`, `app_home_opened`

**⚠️ Important:** Replace `teammato-production.up.railway.app` with your actual Railway domain if different

### Stripe Dashboard

Navigate to: https://dashboard.stripe.com → Developers → Webhooks

**Endpoint URL:**
```
https://teammato-production.up.railway.app/api/stripe/webhook
```

**Listen to events:**
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

**After creating the endpoint:**
1. Copy the "Signing secret" (starts with `whsec_...`)
2. Update Railway's `STRIPE_WEBHOOK_SECRET` with this value
3. Redeploy Railway to pick up the new secret

---

## 🧪 Testing & Verification

### Pre-Deployment Checklist

- [ ] Replit DATABASE_URL points to **dev database** (ep-billowing-hat-...)
- [ ] Railway DATABASE_URL points to **prod database** (ep-aged-surf-...)
- [ ] Production database schema applied (tables exist)
- [ ] GitHub Actions workflow file exists (`.github/workflows/deploy.yml`)
- [ ] Railway environment variables set (see above)
- [ ] `VITE_API_BASE_URL` in GitHub Actions = Railway URL
- [ ] Railway domain verified in all webhook URLs

### Post-Deployment Verification

**1. Frontend (GitHub Pages)**
- [ ] Visit https://www.teammato.com - page loads
- [ ] Open browser console - no CORS errors
- [ ] Check Network tab - API calls go to `teammato-production.up.railway.app`

**2. Backend (Railway)**
- [ ] Visit https://teammato-production.up.railway.app/health
  - Should return: `{"ok":true,"service":"teammato-api","ts":...}`
- [ ] Visit https://teammato-production.up.railway.app/__version
  - Should return: `{"bootmark":"v2","env":"production","port":"..."}`
- [ ] Check Railway logs for: `[BOOTMARK v2] NODE_ENV=production PORT=<number>`
- [ ] Verify NO error: "TM_MASTER_KEY_V1 not set"
- [ ] Verify NO error: "relation does not exist"

**3. Database (Neon Production)**
- [ ] Login to Neon dashboard
- [ ] Select production database (ep-aged-surf-...)
- [ ] Run SQL: `SELECT COUNT(*) FROM orgs;` - should work (not error)
- [ ] Run SQL: `SELECT * FROM v_threads LIMIT 1;` - views exist

**4. Integrations**
- [ ] Slack: Run `/teammato` in your workspace - modal opens
- [ ] Slack: Complete OAuth flow - redirects to `/post-install?success=true`
- [ ] Stripe: Create test checkout - webhook received (check Railway logs)

---

## 🚨 Common Issues & Fixes

### "502 Bad Gateway" on Railway

**Symptom:** Railway deployment succeeds but URL returns 502

**Causes:**
1. **Empty database** - Tables don't exist
   - Fix: Run `DATABASE_URL=<prod-url> npm run db:push` from Replit
2. **PORT not set** - Railway can't find your server
   - Fix: Remove custom PORT variable (Railway auto-sets it)
3. **Missing environment variable** - App crashes on startup
   - Check Railway logs for error messages

### "404 Not Found" on Frontend API Calls

**Symptom:** Frontend can't find `/api/slack/install`

**Cause:** `VITE_API_BASE_URL` not set in GitHub Actions build

**Fix:**
1. Edit `.github/workflows/deploy.yml`
2. Add under build step:
   ```yaml
   env:
     VITE_API_BASE_URL: https://teammato-production.up.railway.app
   ```
3. Commit and push

### Slack OAuth "server_error"

**Symptom:** After Slack auth, redirected to `/post-install?error=server_error`

**Causes:**
1. **Database empty** - `slack_teams` table doesn't exist
   - Fix: Apply schema to production database
2. **Wrong SLACK_REDIRECT_URI** - Slack rejects callback
   - Fix: Ensure Railway env has correct redirect URI matching your actual domain
3. **Database connection fails** - Wrong DATABASE_URL
   - Fix: Check Railway logs, verify DATABASE_URL

### Slack Interactivity Not Working

**Symptom:** Button clicks or modal submissions fail silently

**Causes:**
1. **Wrong webhook URL** - Slack configured to wrong endpoint
   - Fix: Verify Interactivity URL is `https://<your-railway-domain>/api/slack/modal`
2. **Signature verification fails** - Wrong SLACK_SIGNING_SECRET
   - Fix: Verify secret matches Slack app dashboard

### Stripe Payments Failing in Production

**Symptom:** Checkout works but payments don't process

**Causes:**
1. **Test keys in production** - Using `TESTING_STRIPE_SECRET_KEY`
   - Fix: Set `STRIPE_SECRET_KEY=sk_live_...` in Railway
2. **Wrong webhook secret** - Stripe signature verification fails
   - Fix: Update `STRIPE_WEBHOOK_SECRET` with production endpoint secret

### Replit Dev Environment Broken

**Symptom:** "relation does not exist" errors in Replit

**Cause:** DATABASE_URL points to empty production database

**Fix:**
1. Go to Replit Secrets
2. Change DATABASE_URL to dev database:
   ```
   postgresql://neondb_owner:npg_CEp0hXb3PRmK@ep-billowing-hat-adzdqmmd.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```
3. Restart workflow

---

## 📋 Deployment Workflow Summary

### Making Changes

```bash
# 1. Develop in Replit (uses dev database)
# Edit code, test locally

# 2. Commit to GitHub
git add .
git commit -m "Add feature X"
git push origin main

# 3. Automatic deployments trigger:
# - GitHub Actions → Builds frontend → Deploys to GitHub Pages
# - Railway detects push → Builds backend → Deploys to Railway

# 4. Verify production
# - Visit www.teammato.com
# - Check Railway logs
# - Test critical flows
```

### Schema Changes

```bash
# 1. Update shared/schema.ts in Replit

# 2. Test on dev database
npm run db:push

# 3. Apply to production (after testing)
DATABASE_URL="<railway-prod-url>" npm run db:push

# 4. Commit schema changes
git add shared/schema.ts
git commit -m "Add new table: xyz"
git push origin main
```

---

## 🔐 Security Notes

- **Never commit secrets to git** - Use environment variables
- **Separate databases** - Dev and prod are isolated
- **Different SESSION_SECRET** - Each environment has unique secret
- **CORS configured** - Only teammato.com can call API
- **Webhook signature verification** - Slack/Stripe requests are validated
- **HTTPS enforced** - All production traffic encrypted
- **Production Stripe keys** - Use live keys (sk_live_...) not test keys

---

## 📞 Support Resources

- **Neon Dashboard:** https://console.neon.tech
- **Railway Dashboard:** https://railway.app
- **GitHub Actions:** Repository → Actions tab
- **Slack API Dashboard:** https://api.slack.com/apps
- **Stripe Dashboard:** https://dashboard.stripe.com

---

**Last Updated:** October 2025
**Deployment Stack:** Replit → GitHub → Railway + GitHub Pages + Neon
