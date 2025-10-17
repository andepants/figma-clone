# Stripe Backend Deployment Checklist

Quick reference for deploying the Stripe webhook integration to production.

## Pre-Deployment

### 1. Verify Code Builds Successfully
```bash
cd /Users/andre/coding/figma-clone/functions
npm run build
```
**Expected:** No TypeScript errors

### 2. Create Stripe Products (if not done)

**Test Mode:**
1. Go to [Stripe Dashboard (Test)](https://dashboard.stripe.com/test/products)
2. Create "CanvasIcons Founders Access" product
   - Price: $10/year (recurring)
   - Add metadata: `tier=founders`
3. Copy Price ID → Add to `.env.local` as `STRIPE_FOUNDERS_PRICE_ID`

**Production Mode:**
1. Switch to [Live mode](https://dashboard.stripe.com/products)
2. Create same product with live price
3. Copy Price ID for production environment

### 3. Configure Local Environment

Edit `/Users/andre/coding/figma-clone/functions/.env.local`:

```bash
# Required for local testing
STRIPE_TEST_SECRET_KEY=sk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_FOUNDERS_PRICE_ID=price_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx  # From Stripe CLI
```

## Local Testing

### 1. Start Functions Emulator
```bash
cd /Users/andre/coding/figma-clone/functions
npm run serve
```

### 2. Start Stripe CLI Listener
```bash
stripe listen --forward-to localhost:5001/YOUR-PROJECT-ID/us-central1/stripeWebhook
```

Copy the `whsec_xxx` secret to `.env.local` and restart emulator.

### 3. Test Events
```bash
# Test each event type
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
stripe trigger invoice.payment_failed
stripe trigger invoice.payment_succeeded
```

### 4. End-to-End Test
1. Run frontend: `npm run dev`
2. Navigate to `/pricing`
3. Complete checkout with test card: `4242 4242 4242 4242`
4. Verify Firestore user document updated with subscription

**Success Criteria:**
- ✅ All 5 test events process successfully
- ✅ User subscription updated in Firestore
- ✅ No errors in Functions logs
- ✅ Webhook signature verification passes

## Production Deployment

### 1. Set Firebase Secrets

```bash
cd /Users/andre/coding/figma-clone/functions

# Set production Stripe secret key
firebase functions:secrets:set STRIPE_SECRET_KEY
# Paste: sk_live_xxx (from Stripe Dashboard → API Keys)

# Set production price IDs as environment config (not secrets)
firebase functions:config:set \
  stripe.founders_price_id="price_live_xxx" \
  stripe.pro_price_id="price_live_yyy"
```

**Note:** Webhook secret will be set after creating endpoint in next step.

### 2. Deploy Functions

```bash
npm run build
firebase deploy --only functions:stripeWebhook
```

**Expected output:**
```
✔ functions[stripeWebhook(us-central1)] Successful create operation
Function URL: https://us-central1-YOUR-PROJECT-ID.cloudfunctions.net/stripeWebhook
```

**Copy the Function URL** for next step.

### 3. Configure Stripe Webhook (Production)

1. Switch Stripe to **Live mode**
2. Go to [Webhooks](https://dashboard.stripe.com/webhooks)
3. Click "Add endpoint"
4. **Endpoint URL:** Paste Function URL
5. **Description:** CanvasIcons Subscription Webhook (Production)
6. **Events to send:**
   - ✅ checkout.session.completed
   - ✅ customer.subscription.updated
   - ✅ customer.subscription.deleted
   - ✅ invoice.payment_failed
   - ✅ invoice.payment_succeeded
7. Click "Add endpoint"

### 4. Set Webhook Secret

1. In webhook details, reveal "Signing secret" (starts with `whsec_`)
2. Copy the secret
3. Set as Firebase secret:
   ```bash
   firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
   # Paste the whsec_xxx value when prompted
   ```

### 5. Redeploy with Secrets

```bash
firebase deploy --only functions:stripeWebhook
```

This redeploy picks up the new secret.

### 6. Test Production Webhook

**Option A: Send test event from Stripe Dashboard**
1. Go to webhook endpoint page
2. Click "Send test webhook"
3. Select "checkout.session.completed"
4. Check response is 200 OK

**Option B: Complete real test payment**
1. Use live mode test card (if available in your region)
2. Or use real card for $10 and immediately refund
3. Verify webhook processed in Firebase logs

### 7. Verify Firebase Logs

```bash
firebase functions:log --only stripeWebhook --limit 10
```

**Look for:**
```
Webhook signature verified
Processing webhook event: checkout.session.completed
User subscription updated
Webhook event processed successfully
```

## Post-Deployment Verification

### Checklist
- [ ] Webhook endpoint shows "Active" in Stripe Dashboard
- [ ] Test event returns 200 OK
- [ ] Firebase Functions logs show successful processing
- [ ] Firestore security rules allow webhook to write to `/users`
- [ ] Frontend can read updated subscription status
- [ ] Payment success page shows correct upgrade message

### Monitor First 24 Hours
```bash
# Follow live logs
firebase functions:log --only stripeWebhook --follow

# Check for any 400/500 errors in Stripe Dashboard
```

## Rollback Procedure

If webhook is failing:

1. **Disable webhook in Stripe Dashboard**
   - Prevents further failed events

2. **Check Firebase Functions logs for errors**
   ```bash
   firebase functions:log --only stripeWebhook --limit 50
   ```

3. **Fix issue and redeploy**
   ```bash
   npm run build
   firebase deploy --only functions:stripeWebhook
   ```

4. **Re-enable webhook** in Stripe Dashboard

5. **Replay failed events**
   - Stripe Dashboard → Webhook → Failed events → "Resend"

## Environment Variables Reference

### Local (.env.local)
```bash
STRIPE_TEST_SECRET_KEY=sk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_FOUNDERS_PRICE_ID=price_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

### Production (Firebase Secrets)
```bash
# Secrets (sensitive)
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Config (not sensitive)
stripe.founders_price_id=price_live_xxx
stripe.pro_price_id=price_live_yyy
```

## Troubleshooting

### "Webhook secret not configured"
**Solution:** Run `firebase functions:secrets:set STRIPE_WEBHOOK_SECRET`

### "Webhook signature verification failed"
**Solution:**
1. Verify secret matches Stripe Dashboard
2. Ensure using correct environment (test vs live)
3. Check Function URL matches webhook endpoint URL

### "User not found for customer ID"
**Solution:**
1. Ensure checkout passes `client_reference_id` with user ID
2. Verify user document exists in Firestore
3. Check `stripeCustomerId` field is indexed

### Functions deployment fails
**Solution:**
```bash
# Check for TypeScript errors
npm run build

# Check Firebase project
firebase use --add

# Verify Functions service is enabled
firebase projects:list
```

## Additional Resources

- [Webhook Setup Guide](./_docs/stripe/webhook-setup-and-testing.md)
- [Stripe Webhooks Documentation](https://stripe.com/docs/webhooks)
- [Firebase Functions Secrets](https://firebase.google.com/docs/functions/config-env)

---

**Last Updated:** 2025-10-17
