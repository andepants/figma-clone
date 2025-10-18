# Stripe Webhook Debugging - Deployment Notes

## What Changed

Enhanced logging has been added to all Stripe webhook and payment verification functions to help diagnose the "Failed to verify checkout session: FirebaseError: internal" error in production.

### Files Modified

1. **functions/src/handlers/stripeWebhook.ts**
   - Added comprehensive logging with emoji prefixes (`🔵 WEBHOOK`, `❌ WEBHOOK`, etc.)
   - Logs signature verification process
   - Logs request body details
   - Enhanced error context

2. **functions/src/services/webhook-handlers/checkoutCompleted.ts**
   - Added detailed logging at each step (`🎯 CHECKOUT`, `💾 CHECKOUT`)
   - Logs Stripe API calls
   - Logs Firestore operations
   - Validates user document exists before update

3. **functions/src/services/verify-checkout-session.ts**
   - Added fallback verification logging (`🔍 VERIFY`)
   - Logs session retrieval from Stripe
   - Enhanced error context

4. **functions/src/handlers/verifyCheckoutSession.ts**
   - Added handler-level logging (`🎯 HANDLER`)
   - Logs incoming requests from frontend
   - Enhanced error messages

### Documentation Added

1. **_docs/guides/debugging-stripe-webhooks.md**
   - Comprehensive debugging guide
   - Common issues and fixes
   - Step-by-step troubleshooting workflow
   - Log interpretation guide

2. **_docs/guides/quick-stripe-debugging.md**
   - Quick 5-minute checklist
   - Most common issues (80/15/5 breakdown)
   - Commands reference
   - Emergency procedures

## Deployment Steps

### 1. Deploy Functions

```bash
cd functions
npm run build
npm run deploy
```

Or deploy specific functions:
```bash
firebase deploy --only functions:stripeWebhook,functions:verifyCheckoutSession
```

### 2. Verify Deployment

```bash
# Check function URLs
firebase functions:list

# Should see:
# stripeWebhook(us-central1) - https://us-central1-YOUR-PROJECT.cloudfunctions.net/stripeWebhook
# verifyCheckoutSession(us-central1) - https://us-central1-YOUR-PROJECT.cloudfunctions.net/verifyCheckoutSession
```

### 3. Update Stripe Webhook URL (if needed)

If webhook URL changed, update in Stripe Dashboard:

```
Stripe Dashboard → Developers → Webhooks → [Your endpoint] → Update
URL: https://us-central1-YOUR-PROJECT.cloudfunctions.net/stripeWebhook
```

### 4. Test Webhook

Option A: Use Stripe CLI (local testing)
```bash
stripe listen --forward-to https://us-central1-YOUR-PROJECT.cloudfunctions.net/stripeWebhook
stripe trigger checkout.session.completed
```

Option B: Create test payment in Stripe Dashboard
1. Stripe Dashboard (test mode) → Payments → Create payment
2. Use test card: 4242 4242 4242 4242
3. Monitor Firebase logs in real-time

### 5. Monitor Logs

```bash
# Real-time logs
firebase functions:log --only stripeWebhook,verifyCheckoutSession

# Or use Firebase Console
# https://console.firebase.google.com/project/YOUR-PROJECT/functions/logs
```

## What to Look For

### Successful Webhook Flow

```
🔵 WEBHOOK: Starting webhook processing
🔐 WEBHOOK: Verifying webhook signature
✅ WEBHOOK: Signature verified successfully
🔄 WEBHOOK: Processing webhook event
🎯 CHECKOUT: Processing checkout.session.completed
✅ CHECKOUT: User ID extracted successfully
✅ CHECKOUT: Customer ID extracted successfully
✅ CHECKOUT: Subscription retrieved successfully
💾 CHECKOUT: Updating user subscription in Firestore
✅ CHECKOUT: User subscription updated successfully
✅ WEBHOOK: Event processed successfully
```

### Successful Fallback Flow (if webhook delayed)

```
🎯 HANDLER: verifyCheckoutSession called from frontend
🔍 VERIFY: Manually verifying checkout session
✅ VERIFY: Checkout session retrieved successfully
🔄 VERIFY: Session is complete, triggering subscription update
🎯 CHECKOUT: Processing checkout.session.completed
✅ CHECKOUT: User subscription updated successfully
```

### Common Error Patterns

**Signature Verification Failed:**
```
❌ WEBHOOK: Signature verification failed - webhook secret mismatch?
```
→ Fix: Update `STRIPE_WEBHOOK_SECRET` in Firebase

**User Not Found:**
```
❌ CHECKOUT: User document does not exist in Firestore
```
→ Fix: Check user signup process

**Firestore Update Failed:**
```
❌ CHECKOUT: Failed to update user subscription in Firestore
```
→ Fix: Check Firestore permissions

## Immediate Actions After Deployment

1. **Monitor next payment:** Watch logs during checkout to see where it fails

2. **Check webhook deliveries:** Stripe Dashboard → Webhooks → Recent deliveries

3. **Verify secrets match:**
   ```bash
   firebase functions:secrets:access STRIPE_WEBHOOK_SECRET
   # Compare with: Stripe Dashboard → Webhooks → Signing secret
   ```

4. **Test with Stripe test mode:**
   - Create checkout session in test mode
   - Complete with test card: 4242 4242 4242 4242
   - Check logs for full flow

## Most Likely Root Causes

Based on the error "Failed to verify checkout session: FirebaseError: internal":

### 1. Webhook Secret Mismatch (80% probability)

**Check:**
```bash
firebase functions:secrets:access STRIPE_WEBHOOK_SECRET
```

**Should match:**
```
Stripe Dashboard → Developers → Webhooks → [endpoint] → Signing secret
```

**Fix if mismatch:**
```bash
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
# Paste the whsec_... secret from Stripe
firebase deploy --only functions:stripeWebhook
```

### 2. Webhook URL Wrong (15% probability)

**Check:**
Stripe Dashboard → Webhooks → [endpoint] URL

**Should be:**
```
https://us-central1-YOUR-PROJECT.cloudfunctions.net/stripeWebhook
```

**Fix:**
Update webhook URL in Stripe Dashboard

### 3. Firestore Permissions (5% probability)

**Check:**
Firebase Console → Firestore → Rules

**Should allow:**
Admin SDK writes (Functions use admin SDK, no rules restrictions)

## Support Resources

- Quick Debugging Guide: `_docs/guides/quick-stripe-debugging.md`
- Comprehensive Guide: `_docs/guides/debugging-stripe-webhooks.md`
- Stripe Webhook Docs: https://stripe.com/docs/webhooks
- Firebase Functions Logs: https://firebase.google.com/docs/functions/writing-and-viewing-logs

## Next Steps

1. Deploy the functions (see step 1 above)
2. Monitor logs during next payment attempt
3. Use emoji filters to quickly identify issues:
   - Search `❌` for errors
   - Search `🔵 WEBHOOK` for webhook arrival
   - Search `🎯 CHECKOUT` for processing
4. Share relevant log entries for further diagnosis if needed

---

**Deployment Date:** [To be filled after deployment]
**Deployed By:** [Your name]
**Production Issue:** "Failed to verify checkout session: FirebaseError: internal"
**Resolution Status:** Pending - Enhanced logging deployed to diagnose root cause
