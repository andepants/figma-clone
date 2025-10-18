# Debugging Stripe Webhooks - Production Issue Guide

This guide helps you debug the "Failed to verify checkout session: FirebaseError: internal" error in production.

## Overview

The system has two paths for updating subscriptions after payment:
1. **Webhook Path** (Primary): Stripe sends webhook → Firebase Function processes → Firestore updated
2. **Manual Verification** (Fallback): Frontend calls verifyCheckoutSession after 5s if webhook doesn't fire

## Enhanced Logging

All critical functions now have comprehensive logging with emoji prefixes for easy filtering:

### Log Prefixes

- `🔵 WEBHOOK` - Webhook handler entry point
- `🔐 WEBHOOK` - Signature verification
- `✅ WEBHOOK` - Webhook success
- `❌ WEBHOOK` - Webhook errors
- `🎯 CHECKOUT` - Checkout completion handler
- `💾 CHECKOUT` - Firestore operations
- `🔍 VERIFY` - Manual verification (fallback)
- `🎯 HANDLER` - Callable function handler

## Viewing Logs in Firebase Console

### 1. Navigate to Firebase Logs

```
Firebase Console → Functions → Logs
```

Or use the Firebase CLI:

```bash
# View real-time logs
firebase functions:log --only stripeWebhook,verifyCheckoutSession

# Filter by specific function
firebase functions:log --only stripeWebhook

# View last 50 lines
firebase functions:log --limit 50
```

### 2. Filter Logs by Emoji

In the Firebase Console log viewer, search for:

- Search `🔵 WEBHOOK` - See all webhook requests received
- Search `❌ WEBHOOK` - See webhook failures
- Search `🎯 CHECKOUT` - See checkout processing
- Search `❌ CHECKOUT` - See checkout failures
- Search `🔍 VERIFY` - See manual verification attempts

### 3. Filter by Session ID

When a user reports an issue, get their session ID from the URL (`?session_id=...`) and filter:

```
cs_test_... OR cs_live_...
```

## Common Issues and Log Patterns

### Issue 1: Webhook Not Received

**Symptoms:**
- User sees "Failed to verify checkout session: FirebaseError: internal"
- No logs with `🔵 WEBHOOK: Starting webhook processing`

**Diagnosis:**
```bash
# Check if webhook endpoint is configured in Stripe Dashboard
# Stripe Dashboard → Developers → Webhooks
# Should see: https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net/stripeWebhook
```

**Logs to Check:**
- Search for session ID in logs - if no `🔵 WEBHOOK` logs, webhook never reached Firebase

**Fix:**
1. Verify webhook URL in Stripe Dashboard matches deployed function URL
2. Check webhook is enabled and listening for `checkout.session.completed`
3. Test webhook using Stripe CLI: `stripe trigger checkout.session.completed`

### Issue 2: Webhook Signature Verification Failed

**Symptoms:**
- Logs show `❌ WEBHOOK: Signature verification failed`
- Error message mentions "signature verification"

**Logs to Check:**
```
Search: "❌ WEBHOOK: Signature verification failed"
```

**Example Log:**
```json
{
  "severity": "ERROR",
  "message": "❌ WEBHOOK: Signature verification failed - webhook secret mismatch?",
  "errorMessage": "No signatures found matching the expected signature for payload",
  "webhookSecretConfigured": true
}
```

**Fix:**
1. Check Firebase secret matches Stripe webhook signing secret:
   ```bash
   firebase functions:secrets:access STRIPE_WEBHOOK_SECRET
   ```
2. Update secret if mismatch:
   ```bash
   firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
   # Paste webhook signing secret from Stripe Dashboard → Webhooks → [Your endpoint] → Signing secret
   ```
3. Redeploy functions:
   ```bash
   cd functions && npm run deploy
   ```

### Issue 3: Firestore Update Failed

**Symptoms:**
- Logs show `❌ CHECKOUT: Failed to update user subscription in Firestore`
- Webhook received and verified successfully

**Logs to Check:**
```
Search: "💾 CHECKOUT: Updating user subscription"
```

**Example Log:**
```json
{
  "severity": "ERROR",
  "message": "❌ CHECKOUT: Failed to update user subscription in Firestore",
  "userId": "abc123...",
  "error": "No document to update: users/abc123...",
  "errorCode": "NOT_FOUND"
}
```

**Common Causes:**
1. **User document doesn't exist**: Check if user exists in Firestore
2. **Permission error**: Check Firestore security rules
3. **Network issue**: Check Firestore service status

**Fix:**
1. Verify user document exists:
   ```
   Firebase Console → Firestore → users → [userId]
   ```
2. Check Firestore security rules allow admin writes:
   ```javascript
   // Should have admin SDK access (no rules check for admin)
   ```

### Issue 4: Manual Verification (Fallback) Failing

**Symptoms:**
- Logs show `🔍 VERIFY: Manually verifying checkout session`
- Error: `FirebaseError: internal`

**Logs to Check:**
```
Search: "🔍 VERIFY"
```

**Example Log Pattern (Success):**
```json
[
  {"message": "🎯 HANDLER: verifyCheckoutSession called from frontend", "userId": "abc123"},
  {"message": "🔍 VERIFY: Manually verifying checkout session", "sessionId": "cs_test_..."},
  {"message": "✅ VERIFY: Checkout session retrieved successfully", "status": "complete"},
  {"message": "🎯 CHECKOUT: Processing checkout.session.completed"},
  {"message": "✅ CHECKOUT: User subscription updated successfully"}
]
```

**Example Log Pattern (Failure):**
```json
[
  {"message": "🎯 HANDLER: verifyCheckoutSession called from frontend"},
  {"message": "🔍 VERIFY: Manually verifying checkout session"},
  {"message": "❌ VERIFY: Failed to verify checkout session", "error": "..."}
]
```

**Fix:**
1. Check error message in logs for root cause
2. Verify Stripe secret key is configured:
   ```bash
   firebase functions:secrets:access STRIPE_SECRET_KEY
   ```
3. Test manually in Firebase Console Functions → Test

## Step-by-Step Debugging Workflow

### Step 1: Identify the Session

When user reports error:
1. Get session ID from URL: `?session_id=cs_test_...` or `?session_id=cs_live_...`
2. Note the user's Firebase UID (from auth system or ask them to provide)

### Step 2: Check Webhook Reception

Search logs for session ID:

```
Firebase Console → Functions → Logs → Search: "cs_test_abc123..." (your session ID)
```

**What to look for:**

✅ **Webhook received successfully:**
```
🔵 WEBHOOK: Starting webhook processing
🔐 WEBHOOK: Verifying webhook signature
✅ WEBHOOK: Signature verified successfully
🔄 WEBHOOK: Processing webhook event
```

❌ **Webhook NOT received:**
- No logs with session ID → Webhook didn't reach Firebase
- Check Stripe Dashboard → Webhooks → Recent Deliveries
- Look for failed deliveries or 4xx/5xx errors

### Step 3: Check Webhook Processing

If webhook was received, check if it was processed:

```
Search: "cs_test_abc123..." AND "🎯 CHECKOUT"
```

✅ **Processing succeeded:**
```
🎯 CHECKOUT: Processing checkout.session.completed
✅ CHECKOUT: User ID extracted successfully
✅ CHECKOUT: Customer ID extracted successfully
✅ CHECKOUT: Subscription retrieved successfully
💾 CHECKOUT: Updating user subscription in Firestore
✅ CHECKOUT: User subscription updated successfully
```

❌ **Processing failed:**
Look for `❌ CHECKOUT` logs with error details

### Step 4: Check Manual Verification (if webhook failed)

Search for manual verification attempts:

```
Search: "cs_test_abc123..." AND "🔍 VERIFY"
```

✅ **Manual verification succeeded:**
```
🎯 HANDLER: verifyCheckoutSession called from frontend
🔍 VERIFY: Manually verifying checkout session
✅ VERIFY: Checkout session retrieved successfully
🔄 VERIFY: Session is complete, triggering subscription update
✅ VERIFY: Subscription updated successfully via manual verification
```

❌ **Manual verification failed:**
Check error message in logs - this will tell you the root cause

### Step 5: Verify Firestore Update

Check Firestore directly:

```
Firebase Console → Firestore Database → users → [userId] → subscription
```

**Expected fields:**
```json
{
  "subscription": {
    "status": "founders" | "pro",
    "stripeCustomerId": "cus_...",
    "stripePriceId": "price_...",
    "currentPeriodEnd": 1234567890000,
    "cancelAtPeriodEnd": false
  },
  "updatedAt": 1234567890000
}
```

## Testing Webhooks Locally

### Using Stripe CLI

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli

2. Forward webhooks to local emulator:
   ```bash
   stripe listen --forward-to http://127.0.0.1:5001/YOUR-PROJECT/us-central1/stripeWebhook
   ```

3. Trigger test webhook:
   ```bash
   stripe trigger checkout.session.completed
   ```

4. Check emulator logs:
   ```bash
   # Logs will appear in terminal running `firebase emulators:start`
   ```

### Testing in Production

**⚠️ Use with caution - creates real Stripe events**

1. Create test checkout session in Stripe Dashboard (test mode)
2. Complete checkout with test card: `4242 4242 4242 4242`
3. Check Firebase logs for webhook processing
4. Verify Firestore was updated

## Common Error Messages

### "No signatures found matching the expected signature for payload"

**Cause:** Webhook signing secret mismatch

**Fix:**
```bash
# Get signing secret from Stripe Dashboard → Webhooks → [endpoint] → Signing secret
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
# Paste secret
firebase deploy --only functions:stripeWebhook
```

### "client_reference_id (user ID) not found in session"

**Cause:** Checkout session created without user ID

**Fix:** Ensure checkout session is created with `client_reference_id`:
```typescript
// src/lib/stripe/checkout.ts
await createCheckoutSession({
  priceId,
  userId: auth.uid, // ← Must be set
});
```

### "User document not found for userId: abc123..."

**Cause:** User document doesn't exist in Firestore

**Fix:**
1. Check if user exists: `Firebase Console → Firestore → users → [userId]`
2. If missing, user signup may have failed - check auth logs
3. Create user document manually if needed

### "Request body was pre-parsed, raw body required"

**Cause:** Firebase Functions is parsing body as JSON before signature verification

**Fix:** This should not happen with v2 functions - check function configuration:
```typescript
// functions/src/index.ts
export const stripeWebhook = onRequest(
  {
    secrets: [stripeWebhookSecret],
    // No bodyParser middleware - v2 handles this correctly
  },
  async (req, res) => {
    await stripeWebhookHandler(req, res, stripeWebhookSecret);
  }
);
```

## Emergency Fallback: Manual Subscription Update

If webhooks are completely broken and manual verification fails, you can manually update user subscription:

```javascript
// Firebase Console → Firestore → users → [userId]
// Manually set:
{
  "subscription": {
    "status": "founders", // or "pro"
    "stripeCustomerId": "cus_...", // from Stripe Dashboard
    "stripePriceId": "price_...", // from Stripe Dashboard
    "currentPeriodEnd": 1234567890000, // Unix timestamp in milliseconds
    "cancelAtPeriodEnd": false
  },
  "updatedAt": Date.now()
}
```

**⚠️ Only use as last resort** - investigate root cause first!

## Monitoring and Alerts

### Set Up Log-Based Alerts

Firebase Console → Logs → Create Alert

**Recommended Alerts:**

1. **Webhook Signature Failures:**
   - Query: `"❌ WEBHOOK: Signature verification failed"`
   - Alert when: More than 3 in 10 minutes

2. **Checkout Update Failures:**
   - Query: `"❌ CHECKOUT: Failed to update user subscription"`
   - Alert when: Any occurrence

3. **Manual Verification Failures:**
   - Query: `"❌ VERIFY: Failed to verify checkout session"`
   - Alert when: More than 5 in 1 hour

## Next Steps

After implementing enhanced logging:

1. **Deploy updated functions:**
   ```bash
   cd functions
   npm run deploy
   ```

2. **Monitor next payment:**
   - Watch logs in real-time during checkout
   - Note where failure occurs
   - Use this guide to diagnose

3. **Common fixes (in order of likelihood):**
   - Update webhook signing secret
   - Fix webhook URL in Stripe Dashboard
   - Check Firestore permissions
   - Verify Firebase secrets are set correctly

## Support Resources

- Stripe Webhook Testing: https://stripe.com/docs/webhooks/test
- Firebase Functions Logs: https://firebase.google.com/docs/functions/writing-and-viewing-logs
- Stripe Dashboard Webhooks: https://dashboard.stripe.com/webhooks
- Firebase Secrets: https://firebase.google.com/docs/functions/config-env#secret-manager

---

**Need more help?** Share these specific logs:
1. Search logs for session ID and share ALL matching entries
2. Include both webhook attempts (`🔵 WEBHOOK`) and manual verification (`🔍 VERIFY`)
3. Check Stripe Dashboard → Webhooks → Recent Deliveries for the same timestamp
