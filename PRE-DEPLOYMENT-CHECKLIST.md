# Pre-Deployment Checklist - Stripe Functions

## ✅ Verify Secrets Are Set

Run these commands to verify secrets exist:

```bash
# Check STRIPE_SECRET_KEY
firebase functions:secrets:access STRIPE_SECRET_KEY
# Should output: sk_test_... or sk_live_...

# Check STRIPE_WEBHOOK_SECRET
firebase functions:secrets:access STRIPE_WEBHOOK_SECRET
# Should output: whsec_...
```

### If secrets are missing or wrong:

```bash
# Set Stripe Secret Key
firebase functions:secrets:set STRIPE_SECRET_KEY
# Paste: sk_live_... or sk_test_... (from Stripe Dashboard → API keys)

# Set Webhook Secret
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
# Paste: whsec_... (from Stripe Dashboard → Webhooks → [endpoint] → Signing secret)
```

## ✅ Verify Firebase Function Configuration

Check that functions are properly configured with secrets:

```bash
# View functions/src/index.ts
# Should see:
# - const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");
# - const stripeWebhookSecret = defineSecret("STRIPE_WEBHOOK_SECRET");
# - createCheckoutSession has: secrets: [stripeSecretKey]
# - verifyCheckoutSession has: secrets: [stripeSecretKey]
# - stripeWebhook has: secrets: [stripeWebhookSecret]
```

This is already correct in your code ✅

## ✅ Verify Stripe Dashboard Configuration

### 1. API Keys

```
Stripe Dashboard → Developers → API keys
```

- **Publishable key**: Starts with `pk_test_` or `pk_live_`
- **Secret key**: Starts with `sk_test_` or `sk_live_`

Copy the Secret key for Firebase secret.

### 2. Webhook Endpoint

```
Stripe Dashboard → Developers → Webhooks
```

Should have an endpoint configured:

**URL**: `https://us-central1-YOUR-PROJECT.cloudfunctions.net/stripeWebhook`

**Events to listen for** (minimum):
- ✅ `checkout.session.completed`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`
- ✅ `invoice.payment_failed`
- ✅ `invoice.payment_succeeded`

**Signing secret**: Starts with `whsec_...` (use for STRIPE_WEBHOOK_SECRET)

### 3. Products and Prices

```
Stripe Dashboard → Products
```

You should have products with price IDs. Note these down:

- **Founders Price ID**: `price_...` (set in `.env.local` as `STRIPE_FOUNDERS_PRICE_ID`)
- **Pro Price ID**: `price_...` (set in `.env.local` as `STRIPE_PRO_PRICE_ID`)

## ✅ Build and Deploy

```bash
cd functions
npm run build
npm run deploy
```

Watch for any errors during deployment.

## ✅ Post-Deployment Verification

### 1. Check Functions Deployed Successfully

```bash
firebase functions:list
```

Should show:
- ✅ `createCheckoutSession(us-central1)`
- ✅ `verifyCheckoutSession(us-central1)`
- ✅ `stripeWebhook(us-central1)`

### 2. Get Function URLs

```bash
firebase functions:list | grep stripe
```

Copy the `stripeWebhook` URL for Stripe Dashboard.

### 3. Update Stripe Webhook URL (if needed)

If the URL changed:

```
Stripe Dashboard → Developers → Webhooks → [Your endpoint] → Update endpoint
```

Paste the `stripeWebhook` URL from above.

### 4. Test Secret Injection

Create a test checkout and watch logs:

```bash
firebase functions:log --only createCheckoutSession,verifyCheckoutSession,stripeWebhook
```

Look for:
```
🔑 CREATE_CHECKOUT: Function called
  hasStripeKey: true
  stripeKeyPrefix: "sk_test" or "sk_live"
```

If `hasStripeKey: false`, secrets aren't injecting correctly.

## ✅ Test Stripe Integration

### Test Mode (Recommended First)

1. **Switch Stripe Dashboard to Test Mode** (toggle in top right)

2. **Create test checkout session** from your app

3. **Watch logs in real-time:**
   ```bash
   firebase functions:log --only createCheckoutSession,verifyCheckoutSession,stripeWebhook
   ```

4. **Complete checkout with test card:**
   - Card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits

5. **Expected log flow:**
   ```
   🔑 CREATE_CHECKOUT: Function called
     hasStripeKey: true

   🔵 WEBHOOK: Starting webhook processing
   🔐 WEBHOOK: Verifying webhook signature
   ✅ WEBHOOK: Signature verified successfully
   🎯 CHECKOUT: Processing checkout.session.completed
   💾 CHECKOUT: Updating user subscription in Firestore
   ✅ CHECKOUT: User subscription updated successfully
   ```

6. **Verify in Firestore:**
   ```
   Firebase Console → Firestore → users → [userId] → subscription
   ```

   Should show:
   ```json
   {
     "status": "founders" | "pro",
     "stripeCustomerId": "cus_...",
     "stripePriceId": "price_...",
     "currentPeriodEnd": <timestamp>
   }
   ```

### If Test Fails

**No webhook logs?**
- Check Stripe Dashboard → Webhooks → Recent deliveries
- Look for failed deliveries (red X)
- Click for details and error message

**Signature verification failed?**
```bash
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
# Re-paste from Stripe Dashboard → Webhooks → Signing secret
firebase deploy --only functions:stripeWebhook
```

**STRIPE_SECRET_KEY not found?**
```bash
firebase functions:secrets:set STRIPE_SECRET_KEY
# Paste from Stripe Dashboard → API keys → Secret key
firebase deploy --only functions:createCheckoutSession,functions:verifyCheckoutSession
```

**Firestore update failed?**
- Check user document exists: `Firestore → users → [userId]`
- Check Firebase Functions logs for specific error

## ✅ Production Checklist

Before going live with real payments:

- [ ] Switch Stripe to Live Mode
- [ ] Update `STRIPE_SECRET_KEY` with live key (`sk_live_...`)
- [ ] Update `STRIPE_WEBHOOK_SECRET` with live webhook secret
- [ ] Verify webhook URL points to production function
- [ ] Test with small real payment (can refund after)
- [ ] Monitor logs during first real payment
- [ ] Set up log-based alerts for errors

## 🚨 Emergency Rollback

If production deployment fails:

```bash
# Rollback to previous version
firebase functions:log  # Check when last good deployment was
# No built-in rollback - redeploy previous code

# Quick fix: Disable problematic function
firebase functions:delete stripeWebhook  # WARNING: Stops webhooks!
# Then fix and redeploy
```

## 📞 Support

If issues persist after following this checklist:

1. Capture error logs:
   ```bash
   firebase functions:log --only stripeWebhook,verifyCheckoutSession --limit 100 > error-logs.txt
   ```

2. Check Stripe webhook deliveries:
   ```
   Stripe Dashboard → Webhooks → Recent deliveries
   ```
   Screenshot any failed deliveries

3. Share both for debugging

---

**Last Updated**: 2025-10-17
**Verified By**: [Your name after verification]
**Status**: ⏳ Pending deployment and testing
