# Local Stripe Webhook Testing Guide

## Problem

When developing locally with Firebase Emulators + Stripe, webhooks need special configuration:

- **Frontend**: Connects to local Firestore emulator ✅
- **Stripe**: Creates checkout sessions in test mode ✅
- **Webhook**: By default hits PRODUCTION functions (wrong!) ❌

This causes:
- Firebase Console shows updated subscription (production Firestore)
- App shows stale subscription (emulator Firestore never updated)

## Solution: Stripe CLI Webhook Forwarding

Use Stripe CLI to forward webhooks to your local emulator functions.

### Setup (One-time)

1. **Install Stripe CLI** (if not already installed):
   ```bash
   brew install stripe/stripe-cli/stripe
   ```

2. **Login to Stripe**:
   ```bash
   stripe login
   ```

### Development Workflow

**Terminal 1**: Start Firebase Emulators
```bash
npm run emulators
```

**Terminal 2**: Forward Stripe webhooks to local functions
```bash
stripe listen --forward-to http://localhost:5001/figma-clone-d33e3/us-central1/stripeWebhook
```

**Terminal 3**: Run your dev server
```bash
npm run dev
```

### How It Works

1. **Stripe CLI** listens for events from Stripe (checkout.session.completed, etc.)
2. **Forwards** them to your local Functions emulator endpoint
3. **Webhook handler** (checkoutCompleted.ts) updates **emulator Firestore**
4. **Frontend** receives real-time update via onSnapshot ✅

### Verification

After completing a test checkout:

1. Check Stripe CLI terminal - should show webhook forwarded
2. Check Functions emulator logs - should show "✅ CHECKOUT: User subscription updated"
3. Check Emulator UI (http://localhost:4000) - Firestore should show updated subscription
4. Check your app - subscription status should update in real-time

### Troubleshooting

**Webhook not received:**
- Verify Stripe CLI is running (`stripe listen`)
- Check Functions emulator is on port 5001 (`lsof -i :5001`)
- Verify webhook endpoint matches your project ID

**User document not found:**
- Ensure user is created in emulator Firestore before checkout
- Check Auth emulator has the user logged in
- Verify `client_reference_id` in Stripe checkout session matches Firebase UID

**Subscription not updating in app:**
- Check browser console for "USER_STORE: Received Firestore update" logs
- Verify you're looking at emulator data, not production Firebase Console
- Force refresh: Open console, run `window.forceRefreshUser()`

## Production

In production, webhooks work automatically:
- Stripe → Production Cloud Functions → Production Firestore ✅

No Stripe CLI needed.
