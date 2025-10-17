# Complete Stripe Setup Guide (Development + Production)

This guide covers EVERYTHING you need to set up Stripe for both development and production.

## 📋 What You Need to Configure

✅ **1. Price IDs** (Test + Live)
✅ **2. Publishable Keys** (Test + Live)
✅ **3. Secret Keys** (Test + Live)
✅ **4. Webhooks** (Local + Production)
✅ **5. Webhook Secrets** (Test + Live)

---

## 🧪 Development Setup (Local Testing)

### Step 1: Create Test Products in Stripe Dashboard

1. Go to: https://dashboard.stripe.com/test/products
2. Create **TWO** products:

**Product 1: Founders Tier ($10/year)**
- Name: "Canvas Icons - Founders"
- Price: $10.00 USD
- Billing: Recurring, yearly
- Copy the **Price ID**: `price_xxxxx` → This is `VITE_STRIPE_FOUNDERS_PRICE_ID`

**Product 2: Pro Tier ($60/year)**
- Name: "Canvas Icons - Pro"
- Price: $60.00 USD
- Billing: Recurring, yearly
- Copy the **Price ID**: `price_xxxxx` → This is `VITE_STRIPE_FOUNDERS_PRICE_ID60`

### Step 2: Configure Frontend (.env.development)

```bash
# File: .env.development

# Test publishable key (from https://dashboard.stripe.com/test/apikeys)
VITE_STRIPE_PUBLISHABLE_KEY="pk_test_YOUR_TEST_PUBLISHABLE_KEY"

# Test price IDs (from Stripe Dashboard > Products)
VITE_STRIPE_FOUNDERS_PRICE_ID="price_YOUR_TEST_10_DOLLAR_PRICE_ID"
VITE_STRIPE_FOUNDERS_PRICE_ID60="price_YOUR_TEST_60_DOLLAR_PRICE_ID"
```

### Step 3: Configure Backend (functions/.env.local)

```bash
# File: functions/.env.local

# Test secret key (from https://dashboard.stripe.com/test/apikeys)
STRIPE_SECRET_KEY=sk_test_YOUR_TEST_SECRET_KEY

# Webhook secret (from Stripe CLI - see Step 4)
STRIPE_WEBHOOK_SECRET=whsec_YOUR_LOCAL_WEBHOOK_SECRET
```

### Step 4: Setup Local Webhooks (Stripe CLI)

**Option A: Using Stripe CLI (Recommended for local testing)**

```bash
# 1. Install Stripe CLI
brew install stripe/stripe-cli/stripe

# 2. Login to Stripe
stripe login

# 3. Forward webhooks to your local emulator
# This runs alongside your Firebase emulators
stripe listen --forward-to http://localhost:5001/figma-clone-d33e3/us-central1/stripeWebhook

# Output will show:
# > Ready! Your webhook signing secret is whsec_xxxxx

# 4. Copy the webhook secret (whsec_xxxxx) to functions/.env.local
# STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# 5. Keep this terminal running while developing
# Open new terminal for npm run dev
```

**Option B: Without Stripe CLI (Manual webhook testing)**

If you don't want to use Stripe CLI, you can:
1. Set `STRIPE_WEBHOOK_SECRET=whsec_placeholder` (webhooks won't work)
2. Manually test checkout flow (payment will work)
3. Webhook events won't trigger (subscription updates won't work)
4. **Not recommended** - webhooks are critical for subscription management

### Step 5: Test Development Setup

```bash
# Terminal 1: Run Stripe CLI (if using webhooks)
stripe listen --forward-to http://localhost:5001/figma-clone-d33e3/us-central1/stripeWebhook

# Terminal 2: Run Firebase emulators
npm run dev

# Test checkout flow:
# 1. Click "Upgrade to Continue"
# 2. Use test card: 4242 4242 4242 4242
# 3. Any future expiry, any CVC
# 4. Check Terminal 1 for webhook events
```

---

## 🚀 Production Setup (Live Payments)

### Step 1: Create Live Products in Stripe Dashboard

1. **Switch to Live Mode** in Stripe Dashboard (toggle in top-left)
2. Go to: https://dashboard.stripe.com/products
3. Create **TWO** products (same as test):

**Product 1: Founders Tier ($10/year)**
- Name: "Canvas Icons - Founders"
- Price: $10.00 USD
- Billing: Recurring, yearly
- Copy the **Price ID**: `price_xxxxx` → This is LIVE `VITE_STRIPE_FOUNDERS_PRICE_ID`

**Product 2: Pro Tier ($60/year)**
- Name: "Canvas Icons - Pro"
- Price: $60.00 USD
- Billing: Recurring, yearly
- Copy the **Price ID**: `price_xxxxx` → This is LIVE `VITE_STRIPE_FOUNDERS_PRICE_ID60`

### Step 2: Configure Frontend (.env.production)

```bash
# File: .env.production

# Live publishable key (from https://dashboard.stripe.com/apikeys)
VITE_STRIPE_PUBLISHABLE_KEY="pk_live_YOUR_LIVE_PUBLISHABLE_KEY"

# Live price IDs (from Stripe Dashboard > Products)
VITE_STRIPE_FOUNDERS_PRICE_ID="price_YOUR_LIVE_10_DOLLAR_PRICE_ID"
VITE_STRIPE_FOUNDERS_PRICE_ID60="price_YOUR_LIVE_60_DOLLAR_PRICE_ID"
```

### Step 3: Configure Backend (Firebase Secrets)

```bash
# Set OpenAI API key (for AI features)
firebase functions:secrets:set OPENAI_API_KEY
# When prompted, paste: sk-proj-YOUR_OPENAI_KEY

# Set Stripe LIVE secret key
firebase functions:secrets:set STRIPE_SECRET_KEY
# When prompted, paste: sk_live_YOUR_LIVE_SECRET_KEY

# Stripe webhook secret (we'll get this in Step 4)
# WAIT - do this after Step 4
```

### Step 4: Setup Production Webhooks

**IMPORTANT: Do this AFTER deploying your functions!**

```bash
# 1. First deploy functions to get the webhook URL
firebase deploy --only functions

# Output will show:
# ✔ functions[stripeWebhook(us-central1)] https://us-central1-figma-clone-d33e3.cloudfunctions.net/stripeWebhook

# 2. Copy the webhook URL, then go to Stripe Dashboard
```

**In Stripe Dashboard (LIVE MODE):**

1. Go to: https://dashboard.stripe.com/webhooks
2. Click **"Add endpoint"**
3. **Endpoint URL**: Paste your function URL from step 1
   - Example: `https://us-central1-figma-clone-d33e3.cloudfunctions.net/stripeWebhook`
4. **Events to listen to**: Select these events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
   - `invoice.payment_succeeded`
5. Click **"Add endpoint"**
6. Click on the endpoint you just created
7. Click **"Reveal"** next to "Signing secret"
8. Copy the webhook secret: `whsec_xxxxx`

**Set the webhook secret:**

```bash
# Back in terminal
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
# When prompted, paste: whsec_xxxxx (from Stripe Dashboard)
```

### Step 5: Redeploy Functions with Webhook Secret

```bash
# Deploy again to use the new webhook secret
firebase deploy --only functions
```

### Step 6: Test Production Webhooks

1. Go to: https://dashboard.stripe.com/webhooks
2. Click on your webhook endpoint
3. Click **"Send test webhook"**
4. Select event: `checkout.session.completed`
5. Click **"Send test webhook"**
6. Check **"Recent events"** tab → Should show ✅ Success

---

## 📊 Complete Environment Variables Checklist

### Frontend Variables

| Variable | Development (.env.development) | Production (.env.production) |
|----------|-------------------------------|------------------------------|
| `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` | `pk_live_...` |
| `VITE_STRIPE_FOUNDERS_PRICE_ID` | `price_...` (test $10) | `price_...` (live $10) |
| `VITE_STRIPE_FOUNDERS_PRICE_ID60` | `price_...` (test $60) | `price_...` (live $60) |
| `VITE_ENVIRONMENT` | `"development"` | `"production"` |

### Backend Variables

| Variable | Development (functions/.env.local) | Production (Firebase Secrets) |
|----------|-----------------------------------|-------------------------------|
| `OPENAI_API_KEY` | `sk-proj-...` | Set via CLI |
| `STRIPE_SECRET_KEY` | `sk_test_...` | Set via CLI (`sk_live_...`) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` (from Stripe CLI) | Set via CLI (from Dashboard) |

---

## 🔄 How Webhooks Work

### Development Flow

```
Stripe Test Payment
   ↓
Stripe Test Webhook Event
   ↓
Stripe CLI (running locally)
   ↓
http://localhost:5001/.../stripeWebhook
   ↓
Firebase Functions Emulator
   ↓
Update Firestore (local emulator)
```

### Production Flow

```
Stripe Live Payment
   ↓
Stripe Live Webhook Event
   ↓
https://us-central1-figma-clone-d33e3.cloudfunctions.net/stripeWebhook
   ↓
Firebase Functions (deployed)
   ↓
Update Firestore (production)
```

---

## ✅ Final Checklist

### Development Setup
- [ ] Created test products in Stripe (2 price IDs)
- [ ] Added test publishable key to `.env.development`
- [ ] Added both test price IDs to `.env.development`
- [ ] Added test secret key to `functions/.env.local`
- [ ] Installed Stripe CLI
- [ ] Running `stripe listen` for local webhooks
- [ ] Added webhook secret to `functions/.env.local`
- [ ] Tested checkout with test card (4242 4242 4242 4242)

### Production Setup
- [ ] Created live products in Stripe (2 price IDs)
- [ ] Added live publishable key to `.env.production`
- [ ] Added both live price IDs to `.env.production`
- [ ] Set `OPENAI_API_KEY` via Firebase Secrets
- [ ] Set `STRIPE_SECRET_KEY` (live) via Firebase Secrets
- [ ] Deployed functions: `firebase deploy --only functions`
- [ ] Created webhook endpoint in Stripe Dashboard
- [ ] Configured webhook events (5 events)
- [ ] Set `STRIPE_WEBHOOK_SECRET` via Firebase Secrets
- [ ] Redeployed functions
- [ ] Tested webhook with "Send test webhook" in Dashboard

---

## 🐛 Common Issues

### Webhook signature verification failed
**Cause**: Wrong webhook secret
**Fix (Dev)**: Copy secret from `stripe listen` output
**Fix (Prod)**: Copy secret from Stripe Dashboard webhook settings

### No such price: price_xxx
**Cause**: Price ID doesn't exist or using test price in live mode
**Fix**: Verify price IDs match your Stripe Dashboard mode (test vs live)

### Webhook events not firing (development)
**Cause**: Stripe CLI not running
**Fix**: Run `stripe listen --forward-to http://localhost:5001/figma-clone-d33e3/us-central1/stripeWebhook` in separate terminal

### Subscription not updating after payment
**Cause**: Webhook not configured or failing
**Fix**: Check Stripe Dashboard > Webhooks > Recent events for errors

---

## 🔐 Security Best Practices

1. ✅ **Never commit** `.env.local` or `.env.production` files
2. ✅ **Always use test mode** for development
3. ✅ **Use Firebase Secrets** for production keys
4. ✅ **Verify webhook signatures** (already implemented)
5. ✅ **Rotate keys** if exposed
6. ❌ **Never use live keys** in `.env` files
7. ❌ **Never hardcode** API keys in code

---

## 📚 Related Resources

- [Stripe Test Cards](https://stripe.com/docs/testing#cards)
- [Stripe CLI Docs](https://stripe.com/docs/stripe-cli)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Firebase Secrets Manager](https://firebase.google.com/docs/functions/config-env#secret-manager)
