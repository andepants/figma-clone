# Development Environment Setup

## Overview

CollabCanvas uses **Firebase Emulators** for local development to provide complete isolation between development and production environments.

## Environment Detection

The app automatically detects which environment it's running in:

### Local Development (Emulators)
- **Frontend**: `import.meta.env.DEV` is true → connects to emulators
- **Backend**: `FIREBASE_DATABASE_EMULATOR_HOST` is set → connects to emulators
- **Data**: Stored locally, cleared on emulator restart
- **Console**: Look for `🔧 Using Firebase Emulators (local development)`

### Production
- **Frontend**: Built with `npm run build` → connects to production Firebase
- **Backend**: Deployed with `firebase deploy` → connects to production Firebase
- **Data**: Persisted in production `figma-clone-d33e3-default-rtdb`
- **Console**: Look for `🚀 Firebase Admin: Using Production RTDB`

## Running the Development Environment

### Step 1: Start Firebase Emulators

```bash
npm run emulators
```

This starts:
- **RTDB Emulator**: `localhost:9000` - Real-time database for canvas objects
- **Functions Emulator**: `localhost:5001` - Cloud Functions (AI agent)
- **Firestore Emulator**: `localhost:9150` - Document database
- **Auth Emulator**: `localhost:9099` - Authentication
- **Emulator UI**: `http://localhost:4000` - Visual interface for all emulators

### Step 2: Start Development Server

In a **separate terminal**:

```bash
npm run dev
```

This starts Vite at `http://localhost:5173`

### Step 3: Verify Emulator Connection

Check the browser console for:
```
🔧 Using Firebase Emulators (local development)
```

Check the Functions logs for:
```
🔧 Firebase Admin: Using RTDB Emulator
```

## Emulator UI

Access the Firebase Emulator UI at `http://localhost:4000` to:
- View real-time database contents
- Inspect function calls and logs
- Monitor authentication state
- Debug Firestore documents

## Data Isolation

### Development Data
- **Location**: In-memory (emulator)
- **Persistence**: Lost when emulator stops
- **Access**: Only available locally
- **Database URL**: `http://127.0.0.1:9000/?ns=demo-figma-clone`

### Production Data
- **Location**: Firebase Cloud
- **Persistence**: Always persisted
- **Access**: Available globally
- **Database URL**: `https://figma-clone-d33e3-default-rtdb.firebaseio.com`

## Common Issues

### Issue: Objects not appearing on canvas

**Cause**: Emulators not running while using `npm run dev`

**Solution**: Always run emulators first (`npm run emulators`) in one terminal, then start dev server (`npm run dev`) in another

### Issue: AI agent creates objects but they disappear

**Cause**: Backend connecting to different database than frontend

**Solution**: Verify both show emulator connection messages in console

### Issue: Can't see database contents

**Cause**: Emulator UI not accessible

**Solution**: Check that `http://localhost:4000` is accessible and emulators are running

## Switching to Production

To test against production Firebase:

1. Build the app: `npm run build`
2. Preview: `npm run preview`
3. Or deploy: `npm run deploy`

Production builds automatically connect to production Firebase (no emulators).

## Port Configuration

All ports are configured in `firebase.json`:

```json
{
  "emulators": {
    "auth": { "port": 9099 },
    "functions": { "port": 5001 },
    "firestore": { "port": 9150 },
    "database": { "port": 9000 },
    "hosting": { "port": 5002 },
    "ui": { "port": 4000 }
  }
}
```

To change ports, edit `firebase.json` and update the corresponding connection code in:
- `src/lib/firebase/config.ts` (frontend)
- `functions/src/services/firebase-admin.ts` (backend)

## Troubleshooting

### Check Emulator Status
```bash
# View all running processes
lsof -i :9000  # RTDB emulator
lsof -i :5001  # Functions emulator
lsof -i :4000  # Emulator UI
```

### Clear Emulator Data
Stop emulators (`Ctrl+C`) and restart them. All emulator data is in-memory and will be cleared.

### View Function Logs
Check terminal running `npm run emulators` for function execution logs.

---

**Best Practice**: Always run emulators during development to avoid polluting production data.
