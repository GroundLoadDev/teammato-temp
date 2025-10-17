# Teammato Deployment Configuration

## Current Status
✓ Replit development environment working
✓ Neon database connected to GitHub main branch
✓ Railway backend deployed
✓ GitHub Pages frontend deployed at teammato.com

## Fix Needed: API Base URL Configuration

### Problem
The frontend on GitHub Pages (teammato.com) cannot reach the Railway backend because it's using relative URLs like `/api/auth/me` which try to call GitHub Pages instead of Railway.

### Solution

#### 1. Get Your Railway Domain
1. Go to your Railway project dashboard
2. Find your deployment URL (should be something like: `teammato-production-XXXX.up.railway.app`)
3. Copy the full URL (e.g., `https://teammato-production-XXXX.up.railway.app`)

#### 2. Update GitHub Actions Workflow
In your GitHub repository, edit `.github/workflows/deploy.yml` (or whatever your workflow file is called).

Find the build step and add the `VITE_API_BASE_URL` environment variable:

```yaml
- name: Build
  run: npm run build
  env:
    VITE_API_BASE_URL: https://your-railway-domain.up.railway.app
```

Replace `your-railway-domain.up.railway.app` with your actual Railway URL.

#### 3. Commit and Push
The next deployment will include the API base URL, and your frontend will be able to reach the Railway backend.

---

## Railway Environment Variables

Your Railway deployment needs these environment variables set:

### Required Variables
```
NODE_ENV=production
DISABLE_CRON_JOBS=true
DATABASE_URL=<automatically set by Railway's Neon integration>
TM_MASTER_KEY_V1=<copy from Replit Secrets>
TESTING_STRIPE_SECRET_KEY=<copy from Replit Secrets>
STRIPE_WEBHOOK_SECRET=<copy from Replit Secrets - use the non-TEST version>
```

### Slack Integration (when ready)
```
SLACK_CLIENT_ID=<from Slack app dashboard>
SLACK_CLIENT_SECRET=<from Slack app dashboard>
SLACK_SIGNING_SECRET=<from Slack app dashboard>
```

### Session Configuration
```
SESSION_SECRET=<generate a random 32+ character string>
```

---

## Webhook URLs to Configure

Once your Railway backend is live, you'll need to update webhook URLs in:

### Slack App Dashboard
- **Slash Commands**: Update `/teammato` request URL to: `https://your-railway-domain.up.railway.app/slack/commands`
- **Interactivity**: Update request URL to: `https://your-railway-domain.up.railway.app/slack/interactions`
- **Event Subscriptions**: Update request URL to: `https://your-railway-domain.up.railway.app/slack/events`
- **OAuth Redirect URL**: Update to: `https://your-railway-domain.up.railway.app/auth/slack/callback`

### Stripe Dashboard
- **Webhook Endpoint**: Update to: `https://your-railway-domain.up.railway.app/webhooks/stripe`
- Listen for these events:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`

---

## Testing Checklist

After updating the GitHub Actions workflow:

1. ✓ Frontend loads at teammato.com
2. ⏳ API calls work (check browser console for errors)
3. ⏳ CORS allows cross-origin requests
4. ⏳ Session cookies work across domains
5. ⏳ Slack OAuth flow completes
6. ⏳ Stripe checkout redirects work

---

## Local Development vs Production

### Local Development (Replit)
- Frontend and backend on same port (5000)
- Relative URLs work fine (`/api/auth/me`)
- `VITE_API_BASE_URL` is empty/not set

### Production
- Frontend: GitHub Pages (teammato.com)
- Backend: Railway (your-railway-domain.up.railway.app)
- `VITE_API_BASE_URL` must be set to Railway URL
- CORS configured to allow teammato.com origin
