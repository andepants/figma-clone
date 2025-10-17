# Stripe Environment Setup Guide

This guide explains how to configure Stripe for both development and production environments.

## 🔑 Get Your Stripe Keys

### Test Mode (Development)
1. Go to: https://dashboard.stripe.com/test/apikeys
2. Copy both keys:
   - **Publishable key**: `pk_test_...` (for frontend)
   - **Secret key**: `sk_test_...` (for backend)

### Live Mode (Production)
1. Go to: https://dashboard.stripe.com/apikeys
2. Copy both keys:
   - **Publishable key**: `pk_live_...` (for frontend)
   - **Secret key**: `sk_live_...` (for backend)

---

## 🛠️ Development Setup (Local)

### 1. Configure Frontend (.env.development)

```bash
# File: .env.development

VITE_STRIPE_PUBLISHABLE_KEY="pk_test_YOUR_TEST_PUBLISHABLE_KEY"
VITE_STRIPE_FOUNDERS_PRICE_ID="price_YOUR_TEST_PRICE_ID"
```

### 2. Configure Backend (functions/.env.local)

```bash
# File: functions/.env.local

STRIPE_SECRET_KEY=sk_test_YOUR_TEST_SECRET_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET
```

### 3. Restart Emulators

```bash
# Stop current emulators (Ctrl+C)
# Then restart
npm run dev
```

**✅ No deployment needed! Changes work immediately.**

---

## 🚀 Production Setup (Deployed)

### 1. Configure Frontend (.env.production)

```bash
# File: .env.production

VITE_STRIPE_PUBLISHABLE_KEY="pk_live_YOUR_LIVE_PUBLISHABLE_KEY"
VITE_STRIPE_FOUNDERS_PRICE_ID="price_YOUR_LIVE_PRICE_ID"
```

### 2. Configure Backend (Firebase Secrets)

**⚠️ DO NOT put live keys in .env files!**

Use Firebase Secrets instead:

```bash
# Set Stripe secret key
firebase functions:secrets:set STRIPE_SECRET_KEY

# When prompted, paste your LIVE secret key:
# sk_live_YOUR_LIVE_SECRET_KEY

# Set Stripe webhook secret (for production webhooks)
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET

# When prompted, paste your webhook secret from Stripe Dashboard
```

### 3. Deploy Functions

```bash
# Deploy only functions (faster)
firebase deploy --only functions

# Or deploy everything
firebase deploy
```

**✅ Secrets are securely stored in Firebase, never in code.**

---

## 🔄 How It Works

### Development Flow

```
Local Request
   ↓
functions/.env.local (loaded via dotenv)
   ↓
process.env.STRIPE_SECRET_KEY
   ↓
Stripe API (TEST MODE)
```

- ✅ Instant updates (just restart emulators)
- ✅ No deployment required
- ✅ Test mode = no real charges

### Production Flow

```
Live Request
   ↓
Firebase Secret Manager
   ↓
process.env.STRIPE_SECRET_KEY
   ↓
Stripe API (LIVE MODE)
```

- ✅ Secure secret storage
- ✅ Requires deployment to update
- ⚠️ Live mode = real charges

---

## ⚠️ Important Security Notes

### ❌ NEVER Do This:
- Put `sk_live_` keys in `.env` files
- Commit `.env.local` or `.env.production` to git
- Use live keys in development
- Share your secret keys

### ✅ ALWAYS Do This:
- Use `sk_test_` keys in development
- Use Firebase Secrets for production
- Add `.env*` to `.gitignore`
- Rotate keys if exposed

---

## 🧪 Testing Checkout Flow

### In Development (Local)

1. Make sure `functions/.env.local` has valid **TEST** key
2. Restart emulators: `npm run dev`
3. Click "Upgrade to Continue" button
4. Use Stripe test card: `4242 4242 4242 4242`
   - Any future expiry date
   - Any 3-digit CVC
5. Complete checkout
6. Check webhook logs in terminal

### In Production (Deployed)

1. Set Firebase secrets (see above)
2. Deploy functions: `firebase deploy --only functions`
3. Test with real Stripe account
4. Use live keys = real charges ⚠️

---

## 📊 Environment Comparison

| Feature | Development | Production |
|---------|-------------|------------|
| **Secret Storage** | `functions/.env.local` | Firebase Secrets |
| **Deployment** | No deployment needed | Requires `firebase deploy` |
| **Stripe Mode** | Test (no real charges) | Live (real money) |
| **Updates** | Instant (restart emulators) | Deploy required |
| **Keys Used** | `sk_test_...` | `sk_live_...` |
| **Publishable Key** | `.env.development` | `.env.production` |

---

## 🐛 Troubleshooting

### Error: "FirebaseError: internal"
- **Cause**: Invalid or missing `STRIPE_SECRET_KEY`
- **Fix**: Check `functions/.env.local` has valid test key
- **Restart**: Stop and restart emulators

### Error: "No such price: price_xxx"
- **Cause**: Price ID doesn't exist in Stripe
- **Fix**: Create price in Stripe Dashboard > Products
- **Update**: Add price ID to `.env.development`

### Checkout works locally but not in production
- **Cause**: Firebase Secrets not set
- **Fix**: Run `firebase functions:secrets:set STRIPE_SECRET_KEY`
- **Deploy**: `firebase deploy --only functions`

### Webhook signature verification failed
- **Cause**: Wrong webhook secret
- **Fix**: Get webhook signing secret from Stripe Dashboard > Developers > Webhooks
- **Update**: Set in `functions/.env.local` (dev) or Firebase Secrets (prod)

---

## 📚 Related Docs

- [Stripe API Keys](https://dashboard.stripe.com/test/apikeys)
- [Firebase Secrets Manager](https://firebase.google.com/docs/functions/config-env#secret-manager)
- [Stripe Test Cards](https://stripe.com/docs/testing#cards)
