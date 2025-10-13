# Phase 0: Project Setup

## Overview

**Goal:** Create a barebones project foundation that runs locally but isn't fully usable yet.

**Timeline:** 2-3 hours

**Deliverable:** A running Vite + React + TypeScript application with Firebase connected, deployed to Firebase Hosting, showing a basic "Hello World" on the canvas.

**Success Criteria:**
- ✅ Project runs locally with `npm run dev`
- ✅ TypeScript compiles without errors
- ✅ Tailwind CSS is working
- ✅ Firebase is initialized and connected
- ✅ Application is deployed to Firebase Hosting
- ✅ Basic routing works (landing page → canvas page)

---

## Phase Scope

This phase focuses on infrastructure and tooling. No user-facing features yet—just the foundation to build on.

**What's Included:**
- Project initialization with Vite
- TypeScript and Tailwind configuration
- Firebase project setup
- Basic folder structure
- Deployment pipeline

**What's NOT Included:**
- Any canvas functionality
- Authentication UI
- Real-time features
- Actual components

---

## Features & Tasks

### Feature 1: Initialize Vite Project

**Objective:** Create a new Vite React TypeScript project with proper configuration.

**Steps:**
1. Run `npm create vite@latest collabcanvas -- --template react-ts`
2. Install core dependencies: `npm install`
3. Start dev server and verify it runs: `npm run dev`
4. Open http://localhost:5173 and see Vite default page
5. Remove default Vite boilerplate (App.css, assets, default components)

**Verification:** Browser shows empty React app without errors.

---

### Feature 2: Configure Tailwind CSS

**Objective:** Set up Tailwind CSS for styling throughout the application.

**Steps:**
1. Install Tailwind: `npm install -D tailwindcss postcss autoprefixer`
2. Initialize Tailwind config: `npx tailwindcss init -p`
3. Update `tailwind.config.js` with content paths and theme from `theme-rules.md`
4. Create `src/styles/globals.css` with Tailwind imports
5. Import globals.css in `src/main.tsx`

**Verification:** Apply Tailwind class like `bg-blue-500` and see it work.

---

### Feature 3: Set Up Project Structure

**Objective:** Create the folder structure defined in `project-rules.md`.

**Steps:**
1. Create all directories: `components/`, `hooks/`, `lib/`, `stores/`, `types/`, `constants/`, `pages/`
2. Create subdirectories: `components/canvas/`, `components/ui/`, `lib/firebase/`, etc.
3. Add `index.ts` barrel exports in each directory
4. Create placeholder files with header comments (can be empty functions)
5. Verify TypeScript recognizes all paths

**Verification:** Import from any directory using `@/` alias works without errors.

---

### Feature 4: Configure TypeScript Path Aliases

**Objective:** Set up `@/` path aliases for clean imports.

**Steps:**
1. Update `tsconfig.json` with `baseUrl` and `paths` configuration
2. Update `vite.config.ts` to resolve `@/` aliases
3. Create test import in App.tsx using `@/` alias
4. Run dev server and verify no import errors
5. Test that IDE autocomplete works with aliases

**Verification:** `import { something } from '@/lib/utils'` works correctly.

**tsconfig.json example:**
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

**vite.config.ts example:**
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

---

### Feature 5: Initialize Firebase Project

**Objective:** Create and configure Firebase project with all required services.

**Steps:**
1. Go to console.firebase.google.com and create new project "collabcanvas"
2. Enable Firebase Realtime Database (start in test mode for now)
3. Enable Cloud Firestore (start in test mode for now)
4. Enable Authentication with Email/Password provider
5. Copy Firebase config object from project settings

**Verification:** Firebase console shows all three services enabled.

---

### Feature 6: Install and Configure Firebase SDK

**Objective:** Connect the application to Firebase backend.

**Steps:**
1. Install Firebase: `npm install firebase`
2. Create `.env.local` with Firebase config variables (prefixed with `VITE_`)
3. Create `src/lib/firebase/config.ts` with Firebase initialization
4. Create `src/lib/firebase/auth.ts`, `firestore.ts`, `realtimedb.ts` with service imports
5. Test connection by logging `firebase.app().name` in App.tsx

**Verification:** Console shows Firebase app name without errors.

**.env.local example:**
```bash
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project
VITE_FIREBASE_REALTIME_DB_URL=https://your_project.firebaseio.com
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

**config.ts example:**
```typescript
/**
 * @fileoverview Firebase configuration and initialization
 */

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_REALTIME_DB_URL,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const realtimeDb = getDatabase(app);
```

---

### Feature 7: Set Up Basic Routing

**Objective:** Create React Router structure for landing and canvas pages.

**Steps:**
1. Install React Router: `npm install react-router-dom`
2. Create `src/pages/LandingPage.tsx` with placeholder content
3. Create `src/pages/CanvasPage.tsx` with placeholder content
4. Set up BrowserRouter in `src/App.tsx` with routes for `/` and `/canvas`
5. Test navigation between pages

**Verification:** Clicking links navigates between landing and canvas pages.

**App.tsx example:**
```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import CanvasPage from './pages/CanvasPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/canvas" element={<CanvasPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

---

### Feature 8: Install Core Dependencies

**Objective:** Install all libraries needed for MVP.

**Steps:**
1. Install Konva: `npm install konva react-konva`
2. Install Zustand: `npm install zustand`
3. Install Lucide React (icons): `npm install lucide-react`
4. Install shadcn/ui (run init): `npx shadcn-ui@latest init`
5. Verify all packages in package.json

**Verification:** All imports resolve and `npm run dev` works without errors.

---

### Feature 9: Set Up Firebase Hosting

**Objective:** Configure deployment to Firebase Hosting.

**Steps:**
1. Install Firebase CLI globally: `npm install -g firebase-tools`
2. Login to Firebase: `firebase login`
3. Initialize Firebase Hosting: `firebase init hosting`
4. Configure `firebase.json` to use `dist` folder and SPA rewrites
5. Add build and deploy scripts to package.json

**Verification:** `firebase deploy --only hosting` deploys successfully.

**firebase.json example:**
```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

**package.json scripts:**
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "deploy": "npm run build && firebase deploy --only hosting"
  }
}
```

---

### Feature 10: Create Environment Template

**Objective:** Document environment variables for other developers.

**Steps:**
1. Create `.env.example` with all required variables (values as placeholders)
2. Add `.env.local` to `.gitignore`
3. Update README.md with setup instructions
4. Document where to get Firebase config values
5. Test setup on a fresh clone

**Verification:** Another developer can follow README to get project running.

**.env.example:**
```bash
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_REALTIME_DB_URL=https://your_project.firebaseio.com
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

---

## Testing Phase 0

### Manual Testing Checklist

- [ ] Run `npm install` → No errors
- [ ] Run `npm run dev` → App starts on localhost:5173
- [ ] Open browser → See React app (even if empty)
- [ ] Tailwind classes work → Apply `bg-blue-500` and see blue
- [ ] TypeScript compiles → No red squiggles in IDE
- [ ] Firebase connected → Console log shows Firebase app initialized
- [ ] Routing works → Navigate from `/` to `/canvas`
- [ ] Build works → `npm run build` completes successfully
- [ ] Deploy works → `firebase deploy` completes and app is accessible online
- [ ] Environment variables work → Firebase config loads from .env.local

---

## Deliverables

At the end of Phase 0, you should have:

1. **Running local development environment**
   - Vite dev server running
   - Hot module replacement working
   - TypeScript compiling

2. **Project structure**
   - All folders created per `project-rules.md`
   - Path aliases configured
   - Barrel exports in place

3. **Firebase connected**
   - All three services enabled (Auth, Firestore, Realtime DB)
   - SDK initialized and connected
   - Environment variables configured

4. **Deployment pipeline**
   - Firebase Hosting configured
   - Build and deploy scripts working
   - App accessible at public URL

5. **Developer documentation**
   - README with setup instructions
   - .env.example for configuration
   - All dependencies documented

---

## Common Issues & Solutions

### Issue: Firebase config not loading
**Solution:** Check that all env variables are prefixed with `VITE_` and restart dev server.

### Issue: Path aliases not working
**Solution:** Verify both tsconfig.json and vite.config.ts have matching alias configuration.

### Issue: Tailwind classes not applying
**Solution:** Check that content paths in tailwind.config.js include all component files.

### Issue: Firebase CLI not found
**Solution:** Install globally: `npm install -g firebase-tools` or use npx: `npx firebase-tools`

### Issue: Build fails with TypeScript errors
**Solution:** Run `tsc --noEmit` to see all TypeScript errors, fix them before building.

---

## Next Phase

After completing Phase 0, proceed to **Phase 1: MVP - Core Collaborative Canvas**.

Phase 1 will build on this foundation to create:
- Authentication flow
- Basic canvas with Konva
- Real-time cursor synchronization
- Single shape type (rectangle)
- Object creation and movement

**Phase 0 → Phase 1 Bridge:**
- All infrastructure is ready
- Now we build actual features
- Focus shifts from setup to user-facing functionality