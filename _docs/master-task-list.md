# CollabCanvas - Master Task List

**Progress Tracker:** Track every task as you complete it. Each task is tested individually before moving forward.

**How to use:** Check off `[ ]` boxes as you complete and verify each task. Don't skip ahead—each task builds foundation for the next.

---

## Legend

- `[ ]` = Not started
- `[x]` = Completed and verified
- **Success Criteria:** How to verify task is done
- **Edge Cases:** Potential issues to watch for
- **Tests:** How to test this specific task

---

# Phase 0: Project Setup (2-3 hours)

**Goal:** Running project with Firebase connected and deployed.

## 0.1 Initialize Vite Project

- [x] **0.1.1** Run `npm create vite@latest collabcanvas -- --template react-ts`
  - **Success:** Command completes without errors, folder created
  - **Test:** Check that `collabcanvas/` folder exists with files
  - **Edge Case:** If folder exists, delete or rename first

- [x] **0.1.2** Navigate into project: `cd collabcanvas`
  - **Success:** Terminal shows `collabcanvas` directory
  - **Test:** Run `pwd` or `cd` to confirm location

- [x] **0.1.3** Install dependencies: `npm install`
  - **Success:** All packages install, no error messages
  - **Test:** Check `node_modules/` folder exists
  - **Edge Case:** If errors, try deleting `package-lock.json` and retry

- [x] **0.1.4** Start dev server: `npm run dev`
  - **Success:** Server starts, shows "Local: http://localhost:5173"
  - **Test:** Visit URL in browser, see Vite default page
  - **Edge Case:** If port 5173 in use, Vite will use different port

- [x] **0.1.5** Remove Vite boilerplate files
  - Delete: `src/App.css`, `src/assets/react.svg`, `public/vite.svg`
  - Clear default content from `src/App.tsx`
  - **Success:** Clean slate, no default Vite styling
  - **Test:** Page shows blank React app
  - **Edge Case:** Keep index.css for now (needed for Tailwind)

---

## 0.2 Configure Tailwind CSS

- [x] **0.2.1** Install Tailwind and dependencies
  - Run: `npm install -D tailwindcss postcss autoprefixer`
  - **Success:** Packages added to package.json devDependencies
  - **Test:** Check package.json lists all three packages

- [x] **0.2.2** Initialize Tailwind config
  - Run: `npx tailwindcss init -p`
  - **Success:** Creates `tailwind.config.js` and `postcss.config.js`
  - **Test:** Both files exist in root directory
  - **Edge Case:** If files exist, they'll be overwritten

- [x] **0.2.3** Configure Tailwind content paths in `tailwind.config.js`
  - Add: `content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"]`
  - **Success:** Config watches all source files
  - **Test:** File matches content array format

- [x] **0.2.4** Add theme from `theme-rules.md` to Tailwind config
  - Copy color palette (primary, neutral, success, error, warning)
  - Add Inter font family
  - Add custom shadows and spacing
  - **Success:** Theme matches design system
  - **Test:** Config has extended theme object
  - **Edge Case:** Make sure to use `extend` not replace default

- [x] **0.2.5** Create `src/styles/globals.css`
  - Add Tailwind directives:
    ```css
    @tailwind base;
    @tailwind components;
    @tailwind utilities;
    ```
  - **Success:** File created with directives
  - **Test:** File exists with correct content

- [x] **0.2.6** Import globals.css in `src/main.tsx`
  - Add: `import './styles/globals.css'` at top
  - **Success:** Import statement added before App import
  - **Test:** Check main.tsx file

- [x] **0.2.7** Test Tailwind is working
  - Add `className="bg-primary-500 text-white p-4"` to any element
  - **Success:** Element shows blue background, white text, padding
  - **Test:** See styling in browser
  - **Edge Case:** If no styling, restart dev server

---

## 0.3 Set Up Project Folder Structure (Vertical Slice Architecture)

**Important:** This project uses Vertical Slice Architecture from day one. Each feature is self-contained with its own components, hooks, and utils. Only truly shared code goes in `components/`, `lib/`, etc.

- [x] **0.3.1** Create `src/features/` directory
  - **Success:** features/ folder exists
  - **Test:** Navigate to src/features/
  - **Why:** This is the core of vertical slice architecture - features, not component types

- [x] **0.3.2** Create `src/features/auth/` feature slice
  - Create: `auth/components/`, `auth/hooks/`, `auth/utils/`
  - **Success:** All subdirectories exist
  - **Test:** Navigate into each folder
  - **Why:** Auth is feature-complete with UI, logic, and utilities

- [x] **0.3.3** Create `src/features/canvas-core/` feature slice
  - Create: `canvas-core/components/`, `canvas-core/shapes/`, `canvas-core/hooks/`, `canvas-core/utils/`
  - **Success:** All subdirectories exist
  - **Test:** Navigate into each folder
  - **Why:** Canvas rendering is a self-contained feature

- [x] **0.3.4** Create `src/features/collaboration/` feature slice
  - Create: `collaboration/components/`, `collaboration/hooks/`, `collaboration/utils/`
  - **Success:** All subdirectories exist
  - **Test:** Navigate into each folder
  - **Why:** Multiplayer features (cursors, presence) are isolated

- [x] **0.3.5** Create `src/features/toolbar/` feature slice
  - Create: `toolbar/components/`, `toolbar/hooks/`
  - **Success:** All subdirectories exist
  - **Test:** Navigate into each folder
  - **Why:** Toolbar and tools are their own domain

- [x] **0.3.6** Create `src/features/ai-agent/` feature slice (Phase 3 placeholder)
  - Create: `ai-agent/components/`, `ai-agent/hooks/`, `ai-agent/utils/`
  - **Success:** All subdirectories exist
  - **Test:** Navigate into each folder
  - **Why:** Placeholder for Phase 3, empty for now

- [x] **0.3.7** Create barrel exports for each feature
  - Create `index.ts` in: `features/auth/`, `features/canvas-core/`, `features/collaboration/`, `features/toolbar/`, `features/ai-agent/`
  - Content: `// Barrel export for [feature-name] feature`
  - **Success:** 5 index.ts files in feature roots
  - **Test:** Each feature has index.ts
  - **Edge Case:** Files are empty for now, will export components later

- [x] **0.3.8** Create subdirectory barrel exports
  - Create `index.ts` in each components/, hooks/, utils/ subdirectory
  - Content: `// Export [components/hooks/utils] from this directory`
  - **Success:** All subdirectories have index.ts
  - **Test:** Count index.ts files (should be 15+)
  - **Why:** Enables clean imports like `import { AuthModal } from '@/features/auth/components'`

- [x] **0.3.9** Create `src/components/` (SHARED ONLY)
  - Create: `components/ui/`, `components/common/`, `components/layout/`
  - **Success:** 3 subdirectories exist
  - **Test:** Navigate into each folder
  - **Why:** Shared, generic components used across multiple features
  - **Edge Case:** If only one feature needs it, put it in that feature instead

- [x] **0.3.10** Create `src/stores/` directory
  - **Success:** stores/ folder exists
  - **Test:** Navigate to stores/
  - **Why:** Zustand stores are shared state, not feature-specific

- [x] **0.3.11** Create `src/lib/` directory and subdirectories
  - Create: `lib/firebase/`, `lib/canvas/`, `lib/utils/`
  - **Success:** All subdirectories exist
  - **Test:** Navigate into each folder
  - **Why:** Infrastructure services (Firebase, utilities) are shared

- [x] **0.3.12** Create `src/types/` directory
  - **Success:** types/ folder exists
  - **Test:** Navigate to types/
  - **Why:** Shared TypeScript types used across features

- [x] **0.3.13** Create `src/constants/` directory
  - **Success:** constants/ folder exists
  - **Test:** Navigate to constants/
  - **Why:** App-wide constants (API URLs, config values)

- [x] **0.3.14** Create `src/pages/` directory
  - **Success:** pages/ folder exists
  - **Test:** Navigate to pages/
  - **Why:** Top-level route components (LandingPage, CanvasPage)

- [x] **0.3.15** Create `src/styles/` directory
  - **Success:** styles/ folder exists
  - **Test:** Navigate to styles/
  - **Why:** Global styles, Tailwind imports

- [x] **0.3.16** Create barrel exports for shared directories
  - Create `index.ts` in: `components/ui/`, `components/common/`, `components/layout/`, `stores/`, `lib/firebase/`, `lib/canvas/`, `lib/utils/`, `types/`, `constants/`
  - Content: `// Export from this directory`
  - **Success:** 9 index.ts files created
  - **Test:** All exist and are empty for now

- [x] **0.3.17** Verify final folder structure
  - Run: `tree src/ -L 3` or use file explorer
  - **Success:** Structure matches architecture.md
  - **Test:** Compare with expected structure below
  - **Edge Case:** tree command might not be installed, use `ls -R src/` instead

**Expected Structure:**
```
src/
├── features/
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── index.ts
│   ├── canvas-core/
│   │   ├── components/
│   │   ├── shapes/
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── index.ts
│   ├── collaboration/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── index.ts
│   ├── toolbar/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── index.ts
│   └── ai-agent/
│       ├── components/
│       ├── hooks/
│       ├── utils/
│       └── index.ts
├── components/        # Shared only
│   ├── ui/
│   ├── common/
│   └── layout/
├── stores/
├── lib/
│   ├── firebase/
│   ├── canvas/
│   └── utils/
├── types/
├── constants/
├── pages/
└── styles/
```

---

## 0.4 Configure TypeScript Path Aliases

- [x] **0.4.1** Update `tsconfig.json` with baseUrl
  - Add: `"baseUrl": "."` in compilerOptions
  - **Success:** BaseUrl set to root
  - **Test:** Check tsconfig.json

- [x] **0.4.2** Add paths configuration to `tsconfig.json`
  - Add paths object with `@/*: ["src/*"]`
  - **Success:** Alias configured
  - **Test:** Check compilerOptions.paths exists
  - **Edge Case:** Make sure it's inside compilerOptions

- [x] **0.4.3** Install path package for Vite
  - Run: `npm install -D @types/node`
  - **Success:** Package installed
  - **Test:** Check package.json

- [x] **0.4.4** Update `vite.config.ts` with resolve alias
  - Add path import: `import path from 'path'`
  - Add resolve.alias: `{ '@': path.resolve(__dirname, './src') }`
  - **Success:** Alias configured in Vite
  - **Test:** Check vite.config.ts has resolve object

- [x] **0.4.5** Test path alias works
  - Create test file `src/lib/test.ts` with: `export const test = 'working'`
  - Import in App.tsx: `import { test } from '@/lib/test'`
  - Console log test variable
  - **Success:** No import errors, console shows "working"
  - **Test:** Check browser console
  - **Edge Case:** Restart dev server if not working

- [x] **0.4.6** Remove test files
  - Delete `src/lib/test.ts` and remove import from App.tsx
  - **Success:** Clean state restored
  - **Test:** No test code remains

---

## 0.5 Create Firebase Project

- [x] **0.5.1** Go to Firebase Console (console.firebase.google.com)
  - **Success:** Console loads, logged in
  - **Test:** See projects page or create project button

- [x] **0.5.2** Create new project named "collabcanvas"
  - Click "Add project"
  - Enter name: collabcanvas
  - **Success:** Project created
  - **Test:** Project appears in console
  - **Edge Case:** Name might need to be unique, try collabcanvas-[yourname]
  - **Note:** Project created as "figma-clone-d33e3"

- [x] **0.5.3** Disable Google Analytics (optional for MVP)
  - Toggle off during project creation
  - **Success:** Project creates faster without Analytics
  - **Test:** Project ready to use

- [x] **0.5.4** Enable Firebase Realtime Database
  - Go to Build → Realtime Database
  - Click "Create Database"
  - Choose location (us-central1 recommended)
  - Start in **test mode** for now
  - **Success:** Database created with URL
  - **Test:** See database URL in console
  - **Edge Case:** Note the URL format (ends with .firebaseio.com)

- [x] **0.5.5** Enable Cloud Firestore
  - Go to Build → Firestore Database
  - Click "Create database"
  - Start in **test mode** for now
  - Choose same location as Realtime DB
  - **Success:** Firestore created
  - **Test:** See Firestore collections tab
  - **Edge Case:** Test mode allows all reads/writes temporarily

- [x] **0.5.6** Enable Authentication with Email/Password
  - Go to Build → Authentication
  - Click "Get started"
  - Click "Email/Password" provider
  - Toggle "Enable" ON
  - Save
  - **Success:** Email/Password enabled
  - **Test:** See enabled in Sign-in methods
  - **Edge Case:** Don't enable Email link (passwordless) yet

- [x] **0.5.7** Register web app in Firebase
  - Go to Project Overview
  - Click web icon (</>)
  - Register app with nickname: "collabcanvas-web"
  - **Don't set up Firebase Hosting yet** (will do later)
  - **Success:** Web app registered, config object shown
  - **Test:** See Firebase config code
  - **Edge Case:** Copy config object somewhere safe
  - **Note:** App registered as "figma-clone-web"

---

## 0.6 Install and Configure Firebase SDK

- [x] **0.6.1** Install Firebase SDK
  - Run: `npm install firebase`
  - **Success:** Firebase added to dependencies
  - **Test:** Check package.json

- [x] **0.6.2** Create `.env.local` file in root
  - **Success:** File created (will show in root directory)
  - **Test:** File exists
  - **Edge Case:** File starts with dot (hidden on some systems)
  - **Note:** Using `.env` file instead of `.env.local`

- [x] **0.6.3** Add Firebase config to `.env.local`
  - Add all variables with VITE_ prefix:
    ```
    VITE_FIREBASE_API_KEY=your_key
    VITE_FIREBASE_AUTH_DOMAIN=your_domain
    VITE_FIREBASE_PROJECT_ID=your_id
    VITE_FIREBASE_REALTIME_DB_URL=your_url
    VITE_FIREBASE_STORAGE_BUCKET=your_bucket
    VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender
    VITE_FIREBASE_APP_ID=your_app_id
    ```
  - **Success:** All 7 variables added with real values
  - **Test:** File has all VITE_ prefixed variables
  - **Edge Case:** No quotes needed around values

- [x] **0.6.4** Add `.env.local` to `.gitignore`
  - Open .gitignore
  - Add line: `.env.local`
  - **Success:** File listed in gitignore
  - **Test:** Git won't track this file
  - **Edge Case:** Should already be there, but verify

- [x] **0.6.5** Create `src/lib/firebase/config.ts`
  - Add file with header comment
  - Import Firebase modules
  - Initialize app with env variables
  - Export app, auth, firestore, realtimeDb
  - **Success:** Config file complete
  - **Test:** No TypeScript errors
  - **Edge Case:** Use import.meta.env not process.env

- [x] **0.6.6** Create `src/lib/firebase/auth.ts`
  - Import auth from config
  - Export auth for use in app
  - **Success:** Auth module ready
  - **Test:** Can import from this file

- [x] **0.6.7** Create `src/lib/firebase/firestore.ts`
  - Import firestore from config
  - Export firestore for use in app
  - **Success:** Firestore module ready
  - **Test:** Can import from this file

- [x] **0.6.8** Create `src/lib/firebase/realtimedb.ts`
  - Import realtimeDb from config
  - Export realtimeDb for use in app
  - **Success:** Realtime DB module ready
  - **Test:** Can import from this file

- [x] **0.6.9** Create `src/lib/firebase/index.ts` barrel export
  - Export all from config, auth, firestore, realtimedb
  - **Success:** Single import point for Firebase
  - **Test:** Can import all Firebase exports from @/lib/firebase

- [x] **0.6.10** Test Firebase connection
  - Import { app } from '@/lib/firebase' in App.tsx
  - Add: `console.log('Firebase:', app.name)`
  - **Success:** Console shows "Firebase: [DEFAULT]"
  - **Test:** Check browser console
  - **Edge Case:** If error, check env variables are loaded (restart dev server)

- [x] **0.6.11** Remove Firebase test code from App.tsx
  - Delete console.log and import
  - **Success:** Clean App.tsx
  - **Test:** No Firebase-related code in App.tsx yet

---

## 0.7 Set Up Basic Routing

- [x] **0.7.1** Install React Router
  - Run: `npm install react-router-dom`
  - **Success:** Package installed
  - **Test:** Check package.json dependencies

- [x] **0.7.2** Create `src/pages/LandingPage.tsx`
  - Add file with header comment
  - Create simple component returning "Landing Page"
  - Export default
  - **Success:** File created with component
  - **Test:** No TypeScript errors

- [x] **0.7.3** Create `src/pages/CanvasPage.tsx`
  - Add file with header comment
  - Create simple component returning "Canvas Page"
  - Export default
  - **Success:** File created with component
  - **Test:** No TypeScript errors

- [x] **0.7.4** Update `src/App.tsx` with BrowserRouter
  - Import BrowserRouter, Routes, Route from react-router-dom
  - Import LandingPage and CanvasPage
  - Wrap app in BrowserRouter
  - Add Routes with Route for "/" and "/canvas"
  - **Success:** Routing configured
  - **Test:** No TypeScript errors

- [x] **0.7.5** Test navigation to landing page
  - Visit http://localhost:5173/
  - **Success:** See "Landing Page" text
  - **Test:** Browser shows correct content
  - **Edge Case:** If blank, check routes are inside BrowserRouter

- [x] **0.7.6** Test navigation to canvas page
  - Visit http://localhost:5173/canvas
  - **Success:** See "Canvas Page" text
  - **Test:** Browser shows correct content

- [x] **0.7.7** Add Link component test
  - Add Link to LandingPage: `<Link to="/canvas">Go to Canvas</Link>`
  - **Success:** Link appears and is clickable
  - **Test:** Click link navigates to /canvas
  - **Edge Case:** Import Link from react-router-dom

---

## 0.8 Install Core Dependencies

- [x] **0.8.1** Install Konva and React-Konva
  - Run: `npm install konva react-konva`
  - **Success:** Both packages installed
  - **Test:** Check package.json has both

- [x] **0.8.2** Install Konva types
  - Run: `npm install -D @types/konva`
  - **Success:** Types installed
  - **Test:** Check package.json devDependencies
  - **Note:** Konva includes its own TypeScript types, no separate @types package needed

- [x] **0.8.3** Install Zustand
  - Run: `npm install zustand`
  - **Success:** Package installed
  - **Test:** Check package.json

- [x] **0.8.4** Install Lucide React (icons)
  - Run: `npm install lucide-react`
  - **Success:** Package installed
  - **Test:** Check package.json

- [x] **0.8.5** Initialize shadcn/ui
  - Run: `npx shadcn-ui@latest init`
  - Choose: TypeScript, default style
  - Use CSS variables: Yes
  - **Success:** shadcn/ui configured
  - **Test:** Check components/ui folder created
  - **Edge Case:** Will ask several questions, use defaults

- [x] **0.8.6** Verify all dependencies installed
  - Run: `npm list --depth=0`
  - **Success:** All packages listed without errors
  - **Test:** Check output for all installed packages
  - **Edge Case:** If peer dependency warnings, usually safe to ignore

---

## 0.9 Set Up Firebase Hosting

- [x] **0.9.1** Install Firebase CLI globally
  - Run: `npm install -g firebase-tools`
  - **Success:** CLI installed
  - **Test:** Run `firebase --version` shows version number
  - **Edge Case:** May need sudo on Mac/Linux
  - **Note:** Firebase CLI 14.19.1 verified

- [x] **0.9.2** Login to Firebase CLI
  - Run: `firebase login`
  - **Success:** Browser opens, login successful
  - **Test:** CLI shows "Success! Logged in as [email]"
  - **Edge Case:** If already logged in, will show current user
  - **Note:** Logged in as andrewsheim@gmail.com

- [x] **0.9.3** Initialize Firebase in project
  - Run: `firebase init`
  - **Success:** Firebase initialization starts
  - **Test:** See Firebase logo in terminal
  - **Note:** Already initialized

- [x] **0.9.4** Select Hosting feature
  - Use arrow keys and spacebar to select "Hosting"
  - Press Enter
  - **Success:** Hosting selected
  - **Test:** See checkmark next to Hosting
  - **Note:** Hosting already configured

- [x] **0.9.5** Select existing project
  - Choose "Use an existing project"
  - Select your collabcanvas project
  - **Success:** Project selected
  - **Test:** See project name confirmed
  - **Note:** Project figma-clone-d33e3 configured

- [x] **0.9.6** Configure hosting settings
  - Public directory: `dist` (not build, not public)
  - Single-page app: **Yes**
  - Set up automatic builds with GitHub: **No** (for now)
  - **Success:** Configuration complete
  - **Test:** See firebase.json created

- [x] **0.9.7** Verify `firebase.json` configuration
  - Check public is "dist"
  - Check rewrites array exists for SPA
  - **Success:** Config looks correct
  - **Test:** File matches expected format

- [x] **0.9.8** Add deploy script to package.json
  - Add to scripts: `"deploy": "npm run build && firebase deploy --only hosting"`
  - **Success:** Script added
  - **Test:** Check package.json scripts section

- [x] **0.9.9** Test production build
  - Run: `npm run build`
  - **Success:** Build completes, dist/ folder created
  - **Test:** Check dist/ folder has index.html and assets/
  - **Edge Case:** Fix any TypeScript errors before build succeeds
  - **Note:** Build successful, created dist/index.html and assets

- [x] **0.9.10** Test local preview of build
  - Run: `npm run preview`
  - Visit preview URL
  - **Success:** Production build works locally
  - **Test:** See app in browser from dist/
  - **Edge Case:** Might be different port than dev server
  - **Note:** Preview running at http://localhost:4173/

- [x] **0.9.11** Deploy to Firebase Hosting
  - Run: `firebase deploy --only hosting`
  - **Success:** Deploy completes
  - **Test:** See "Deploy complete!" message
  - **Edge Case:** First deploy might take longer
  - **Note:** Deployed 3 files successfully

- [x] **0.9.12** Test deployed application
  - Visit the Firebase hosting URL (shown in deploy output)
  - **Success:** App loads from deployed URL
  - **Test:** Navigation works, see both pages
  - **Edge Case:** May take a minute to propagate
  - **Note:** Live at https://figma-clone-d33e3.web.app

---

## 0.10 Create Environment Template and Documentation

- [x] **0.10.1** Create `.env.example` file
  - Copy structure from .env.local
  - Replace real values with placeholders
  - **Success:** Template file created
  - **Test:** File has all variables with placeholder values

- [x] **0.10.2** Update README.md with setup instructions
  - Add "Setup" section
  - Document: clone, npm install, env setup, Firebase config
  - **Success:** Clear setup instructions
  - **Test:** Another person could follow steps

- [x] **0.10.3** Document Firebase configuration steps
  - Add section explaining where to get Firebase config
  - **Success:** Clear Firebase setup docs
  - **Test:** Instructions are complete

- [x] **0.10.4** Add development commands to README
  - Document: `npm run dev`, `npm run build`, `npm run deploy`
  - **Success:** Commands documented
  - **Test:** All important commands listed

- [x] **0.10.5** Commit initial setup to git
  - Run: `git add .`
  - Run: `git commit -m "Initial project setup"`
  - **Success:** Initial commit created
  - **Test:** Run `git log` shows commit
  - **Edge Case:** Make sure .env.local is NOT committed
  - **Note:** Commit 18aed3e created with comprehensive Phase 0 summary

---

## Phase 0 Verification Checklist

Before proceeding to Phase 1, verify ALL of these:

**Project Setup:**
- [x] Project runs locally with `npm run dev`
- [x] TypeScript compiles with no errors
- [x] Tailwind CSS classes work (test with `bg-primary-500 text-white`)
- [x] Tailwind theme matches `theme-rules.md` (colors, fonts, shadows)

**Folder Structure (Vertical Slice Architecture):**
- [x] `src/features/` directory exists with 5 feature slices (auth, canvas-core, collaboration, toolbar, ai-agent)
- [x] Each feature has subdirectories (components/, hooks/, utils/ where applicable)
- [x] `src/components/` exists for SHARED components only (ui/, common/, layout/)
- [x] `src/stores/`, `src/lib/`, `src/types/`, `src/constants/`, `src/pages/`, `src/styles/` all exist
- [x] Barrel exports (`index.ts`) created in all appropriate directories
- [x] Structure matches architecture.md exactly

**Path Aliases:**
- [x] Path aliases configured (@/* imports work)
- [x] Can import from `@/features/auth/components`
- [x] Can import from `@/lib/firebase`
- [x] Can import from `@/stores`

**Firebase:**
- [x] Firebase services enabled in console (Auth, Firestore, Realtime DB)
- [x] Firebase SDK installed and configured
- [x] `.env.local` created with all Firebase config variables
- [x] Firebase connection test passes (console log shows app name)
- [x] `.env.example` created (no real values)

**Routing:**
- [x] React Router installed and configured
- [x] Can navigate between `/` (landing) and `/canvas` (canvas)
- [x] Both routes render correctly

**Dependencies:**
- [x] All core dependencies installed (Firebase, Konva, React Konva, Zustand, Lucide, shadcn/ui)
- [x] `npm list --depth=0` shows no missing dependencies
- [x] shadcn/ui initialized (components/ui/ exists)

**Build & Deploy:**
- [x] Build command works: `npm run build` (creates `dist/` folder)
- [x] Preview works: `npm run preview`
- [x] Firebase Hosting configured (firebase.json exists)
- [x] App deployed to Firebase Hosting
- [x] Deployed app accessible via public URL

**Documentation:**
- [x] README.md has setup instructions
- [x] README.md project structure matches new vertical slice architecture
- [x] Git repository initialized and initial commit made
- [x] `.env.local` is in `.gitignore` (never committed)

**If ANY checkbox above is unchecked, fix it before Phase 1.**

---

# Phase 1: MVP - Core Collaborative Canvas (12-18 hours)

**Goal:** Working collaborative canvas with real-time sync passing all MVP criteria.

**Key Feature:** Dynamic shape creation using click-drag-release pattern (shapes size as you drag).

**Important - Using Up-to-Date Documentation:**
When working with 3rd party libraries (Firebase, shadcn/ui, Konva, etc.), use the context7 MCP to get the latest documentation:
1. Call `mcp__context7__resolve-library-id` with the library name (e.g., 'firebase', 'shadcn')
2. Call `mcp__context7__get-library-docs` with the returned library ID
3. Use the documentation to ensure you're using current APIs and best practices

This is especially important for Firebase SDK methods and shadcn/ui component APIs, which may have changed since the knowledge cutoff.

---

## 1.1 Authentication Feature (2-3 hours)

### 1.1.1 Install shadcn Components
- [x] **Documentation:** Use context7 MCP to get latest shadcn/ui docs before starting
  - Call `mcp__context7__resolve-library-id` with 'shadcn'
  - Call `mcp__context7__get-library-docs` to see installation and component usage
- [x] Run: `npx shadcn-ui@latest add dialog button input label card`
  - **Success:** All components added to components/ui/
  - **Test:** Check components/ui/ has dialog, button, input, label, card
  - **Edge Case:** If install fails, check shadcn/ui is initialized (0.8.5)

### 1.1.2 Create Auth Types
- [x] Create `src/types/auth.types.ts`
  - Define AuthMode: `'login' | 'signup'`
  - Define User interface: `{ uid: string; email: string | null; username: string | null }`
  - Define AuthError interface: `{ code: string; message: string }`
  - **Success:** Types defined with JSDoc comments
  - **Test:** No TypeScript errors, can import from @/types/auth.types
  - **Edge Case:** Ensure nullable fields for email/username

### 1.1.3 Build Auth Modal Component
- [x] Create `features/auth/components/AuthModal.tsx`
  - Import Dialog from shadcn
  - Props: `isOpen: boolean`, `onClose: () => void`, `initialMode?: AuthMode`
  - State: `mode: AuthMode` (toggle login/signup)
  - Toggle button: "Don't have an account? Sign up"
  - **Success:** Modal structure complete with header
  - **Test:** Component compiles, imports from @/features/auth/components
  - **Edge Case:** Modal closes on backdrop click, escape key

### 1.1.4 Build Login Form
- [x] Create `features/auth/components/LoginForm.tsx`
  - Form fields: email (type="email"), password (type="password")
  - State: `{ email, password, loading, error }`
  - Submit button: "Log In" (disabled while loading)
  - Error display: Red text below form
  - **Success:** Form renders with validation UI
  - **Test:** Typing updates state, submit button toggles
  - **Edge Case:** Enter key submits form

### 1.1.5 Build Signup Form
- [x] Create `features/auth/components/SignupForm.tsx`
  - Form fields: username, email, password
  - State: `{ username, email, password, loading, error }`
  - Validation: username min 3 chars, password min 6 chars
  - Submit button: "Sign Up" (disabled while loading)
  - **Success:** Form renders with all fields
  - **Test:** Validation shows errors below inputs
  - **Edge Case:** Password field shows/hides with eye icon

### 1.1.6 Integrate Forms into Auth Modal
- [x] Update `AuthModal.tsx`
  - Render LoginForm when mode === 'login'
  - Render SignupForm when mode === 'signup'
  - Pass onSuccess callback to both forms
  - **Success:** Forms switch smoothly
  - **Test:** Toggle button switches between forms
  - **Edge Case:** Form state resets on mode change

### 1.1.7 Create useAuth Hook
- [x] Create `features/auth/hooks/useAuth.ts`
  - State: `currentUser: User | null`, `loading: boolean`
  - onAuthStateChanged listener in useEffect
  - Methods: `login()`, `signup()`, `logout()`
  - Export hook and context provider
  - **Success:** Hook tracks auth state
  - **Test:** Can call hook from component, auth persists on refresh
  - **Edge Case:** Cleanup listener on unmount

### 1.1.8 Implement Firebase Auth Functions
- [x] **Documentation:** Use context7 MCP to get latest Firebase Auth documentation
  - Call `mcp__context7__resolve-library-id` with 'firebase'
  - Call `mcp__context7__get-library-docs` with topic 'authentication'
  - Review current Auth API methods (createUserWithEmailAndPassword, signInWithEmailAndPassword, etc.)
- [x] Update `lib/firebase/auth.ts`
  - `signUpWithEmail(email, password, username)`: creates user, sets displayName
  - `signInWithEmail(email, password)`: logs in user
  - `signOutUser()`: signs out
  - `getAuthErrorMessage(error)`: maps Firebase errors to friendly messages
  - **Success:** All functions defined with types
  - **Test:** Call from console, check Firebase console
  - **Edge Case:** Handle "email-already-in-use", "weak-password", "user-not-found"

### 1.1.9 Connect Forms to Firebase
- [x] Update `LoginForm.tsx`
  - Use useAuth hook
  - Call login() on submit
  - Handle errors with getAuthErrorMessage
  - On success: close modal, navigate to /canvas
  - **Success:** Login works end-to-end
  - **Test:** Login with valid/invalid credentials
  - **Edge Case:** Show loading state, disable form during submission

- [x] Update `SignupForm.tsx`
  - Use useAuth hook
  - Call signup() on submit
  - Set displayName from username field
  - On success: close modal, navigate to /canvas
  - **Success:** Signup creates user
  - **Test:** Create user, check Firebase Auth console
  - **Edge Case:** Validate email format, password strength

### 1.1.10 Create Protected Route
- [x] Create `features/auth/components/ProtectedRoute.tsx`
  - Use useAuth hook
  - Show loading spinner while auth state loads
  - Redirect to "/" if !currentUser (use Navigate with replace)
  - Render children if authenticated
  - **Success:** Route protection works
  - **Test:** Access /canvas logged out → redirects
  - **Edge Case:** No flash of content before redirect

### 1.1.11 Update App Routing
- [x] Update `src/App.tsx`
  - Wrap app with AuthProvider (from useAuth) - Done in main.tsx
  - Wrap /canvas route with ProtectedRoute
  - **Success:** Auth protection active
  - **Test:** Can't access canvas without login

### 1.1.12 Add Auth Modal to Landing Page
- [x] Update `src/pages/LandingPage.tsx`
  - State: `authModalOpen: boolean`
  - Replace "Go to Canvas" with "Get Started" (opens auth modal)
  - If logged in, auto-redirect to /canvas (useEffect + useNavigate)
  - **Success:** Modal opens on button click
  - **Test:** Click button, see modal, login redirects
  - **Edge Case:** Logged-in users bypass landing page

### 1.1.13 Test Auth Flow End-to-End
- [x] Manual testing checklist:
  - Signup with new account → auto-navigate to canvas
  - Logout → redirect to landing
  - Login with existing account → navigate to canvas
  - Refresh on canvas → stay logged in
  - Access /canvas logged out → redirect to landing
  - Invalid email/password → show error
  - Weak password → show error
  - **Success:** All scenarios work
  - **Test:** Network disconnect during auth (graceful error)

---

## 1.2 Canvas Store (Zustand) (1 hour)

### 1.2.1 Define Canvas Types
- [x] Create `src/types/canvas.types.ts`
  - `ShapeType: 'rectangle' | 'circle' | 'text'`
  - `BaseCanvasObject: { id: string; type: ShapeType; x: number; y: number; createdBy: string; createdAt: number; updatedAt: number }`
  - `Rectangle extends BaseCanvasObject: { type: 'rectangle'; width: number; height: number; fill: string }`
  - `Circle, Text` interfaces (for Phase 2, define stubs)
  - `CanvasObject: Rectangle | Circle | Text`
  - **Success:** All types defined with JSDoc
  - **Test:** No TypeScript errors
  - **Edge Case:** Union type works with discriminated union pattern

### 1.2.2 Create Canvas Store
- [x] Create `src/stores/canvasStore.ts`
  - State: `objects: CanvasObject[]`, `selectedId: string | null`
  - Actions:
    - `addObject(object: CanvasObject): void`
    - `updateObject(id: string, updates: Partial<CanvasObject>): void`
    - `removeObject(id: string): void`
    - `selectObject(id: string | null): void`
    - `clearSelection(): void`
    - `setObjects(objects: CanvasObject[]): void` (for Firestore sync)
  - **Success:** Store created with types
  - **Test:** Import and call actions in console
  - **Edge Case:** updateObject handles nested properties

### 1.2.3 Test Store Independently
- [x] Test in browser console:
  - `useCanvasStore.getState().addObject({ ... })`
  - `useCanvasStore.getState().objects` (verify added)
  - Add 10 objects, update one, remove one, select one
  - **Success:** All CRUD operations work
  - **Test:** State updates trigger re-renders (test with React DevTools)
  - **Edge Case:** Concurrent updates don't lose data

### 1.2.4 Create Store Barrel Export
- [x] Update `src/stores/index.ts`
  - `export * from './canvasStore'`
  - **Success:** Can import from @/stores
  - **Test:** `import { useCanvasStore } from '@/stores'` works

---

## 1.3 Basic Konva Canvas Setup (1-2 hours)

### 1.3.1 Create Canvas Stage Component
- [x] **Documentation:** Use context7 MCP to get latest Konva/react-konva documentation
  - Call `mcp__context7__resolve-library-id` with 'konva' and 'react-konva'
  - Call `mcp__context7__get-library-docs` to review Stage, Layer, and Shape APIs
- [x] Create `features/canvas-core/components/CanvasStage.tsx`
  - Import Stage, Layer from react-konva
  - State: `dimensions: { width: number; height: number }`
  - Initialize with `window.innerWidth`, `window.innerHeight`
  - Render Stage with Layer (empty for now)
  - **Success:** Component renders full-screen canvas
  - **Test:** No console errors, import from @/features/canvas-core/components

### 1.3.2 Add Window Resize Handler
- [x] Update `CanvasStage.tsx`
  - useEffect with resize listener
  - Update dimensions on resize
  - Cleanup listener on unmount
  - **Success:** Canvas resizes with window
  - **Test:** Resize browser window, canvas adjusts
  - **Edge Case:** Debounce resize (100ms) for performance

### 1.3.3 Add Canvas Background
- [x] Update `CanvasStage.tsx`
  - Add Rect to background Layer
  - Fill: #f5f5f5, width/height from dimensions
  - Layer props: `listening={false}` (optimization)
  - **Success:** Gray background renders
  - **Test:** See #f5f5f5 background
  - **Edge Case:** Background always behind objects (layer order)

### 1.3.4 Implement Pan (Drag Stage)
- [x] Update `CanvasStage.tsx`
  - State: `stagePos: { x: number; y: number }`
  - Stage props: `draggable={true}`, `x={stagePos.x}`, `y={stagePos.y}`
  - onDragEnd: update stagePos
  - Cursor: "grab" default, "grabbing" while dragging
  - **Success:** Canvas pans smoothly
  - **Test:** Drag in all directions, 60 FPS
  - **Edge Case:** Pan while objects exist (all move together)

### 1.3.5 Implement Zoom (Wheel Event)
- [x] Update `CanvasStage.tsx`
  - State: `stageScale: number` (default: 1)
  - onWheel handler:
    - Get pointer position
    - Calculate new scale (current * (1 ± 0.1))
    - Clamp scale: Math.max(0.1, Math.min(5, newScale))
    - Transform: zoom towards cursor (not center)
    - Update stageScale and stagePos
  - **Success:** Zoom centers on cursor
  - **Test:** Zoom in/out, test limits (0.1, 5.0)
  - **Edge Case:** Zoom calculation: `stage.getAbsoluteTransform().invert().point(pointerPos)`

### 1.3.6 Add Canvas to CanvasPage
- [x] Update `src/pages/CanvasPage.tsx`
  - Import CanvasStage
  - Replace placeholder with `<CanvasStage />`
  - Remove padding/margins (full-screen canvas)
  - **Success:** Canvas renders on /canvas route
  - **Test:** Navigate to /canvas, see full-screen gray canvas

### 1.3.7 Test Canvas Interactions
- [x] Manual testing:
  - Pan in all directions
  - Zoom in to 5.0x (max)
  - Zoom out to 0.1x (min)
  - Pan while zoomed in/out
  - Rapid pan + zoom (test performance)
  - **Success:** 60 FPS, smooth interactions
  - **Test:** Chrome DevTools Performance tab
  - **Edge Case:** Trackpad pinch-to-zoom (browser default, may need preventDefault)

---

## 1.4 Tool Store & Toolbar (1 hour)

### 1.4.1 Create Tool Types
- [x] Create `src/types/tool.types.ts`
  - `ToolType: 'select' | 'rectangle' | 'circle' | 'text'`
  - `Tool: { id: ToolType; name: string; icon: LucideIcon; shortcut: string }`
  - **Success:** Types defined
  - **Test:** No TypeScript errors

### 1.4.2 Create Tool Store
- [x] Create `src/stores/toolStore.ts`
  - State: `activeTool: ToolType` (default: 'select')
  - Action: `setActiveTool(tool: ToolType): void`
  - **Success:** Store created
  - **Test:** Change tool in console, state updates

### 1.4.3 Create Toolbar Component
- [x] Create `features/toolbar/components/Toolbar.tsx`
  - Import tools: Mouse (select), Square (rectangle)
  - Map tools to buttons
  - Use toolStore to track active tool
  - Style: Absolute positioned, top-left, floating panel
  - Active tool: Blue background (#0ea5e9)
  - **Success:** Toolbar renders with 2 buttons
  - **Test:** Click tools, active state changes
  - **Edge Case:** Keyboard shortcuts (V = select, R = rectangle)

### 1.4.4 Add Toolbar to CanvasPage
- [x] Update `src/pages/CanvasPage.tsx`
  - Import Toolbar
  - Render above CanvasStage (z-index)
  - **Success:** Toolbar visible on canvas
  - **Test:** Tool selection works

### 1.4.5 Implement Keyboard Shortcuts
- [x] Create `features/toolbar/hooks/useToolShortcuts.ts`
  - useEffect with keydown listener
  - V key → setActiveTool('select')
  - R key → setActiveTool('rectangle')
  - Escape → clearSelection (canvasStore)
  - Cleanup on unmount
  - **Success:** Shortcuts work
  - **Test:** Press V, R, Escape
  - **Edge Case:** Don't trigger if user is typing in input

- [x] Update `CanvasPage.tsx`
  - Call useToolShortcuts() hook
  - **Success:** Shortcuts active on canvas

---

## 1.5 Dynamic Rectangle Creation (2-3 hours)

**Key Feature:** Click-drag-release pattern (not preset sizes).

### 1.5.1 Create Shape Creation Hook
- [x] Create `features/canvas-core/hooks/useShapeCreation.ts`
  - State: `previewShape: CanvasObject | null`, `isCreating: boolean`, `startPoint: { x, y } | null`
  - Logic:
    - onMouseDown: If activeTool === 'rectangle', set startPoint, isCreating = true
    - onMouseMove: If isCreating, update previewShape (calculate width/height from startPoint to current)
    - onMouseUp: If isCreating, finalize shape (add to canvasStore), reset state
  - Handle coordinate transforms (screen → canvas coords)
  - Minimum size: 10x10 px (enforce on mouseUp)
  - **Success:** Hook manages creation state
  - **Test:** Console log shape dimensions during drag

### 1.5.2 Implement Coordinate Transform Utility
- [x] Create `features/canvas-core/utils/coordinates.ts`
  - `screenToCanvasCoords(stage: Konva.Stage, screenPoint: { x, y }): { x, y }`
    - Get stage transform: `stage.getAbsoluteTransform().copy().invert()`
    - Apply: `transform.point(screenPoint)`
  - **Success:** Function converts coords correctly
  - **Test:** Log coords at different zoom/pan levels
  - **Edge Case:** Handle stage = null (return screen coords)

### 1.5.3 Integrate Shape Creation into CanvasStage
- [x] Update `features/canvas-core/components/CanvasStage.tsx`
  - Use `useShapeCreation` hook
  - Attach mouse handlers to Stage: onMouseDown, onMouseMove, onMouseUp
  - Only trigger if activeTool === 'rectangle' (check toolStore)
  - If activeTool === 'select', allow pan (draggable)
  - **Success:** Tool mode controls behavior
  - **Test:** Select tool = pan, rectangle tool = create

### 1.5.4 Render Preview Shape
- [x] Update `CanvasStage.tsx`
  - If `previewShape` exists, render it (Rect component)
  - Style: Dashed stroke (#0ea5e9), transparent fill, strokeWidth: 2
  - Layer: Objects layer (above background, below cursors later)
  - **Success:** Preview shows while dragging
  - **Test:** Click-drag, see blue dashed rectangle growing
  - **Edge Case:** Preview disappears on mouseUp

### 1.5.5 Handle Negative Dimensions
- [x] Update `useShapeCreation.ts` onMouseMove logic
  - Calculate: `width = Math.abs(currentX - startX)`, `height = Math.abs(currentY - startY)`
  - Position: `x = Math.min(startX, currentX)`, `y = Math.min(startY, currentY)`
  - **Success:** Can drag in any direction
  - **Test:** Drag up-left, up-right, down-left, down-right
  - **Edge Case:** All directions produce positive width/height

### 1.5.6 Enforce Minimum Size
- [x] Update `useShapeCreation.ts` onMouseUp logic
  - If width < 10, set width = 10
  - If height < 10, set height = 10
  - **Success:** No tiny shapes created
  - **Test:** Click without dragging → 10x10 shape
  - **Edge Case:** Drag 3px → 10x10 shape

### 1.5.7 Create Rectangle Shape Component
- [x] Create `features/canvas-core/shapes/Rectangle.tsx`
  - Props: `rectangle: Rectangle`, `isSelected: boolean`, `onSelect: () => void`
  - Render Konva Rect: x, y, width, height, fill
  - onClick: call onSelect (only if select tool active)
  - Selection border: Blue 3px stroke if isSelected
  - **Success:** Rectangle component renders
  - **Test:** Render from canvasStore.objects
  - **Edge Case:** Click only fires if activeTool === 'select'

### 1.5.8 Render Rectangles from Store
- [x] Update `CanvasStage.tsx`
  - Get objects from canvasStore
  - Map over objects.filter(obj => obj.type === 'rectangle')
  - Render Rectangle component for each
  - Pass isSelected, onSelect
  - **Success:** Rectangles render
  - **Test:** Create 5 shapes, all visible

### 1.5.9 Test Dynamic Creation
- [x] Manual testing:
  - Switch to rectangle tool (R key)
  - Click-drag small (20x20) → creates
  - Click-drag large (200x300) → creates
  - Click without drag → 10x10 minimum
  - Drag in all 4 directions → all work
  - Create 10 shapes rapidly → all appear
  - Switch to select tool (V key) → creation stops, pan works
  - **Success:** All creation scenarios work
  - **Edge Case:** Creation during zoom/pan (coords correct)

---

## 1.6 Rectangle Selection & Manipulation (1-2 hours)

### 1.6.1 Implement Selection Logic
- [x] Update `features/canvas-core/shapes/Rectangle.tsx`
  - onClick handler:
    - Check activeTool === 'select'
    - If yes: `canvasStore.selectObject(rectangle.id)`
    - If no: ignore click
  - **Success:** Click selects rectangle
  - **Test:** Click shape → selectedId updates in store

### 1.6.2 Implement Deselection
- [x] Update `CanvasStage.tsx`
  - onClick handler on Stage:
    - If target === background: `canvasStore.clearSelection()`
  - **Success:** Click background deselects
  - **Test:** Select shape → click background → deselected

### 1.6.3 Add Selection Visual
- [x] Update `Rectangle.tsx`
  - If isSelected:
    - stroke: #0ea5e9, strokeWidth: 3
    - Add 8 resize handles (4 corners, white squares, 8x8px)
  - **Success:** Selected shape shows blue border + handles
  - **Test:** Select shape, see visual feedback

### 1.6.4 Implement Drag-to-Move
- [x] Update `Rectangle.tsx`
  - Add draggable prop: `draggable={isSelected && activeTool === 'select'}`
  - onDragMove: Optimistic update (update local position immediately)
  - onDragEnd: Update canvasStore + sync to Firebase (later)
  - **Success:** Can drag selected shapes
  - **Test:** Select → drag → position updates
  - **Edge Case:** Only selected shapes draggable

### 1.6.5 Add Cursor States
- [x] Update `Rectangle.tsx`
  - onMouseEnter: Set cursor = "move" (if select tool + selected)
  - onMouseLeave: Set cursor = "default"
  - **Success:** Cursor changes on hover
  - **Test:** Hover over shape, cursor changes

### 1.6.6 Test Selection & Movement
- [x] Manual testing:
  - Create 3 rectangles
  - Select first → blue border
  - Select second → first deselects, second selects
  - Click background → deselect
  - Drag selected shape → moves
  - Drag unselected shape → doesn't move
  - Switch to rectangle tool → shapes not selectable
  - **Success:** All selection scenarios work
  - **Edge Case:** Rapid selection switching (no lag)

---

## 1.7 Firestore Integration (2 hours)

### 1.7.1 Design Firestore Structure
- [x] **Documentation:** Use context7 MCP to get latest Firestore documentation
  - Call `mcp__context7__resolve-library-id` with 'firebase'
  - Call `mcp__context7__get-library-docs` with topic 'firestore'
  - Review current Firestore data modeling, onSnapshot, and update methods
- [x] Document structure:
  ```
  /canvases/main/
    objects: CanvasObject[]
    metadata: { createdAt: timestamp, lastModified: timestamp }
  ```
  - **Success:** Structure documented
  - **Test:** Create doc manually in Firebase console

### 1.7.2 Create Canvas Service
- [x] Create `src/lib/firebase/canvasService.ts`
  - `subscribeToCanvas(canvasId: string, callback: (objects: CanvasObject[]) => void): () => void`
    - onSnapshot listener
    - Returns unsubscribe function
  - `updateCanvasObjects(canvasId: string, objects: CanvasObject[]): Promise<void>`
    - Update doc with new objects array + lastModified timestamp
  - **Success:** Service functions defined
  - **Test:** Call from console, check Firestore

### 1.7.3 Implement Debounced Updates
- [x] Create `src/lib/utils/debounce.ts`
  - `debounce(fn, delay)` helper
  - **Success:** Debounce function works

- [x] Update `canvasService.ts`
  - Wrap `updateCanvasObjects` with debounce (500ms)
  - Export as `debouncedUpdateCanvas`
  - **Success:** Updates debounced
  - **Test:** Rapid updates → only one Firebase write

### 1.7.4 Subscribe to Firestore in CanvasPage
- [x] Update `src/pages/CanvasPage.tsx`
  - useEffect: `subscribeToCanvas('main', (objects) => canvasStore.setObjects(objects))`
  - Cleanup: unsubscribe on unmount
  - **Success:** Firestore → Store sync
  - **Test:** Update Firestore manually → canvas updates

### 1.7.5 Sync Local Changes to Firestore
- [x] Update `useShapeCreation.ts` onMouseUp
  - After adding to store: `debouncedUpdateCanvas('main', canvasStore.getState().objects)`
  - **Success:** Created shapes sync to Firestore
  - **Test:** Create shape → check Firestore within 500ms

- [x] Update `Rectangle.tsx` onDragEnd
  - After updating store: sync to Firestore
  - **Success:** Moved shapes sync
  - **Test:** Move shape → check Firestore

### 1.7.6 Handle Optimistic Updates
- [x] Pattern:
  1. User action → update local store immediately (instant UI feedback)
  2. Sync to Firestore (debounced)
  3. Firestore broadcasts → other clients receive update
  4. Local client ignores own update (check timestamp or ID)
  - **Success:** No duplicate updates
  - **Test:** Create shape, verify only one store update

### 1.7.7 Test Multi-User Sync
- [ ] Open 2 browser windows:
  - Window A: Create rectangle
  - Window B: See rectangle appear within 500ms
  - Window B: Move rectangle
  - Window A: See rectangle move
  - Both: Create shapes rapidly (10 shapes in 10 seconds)
  - **Success:** All changes sync correctly
  - **Edge Case:** Concurrent edits (last-write-wins, both see final state)
  - **Note:** Testing instructions provided - please test manually

### 1.7.8 Handle Offline Mode
- [x] Test with network disabled:
  - Create shapes → queued locally
  - Re-enable network → shapes sync
  - **Success:** Firestore offline persistence works
  - **Test:** Chrome DevTools → offline mode
  - **Note:** Offline persistence enabled with enableIndexedDbPersistence()

---

## 1.8 Multiplayer Cursors (2-3 hours)

### 1.8.1 Design Realtime DB Structure
- [ ] **Documentation:** Use context7 MCP to get latest Firebase Realtime Database documentation
  - Call `mcp__context7__resolve-library-id` with 'firebase'
  - Call `mcp__context7__get-library-docs` with topic 'realtime database'
  - Review current RTDB API: ref(), set(), onValue(), onDisconnect()
- [ ] Document structure:
  ```
  /canvases/main/cursors/{userId}/
    x: number
    y: number
    username: string
    color: string
    lastUpdate: timestamp
  ```
  - **Success:** Structure documented

### 1.8.2 Create Cursor Service
- [ ] Create `src/lib/firebase/cursorService.ts`
  - `updateCursor(canvasId, userId, position: {x, y}, username, color): Promise<void>`
  - `subscribeToCursors(canvasId, callback): () => void`
    - Listen to entire `/cursors/` path
    - Return unsubscribe
  - **Success:** Service functions defined

### 1.8.3 Implement Throttled Cursor Updates
- [ ] Create `src/lib/utils/throttle.ts`
  - `throttle(fn, delay)` helper

- [ ] Update `cursorService.ts`
  - Wrap `updateCursor` with throttle (50ms)
  - Export as `throttledUpdateCursor`
  - **Success:** Cursor updates throttled

### 1.8.4 Create Cursor Component
- [ ] Create `features/collaboration/components/Cursor.tsx`
  - Props: `x, y, username, color`
  - Render: SVG cursor icon (M0,0 L0,16 L4,12 L8,16 L12,12 L8,8 Z)
  - Username label: Small badge below cursor (Tailwind)
  - Color: Cursor fill + label background
  - **Success:** Cursor renders
  - **Test:** Render at 100,100 with name "Test User"

### 1.8.5 Implement Cursor Color Assignment
- [ ] Create `features/collaboration/utils/colorAssignment.ts`
  - `getUserColor(userId: string): string`
    - Hash userId to index: `hashCode(userId) % COLORS.length`
    - COLORS: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899']
  - **Success:** Consistent colors per user
  - **Test:** Same userId → same color

### 1.8.6 Create useCursors Hook
- [ ] Create `features/collaboration/hooks/useCursors.ts`
  - State: `cursors: Array<{userId, x, y, username, color}>`
  - Subscribe to Realtime DB on mount
  - Filter out own cursor (currentUser.uid)
  - Cleanup on unmount
  - **Success:** Hook provides cursor data
  - **Test:** Log cursors state

### 1.8.7 Update Own Cursor Position
- [ ] Update `CanvasStage.tsx`
  - onMouseMove: Get canvas coords, call throttledUpdateCursor
  - Use auth.currentUser.uid, username, color
  - **Success:** Own cursor updates in Realtime DB
  - **Test:** Check Realtime DB, see cursor object

### 1.8.8 Render Other Users' Cursors
- [ ] Update `CanvasStage.tsx`
  - Use useCursors hook
  - Add new Layer (cursors, `listening={false}`)
  - Map over cursors, render Cursor component
  - **Success:** Other cursors visible
  - **Test:** Open 2 windows, move mouse, see cursor in other window

### 1.8.9 Test Cursor Performance
- [ ] Performance testing:
  - Rapid mouse movement → smooth cursor updates
  - 3 concurrent users → all cursors visible, <50ms latency
  - Check FPS (should stay 60)
  - **Success:** 60 FPS with 3 moving cursors
  - **Edge Case:** Cursor at different zoom levels (coords correct)

---

## 1.9 Presence System (1 hour)

### 1.9.1 Design Presence Structure
- [ ] Document structure:
  ```
  /canvases/main/presence/{userId}/
    username: string
    online: boolean
    lastSeen: timestamp
  ```

### 1.9.2 Create Presence Service
- [ ] Create `src/lib/firebase/presenceService.ts`
  - `setOnline(canvasId, userId, username): Promise<void>`
    - Set online = true
    - Use `onDisconnect()` to set online = false automatically
  - `subscribeToPresence(canvasId, callback): () => void`
  - **Success:** Service functions defined

### 1.9.3 Set User Online on Canvas Mount
- [ ] Update `CanvasPage.tsx`
  - useEffect: Call `setOnline('main', currentUser.uid, currentUser.username)`
  - **Success:** User marked online
  - **Test:** Check Realtime DB, see presence object

### 1.9.4 Create PresenceList Component
- [ ] Create `features/collaboration/components/PresenceList.tsx`
  - Props: `users: Array<{userId, username, online, color}>`
  - Render: Small panel (top-right, fixed position)
  - Show avatar circles (first initial, colored background)
  - Limit to 10, show "+X more"
  - Hover: Show full username
  - **Success:** Component renders
  - **Test:** Pass mock data, see list

### 1.9.5 Create usePresence Hook
- [ ] Create `features/collaboration/hooks/usePresence.ts`
  - Subscribe to Realtime DB
  - Filter online users
  - Add color from getUserColor
  - **Success:** Hook provides online users

### 1.9.6 Add PresenceList to CanvasPage
- [ ] Update `CanvasPage.tsx`
  - Use usePresence hook
  - Render PresenceList component
  - **Success:** Presence list visible

### 1.9.7 Test Presence System
- [ ] Open 3 browser windows:
  - All 3 show each other in presence list
  - Close one window → disappears from others within 3 seconds
  - Refresh one window → presence persists
  - **Success:** Presence tracking works
  - **Edge Case:** Browser crash → onDisconnect fires

---

## 1.10 UI Polish & Performance (1-2 hours)

### 1.10.1 Add Loading States
- [ ] Create `components/common/Loading.tsx`
  - Spinner component
  - Use in ProtectedRoute, CanvasPage (initial load)
  - **Success:** Loading states visible

### 1.10.2 Add Error Boundaries
- [ ] Create `components/common/ErrorBoundary.tsx`
  - Catch React errors
  - Show friendly error message
  - **Success:** Errors don't crash app

### 1.10.3 Optimize Re-Renders
- [ ] Update `Rectangle.tsx`
  - Wrap with React.memo
  - **Success:** Re-renders only when props change

- [ ] Update `Cursor.tsx`
  - Wrap with React.memo
  - **Success:** Cursor re-renders minimized

### 1.10.4 Performance Audit
- [ ] Chrome DevTools Performance tab:
  - Record while creating 10 shapes
  - Check FPS (target: 60)
  - Check sync latency (target: <100ms shapes, <50ms cursors)
  - **Success:** Meets performance targets
  - **Edge Case:** Test with 100 shapes (should still be 60 FPS)

### 1.10.5 Add Toast Notifications
- [ ] **Documentation:** Use context7 MCP to get latest shadcn/ui toast documentation
  - Call `mcp__context7__get-library-docs` with topic 'toast'
  - Review toast component API and usage patterns
- [ ] Install shadcn toast: `npx shadcn-ui@latest add toast`
- [ ] Add toasts for:
  - Shape created
  - Sync error
  - User joined/left
  - **Success:** Toasts appear

### 1.10.6 Style Pass
- [ ] Verify all colors match theme-rules.md:
  - Primary: #0ea5e9 (selected, buttons)
  - Neutral: #f5f5f5 (canvas bg), #e5e7eb (borders)
  - Error: #ef4444
  - **Success:** Consistent styling
  - **Test:** Visual inspection

---

## 1.11 MVP Validation Checklist

**Must pass ALL before Phase 1 complete:**

### Functional Requirements
- [ ] User can sign up with email/password/username
- [ ] User can log in with email/password
- [ ] User stays logged in after page refresh
- [ ] Canvas loads with persisted shapes from Firestore
- [ ] User can switch between select (V) and rectangle (R) tools
- [ ] User can create rectangles with click-drag-release (dynamic sizing)
- [ ] Rectangles have minimum size 10x10px
- [ ] Dragging in any direction creates correct shape
- [ ] Click without drag creates 10x10 minimum rectangle
- [ ] User can select rectangles (click when select tool active)
- [ ] User can deselect (click background)
- [ ] User can drag selected rectangles
- [ ] Rectangle changes sync to Firestore within 500ms
- [ ] Multiple users see each other's shapes in real-time
- [ ] Multiple users see each other's cursors with username labels
- [ ] Presence list shows online users
- [ ] User can pan canvas (drag background when select tool active)
- [ ] User can zoom canvas (mouse wheel, 0.1x - 5.0x)

### Performance Requirements
- [ ] 60 FPS during pan
- [ ] 60 FPS during zoom
- [ ] 60 FPS while dragging shapes
- [ ] 60 FPS with 100+ shapes on canvas
- [ ] <100ms sync latency for shape changes
- [ ] <50ms sync latency for cursor positions
- [ ] No memory leaks after 5 minutes of use

### Multi-User Requirements
- [ ] Open 2 browser windows logged in as different users
- [ ] User A creates shape → User B sees it within 500ms
- [ ] User B moves shape → User A sees it update
- [ ] User A moves cursor → User B sees cursor with label
- [ ] Both users appear in each other's presence list
- [ ] User A closes tab → User B sees them go offline within 3 seconds
- [ ] Users can edit simultaneously without conflicts
- [ ] Concurrent shape creation (both create at once) → both shapes appear

### Edge Cases
- [ ] Network disconnect → graceful error, resume on reconnect
- [ ] Invalid login credentials → show error message
- [ ] Weak password → show error before Firebase call
- [ ] Empty canvas loads correctly (no errors)
- [ ] Click without drag creates minimum size shape (not 0x0)
- [ ] Drag up-left, up-right, down-left, down-right all work
- [ ] Drag 3px → 10x10 shape (minimum enforced)
- [ ] Tool change cancels shape preview
- [ ] Pan works only when select tool active
- [ ] Shape creation works only when rectangle tool active
- [ ] Selection works only when select tool active
- [ ] Cursor coords correct at any zoom/pan level
- [ ] Rapid tool switching (V, R, V, R) → no errors
- [ ] Rapid shape creation (10 shapes in 5 seconds) → all persist

### Deployment
- [ ] Build succeeds: `npm run build` (no TypeScript errors)
- [ ] Preview works: `npm run preview`
- [ ] Deploy succeeds: `firebase deploy --only hosting`
- [ ] Deployed app accessible at Firebase URL
- [ ] All features work in production build
- [ ] Multiple users can access and collaborate

### Code Quality
- [ ] All files under 500 lines
- [ ] All functions have JSDoc comments
- [ ] No console errors in production
- [ ] All imports use @ alias (no relative ../../../)
- [ ] All components in correct feature slices
- [ ] Barrel exports work (index.ts files)
- [ ] TypeScript strict mode passes
- [ ] No 'any' types used

---

## Phase 1 Success Criteria

Phase 1 is complete when:

1. ✅ **All checklist items above pass**
2. ✅ **Demo-ready:** You can show someone: "Sign up → Create shapes by dragging → See their cursor → Both edit simultaneously"
3. ✅ **Performance targets met:** 60 FPS, <100ms sync shapes, <50ms sync cursors
4. ✅ **No console errors**
5. ✅ **Deployed and publicly accessible**
6. ✅ **Code follows architecture:** Vertical slices, max 500 lines/file, proper imports

**When all complete, commit with:** `feat: Complete Phase 1 MVP with dynamic shape creation and real-time collaboration`

---

## Key Implementation Notes

### Dynamic Shape Creation Pattern
```typescript
// onMouseDown (rectangle tool active)
startPoint = canvasCoords(mouseEvent)
isCreating = true

// onMouseMove (while isCreating)
currentPoint = canvasCoords(mouseEvent)
width = Math.abs(currentPoint.x - startPoint.x)
height = Math.abs(currentPoint.y - startPoint.y)
x = Math.min(startPoint.x, currentPoint.x)
y = Math.min(startPoint.y, currentPoint.y)
previewShape = { x, y, width, height }

// onMouseUp
if (width < 10) width = 10
if (height < 10) height = 10
finalShape = { ...previewShape, width, height }
canvasStore.addObject(finalShape)
isCreating = false
previewShape = null
```

### Coordinate Transform
```typescript
function screenToCanvasCoords(stage, screenPoint) {
  const transform = stage.getAbsoluteTransform().copy().invert()
  return transform.point(screenPoint)
}
```

### Optimistic Updates
```typescript
// 1. Update local immediately
canvasStore.updateObject(id, updates)

// 2. Sync to Firebase (debounced 500ms)
debouncedUpdateCanvas('main', canvasStore.getState().objects)

// 3. Firebase broadcasts to others
// 4. Local ignores own update (Firestore listener checks timestamp)
```

---

## File Structure (Phase 1 Complete)

```
src/
├── features/
│   ├── auth/
│   │   ├── components/
│   │   │   ├── AuthModal.tsx
│   │   │   ├── LoginForm.tsx
│   │   │   ├── SignupForm.tsx
│   │   │   ├── ProtectedRoute.tsx
│   │   │   └── index.ts
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   └── index.ts
│   │   └── utils/
│   │       ├── authHelpers.ts
│   │       └── index.ts
│   ├── canvas-core/
│   │   ├── components/
│   │   │   ├── CanvasStage.tsx
│   │   │   └── index.ts
│   │   ├── shapes/
│   │   │   ├── Rectangle.tsx
│   │   │   └── index.ts
│   │   ├── hooks/
│   │   │   ├── useCanvas.ts
│   │   │   ├── useShapeCreation.ts
│   │   │   └── index.ts
│   │   └── utils/
│   │       ├── coordinates.ts
│   │       └── index.ts
│   ├── collaboration/
│   │   ├── components/
│   │   │   ├── Cursor.tsx
│   │   │   ├── PresenceList.tsx
│   │   │   └── index.ts
│   │   ├── hooks/
│   │   │   ├── useCursors.ts
│   │   │   ├── usePresence.ts
│   │   │   └── index.ts
│   │   └── utils/
│   │       ├── colorAssignment.ts
│   │       └── index.ts
│   └── toolbar/
│       ├── components/
│       │   ├── Toolbar.tsx
│       │   ├── ToolButton.tsx
│       │   └── index.ts
│       └── hooks/
│           ├── useActiveTool.ts
│           ├── useToolShortcuts.ts
│           └── index.ts
├── stores/
│   ├── canvasStore.ts
│   ├── toolStore.ts
│   └── index.ts
├── lib/
│   ├── firebase/
│   │   ├── config.ts
│   │   ├── auth.ts
│   │   ├── canvasService.ts
│   │   ├── cursorService.ts
│   │   ├── presenceService.ts
│   │   └── index.ts
│   └── utils/
│       ├── debounce.ts
│       ├── throttle.ts
│       └── index.ts
├── types/
│   ├── auth.types.ts
│   ├── canvas.types.ts
│   ├── tool.types.ts
│   └── index.ts
├── components/
│   └── common/
│       ├── Loading.tsx
│       ├── ErrorBoundary.tsx
│       └── index.ts
└── pages/
    ├── LandingPage.tsx
    └── CanvasPage.tsx
```

---

## How to Use This Checklist

1. **Work sequentially** - Don't skip ahead
2. **Test each task** - Verify before checking off
3. **Watch for edge cases** - Listed with each task
4. **Build incrementally** - Each task should work individually
5. **Commit frequently** - After each major section

## Progress Tracking

Track your progress:
- **Phase 0:** ___ / 50 tasks complete
- **Phase 1:** ___ / 100 tasks complete
- **Phase 2:** ___ / 60 tasks complete
- **Phase 3:** ___ / 60 tasks complete

**Total Project:** ___ / 270 tasks complete

---

## Verification Before Moving to Next Phase

**Before Phase 1:** All Phase 0 tasks checked ✓
**Before Phase 2:** All Phase 1 tasks checked ✓
**Before Phase 3:** All Phase 2 tasks checked ✓
**Project Complete:** All tasks checked ✓

---

*This master task list provides the granular, testable roadmap you need. Each checkbox represents a verified, working step toward completion.*