# Environment Setup Guide

## Overview

CollabCanvas now has complete separation between development and production environments:

- **Development**: All Firebase services use local emulators (no production data access)
- **Production**: All Firebase services use live Firebase project

## Environment Files

### `.env.development` (Local Development)
- Used when running `npm run dev`
- Connects to Firebase Emulators (localhost)
- Safe for testing without affecting production data
- **Environment Indicator**: Shows "DEVELOPMENT • Emulators" badge (top-left)

### `.env.production` (Production Build)
- Used when running `npm run build`
- Connects to live Firebase project (`figma-clone-d33e3`)
- Used for production deployments
- **Environment Indicator**: Hidden in production builds

### `.env.example` (Template)
- Template file for reference
- Not used by the application
- Committed to git for documentation

## Firebase Services in Development

When running in dev mode (`npm run dev`), all services connect to local emulators:

| Service | Emulator URL | Port |
|---------|--------------|------|
| Authentication | `http://localhost:9099` | 9099 |
| Firestore | `localhost:9150` | 9150 |
| Realtime Database | `localhost:9000` | 9000 |
| Cloud Functions | `localhost:5001` | 5001 |
| Emulator UI | `http://localhost:4000` | 4000 |

## Running the Application

### Development (with Emulators)

**Terminal 1** - Start Firebase Emulators:
```bash
npm run emulators
```

**Terminal 2** - Start Vite Dev Server:
```bash
npm run dev
```

The app will:
- ✅ Load `.env.development`
- ✅ Connect ALL services to emulators
- ✅ Show environment indicator badge
- ✅ Console log: "🔧 Using Firebase Emulators (local development)"

Access the app at: `http://localhost:5173`
Access Emulator UI at: `http://localhost:4000`

### Production Build

```bash
npm run build
npm run deploy
```

The build will:
- ✅ Load `.env.production`
- ✅ Connect to live Firebase services
- ✅ Hide environment indicator
- ✅ Optimize for production

## Testing Presence System

### In Development (Emulators)

1. **Start emulators** in Terminal 1:
   ```bash
   npm run emulators
   ```

2. **Start dev server** in Terminal 2:
   ```bash
   npm run dev
   ```

3. **Open browser** and navigate to Canvas page
   - You should see "DEVELOPMENT • Emulators" badge (top-left)
   - Console should show emulator connections

4. **Open Firebase Emulator UI**: `http://localhost:4000`
   - Navigate to Realtime Database tab
   - Watch `/canvases/main/presence` path

5. **Test presence**:
   - Sign in with any email (emulator auto-creates users)
   - You should see your user appear in Realtime Database
   - `online: true` should be set
   - Open second browser tab/window
   - Sign in with different email
   - Both users should appear in presence

6. **Test disconnect**:
   - Close one browser tab
   - User should be marked `online: false` automatically
   - This proves `onDisconnect()` is working

### Troubleshooting

**Issue**: "Permission denied" errors
- **Cause**: Database rules require authentication
- **Fix**: Ensure you're signed in (Auth emulator creates users automatically)

**Issue**: Changes appear in production
- **Cause**: Not connected to emulators
- **Fix**: Check console for "🔧 Using Firebase Emulators" message
- **Fix**: Verify environment badge shows "DEVELOPMENT"
- **Fix**: Restart both emulators and dev server

**Issue**: Emulators not starting
- **Cause**: Ports already in use
- **Fix**: Kill processes on ports 4000, 5001, 9000, 9099, 9150
- **Fix**: Run `npx kill-port 4000 5001 9000 9099 9150`

**Issue**: Auth not working
- **Cause**: connectAuthEmulator must be called before any auth operations
- **Fix**: Clear browser cache and reload
- **Fix**: Verify emulator is running on port 9099

## Environment Verification

Run this in your browser console on the Canvas page:

```javascript
console.log('Environment:', import.meta.env.VITE_ENVIRONMENT)
console.log('Mode:', import.meta.env.MODE)
console.log('Dev:', import.meta.env.DEV)
```

**Development** should show:
```
Environment: development
Mode: development
Dev: true
```

**Production** should show:
```
Environment: production
Mode: production
Dev: false
```

## Migration Notes

### Before This Change
- `.env` file with production credentials
- Hybrid mode: Auth/Firestore → Production, Database/Functions → Emulators
- Risk of accidentally modifying production data
- Presence system issues due to auth token mismatch

### After This Change
- Separate `.env.development` and `.env.production` files
- Complete isolation: ALL services use emulators in dev
- Zero risk to production data during development
- Presence system works correctly with local auth tokens

## Security

- **DO NOT** commit `.env.development` or `.env.production` to git
- Both files are in `.gitignore`
- Only commit `.env.example` for documentation
- Production API keys are safe in `.env.production` (git-ignored)
