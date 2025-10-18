# Development Setup - Quick Reference

## Starting Your Dev Environment

You need **3 terminals running simultaneously**:

### Terminal 1: Firebase Emulators
```bash
npm run emulators
```
**Starts:**
- Firestore emulator (port 9150)
- Realtime Database emulator (port 9000)
- Auth emulator (port 9099)
- Functions emulator (port 5001)
- Storage emulator (port 9199)
- Emulator UI (http://localhost:4000)

**Important:** Only run ONE instance of emulators!

### Terminal 2: Stripe Webhook Forwarding
```bash
npm run stripe:listen
```
**Forwards Stripe webhooks → Local Functions emulator**

First time? Install Stripe CLI:
```bash
brew install stripe/stripe-cli/stripe
stripe login
```

### Terminal 3: Vite Dev Server
```bash
npm run dev
```
**Runs your app:** http://localhost:5173

## Testing Stripe Checkout Locally

1. **All 3 terminals running** (emulators, stripe:listen, dev server)
2. **Create test checkout session** in your app
3. **Complete test payment** (use Stripe test card: `4242 4242 4242 4242`)
4. **Watch Stripe CLI terminal** - should show "checkout.session.completed" forwarded
5. **Check Functions logs** - should show "✅ CHECKOUT: User subscription updated"
6. **Check app** - subscription status should update immediately

## Viewing Your Data

### Development (Emulator) Data
- **Emulator UI:** http://localhost:4000
- **Firestore tab:** View/edit user documents
- **Auth tab:** View test users

### Production Data
- **Firebase Console:** https://console.firebase.google.com
- **⚠️ WARNING:** Don't confuse this with emulator data!

## Common Issues

### "User document does not exist" warning
**Cause:** Webhook received before user document created in emulator
**Fix:** Ensure user is logged in and user document exists in emulator Firestore before checkout

### Subscription not updating in app
**Cause:** Looking at production Firebase Console, not emulator data
**Fix:**
1. Open emulator UI (http://localhost:4000)
2. Check Firestore → users → {userId}
3. Or run in browser console: `window.debugUserStore()`

### Stale subscription data
**Cause:** Emulator Firestore cache
**Fix:** Run in browser console: `window.forceRefreshUser()`

### Multiple emulators running
**Symptom:** Errors like "port already in use"
**Fix:**
```bash
pkill -f firebase
npm run emulators
```

## Debug Commands

### Browser Console
```js
// View current user store state
window.debugUserStore()

// Force refresh from Firestore
window.forceRefreshUser()
```

### Terminal
```bash
# Check what's running on port 5001 (Functions)
lsof -i :5001

# Check what's running on port 9150 (Firestore)
lsof -i :9150

# Kill all Firebase processes
pkill -f firebase
```

## Environment Variables

**Development (.env.development):**
- Uses emulator URLs
- Stripe test keys
- Test price IDs

**Production (.env.production):**
- Uses production Firebase URLs
- Stripe live keys
- Production price IDs

**Never mix them!**
