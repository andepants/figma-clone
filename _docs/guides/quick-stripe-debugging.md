# Quick Stripe Debugging Checklist

**Problem:** "Failed to verify checkout session: FirebaseError: internal"

## Immediate Checks (5 minutes)

### 1. Check Firebase Logs (Most Important)

```bash
# View recent logs
firebase functions:log --only stripeWebhook,verifyCheckoutSession --limit 100

# Or in Firebase Console:
# https://console.firebase.google.com/project/YOUR-PROJECT/functions/logs
```

**Search for these emoji patterns:**
- `🔵 WEBHOOK` - Did webhook arrive?
- `❌ WEBHOOK` - Webhook errors
- `❌ CHECKOUT` - Checkout processing errors
- `❌ VERIFY` - Manual verification errors

### 2. Check Stripe Webhook Deliveries

```
Stripe Dashboard → Developers → Webhooks → [Your endpoint] → Recent deliveries
```

**Look for:**
- ✅ Green checkmarks = successful delivery
- ❌ Red X = failed delivery (click for details)
- Response codes (should be 200, not 400/500)

### 3. Verify Webhook Configuration

**Stripe Dashboard → Developers → Webhooks**

Must have:
- ✅ Endpoint URL: `https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net/stripeWebhook`
- ✅ Events: `checkout.session.completed` (at minimum)
- ✅ Status: Enabled

### 4. Check Secrets Match

```bash
# View Firebase secrets
firebase functions:secrets:access STRIPE_WEBHOOK_SECRET
# Should match: Stripe Dashboard → Webhooks → [endpoint] → Signing secret

firebase functions:secrets:access STRIPE_SECRET_KEY
# Should match: Stripe Dashboard → Developers → API keys → Secret key
```

## Most Common Issues (Fix These First)

### Issue #1: Webhook Secret Mismatch (80% of cases)

**Symptoms:**
- Logs show: `❌ WEBHOOK: Signature verification failed`
- Stripe shows deliveries sent but Functions returning 400

**Fix:**
```bash
# Get correct signing secret from Stripe Dashboard → Webhooks
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
# Paste the webhook signing secret (starts with whsec_)

# Redeploy
cd functions && npm run deploy
```

### Issue #2: Webhook URL Wrong (15% of cases)

**Symptoms:**
- No `🔵 WEBHOOK` logs in Firebase
- Stripe webhook deliveries show "No such function"

**Fix:**
1. Get your function URL:
   ```bash
   firebase functions:list
   # Copy the stripeWebhook URL
   ```

2. Update in Stripe Dashboard → Webhooks → [endpoint] → Update endpoint URL

### Issue #3: User Document Missing (5% of cases)

**Symptoms:**
- Logs show: `❌ CHECKOUT: User document does not exist`
- Webhook arrived but Firestore update failed

**Fix:**
```
Firebase Console → Firestore → users → [userId]
# If missing, user signup failed - check auth logs
```

## Deploy Enhanced Logging

```bash
# Deploy the updated functions with enhanced logging
cd functions
npm run build
npm run deploy

# Or deploy just the webhook function
firebase deploy --only functions:stripeWebhook,functions:verifyCheckoutSession
```

## After Deployment: Test a Payment

1. **Create test checkout** (use Stripe test mode)
2. **Complete with test card:** 4242 4242 4242 4242
3. **Watch logs in real-time:**
   ```bash
   firebase functions:log --only stripeWebhook,verifyCheckoutSession
   ```

4. **Look for the flow:**
   ```
   ✅ 🔵 WEBHOOK: Starting webhook processing
   ✅ 🔐 WEBHOOK: Verifying webhook signature
   ✅ ✅ WEBHOOK: Signature verified successfully
   ✅ 🎯 CHECKOUT: Processing checkout.session.completed
   ✅ 💾 CHECKOUT: Updating user subscription in Firestore
   ✅ ✅ CHECKOUT: User subscription updated successfully
   ```

5. **If webhook doesn't fire within 5s, fallback triggers:**
   ```
   ✅ 🎯 HANDLER: verifyCheckoutSession called from frontend
   ✅ 🔍 VERIFY: Manually verifying checkout session
   ✅ ✅ VERIFY: Subscription updated successfully
   ```

## Red Flags in Logs

❌ **No logs at all** → Webhook URL wrong or function not deployed
❌ **Signature verification failed** → Webhook secret mismatch
❌ **User document does not exist** → User signup issue
❌ **Failed to retrieve subscription** → Stripe API key issue
❌ **Permission denied** → Firestore rules or admin SDK issue

## Quick Commands Reference

```bash
# View logs
firebase functions:log --only stripeWebhook,verifyCheckoutSession

# Check secrets
firebase functions:secrets:access STRIPE_WEBHOOK_SECRET
firebase functions:secrets:access STRIPE_SECRET_KEY

# Update secrets
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
firebase functions:secrets:set STRIPE_SECRET_KEY

# Deploy functions
cd functions && npm run deploy

# Test webhook locally (requires Stripe CLI)
stripe listen --forward-to http://127.0.0.1:5001/YOUR-PROJECT/us-central1/stripeWebhook
stripe trigger checkout.session.completed
```

## Get Help

If issue persists after checking above:

1. **Capture session ID** from URL: `?session_id=cs_test_...`
2. **Search logs** for that session ID
3. **Copy ALL log entries** that mention that session ID
4. **Check Stripe Dashboard** → Webhooks → Recent deliveries for same session
5. **Share both** (Firebase logs + Stripe delivery status)

See `/Users/andre/coding/figma-clone/_docs/guides/debugging-stripe-webhooks.md` for comprehensive debugging guide.
