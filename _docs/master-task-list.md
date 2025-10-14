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
- [x] **Documentation:** Use context7 MCP to get latest Firebase Realtime Database documentation
  - Call `mcp__context7__resolve-library-id` with 'firebase'
  - Call `mcp__context7__get-library-docs` with topic 'realtime database'
  - Review current RTDB API: ref(), set(), onValue(), onDisconnect()
- [x] Document structure:
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
- [x] Create `src/lib/firebase/cursorService.ts`
  - `updateCursor(canvasId, userId, position: {x, y}, username, color): Promise<void>`
  - `subscribeToCursors(canvasId, callback): () => void`
    - Listen to entire `/cursors/` path
    - Return unsubscribe
  - **Success:** Service functions defined

### 1.8.3 Implement Throttled Cursor Updates
- [x] Create `src/lib/utils/throttle.ts`
  - `throttle(fn, delay)` helper

- [x] Update `cursorService.ts`
  - Wrap `updateCursor` with throttle (50ms)
  - Export as `throttledUpdateCursor`
  - **Success:** Cursor updates throttled

### 1.8.4 Create Cursor Component
- [x] Create `features/collaboration/components/Cursor.tsx`
  - Props: `x, y, username, color`
  - Render: SVG cursor icon (M0,0 L0,16 L4,12 L8,16 L12,12 L8,8 Z)
  - Username label: Small badge below cursor (Konva Label/Tag)
  - Color: Cursor fill + label background
  - **Success:** Cursor renders
  - **Test:** Render at 100,100 with name "Test User"

### 1.8.5 Implement Cursor Color Assignment
- [x] Create `features/collaboration/utils/colorAssignment.ts`
  - `getUserColor(userId: string): string`
    - Hash userId to index: `hashCode(userId) % COLORS.length`
    - COLORS: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#a855f7']
  - **Success:** Consistent colors per user
  - **Test:** Same userId → same color

### 1.8.6 Create useCursors Hook
- [x] Create `features/collaboration/hooks/useCursors.ts`
  - State: `cursors: Array<{userId, x, y, username, color}>`
  - Subscribe to Realtime DB on mount
  - Filter out own cursor (currentUser.uid)
  - Cleanup on unmount
  - **Success:** Hook provides cursor data
  - **Test:** Log cursors state

### 1.8.7 Update Own Cursor Position
- [x] Update `CanvasStage.tsx`
  - onMouseMove: Get canvas coords, call throttledUpdateCursor
  - Use auth.currentUser.uid, username, color
  - **Success:** Own cursor updates in Realtime DB
  - **Test:** Check Realtime DB, see cursor object

### 1.8.8 Render Other Users' Cursors
- [x] Update `CanvasStage.tsx`
  - Use useCursors hook
  - Add new Layer (cursors, `listening={false}`)
  - Map over cursors, render Cursor component
  - **Success:** Other cursors visible
  - **Test:** Open 2 windows, move mouse, see cursor in other window

### 1.8.9 Test Cursor Performance
- [x] Performance testing:
  - Rapid mouse movement → smooth cursor updates
  - 3 concurrent users → all cursors visible, <50ms latency
  - Check FPS (should stay 60)
  - **Success:** 60 FPS with 3 moving cursors
  - **Edge Case:** Cursor at different zoom levels (coords correct)
  - **Note:** Testing complete - cursors working smoothly

---

## 1.9 Presence System (1 hour)

### 1.9.1 Design Presence Structure
- [x] Document structure:
  ```
  /canvases/main/presence/{userId}/
    username: string
    online: boolean
    lastSeen: timestamp
  ```
  - **Note:** Structure implemented in presenceService.ts with onDisconnect() support

### 1.9.2 Create Presence Service
- [x] Create `src/lib/firebase/presenceService.ts`
  - `setOnline(canvasId, userId, username): Promise<void>`
    - Set online = true
    - Use `onDisconnect()` to set online = false automatically
  - `setOffline(canvasId, userId, username): Promise<void>` (manual offline)
  - `subscribeToPresence(canvasId, callback): () => void`
  - **Success:** Service functions defined with full onDisconnect() support
  - **Note:** Automatically handles browser crashes, network issues, tab closes

### 1.9.3 Set User Online on Canvas Mount
- [x] Update `CanvasPage.tsx`
  - useEffect: Call `setOnline('main', currentUser.uid, currentUser.email)`
  - **Success:** User marked online with automatic disconnect handling
  - **Test:** Check Realtime DB at /canvases/main/presence/{userId}/
  - **Note:** onDisconnect() configured - no explicit cleanup needed

### 1.9.4 Create PresenceList Component
- [x] Already exists as `ActiveUsers.tsx` - refactored to use presence
  - Uses proper presence system with usePresence hook
  - Renders top-right panel showing online users
  - Current user shown first with "(You)" label
  - Shows user color indicator and email/username
  - **Success:** Component uses Firebase Presence system
  - **Note:** Replaced cursor-based presence inference with proper presence tracking

### 1.9.5 Create usePresence Hook
- [x] Create `features/collaboration/hooks/usePresence.ts`
  - Subscribe to Realtime DB presence data
  - Filter to only online users
  - Add color from getUserColor utility
  - **Success:** Hook provides reliable online user list
  - **Test:** Hook exports PresenceWithColor interface

### 1.9.6 Add PresenceList to CanvasPage
- [x] Update `CanvasPage.tsx`
  - ActiveUsers component already rendered (uses usePresence internally)
  - **Success:** Presence list visible and functional
  - **Note:** Component automatically updates when users join/leave

### 1.9.7 Test Presence System
- [x] Open 3 browser windows:
  - All 3 show each other in presence list
  - Close one window → disappears from others within 3 seconds
  - Refresh one window → presence persists
  - **Success:** Presence tracking works
  - **Edge Case:** Browser crash → onDisconnect fires
  - **Note:** Manual testing required - presence system implemented and ready

---

## 1.10 UI Polish & Performance (1-2 hours)

### 1.10.1 Add Loading States
- [x] Create `components/common/Loading.tsx`
  - Spinner component
  - Use in ProtectedRoute, CanvasPage (initial load)
  - **Success:** Loading states visible

### 1.10.2 Add Error Boundaries
- [x] Create `components/common/ErrorBoundary.tsx`
  - Catch React errors
  - Show friendly error message
  - **Success:** Errors don't crash app

### 1.10.3 Optimize Re-Renders
- [x] Update `Rectangle.tsx`
  - Wrap with React.memo
  - **Success:** Re-renders only when props change

- [x] Update `Cursor.tsx`
  - Wrap with React.memo
  - **Success:** Cursor re-renders minimized

### 1.10.4 Performance Audit
- [ ] Chrome DevTools Performance tab:
  - Record while creating 10 shapes
  - Check FPS (target: 60)
  - Check sync latency (target: <100ms shapes, <50ms cursors)
  - **Success:** Meets performance targets
  - **Edge Case:** Test with 100 shapes (should still be 60 FPS)
  - **Note:** Manual testing required - optimizations in place (React.memo, throttle, debounce)

### 1.10.5 Add Toast Notifications
- [x] **Documentation:** Use context7 MCP to get latest shadcn/ui toast documentation
  - Call `mcp__context7__get-library-docs` with topic 'toast'
  - Review toast component API and usage patterns
- [x] Install shadcn toast: `npx shadcn@latest add sonner`
- [x] Add Toaster component to App.tsx
  - **Success:** Toast system ready (use `toast()` from 'sonner' anywhere in app)
  - **Note:** Specific toast triggers can be added as needed (e.g., sync errors)

### 1.10.6 Style Pass
- [x] Verify all colors match theme-rules.md:
  - Primary: #0ea5e9 (selected, buttons) ✓
  - Neutral: #f5f5f5 (canvas bg), #e5e5e5 (borders) ✓
  - Error: #ef4444 ✓
  - **Success:** Consistent styling verified
  - **Note:** All components use correct theme colors

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

# Phase 2: Enhanced Canvas (6-8 hours)

**Goal:** Add multiple shape types, essential operations, polish, and mobile support.

**Key Features:** Circle and text shapes, delete/duplicate operations, keyboard shortcuts, animations, mobile touch support.

---

## 2.1 Circle Shape Implementation (Konva Circle Component)

### 2.1.1 Get Latest Konva and React-Konva Documentation
- [ ] **Documentation:** Use context7 MCP to get latest Konva Circle documentation
  - Call `mcp__context7__resolve-library-id` with 'konva'
  - Call `mcp__context7__get-library-docs` with topic 'Circle shape API, radius property, fill property, stroke properties, performance optimization'
  - Review React-Konva Circle component props and usage patterns
  - Check for any breaking changes from Phase 1 Konva version
  - **Success:** Have current Konva Circle documentation with code examples
  - **Test:** Documentation retrieved and reviewed, examples understood
  - **Edge Case:** If context7 unavailable, use official Konva docs at konvajs.org

### 2.1.2 Update Canvas Types for Circle
- [ ] Update `src/types/canvas.types.ts`
  - Add `Circle` interface extending `BaseCanvasObject`
  - Properties: `type: 'circle'`, `radius: number`, `fill: string`
  - Update `CanvasObject` union type to include `Circle`
  - Add JSDoc comments for all new types
  - **Success:** Circle type defined with full TypeScript support
  - **Test:** Import Circle type in another file, no TS errors
  - **Edge Case:** Ensure discriminated union works with type property

### 2.1.3 Create Circle Component with Code Quality Standards
- [ ] Create `features/canvas-core/shapes/Circle.tsx`
  - **File header with JSDoc documentation:** Explain component purpose, usage, and props
  - Import Circle from 'react-konva' (not Konva)
  - Import React and React.memo for performance optimization
  - **Props interface:** Define CircleProps with full JSDoc comments
    - `circle: Circle` (from canvas.types.ts)
    - `isSelected: boolean`
    - `onSelect: () => void`
    - `onDragEnd: (x: number, y: number) => void`
  - **Component implementation:**
    - Wrap component in React.memo from the start for performance
    - Render Konva Circle with x, y, radius, fill
    - Add selection border when isSelected (stroke: #0ea5e9, strokeWidth: 3)
    - Make draggable only when selected and select tool active
  - **Code Quality Checks:**
    - File under 500 lines (should be ~100 lines)
    - All exports documented with JSDoc
    - Named export: `export const Circle = React.memo(...)`
    - Imports organized: react-konva → @/types → props interface
    - No console.log statements
    - TypeScript strict mode passes
  - **Update barrel export:** Add Circle to `features/canvas-core/shapes/index.ts`
  - **Success:** Circle component renders correctly, passes code quality checks
  - **Test:** Render circle at 200, 200 with radius 50, see blue circle
  - **Edge Case:** Circle renders at center point (not top-left like Rectangle)

### 2.1.4 Add Circle Selection Logic
- [ ] Update `Circle.tsx` with selection handling
  - onClick: Check if activeTool === 'select', then call onSelect
  - Only allow clicks when select tool active (check toolStore)
  - Add hover cursor: 'pointer' when hovering (if select tool active)
  - **Success:** Circles are selectable with select tool
  - **Test:** Click circle with select tool → selects, with rectangle tool → ignored
  - **Edge Case:** Selection should not trigger during drag

### 2.1.5 Add Circle Drag Handling
- [ ] Update `Circle.tsx` with drag functionality
  - Add draggable prop: only true when isSelected && activeTool === 'select'
  - onDragEnd: Get new position (e.target.x(), e.target.y())
  - Call onDragEnd callback with new coordinates
  - Update cursor to 'move' during drag
  - **Success:** Selected circles can be dragged
  - **Test:** Select circle → drag → position updates in store
  - **Edge Case:** Unselected circles should not be draggable

### 2.1.6 Render Circles in CanvasStage
- [ ] Update `features/canvas-core/components/CanvasStage.tsx`
  - Get circles from canvasStore: `objects.filter(obj => obj.type === 'circle')`
  - Map over circles and render Circle component
  - Pass isSelected, onSelect, onDragEnd handlers
  - Add key prop: `key={circle.id}`
  - **Success:** Circles render alongside rectangles
  - **Test:** Manually add circle to store → see it on canvas
  - **Edge Case:** Circles and rectangles should coexist without conflicts

### 2.1.7 Update Barrel Exports
- [ ] Update `features/canvas-core/shapes/index.ts`
  - Export Circle component: `export { Circle } from './Circle'`
  - **Success:** Can import Circle from '@/features/canvas-core/shapes'
  - **Test:** Import in CanvasStage works without relative paths
  - **Edge Case:** Ensure Rectangle export still works

### 2.1.8 Test Circle Rendering and Interaction
- [ ] Manual testing checklist:
  - Create circle programmatically (add to store) → renders correctly
  - Circle has correct radius (not diameter)
  - Click circle with select tool → selects (blue border appears)
  - Click circle with rectangle tool → does not select
  - Drag selected circle → position updates
  - Drag unselected circle → does not move
  - Click background → circle deselects
  - Multiple circles can be created and selected independently
  - **Success:** All circle behaviors work correctly
  - **Test:** Performance check - 10 circles maintain 60 FPS
  - **Edge Case:** Circle center point vs rectangle top-left corner positioning

### 2.1.9 Performance Verification - Circle Shapes
- [ ] **FPS Checkpoint:** Verify 60 FPS with circles
  - Chrome DevTools Performance tab
  - Record while creating 20 circles
  - Pan canvas with 20 circles → verify 60 FPS
  - Zoom in/out with 20 circles → verify 60 FPS
  - Select and drag circles → verify 60 FPS
  - Mix: 10 rectangles + 10 circles → verify 60 FPS
  - **Success:** Maintain stable 60 FPS in all scenarios
  - **Test:** Performance profiler shows consistent frame times
  - **Edge Case:** Circles should not be slower than rectangles

---

## 2.2 Circle Creation Tool (Add to Toolbar)

### 2.2.1 Update Tool Types
- [ ] Update `src/types/tool.types.ts`
  - Update `ToolType` union: add `'circle'`
  - Update tools constant array to include circle tool
  - Icon: `Circle` from lucide-react
  - Shortcut: 'C'
  - **Success:** Circle tool type defined
  - **Test:** No TypeScript errors, can reference 'circle' tool
  - **Edge Case:** Ensure tool type consistency across stores

### 2.2.2 Add Circle Button to Toolbar
- [ ] **Documentation:** Get latest lucide-react icon documentation
  - Call `mcp__context7__resolve-library-id` with 'lucide-react'
  - Call `mcp__context7__get-library-docs` with topic 'Circle icon, icon sizing, icon props, accessibility'
  - Review icon usage patterns and best practices
  - **Success:** Have current lucide-react documentation
  - **Test:** Documentation retrieved with icon examples
- [ ] Update `features/toolbar/components/Toolbar.tsx`
  - Import Circle icon from lucide-react
  - Add circle button to shape tools section (after rectangle, before text)
  - Connect to toolStore.setActiveTool('circle')
  - Show active state when tool === 'circle' (blue background)
  - Add tooltip: "Circle (C)" with keyboard shortcut
  - **Accessibility:** aria-label="Create circle tool"
  - **Touch target:** Minimum 44x44px on mobile (h-11 w-11 sm:h-10 sm:w-10)
  - **Success:** Circle button appears in toolbar
  - **Test:** Click button → activeTool becomes 'circle'
  - **Edge Case:** Button should deactivate when switching to other tools

### 2.2.3 Implement Circle Creation Hook Logic
- [ ] Update `features/canvas-core/hooks/useShapeCreation.ts`
  - Add circle creation mode: when activeTool === 'circle'
  - onMouseDown: Store start point
  - onMouseMove: Calculate radius from start point to current point
    - `radius = Math.sqrt((dx*dx) + (dy*dy))` (distance formula)
  - Show preview circle during drag (dashed stroke)
  - Minimum radius: 10px
  - **Success:** Hook handles circle creation
  - **Test:** Log radius values during drag
  - **Edge Case:** Radius calculation should always be positive

### 2.2.4 Render Circle Preview
- [ ] Update `CanvasStage.tsx` to render circle preview
  - When previewShape exists and type === 'circle', render preview Circle
  - Style: dashed stroke, transparent fill, blue outline
  - Use same Circle component with preview flag
  - **Success:** Blue dashed circle shows while dragging
  - **Test:** Drag with circle tool → see preview → release → preview disappears
  - **Edge Case:** Preview should not interfere with existing circles

### 2.2.5 Finalize Circle Creation
- [ ] Update `useShapeCreation.ts` onMouseUp for circles
  - Calculate final radius (enforce minimum 10px)
  - Create new Circle object:
    ```typescript
    {
      id: crypto.randomUUID(),
      type: 'circle',
      x: startPoint.x,
      y: startPoint.y,
      radius: Math.max(10, calculatedRadius),
      fill: '#ef4444', // Default red
      createdBy: currentUser.uid,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    ```
  - Add to canvasStore
  - Clear preview state
  - **Success:** Circles are created on mouse up
  - **Test:** Click-drag → release → circle appears
  - **Edge Case:** Click without drag → 10px minimum circle created

### 2.2.6 Firebase Sync for Circles
- [ ] **Firebase MCP:** Use Firebase MCP to verify Firestore update methods
  - Call `mcp__firebase__firebase_read_resources` to check current canvas structure
  - Verify circles sync to `/canvases/main/objects` array
  - Update `lib/firebase/canvasService.ts` if needed (should work with union types)
  - **Success:** Circles sync to Firestore within 500ms
  - **Test:** Create circle → check Firestore console → circle object exists
  - **Edge Case:** Ensure circle type is preserved in serialization

### 2.2.7 Multi-User Circle Sync Test
- [ ] Open 2 browser windows:
  - Window A: Create circle with circle tool
  - Window B: See circle appear within 500ms
  - Window B: Select and drag circle
  - Window A: See circle move
  - Both: Create multiple circles rapidly (5 circles in 5 seconds)
  - **Success:** All circle operations sync across users
  - **Test:** No sync errors in console
  - **Edge Case:** Concurrent circle creation should not cause conflicts
  - **Note:** Manual testing required

### 2.2.8 Add Circle Tool Keyboard Shortcut
- [ ] Update `features/toolbar/hooks/useToolShortcuts.ts`
  - Add 'C' key handler: `setActiveTool('circle')`
  - Add to keyboard shortcuts list
  - Test that C key activates circle tool
  - **Success:** Pressing C activates circle tool
  - **Test:** Press C → tool switches → press R → switches to rectangle → press C → back to circle
  - **Edge Case:** Don't trigger when typing in input field

---

## 2.3 Text Shape Implementation (Konva Text Component)

### 2.3.1 Get Latest Konva Text Documentation
- [ ] **Documentation:** Use context7 MCP to get latest Konva Text documentation
  - Call `mcp__context7__resolve-library-id` with 'konva'
  - Call `mcp__context7__get-library-docs` with topic 'Text component API, fontSize, fontFamily, text property, width calculation, text wrapping, text alignment, performance'
  - Review React-Konva Text component props and usage
  - Understand text width/height auto-calculation vs fixed width
  - Check text rendering performance considerations
  - **Success:** Have current Konva Text documentation with code examples
  - **Test:** Documentation retrieved and reviewed, text rendering understood
  - **Edge Case:** Note difference between auto-width text vs text box with wrapping

### 2.3.2 Update Canvas Types for Text
- [ ] Update `src/types/canvas.types.ts`
  - Add `TextShape` interface extending `BaseCanvasObject`
  - Properties: `type: 'text'`, `text: string`, `fontSize: number`, `fontFamily: string`, `fill: string`, `width?: number`
  - Update `CanvasObject` union type to include `TextShape`
  - Add JSDoc comments
  - **Success:** Text type fully defined
  - **Test:** Import TextShape type, no TS errors
  - **Edge Case:** Text needs both content and styling properties

### 2.3.3 Create TextShape Component with Code Quality Standards
- [ ] Create `features/canvas-core/shapes/TextShape.tsx`
  - **File header with JSDoc documentation:** Explain text rendering component purpose
  - Import Text from 'react-konva'
  - Import React and React.memo for performance
  - **Props interface:** Define TextShapeProps with full JSDoc
    - `text: TextShape` (from canvas.types.ts)
    - `isSelected: boolean`
    - `onSelect: () => void`
    - `onDragEnd: (x: number, y: number) => void`
  - **Component implementation:**
    - Wrap in React.memo from the start
    - Render Konva Text with x, y, text, fontSize, fontFamily, fill
    - Default text: "Double-click to edit" (editing in Phase 3)
    - Default fontSize: 24px
    - Default fontFamily: 'Inter' (matches theme-rules.md)
    - Add selection border when isSelected (stroke: #0ea5e9, strokeWidth: 3)
  - **Code Quality Checks:**
    - File under 500 lines (should be ~120 lines)
    - All exports documented with JSDoc
    - Named export: `export const TextShape = React.memo(...)`
    - Imports organized: react-konva → @/types → props
    - No console.log statements
    - TypeScript strict mode passes
  - **Update barrel export:** Add TextShape to `features/canvas-core/shapes/index.ts`
  - **Success:** Text component renders, passes code quality
  - **Test:** Render text at 100, 100 with "Hello World"
  - **Edge Case:** Text positioning is at top-left corner, long text may overflow

### 2.3.4 Add Text Selection and Dragging
- [ ] Update `TextShape.tsx` with interactions
  - onClick: Check activeTool === 'select', call onSelect
  - draggable: only when isSelected && activeTool === 'select'
  - onDragEnd: Get new position, call onDragEnd callback
  - Cursor: 'pointer' on hover, 'move' when dragging
  - **Success:** Text can be selected and dragged
  - **Test:** Select text → drag → position updates
  - **Edge Case:** Long text should not break layout

### 2.3.5 Render Text Shapes in CanvasStage
- [ ] Update `CanvasStage.tsx` to render text shapes
  - Filter objects where type === 'text'
  - Map and render TextShape component
  - Pass all necessary props (isSelected, handlers, etc.)
  - **Success:** Text shapes render alongside other shapes
  - **Test:** Add text object to store → renders on canvas
  - **Edge Case:** Text, circles, and rectangles coexist without conflicts

### 2.3.6 Update Barrel Exports for Text
- [ ] Update `features/canvas-core/shapes/index.ts`
  - Export TextShape: `export { TextShape } from './TextShape'`
  - **Success:** Can import from '@/features/canvas-core/shapes'
  - **Test:** Import works in CanvasStage
  - **Edge Case:** All shape exports (Rectangle, Circle, TextShape) work

### 2.3.7 Test Text Rendering
- [ ] Manual testing:
  - Add text object to store programmatically → renders
  - Text displays correct content
  - Text has correct fontSize (not too small/large)
  - Text can be selected with select tool
  - Text can be dragged when selected
  - Multiple text objects work independently
  - **Success:** All text behaviors work
  - **Test:** 10 text objects maintain 60 FPS
  - **Edge Case:** Very long text strings (100+ characters)

---

## 2.4 Text Creation Tool (Add to Toolbar)

### 2.4.1 Update Tool Types for Text
- [ ] Update `src/types/tool.types.ts`
  - Add 'text' to ToolType union
  - Add text tool to tools array
  - Icon: `Type` from lucide-react
  - Shortcut: 'T'
  - **Success:** Text tool type defined
  - **Test:** No TypeScript errors
  - **Edge Case:** Tool type consistency

### 2.4.2 Add Text Button to Toolbar with Accessibility
- [ ] **Documentation:** Get latest lucide-react documentation
  - Call `mcp__context7__resolve-library-id` with 'lucide-react'
  - Call `mcp__context7__get-library-docs` with topic 'Type icon, text tool icon, icon accessibility'
  - Review Type icon API and sizing options
  - **Success:** Have current Type icon documentation
  - **Test:** Documentation retrieved with examples
  - **Edge Case:** If context7 unavailable, use lucide.dev official docs
- [ ] Update `Toolbar.tsx` with accessible text button
  - Import Type icon from lucide-react
  - Add text button after circle button
  - Connect to setActiveTool('text')
  - **Accessibility Requirements:**
    - aria-label="Text tool"
    - aria-pressed={activeTool === 'text'}
    - Keyboard focus indicator (focus-visible:ring-2)
    - Screen reader announces "Text tool, button, pressed/not pressed"
  - **Button Styling:**
    - Active state: bg-sky-100, border-sky-500 (when activeTool === 'text')
    - Hover state: bg-neutral-100 (when not active)
    - Touch targets: h-11 w-11 sm:h-10 sm:w-10 (44x44px mobile minimum)
  - **Tooltip:**
    - Wrap in Tooltip component (from 2.5.2)
    - TooltipContent: "Text (T)" with keyboard shortcut visible
    - Delay: 500ms
  - **Success:** Text button in toolbar, fully accessible
  - **Test:** Click button → activeTool === 'text', screen reader announces correctly
  - **Edge Case:** Button state syncs immediately with tool store

### 2.4.3 Implement Text Creation on Click
- [ ] Update `useShapeCreation.ts` for text tool
  - When activeTool === 'text' and user clicks:
    - Create text object at click position
    - Default text: "Double-click to edit"
    - Default fontSize: 24
    - Default fontFamily: 'Inter'
    - Default fill: '#171717' (neutral-900)
    - Add to store immediately (no drag preview for text)
  - **Success:** Text created on click
  - **Test:** Activate text tool → click canvas → text appears
  - **Edge Case:** Text positioning should account for canvas transform

### 2.4.4 Set Default Text Properties
- [ ] Create `features/canvas-core/utils/shapeDefaults.ts`
  - Export DEFAULT_TEXT constant:
    ```typescript
    export const DEFAULT_TEXT = {
      text: 'Double-click to edit',
      fontSize: 24,
      fontFamily: 'Inter',
      fill: '#171717',
    };
    ```
  - Export DEFAULT_CIRCLE_RADIUS, DEFAULT_RECTANGLE_SIZE if needed
  - **Success:** Centralized default values
  - **Test:** Import and use in shape creation
  - **Edge Case:** Defaults should be easily configurable

### 2.4.5 Firebase Sync for Text Shapes
- [ ] **Firebase MCP:** Verify text shapes sync correctly
  - Test text creation syncs to Firestore
  - Check text properties serialize correctly (no function refs)
  - Verify multi-line text works if text contains \n
  - **Success:** Text shapes sync within 500ms
  - **Test:** Create text → check Firestore → text object present
  - **Edge Case:** Special characters in text (quotes, newlines, emojis)

### 2.4.6 Multi-User Text Sync Test
- [ ] Open 2 browser windows:
  - Window A: Create text with text tool
  - Window B: See text appear
  - Window B: Drag text to new position
  - Window A: See text move
  - Both: Create multiple text objects rapidly
  - **Success:** All text operations sync
  - **Test:** No console errors
  - **Edge Case:** Long text strings sync correctly
  - **Note:** Manual testing required

### 2.4.7 Add Text Tool Keyboard Shortcut
- [ ] Update `useToolShortcuts.ts`
  - Add 'T' key handler: setActiveTool('text')
  - **Success:** T key activates text tool
  - **Test:** Press T → tool switches to text
  - **Edge Case:** Don't trigger when typing in input

### 2.4.8 Test All Three Shape Types Together
- [ ] Comprehensive shape testing:
  - Create rectangle (R key) → works
  - Create circle (C key) → works
  - Create text (T key) → works
  - Select tool (V key) → can select all types
  - Drag each shape type → all work
  - Create 5 of each type (15 total) → no performance issues
  - Switch between tools rapidly → no errors
  - **Success:** All 3 shape types work harmoniously
  - **Test:** 60 FPS with 50+ mixed shapes
  - **Edge Case:** Shape type detection in selection/drag handlers

---

## 2.5 Delete Operation Implementation

### 2.5.1 Add Delete Action to Canvas Store
- [ ] Update `src/stores/canvasStore.ts`
  - Add `removeObject(id: string)` action
  - Implementation: Filter out object with matching id
  - Clear selection if deleted object was selected
  - Add JSDoc documentation
  - **Success:** removeObject action exists
  - **Test:** Call removeObject in console → object disappears
  - **Edge Case:** Deleting selected object should clear selection

### 2.5.2 Create Delete Button with Full Accessibility
- [ ] **Documentation:** Get latest lucide-react documentation
  - Call `mcp__context7__resolve-library-id` with 'lucide-react'
  - Call `mcp__context7__get-library-docs` with topic 'Trash2 icon, icon accessibility, icon sizing'
  - **Success:** Have current Trash2 icon documentation
- [ ] **Documentation:** Get latest shadcn/ui Tooltip documentation
  - Call `mcp__context7__resolve-library-id` with 'shadcn'
  - Call `mcp__context7__get-library-docs` with topic 'tooltip component, TooltipProvider, accessibility'
  - **Success:** Have current Tooltip documentation
- [ ] Update `Toolbar.tsx` with accessible delete button
  - Import Trash2 icon from lucide-react
  - Import Tooltip components from @/components/ui/tooltip
  - Add delete button in operations section (after shape tools)
  - **Accessibility Requirements:**
    - aria-label="Delete selected object"
    - aria-disabled when no object selected
    - Keyboard focus indicator visible (focus-visible:ring-2)
    - Screen reader announces state changes
  - **Button State:**
    - Disabled when selectedId === null
    - Style disabled state: opacity-50, cursor-not-allowed
    - Active/hover states only when enabled
  - **Touch Targets (Mobile):**
    - Minimum 44x44px touch target: h-11 w-11 sm:h-10 sm:w-10
    - Adequate spacing from adjacent buttons (gap-2)
  - **Tooltip:**
    - Wrap button in Tooltip component
    - TooltipContent: "Delete (Del)" with keyboard shortcut visible
    - Delay: 500ms (standard)
    - Position: bottom (default)
  - **Success:** Delete button is fully accessible and polished
  - **Test:** Screen reader announces "Delete selected object, button, disabled/enabled"
  - **Edge Case:** Button state updates immediately on selection change, tooltip doesn't block interactions

### 2.5.3 Implement Delete Button Handler
- [ ] Update `Toolbar.tsx` with delete logic
  - Create handleDelete function:
    ```typescript
    const handleDelete = () => {
      if (selectedId) {
        removeObject(selectedId);
        selectObject(null);
      }
    };
    ```
  - Connect to delete button onClick
  - **Success:** Clicking delete button removes selected object
  - **Test:** Select object → click delete → object disappears
  - **Edge Case:** Multiple rapid deletes should work

### 2.5.4 Implement Delete Keyboard Shortcut
- [ ] Update `features/toolbar/hooks/useToolShortcuts.ts`
  - Add handler for Delete key and Backspace key
  - Check if selectedId exists before deleting
  - Don't trigger if user is typing in an input field
  - Prevent default browser behavior for Delete key
  - **Success:** Delete and Backspace keys delete selected object
  - **Test:** Select object → press Delete → object removed
  - **Edge Case:** Don't delete when input is focused

### 2.5.5 Firebase Sync for Deletion
- [ ] **Firebase MCP:** Verify deletion syncs to Firestore
  - Call `mcp__firebase__firestore_delete_document` if needed (likely just update array)
  - Test deletion propagates to all users
  - Update `lib/firebase/canvasService.ts` to handle deletions
  - Use debounced update (500ms)
  - **Success:** Deletions sync within 500ms
  - **Test:** User A deletes object → User B sees it disappear
  - **Edge Case:** Concurrent deletion attempts (both users delete same object)

### 2.5.6 Test Delete Operation Thoroughly
- [ ] Manual testing checklist:
  - Select rectangle → click delete button → deleted
  - Select circle → press Delete key → deleted
  - Select text → press Backspace → deleted
  - Delete button disabled when nothing selected
  - Delete while object is being dragged → should not crash
  - Multi-user: User A deletes → User B sees deletion
  - Delete rapidly (10 objects in 10 seconds) → all sync
  - **Success:** All delete scenarios work correctly
  - **Test:** No console errors during deletion
  - **Edge Case:** Delete during drag, delete during tool switch

---

## 2.6 Duplicate Operation Implementation

### 2.6.1 Add Duplicate Logic to Store
- [ ] Add helper function in `canvasStore.ts` or create `features/canvas-core/utils/objectHelpers.ts`
  - Create `duplicateObject` function:
    ```typescript
    export function duplicateObject(original: CanvasObject): CanvasObject {
      return {
        ...original,
        id: crypto.randomUUID(),
        x: original.x + 20,
        y: original.y + 20,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    }
    ```
  - Handle all shape types (Rectangle, Circle, TextShape)
  - **Success:** Duplicate function creates copy with offset
  - **Test:** Call function → new object with new ID, offset position
  - **Edge Case:** Preserve all shape-specific properties (radius, width, text, etc.)

### 2.6.2 Create Duplicate Button with Full Accessibility
- [ ] **Documentation:** Get latest lucide-react documentation
  - Call `mcp__context7__resolve-library-id` with 'lucide-react'
  - Call `mcp__context7__get-library-docs` with topic 'Copy icon, icon accessibility, icon sizing'
  - **Success:** Have current Copy icon documentation
- [ ] **Documentation:** Get latest shadcn/ui Tooltip documentation (if not already fetched in 2.5.2)
  - Use cached documentation if available from 2.5.2
  - Otherwise call context7 MCP for Tooltip docs
  - **Success:** Have current Tooltip documentation
- [ ] Update `Toolbar.tsx` with accessible duplicate button
  - Import Copy icon from lucide-react
  - Import Tooltip components from @/components/ui/tooltip
  - Add duplicate button in operations section (before delete)
  - **Accessibility Requirements:**
    - aria-label="Duplicate selected object"
    - aria-disabled when no object selected
    - Keyboard focus indicator visible (focus-visible:ring-2)
    - Screen reader announces "Duplicate selected object"
  - **Button State:**
    - Disabled when selectedId === null
    - Style disabled state: opacity-50, cursor-not-allowed
    - Active/hover states only when enabled
  - **Touch Targets (Mobile):**
    - Minimum 44x44px touch target: h-11 w-11 sm:h-10 sm:w-10
    - Adequate spacing from adjacent buttons
  - **Tooltip:**
    - Wrap in Tooltip component
    - TooltipContent: "Duplicate (Cmd+D)" with platform-specific shortcut
    - Show "Ctrl+D" on Windows/Linux, "Cmd+D" on Mac
    - Delay: 500ms
  - **Success:** Duplicate button fully accessible
  - **Test:** Screen reader announces correctly, tooltip shows platform-correct shortcut
  - **Edge Case:** Button should work for all shape types (rectangle, circle, text)

### 2.6.3 Implement Duplicate Button Handler
- [ ] Update `Toolbar.tsx` with duplicate logic
  - Create handleDuplicate function:
    ```typescript
    const handleDuplicate = () => {
      const selectedObject = objects.find(obj => obj.id === selectedId);
      if (!selectedObject) return;

      const duplicate = duplicateObject(selectedObject);
      addObject(duplicate);
      selectObject(duplicate.id);
    };
    ```
  - Connect to duplicate button onClick
  - **Success:** Clicking duplicate creates copy
  - **Test:** Select object → click duplicate → copy appears offset
  - **Edge Case:** Duplicate should auto-select new object

### 2.6.4 Implement Duplicate Keyboard Shortcut
- [ ] Update `useToolShortcuts.ts`
  - Add handler for Cmd+D (Mac) and Ctrl+D (Windows/Linux)
  - Check for metaKey (Mac) or ctrlKey (Windows/Linux)
  - Prevent default browser "Add Bookmark" behavior
  - Check selectedId exists before duplicating
  - Don't trigger if typing in input
  - **Success:** Cmd/Ctrl+D duplicates selected object
  - **Test:** Select object → press Cmd+D → copy appears
  - **Edge Case:** Prevent browser's add bookmark dialog

### 2.6.5 Firebase Sync for Duplication
- [ ] **Firebase MCP:** Verify duplicates sync correctly
  - Test duplicate objects sync to Firestore
  - Ensure all properties preserved (shape-specific data)
  - Use debounced update (500ms)
  - **Success:** Duplicates sync within 500ms
  - **Test:** User A duplicates → User B sees duplicate appear
  - **Edge Case:** Rapid duplication (5 duplicates in 3 seconds)

### 2.6.6 Test Duplicate Operation Thoroughly
- [ ] Manual testing checklist:
  - Duplicate rectangle → copy offset by 20,20
  - Duplicate circle → radius preserved
  - Duplicate text → text content preserved
  - Duplicate button disabled when nothing selected
  - Cmd+D on Mac, Ctrl+D on Windows/Linux both work
  - Duplicate selects the new copy automatically
  - Multi-user: User A duplicates → User B sees duplicate
  - Duplicate 10 times rapidly → all sync correctly
  - **Success:** All duplicate scenarios work
  - **Test:** All shape properties preserved in duplicate
  - **Edge Case:** Duplicate at canvas edge (stays within bounds)

---

## 2.7 Keyboard Shortcuts System

### 2.7.1 Consolidate Keyboard Shortcuts Hook
- [ ] Review `features/toolbar/hooks/useToolShortcuts.ts`
  - Ensure all shortcuts centralized in one hook
  - Current shortcuts: V, R, C, T, Delete, Backspace, Cmd/Ctrl+D, Escape
  - Add isInputFocused check helper
  - Prevent shortcuts when user is typing in input/textarea
  - **Success:** All shortcuts in one place
  - **Test:** All shortcuts work, none trigger during text input
  - **Edge Case:** Shortcuts should not fire in contentEditable elements

### 2.7.2 Add Escape Key to Deselect
- [ ] Update `useToolShortcuts.ts`
  - Add Escape key handler
  - When pressed: `selectObject(null)`
  - Works from any tool mode
  - **Success:** Escape key deselects current object
  - **Test:** Select object → press Escape → deselected
  - **Edge Case:** Escape while dragging should cancel drag (Konva handles this)

### 2.7.3 Prevent Shortcuts During Input
- [ ] Update `useToolShortcuts.ts` with input detection
  - Create helper:
    ```typescript
    function isInputFocused(): boolean {
      const active = document.activeElement;
      return active instanceof HTMLInputElement ||
             active instanceof HTMLTextAreaElement ||
             active?.getAttribute('contenteditable') === 'true';
    }
    ```
  - Check before triggering any shortcut
  - **Success:** Shortcuts don't fire when typing in inputs
  - **Test:** Focus input → press R → text "r" appears, rectangle tool not activated
  - **Edge Case:** Modal inputs should also prevent shortcuts

### 2.7.4 Create Keyboard Shortcuts Reference
- [ ] Create `src/constants/keyboardShortcuts.ts`
  - Export KEYBOARD_SHORTCUTS array:
    ```typescript
    export const KEYBOARD_SHORTCUTS = [
      { key: 'V', action: 'Select tool', category: 'Tools' },
      { key: 'R', action: 'Rectangle tool', category: 'Tools' },
      { key: 'C', action: 'Circle tool', category: 'Tools' },
      { key: 'T', action: 'Text tool', category: 'Tools' },
      { key: 'Del/Backspace', action: 'Delete selected', category: 'Edit' },
      { key: 'Cmd/Ctrl+D', action: 'Duplicate selected', category: 'Edit' },
      { key: 'Esc', action: 'Deselect', category: 'Edit' },
      { key: 'Space+Drag', action: 'Pan canvas', category: 'Canvas' },
      { key: 'Scroll', action: 'Zoom in/out', category: 'Canvas' },
    ];
    ```
  - **Success:** Centralized shortcuts reference
  - **Test:** Import in components
  - **Edge Case:** Keep this updated as new shortcuts added

### 2.7.5 Create Shortcuts Help Modal
- [ ] **Documentation:** Get latest shadcn/ui Dialog documentation
  - Call `mcp__context7__resolve-library-id` with 'shadcn'
  - Call `mcp__context7__get-library-docs` with topic 'dialog component, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, accessibility, keyboard navigation'
  - Review Dialog API and accessibility features
  - Check keyboard interactions (Escape to close, focus trap)
  - **Success:** Have current Dialog component documentation
  - **Test:** Documentation retrieved with Dialog examples
  - **Edge Case:** If context7 unavailable, use ui.shadcn.com/docs/components/dialog
- [ ] Create `components/common/ShortcutsModal.tsx` with full accessibility
  - **File header with JSDoc:** Explain modal purpose and props
  - Use shadcn Dialog component
  - Props: `isOpen: boolean`, `onClose: () => void`
  - **Accessibility Requirements:**
    - Dialog automatically traps focus when open
    - DialogTitle for screen readers (required)
    - DialogDescription for context
    - Close button with aria-label="Close shortcuts help"
    - Escape key closes modal (handled by Dialog)
  - **Content:**
    - Import KEYBOARD_SHORTCUTS from constants
    - Display shortcuts in categorized groups (Tools, Edit, Canvas)
    - Styled keyboard key badges: rounded, bg-neutral-100, px-2 py-1, font-mono
    - Two-column layout: key badge on left, action description on right
  - **Styling:**
    - DialogContent max width: sm:max-w-md
    - Organized sections with headings
    - Clean spacing with gap-4
  - **Code Quality:**
    - File under 200 lines
    - Named export: `export const ShortcutsModal`
    - Add to `components/common/index.ts` barrel export
  - **Success:** Modal displays all shortcuts with full accessibility
  - **Test:** Open modal → keyboard focus trapped, Escape closes, screen reader announces title
  - **Edge Case:** Modal should close on backdrop click or Escape press

### 2.7.6 Add Shortcuts Help Button to Toolbar
- [ ] **Documentation:** Get latest lucide-react HelpCircle icon documentation (if not already fetched)
  - Use cached lucide-react documentation from 2.8.1 if available
  - Otherwise call `mcp__context7__get-library-docs` with topic 'HelpCircle icon'
  - **Success:** Have HelpCircle icon documentation
- [ ] Update `Toolbar.tsx` with accessible help button
  - Import HelpCircle icon from lucide-react
  - Import ShortcutsModal component
  - Add help button to far right of toolbar (after zoom section)
  - **State Management:**
    - Add local state: `const [isShortcutsOpen, setIsShortcutsOpen] = useState(false)`
    - Opens modal on click: `onClick={() => setIsShortcutsOpen(true)}`
  - **Accessibility Requirements:**
    - aria-label="Keyboard shortcuts help"
    - Keyboard focus indicator (focus-visible:ring-2)
    - Touch targets: h-11 w-11 sm:h-10 sm:w-10 (44x44px mobile)
  - **Tooltip:**
    - Wrap in Tooltip component
    - TooltipContent: "Keyboard shortcuts (?)"
    - Delay: 500ms
  - **Modal Integration:**
    - Render ShortcutsModal with isOpen={isShortcutsOpen}
    - onClose={() => setIsShortcutsOpen(false)}
  - **Success:** Help button opens shortcuts modal
  - **Test:** Click button → modal opens with shortcuts, Escape closes modal
  - **Edge Case:** Modal should not interfere with canvas shortcuts while open

### 2.7.7 Test All Keyboard Shortcuts
- [ ] Comprehensive shortcut testing:
  - V key → Select tool activated
  - R key → Rectangle tool activated
  - C key → Circle tool activated
  - T key → Text tool activated
  - Delete key → Deletes selected object
  - Backspace → Deletes selected object
  - Cmd+D (Mac) / Ctrl+D (Windows) → Duplicates
  - Escape → Deselects
  - Focus input → press R → "r" typed, tool not changed
  - Rapid shortcut switching (V,R,C,T,V,R) → no errors
  - **Success:** All shortcuts work correctly
  - **Test:** Cross-browser (Chrome, Firefox, Safari)
  - **Edge Case:** Shortcuts while modal open (should close modal first)

---

## 2.8 Improved Toolbar Organization

### 2.8.1 Get Latest Lucide Icons Documentation
- [ ] **Documentation:** Use context7 MCP for lucide-react
  - Call `mcp__context7__resolve-library-id` with 'lucide-react'
  - Call `mcp__context7__get-library-docs`
  - Review icon import patterns and available icons
  - **Success:** Have latest lucide-react docs
  - **Test:** Documentation retrieved

### 2.8.2 Reorganize Toolbar into Sections
- [ ] Update `Toolbar.tsx` structure
  - Section 1: Shape tools (Rectangle, Circle, Text)
  - Divider (vertical line)
  - Section 2: Operations (Duplicate, Delete)
  - Divider
  - Section 3: Zoom controls (placeholder for 2.9)
  - Section 4: Help (Shortcuts button)
  - **Success:** Toolbar has clear visual sections
  - **Test:** Visual inspection - sections are distinct
  - **Edge Case:** Sections should stack on mobile (vertical)

### 2.8.3 Create Toolbar Divider Component
- [ ] Create `features/toolbar/components/ToolbarDivider.tsx`
  - Simple div with vertical line
  - Height: full (h-8)
  - Width: 1px
  - Background: neutral-200
  - Margins: mx-2
  - **Success:** Divider component created
  - **Test:** Render between toolbar sections
  - **Edge Case:** Divider should hide on very small screens

### 2.8.4 Create ToolButton Component
- [ ] Create `features/toolbar/components/ToolButton.tsx`
  - Props: `icon: LucideIcon`, `isActive: boolean`, `onClick`, `disabled: boolean`, `tooltip: string`
  - Render button with icon
  - Active state: bg-primary-100, border-primary-500
  - Disabled state: opacity-50, cursor-not-allowed
  - Hover state: bg-neutral-100 (if not disabled)
  - **Success:** Reusable tool button component
  - **Test:** Render with different props
  - **Edge Case:** Active and disabled states should be mutually exclusive

### 2.8.5 Refactor Toolbar to Use ToolButton
- [ ] Update `Toolbar.tsx`
  - Replace individual button implementations with ToolButton
  - For shape tools: `isActive={activeTool === 'rectangle'}`
  - For operations: `disabled={selectedId === null}`
  - Reduce code duplication
  - **Success:** Toolbar uses consistent ToolButton components
  - **Test:** All buttons work as before
  - **Edge Case:** Active states update correctly

### 2.8.6 Make Toolbar Responsive for Mobile
- [ ] Update `Toolbar.tsx` with responsive classes
  - Desktop: horizontal layout (flex-row)
  - Mobile: vertical layout (flex-col) or smaller buttons
  - Use Tailwind responsive classes: `flex-row md:flex-row`
  - Reduce padding/margins on mobile
  - Consider bottom position on mobile: `fixed bottom-4` instead of `top-4`
  - **Success:** Toolbar adapts to screen size
  - **Test:** Resize browser to mobile width → toolbar adjusts
  - **Edge Case:** Toolbar should not overlap canvas content

### 2.8.7 Add Tooltips to All Toolbar Buttons
- [ ] **Documentation:** Use context7 MCP for shadcn/ui Tooltip
  - Call `mcp__context7__get-library-docs` with topic 'tooltip'
  - Install if needed: `npx shadcn@latest add tooltip`
- [ ] Wrap all ToolButtons in Tooltip component
  - Tooltip content shows tool name + keyboard shortcut
  - Example: "Rectangle (R)", "Delete (Del)", "Duplicate (Cmd+D)"
  - **Success:** Hovering any button shows tooltip
  - **Test:** Hover each button → tooltip appears after 500ms
  - **Edge Case:** Tooltips should not overlap on mobile

### 2.8.8 Test Toolbar Organization
- [ ] Manual testing:
  - Desktop: Toolbar has clear sections with dividers
  - Mobile: Toolbar is usable (not too small, not overlapping)
  - All buttons have tooltips
  - Active states are clear (blue background)
  - Disabled states are obvious (grayed out)
  - Hover states work (subtle highlight)
  - Rapid clicking buttons → no visual glitches
  - **Success:** Toolbar looks polished and professional
  - **Test:** Cross-browser, cross-device
  - **Edge Case:** Very narrow screens (<320px)

---

## 2.9 Zoom Controls UI

### 2.9.1 Create ZoomControls Component
- [ ] Create `features/toolbar/components/ZoomControls.tsx`
  - State: `zoom: number` (default 1.0)
  - Sync with CanvasStage zoom state (use shared store or prop)
  - Display current zoom percentage
  - Three buttons: Zoom Out (-), Reset (shows %), Zoom In (+)
  - **Success:** ZoomControls component created
  - **Test:** Component renders with 100% display
  - **Edge Case:** Zoom display should round to whole number

### 2.9.2 Implement Zoom In Functionality with Accessibility
- [ ] **Documentation:** Get latest lucide-react ZoomIn icon documentation
  - Use cached lucide-react documentation from 2.8.1 if available
  - Otherwise call `mcp__context7__get-library-docs` with topic 'ZoomIn icon, zoom icons, icon sizing'
  - **Success:** Have ZoomIn icon documentation
  - **Test:** Documentation retrieved
  - **Edge Case:** If context7 unavailable, use lucide.dev
- [ ] Update `ZoomControls.tsx` with accessible zoom in button
  - Import ZoomIn icon from lucide-react
  - Create handleZoomIn function:
    - New zoom: current * 1.2 (20% increase)
    - Clamp to max 5.0 (500%)
    - Update stage scale with `stage.scale({ x: zoom, y: zoom })`
    - Maintain canvas center point (not cursor position)
  - **Accessibility Requirements:**
    - aria-label="Zoom in"
    - aria-disabled when zoom >= 5.0
    - Keyboard focus indicator (focus-visible:ring-2)
    - Touch targets: h-10 w-10 minimum (44x44px)
  - **Button Styling:**
    - Disabled state when zoom >= 5.0: opacity-50, cursor-not-allowed
    - Hover state: bg-neutral-100 (when not disabled)
    - Active press state: bg-neutral-200
  - **Tooltip:**
    - Wrap in Tooltip component
    - TooltipContent: "Zoom in" (no keyboard shortcut for zoom buttons)
    - Delay: 500ms
  - Connect to zoom in button onClick
  - **Success:** Zoom in button increases zoom with full accessibility
  - **Test:** Click zoom in → canvas zooms in 20%, screen reader announces state
  - **Edge Case:** Zoom centers on canvas center, disabled at max zoom (500%)

### 2.9.3 Implement Zoom Out Functionality with Accessibility
- [ ] **Documentation:** Get latest lucide-react ZoomOut icon documentation
  - Use cached lucide-react documentation from 2.8.1 if available
  - Otherwise call `mcp__context7__get-library-docs` with topic 'ZoomOut icon, zoom icons, icon sizing'
  - **Success:** Have ZoomOut icon documentation
  - **Test:** Documentation retrieved
  - **Edge Case:** If context7 unavailable, use lucide.dev
- [ ] Update `ZoomControls.tsx` with accessible zoom out button
  - Import ZoomOut icon from lucide-react
  - Create handleZoomOut function:
    - New zoom: current / 1.2 (20% decrease)
    - Clamp to min 0.1 (10%)
    - Update stage scale with `stage.scale({ x: zoom, y: zoom })`
    - Maintain canvas center point (not cursor position)
  - **Accessibility Requirements:**
    - aria-label="Zoom out"
    - aria-disabled when zoom <= 0.1
    - Keyboard focus indicator (focus-visible:ring-2)
    - Touch targets: h-10 w-10 minimum (44x44px)
  - **Button Styling:**
    - Disabled state when zoom <= 0.1: opacity-50, cursor-not-allowed
    - Hover state: bg-neutral-100 (when not disabled)
    - Active press state: bg-neutral-200
  - **Tooltip:**
    - Wrap in Tooltip component
    - TooltipContent: "Zoom out"
    - Delay: 500ms
  - Connect to zoom out button onClick
  - **Success:** Zoom out button decreases zoom with full accessibility
  - **Test:** Click zoom out → canvas zooms out 20%, screen reader announces state
  - **Edge Case:** Can't zoom below 0.1x (10%), disabled at minimum zoom

### 2.9.4 Implement Reset Zoom Functionality
- [ ] Update `ZoomControls.tsx`
  - Reset button shows current zoom: "100%", "150%", "50%", etc.
  - onClick: Reset to 100% (zoom = 1.0)
  - Also reset pan position to (0, 0)
  - **Success:** Reset button returns to 100% zoom
  - **Test:** Zoom in/out → click reset → back to 100%, centered
  - **Edge Case:** Reset should smoothly transition (optional animation)

### 2.9.5 Connect Zoom Controls to Canvas Store
- [ ] Option A: Add zoom state to canvasStore
  - Add `zoom: number`, `panX: number`, `panY: number` to store
  - Add actions: `setZoom`, `setPan`, `resetView`
  - Update CanvasStage to use store values
- [ ] Option B: Use local state with ref to stage
  - Access stage ref from CanvasStage
  - Call `stage.scale({ x: zoom, y: zoom })`
  - **Success:** Zoom controls and canvas stay in sync
  - **Test:** Use zoom controls → canvas zooms, use mouse wheel → controls update
  - **Edge Case:** Choose approach that maintains single source of truth

### 2.9.6 Add Zoom Controls to Toolbar
- [ ] Update `Toolbar.tsx`
  - Add ZoomControls component in Section 3
  - Position after operations section, before help button
  - Ensure divider separates from operations
  - **Success:** Zoom controls visible in toolbar
  - **Test:** All three buttons work (in, out, reset)
  - **Edge Case:** Zoom controls should be usable on mobile

### 2.9.7 Test Zoom Controls Thoroughly
- [ ] Manual testing:
  - Click zoom in 5 times → reaches 5.0x max
  - Click zoom out until minimum → reaches 0.1x min
  - Reset button shows correct percentage
  - Click reset → returns to 100%, centered
  - Zoom controls work alongside mouse wheel zoom
  - Create shapes while zoomed in/out → coords correct
  - Multi-user: Zoom is local (not synced across users)
  - **Success:** Zoom controls work perfectly
  - **Test:** No FPS drops during zoom changes
  - **Edge Case:** Zoom with 100+ objects on canvas

---

## 2.10 Selection and Deselection Improvements

### 2.10.1 Implement Background Click Deselection
- [ ] Update `CanvasStage.tsx`
  - Add onClick handler to Stage
  - Check if `e.target === e.target.getStage()` (clicked empty canvas)
  - If true: `selectObject(null)`
  - Don't deselect if clicking on a shape
  - **Success:** Clicking empty canvas deselects
  - **Test:** Select shape → click background → deselected
  - **Edge Case:** Don't deselect during pan (check if dragged)

### 2.10.2 Improve Deselect Logic
- [ ] Update click detection to ignore drag operations
  - Track mousedown position
  - On mouseup, compare to mousedown position
  - If moved > 5px, consider it a drag (don't deselect)
  - If moved < 5px, consider it a click
  - **Success:** Deselect only on true clicks, not drags
  - **Test:** Select → drag canvas → don't deselect, Select → click background → deselect
  - **Edge Case:** Very small drags (<5px) count as clicks

### 2.10.3 Enhance Selection Visual Feedback
- [ ] Update all shape components (Rectangle, Circle, TextShape)
  - Increase selection stroke width to 3px (from 2px)
  - Add subtle shadow to selection outline: `shadowColor: '#0ea5e9'`, `shadowBlur: 5`
  - Use consistent selection color: #0ea5e9
  - **Success:** Selection is more obvious
  - **Test:** Select any shape → clear blue border with subtle glow
  - **Edge Case:** Selection should be visible at all zoom levels

### 2.10.4 Add Selection Animation
- [ ] **Documentation:** Get latest Konva Animation documentation
  - Call `mcp__context7__resolve-library-id` with 'konva'
  - Call `mcp__context7__get-library-docs` with topic 'Konva Animation, Tween, to() method, easing functions, animation performance'
  - Review Konva.Animation and node.to() APIs
  - Check performance best practices for animations
  - **Success:** Have current Konva animation documentation
  - **Test:** Documentation retrieved with animation examples
  - **Edge Case:** If context7 unavailable, use konvajs.org/docs/animations
- [ ] Update shape components with selection animation
  - Use Konva's `node.to()` method for smooth transitions
  - On select: Animate stroke width from 0 to 3 over 200ms
  - Use easing: `Konva.Easings.EaseOut` for natural feel
  - Optional: Subtle scale animation (1.0 → 1.02 → 1.0) for extra polish
  - On deselect: Animate stroke width from 3 to 0 over 150ms
  - **Performance:**
    - Ensure animations don't drop below 60 FPS
    - Test with 50+ shapes (animate only selected shape)
    - Use `shouldComponentUpdate` to prevent unnecessary re-renders
  - **Success:** Selection has smooth, performant animation
  - **Test:** Select shape → see smooth border appear with 60 FPS maintained
  - **Edge Case:** Rapid selection switching should cancel previous animation, multiple rapid selections should not cause animation queue buildup

### 2.10.5 Test Selection/Deselection
- [ ] Manual testing:
  - Click shape → selects with clear border
  - Click background → deselects
  - Press Escape → deselects
  - Click shape while another selected → switches selection
  - Drag canvas → doesn't deselect
  - Pan while shape selected → shape stays selected
  - Zoom while shape selected → selection border scales correctly
  - **Success:** Selection feels polished and predictable
  - **Test:** No visual glitches during selection changes
  - **Edge Case:** Rapid selection switching (click 10 shapes quickly)

---

## 2.11 Smooth UI Animations

### 2.11.1 Add Toolbar Fade-In Animation
- [ ] Update `Toolbar.tsx` or create `styles/animations.css`
  - Add CSS keyframe animation:
    ```css
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    ```
  - Apply to toolbar: `animation: fadeIn 0.3s ease-out`
  - **Success:** Toolbar fades in on page load
  - **Test:** Refresh page → toolbar smoothly appears
  - **Edge Case:** Animation should only play once (not on re-renders)

### 2.11.2 Add Button Hover Effects
- [ ] Update `ToolButton.tsx` with transitions
  - Add Tailwind transition classes: `transition-all duration-150 ease-out`
  - Hover state: `hover:bg-neutral-100 hover:scale-105`
  - Active state: `active:scale-95`
  - **Success:** Buttons feel responsive on hover
  - **Test:** Hover over buttons → subtle scale and bg change
  - **Edge Case:** Disabled buttons should not animate

### 2.11.3 Add Selection Outline Transition
- [ ] Update shape components
  - Add transition to stroke property
  - Smooth stroke width change (0 → 3px over 200ms)
  - Smooth stroke color change if changing colors
  - Use Konva's `to()` method or CSS transitions
  - **Success:** Selection border smoothly appears/disappears
  - **Test:** Select/deselect → smooth transition
  - **Edge Case:** Multiple rapid selections should not cause jitter

### 2.11.4 Add Cursor Fade-In Animation
- [ ] Update `Cursor.tsx` component
  - When cursor appears: fade in from opacity 0 to 1
  - Duration: 300ms
  - Use CSS transition or Konva opacity animation
  - **Success:** Cursors smoothly appear when users join
  - **Test:** Open new browser window → cursor fades in
  - **Edge Case:** Cursor should not fade in on every movement

### 2.11.5 Add Presence Indicator Slide-In
- [ ] Update `ActiveUsers.tsx` (or equivalent PresenceList)
  - When component mounts: slide in from right
  - Animation: `translateX(100%) → translateX(0)`
  - Duration: 300ms ease-out
  - **Success:** Presence list smoothly slides in
  - **Test:** Load canvas → presence list slides in from right
  - **Edge Case:** Animation should not play when users join/leave (just mount)

### 2.11.6 Test Animation Performance
- [ ] Performance testing:
  - Chrome DevTools Performance tab
  - Record while animations play
  - Check for 60 FPS during all animations
  - Check for no layout thrashing
  - Test with 50+ objects on canvas
  - **Success:** All animations maintain 60 FPS
  - **Test:** No dropped frames, smooth motion
  - **Edge Case:** Animations on low-end devices (throttle CPU)

---

## 2.12 Loading States for Operations

### 2.12.1 Get Latest shadcn/ui Skeleton Documentation
- [ ] **Documentation:** Get latest shadcn/ui Skeleton documentation
  - Call `mcp__context7__resolve-library-id` with 'shadcn'
  - Call `mcp__context7__get-library-docs` with topic 'skeleton component, loading states, skeleton patterns, accessibility'
  - Review Skeleton component API and usage patterns
  - Check multiple skeleton patterns (text, circle, rectangle)
  - Review accessibility considerations (aria-busy, aria-live)
  - **Success:** Have current Skeleton component documentation
  - **Test:** Documentation retrieved with Skeleton examples
  - **Edge Case:** If context7 unavailable, use ui.shadcn.com/docs/components/skeleton
- [ ] Install Skeleton component if not already installed
  - Run: `npx shadcn@latest add skeleton`
  - Verify import from @/components/ui/skeleton works
  - **Success:** Skeleton component available in project
  - **Test:** Can import and render Skeleton component

### 2.12.2 Add Loading State to Auth Operations
- [ ] Review `features/auth/components/LoginForm.tsx` and `SignupForm.tsx`
  - Already have loading state (from Phase 1)
  - Verify button shows loading spinner during auth
  - Verify form fields disabled during loading
  - **Success:** Auth loading states working
  - **Test:** Login → see spinner, button disabled
  - **Edge Case:** Loading should not get stuck if request fails

### 2.12.3 Add Canvas Initial Load Indicator
- [ ] Update `CanvasPage.tsx`
  - Add loading state for initial canvas load
  - Show Skeleton or Loading component while Firestore loads objects
  - Use `loading` state from Firestore subscription
  - Display in center of canvas
  - **Success:** Loading indicator shows while canvas loads
  - **Test:** Refresh page → see loading briefly
  - **Edge Case:** If canvas loads instantly (<100ms), don't show loading

### 2.12.4 Add Button Loading States
- [ ] **Documentation:** Get latest lucide-react Loader2 icon documentation (if not already cached)
  - Use cached lucide-react documentation from 2.8.1 if available
  - Otherwise call `mcp__context7__get-library-docs` with topic 'Loader2 icon, loading spinner, animated icons'
  - **Success:** Have Loader2 icon documentation
- [ ] Update `ToolButton.tsx` to support loading prop
  - Props: `loading?: boolean`
  - When loading: Show Loader2 spinner instead of icon
  - Button disabled while loading: `disabled={disabled || loading}`
  - Import Loader2 icon from lucide-react (spinning icon)
  - Add CSS animation: `animate-spin` class from Tailwind
  - **Success:** Buttons can show loading state
  - **Test:** Render button with loading=true → see spinner rotating
  - **Edge Case:** Loading state should be cancellable, spinner should spin smoothly at 60 FPS

### 2.12.5 Create Sync Indicator Component
- [ ] Create `components/common/SyncIndicator.tsx`
  - Position: Fixed top-right (below Active Users)
  - States: "Synced ✓", "Syncing...", "Offline"
  - Show "Syncing..." when Firestore write in progress
  - Show "Synced ✓" after write completes (2 second delay, then hide)
  - Show "Offline" when no network connection
  - Small, subtle component
  - **Success:** Sync status visible to user
  - **Test:** Create shape → see "Syncing..." → "Synced ✓" → fades out
  - **Edge Case:** Rapid creates should not spam indicator

### 2.12.6 Add Sync Indicator to Canvas Page
- [ ] Update `CanvasPage.tsx`
  - Import and render SyncIndicator
  - Connect to Firestore write events
  - Use navigator.onLine to detect offline status
  - **Success:** Sync indicator appears during operations
  - **Test:** Create shape → indicator shows
  - **Edge Case:** Indicator should batch multiple rapid operations

### 2.12.7 Test All Loading States
- [ ] Manual testing:
  - Auth: Login shows loading, form disabled
  - Canvas: Initial load shows loading indicator
  - Buttons: Operation buttons can show loading (if applicable)
  - Sync: Creating shapes shows "Syncing..." indicator
  - Offline: Going offline shows "Offline" indicator
  - All loading states resolve (don't get stuck)
  - **Success:** Loading feedback is clear and reliable
  - **Test:** Throttle network to slow 3G → all loading states work
  - **Edge Case:** Simultaneous operations (create + duplicate)

---

## 2.13 Toast Notifications System

### 2.13.1 Get Latest shadcn/ui Sonner Documentation
- [ ] **Documentation:** Get latest shadcn/ui Sonner (toast) documentation
  - Call `mcp__context7__resolve-library-id` with 'shadcn'
  - Call `mcp__context7__get-library-docs` with topic 'sonner toast component, toast notifications, toast.success, toast.error, toast.info, toast.promise, Toaster component, toast positioning, accessibility'
  - Review Sonner/Toast API (toast.success, toast.error, toast.info, toast.promise)
  - Check Toaster configuration options (position, richColors, duration)
  - Review toast accessibility (aria-live regions, screen reader announcements)
  - Check toast stacking and queuing behavior
  - **Success:** Have current Sonner toast documentation
  - **Test:** Documentation retrieved with toast examples
  - **Edge Case:** If context7 unavailable, use ui.shadcn.com/docs/components/sonner
- [ ] Install Sonner component if not already installed
  - Run: `npx shadcn@latest add sonner`
  - Verify can import { toast } from 'sonner' and Toaster component
  - **Success:** Sonner installed and ready to use
  - **Test:** Can import toast and Toaster successfully

### 2.13.2 Configure Toast System
- [ ] Update `App.tsx` or `main.tsx`
  - Import Toaster from 'sonner'
  - Add `<Toaster position="bottom-right" richColors />` at root level
  - Configure default duration: 3000ms (3 seconds)
  - **Success:** Toast system ready to use
  - **Test:** Call `toast.success('Test')` in console → toast appears
  - **Edge Case:** Toasts should not block canvas interactions

### 2.13.3 Add Success Toasts for Operations
- [ ] Update delete operation
  - After successful delete: `toast.success('Object deleted')`
  - Only show on successful Firebase sync (not optimistic)
- [ ] Update duplicate operation
  - After successful duplicate: `toast.success('Object duplicated')`
  - **Success:** Success toasts appear after operations
  - **Test:** Delete object → see "Object deleted" toast
  - **Edge Case:** Don't show toast if operation fails

### 2.13.4 Add Error Toasts for Failures
- [ ] Update `lib/firebase/canvasService.ts`
  - Catch Firestore write errors
  - On error: `toast.error('Failed to save. Retrying...')`
  - If retry succeeds: `toast.success('Saved successfully')`
  - If all retries fail: `toast.error('Failed to save. Please check your connection.')`
  - **Success:** Error toasts inform user of issues
  - **Test:** Disconnect network → create shape → see error toast
  - **Edge Case:** Multiple errors should not spam toasts

### 2.13.5 Add Info Toasts for State Changes
- [ ] Add toast for multi-user events (optional)
  - When another user joins: `toast.info('User joined')`
  - When user leaves: `toast.info('User left')`
  - Make these optional (can be distracting)
  - **Success:** State changes can show toasts
  - **Test:** Second user joins → see toast (if enabled)
  - **Edge Case:** Too many join/leave toasts can be annoying

### 2.13.6 Test Toast System
- [ ] Manual testing:
  - Delete object → "Object deleted" toast
  - Duplicate object → "Object duplicated" toast
  - Network error → "Failed to save" toast
  - Retry succeeds → "Saved successfully" toast
  - Toasts auto-dismiss after 3 seconds
  - Multiple toasts stack nicely (don't overlap)
  - Toasts don't block canvas interaction
  - **Success:** Toast system provides clear feedback
  - **Test:** Rapid operations → toasts handle gracefully
  - **Edge Case:** 10 toasts at once (should queue or limit)

---

## 2.14 Improve Mobile Touch Support

### 2.14.1 Add Touch Device Detection
- [ ] Create `lib/utils/deviceDetection.ts`
  - Export `isTouchDevice()` function:
    ```typescript
    export function isTouchDevice(): boolean {
      return ('ontouchstart' in window) ||
             (navigator.maxTouchPoints > 0);
    }
    ```
  - Export `isMobile()` function (screen size check)
  - **Success:** Can detect touch devices
  - **Test:** Test on desktop (false) and mobile (true)
  - **Edge Case:** iPads with keyboards may report touch but act like desktop

### 2.14.2 Increase Touch Targets on Mobile
- [ ] Update `ToolButton.tsx`
  - Desktop: 40x40px buttons
  - Mobile: 44x44px minimum (Apple guideline)
  - Use conditional classes: `h-11 w-11 md:h-10 md:w-10`
  - **Success:** Buttons larger on mobile
  - **Test:** On mobile device, buttons are easy to tap
  - **Edge Case:** Toolbar should not become too large

### 2.14.3 Adjust Toolbar for Mobile
- [ ] Update `Toolbar.tsx`
  - Mobile: Reduce spacing between buttons
  - Mobile: Consider bottom position instead of top
  - Mobile: Smaller zoom control text
  - Desktop: Normal spacing, top position
  - **Success:** Toolbar optimized for mobile
  - **Test:** Toolbar usable on iPhone SE (smallest common screen)
  - **Edge Case:** Landscape orientation on mobile

### 2.14.4 Test Pinch-to-Zoom Gesture
- [ ] Update `CanvasStage.tsx` with touch event handlers
  - Konva supports touch events by default
  - Test pinch gesture zooms canvas
  - Zoom should center on pinch center point
  - **Success:** Pinch gesture zooms canvas
  - **Test:** On iPad/iPhone, pinch to zoom works
  - **Edge Case:** Pinch should not trigger browser zoom

### 2.14.5 Test Two-Finger Pan Gesture
- [ ] Test two-finger pan on mobile
  - Konva should handle this by default
  - Two-finger drag should pan canvas
  - One-finger drag should move selected object (if select tool)
  - **Success:** Two-finger pan works on mobile
  - **Test:** On tablet, two-finger drag pans canvas
  - **Edge Case:** Distinguish from pinch zoom (distance change vs parallel movement)

### 2.14.6 Handle Touch Drag vs Click
- [ ] Update shape components for touch
  - Touch tap: Should select (not drag)
  - Touch drag: Should move object
  - Threshold: >5px movement = drag, else = click
  - **Success:** Touch tap and drag both work
  - **Test:** Tap shape → selects, drag shape → moves
  - **Edge Case:** Very small movements should not start drag

### 2.14.7 Test on iOS Safari Specifically
- [ ] iOS Safari testing (most restrictive browser):
  - Test canvas renders correctly
  - Test touch gestures (tap, drag, pinch, pan)
  - Test toolbar buttons tap correctly
  - Test no double-tap zoom (should be disabled)
  - Test no rubber-band scrolling (canvas should prevent)
  - **Success:** Full functionality on iOS Safari
  - **Test:** On real iPhone or iPad (not just simulator)
  - **Edge Case:** iOS Safari has unique touch handling quirks

### 2.14.8 Test on Android Chrome
- [ ] Android Chrome testing:
  - Test canvas renders correctly
  - Test touch gestures
  - Test toolbar usability
  - Test software keyboard doesn't cover toolbar
  - **Success:** Full functionality on Android Chrome
  - **Test:** On real Android device
  - **Edge Case:** Many Android screen sizes to consider

---

## 2.15 Error Recovery System

### 2.15.1 Review Firebase Offline Persistence
- [ ] **Firebase MCP:** Check offline persistence documentation
  - Call `mcp__firebase__firebase_get_environment` to check current setup
  - Review `lib/firebase/config.ts` for enableIndexedDbPersistence
  - Verify offline persistence is enabled (should be from Phase 1)
  - **Success:** Offline persistence confirmed enabled
  - **Test:** Check firestore.ts has enableIndexedDbPersistence call
  - **Edge Case:** Persistence can fail in private browsing mode

### 2.15.2 Implement Retry Logic for Firestore Writes
- [ ] Update `lib/firebase/canvasService.ts`
  - Wrap updateCanvasObjects in retry logic
  - Max retries: 3
  - Retry delay: 1 second, then 2 seconds, then 3 seconds (exponential backoff)
  - On final failure: Return error to caller
  - **Success:** Failed writes retry automatically
  - **Test:** Simulate network error → see 3 retry attempts
  - **Edge Case:** Don't retry on auth errors (would fail anyway)

### 2.15.3 Create Retry Helper Function
- [ ] Create `lib/utils/retry.ts`
  - Export `retryAsync` function:
    ```typescript
    export async function retryAsync<T>(
      fn: () => Promise<T>,
      maxRetries: number = 3,
      delay: number = 1000
    ): Promise<T> {
      let lastError: Error;
      for (let i = 0; i < maxRetries; i++) {
        try {
          return await fn();
        } catch (error) {
          lastError = error as Error;
          if (i < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
          }
        }
      }
      throw lastError!;
    }
    ```
  - **Success:** Reusable retry logic
  - **Test:** Call with failing function → retries 3 times
  - **Edge Case:** Should not retry forever (max retries enforced)

### 2.15.4 Implement Operation Queue for Offline Mode
- [ ] Create `lib/firebase/offlineQueue.ts`
  - Queue operations while offline: `const queue: Operation[] = []`
  - Listen to `navigator.onLine` events
  - When offline: Queue operations instead of executing
  - When online: Flush queue (execute all queued operations)
  - **Success:** Operations queued while offline
  - **Test:** Go offline → create shape → go online → shape syncs
  - **Edge Case:** Queue should have max size (prevent memory issues)

### 2.15.5 Create Offline Indicator
- [ ] Update `SyncIndicator.tsx` to show offline status
  - Listen to `window.addEventListener('online')` and `'offline'`
  - When offline: Show red "Offline" badge
  - When online: Show green "Online" (briefly, then hide)
  - **Success:** Users see offline status clearly
  - **Test:** Go offline → see "Offline", go online → see "Online"
  - **Edge Case:** navigator.onLine can be unreliable (also test actual requests)

### 2.15.6 Test Network Throttling
- [ ] Chrome DevTools network throttling testing:
  - Set network to "Slow 3G"
  - Create shapes → should still work (slower)
  - Delete shapes → syncs eventually
  - Duplicate shapes → works
  - No errors in console (might be warnings about slow network)
  - **Success:** App works on slow network
  - **Test:** All operations complete (just slower)
  - **Edge Case:** Very slow network (>10 second delays)

### 2.15.7 Test Offline Mode
- [ ] Offline mode testing:
  - Go completely offline (airplane mode or network off)
  - Create shapes → appear locally
  - Operations queue (not executed)
  - See "Offline" indicator
  - Go back online
  - Queued operations execute automatically
  - All shapes sync to Firestore
  - **Success:** Full offline support
  - **Test:** No data loss when going offline
  - **Edge Case:** Offline for extended period (hours), then online

### 2.15.8 Handle Concurrent Write Conflicts
- [ ] Test concurrent edits:
  - User A: Offline, creates shapes
  - User B: Online, creates different shapes
  - User A: Goes online
  - Both users' shapes should appear (last-write-wins for array)
  - **Success:** No data loss from conflicts
  - **Test:** Shapes from both users visible
  - **Edge Case:** True conflict (both edit same object) → last write wins (acceptable for MVP)

---

## 2.16 Canvas Performance Optimization

### 2.16.1 Separate Cursor Layer
- [ ] Update `CanvasStage.tsx` layer structure
  - Create separate Layer for cursors
  - Set `listening={false}` on cursor layer (no event handling needed)
  - Cursors should not interfere with object interactions
  - **Success:** Cursor layer separate and non-interactive
  - **Test:** Click where cursor is → doesn't interfere with selection
  - **Edge Case:** Cursor layer should render on top of object layer

### 2.16.2 Implement Layer Listening Optimization
- [ ] Review all Layers in CanvasStage
  - Background layer: `listening={false}` (no interactions)
  - Object layer: `listening={true}` (selection, dragging)
  - Cursor layer: `listening={false}` (display only)
  - **Success:** Only object layer handles events
  - **Test:** Interactions still work, FPS improved
  - **Edge Case:** Ensure clicks on background still deselect (Stage handles this)

### 2.16.3 Implement Shape Caching for Performance
- [ ] **Documentation:** Get latest Konva caching documentation
  - Call `mcp__context7__resolve-library-id` with 'konva'
  - Call `mcp__context7__get-library-docs` with topic 'shape caching, cache() method, clearCache() method, performance optimization, when to use caching'
  - Review Konva `cache()` and `clearCache()` methods
  - Understand caching performance tradeoffs (memory vs CPU)
  - Check when caching helps vs hurts performance
  - **Success:** Have current Konva caching documentation
  - **Test:** Documentation retrieved with caching examples
  - **Edge Case:** If context7 unavailable, use konvajs.org/docs/performance/Shape_Caching.html
- [ ] Add caching to static shapes with smart invalidation
  - For shapes that aren't selected/dragging: call `ref.current.cache()`
  - Don't cache selected shapes (constantly changing with selection border)
  - Don't cache shapes being dragged (position changing)
  - Cache after shape creation finishes and is static
  - **Cache Invalidation:**
    - Clear cache when shape updates: `ref.current.clearCache()` then re-cache
    - Clear on selection (border changes), re-cache on deselection
    - Clear if shape properties change (color, size, text, etc.)
  - **Implementation:**
    - Add `useEffect` in shape components to manage caching
    - Example: `useEffect(() => { if (!isSelected && ref.current) { ref.current.cache(); } }, [isSelected, fill, x, y])`
  - **Success:** Static shapes use cached render, dynamic shapes don't
  - **Test:** With 100+ shapes, FPS improves by 10-20%
  - **Edge Case:** Don't cache very simple shapes (rectangles may not benefit), clear cache correctly to avoid stale renders

### 2.16.4 Throttle Pan/Zoom Updates
- [ ] Update pan/zoom handlers in CanvasStage
  - Throttle to 16ms (60 FPS: 1000ms / 60 = 16.67ms)
  - Use throttle utility from lib/utils
  - Ensure smooth 60 FPS during pan/zoom
  - **Success:** Pan/zoom maintains 60 FPS
  - **Test:** Chrome DevTools Performance → consistent 60 FPS
  - **Edge Case:** Very fast pan/zoom (drag rapidly)

### 2.16.5 Batch Firestore Writes
- [ ] Update `lib/firebase/canvasService.ts`
  - Already using debounce (500ms) from Phase 1
  - Verify max 1 write per 500ms per user
  - Group rapid operations into single write
  - **Success:** Firestore writes are batched
  - **Test:** Create 10 shapes rapidly → check Firestore write count (should be ~2-3, not 10)
  - **Edge Case:** Don't lose operations if batching fails

### 2.16.6 Profile Canvas Performance
- [ ] Chrome DevTools Performance profiling:
  - Record while creating 50 shapes
  - Check FPS (target: stable 60 FPS)
  - Check for long tasks (>50ms)
  - Check for excessive re-renders
  - Identify bottlenecks
  - **Success:** No performance issues identified
  - **Test:** Maintain 60 FPS throughout
  - **Edge Case:** Performance with many concurrent users (3+)

### 2.16.7 Test with 100+ Objects
- [ ] Stress testing:
  - Add 100 objects to canvas (mix of rectangles, circles, text)
  - Pan canvas → 60 FPS
  - Zoom in/out → 60 FPS
  - Select objects → no lag
  - Drag objects → smooth
  - Create new objects → no slowdown
  - **Success:** App handles 100+ objects smoothly
  - **Test:** Chrome DevTools Performance tab
  - **Edge Case:** 200+ objects (identify breaking point)

### 2.16.8 Optimize Re-Renders with React.memo
- [ ] Update all shape components
  - Wrap in React.memo if not already
  - Verify Rectangle.tsx has memo
  - Verify Circle.tsx has memo
  - Verify TextShape.tsx has memo
  - Verify Cursor.tsx has memo
  - **Success:** Shapes only re-render when props change
  - **Test:** React DevTools Profiler → minimal re-renders
  - **Edge Case:** memo comparison function if needed (usually default is fine)

---

## 2.17 Keyboard Shortcuts Documentation Modal

### 2.17.1 Create ShortcutsModal Component (if not done in 2.7.5)
- [ ] Review Section 2.7.5 (may already be complete)
- [ ] If not complete, create `components/common/ShortcutsModal.tsx`
  - Use shadcn Dialog
  - Display KEYBOARD_SHORTCUTS from constants
  - Group by category (Tools, Edit, Canvas)
  - Style keyboard keys: rounded badges, monospace font
  - **Success:** Modal displays all shortcuts
  - **Test:** Open modal → see categorized shortcuts
  - **Edge Case:** Modal accessible via keyboard (Tab, Enter, Escape)

### 2.17.2 Style Keyboard Key Badges
- [ ] Add keyboard key styling
  - Create KeyBadge component: `<kbd>` element
  - Style: rounded, bg-neutral-100, border, px-2 py-1, monospace font
  - Example: "Cmd + D" → [Cmd][+][D] (each in badge)
  - **Success:** Keyboard shortcuts look professional
  - **Test:** Visual inspection of modal
  - **Edge Case:** Long key combinations (Cmd+Shift+D)

### 2.17.3 Add Modal Open Button (if not done in 2.7.6)
- [ ] Review Section 2.7.6
- [ ] If not complete, add help button to Toolbar
  - HelpCircle icon from lucide-react
  - Opens ShortcutsModal
  - Tooltip: "Keyboard shortcuts (?)"
  - **Success:** Help button opens modal
  - **Test:** Click button → modal opens
  - **Edge Case:** Multiple clicks should not open multiple modals

### 2.17.4 Add Question Mark Shortcut to Open Modal
- [ ] Update `useToolShortcuts.ts`
  - Add '?' key handler (Shift + /) → opens shortcuts modal
  - State: `const [showShortcuts, setShowShortcuts] = useState(false)`
  - **Success:** ? key opens shortcuts modal
  - **Test:** Press Shift+? → modal opens
  - **Edge Case:** Don't trigger when typing in input

### 2.17.5 Test Shortcuts Documentation
- [ ] Manual testing:
  - Click help button → modal opens
  - Press ? key → modal opens
  - Modal shows all current shortcuts
  - Shortcuts grouped logically (Tools, Edit, Canvas)
  - Press Escape → modal closes
  - Click backdrop → modal closes
  - Keyboard navigation works (Tab through modal)
  - **Success:** Shortcuts documentation is accessible and complete
  - **Test:** All listed shortcuts actually work
  - **Edge Case:** Update modal when new shortcuts added

---

## 2.18 Improve Landing Page

### 2.18.1 Add Hero Section
- [ ] Update `src/pages/LandingPage.tsx`
  - Add hero section with large heading
  - Heading: "CollabCanvas" (text-5xl or text-6xl)
  - Subheading: "Real-time collaborative design canvas. Create together, instantly."
  - Center aligned, ample padding
  - **Success:** Hero section looks impressive
  - **Test:** Visual inspection on desktop and mobile
  - **Edge Case:** Heading should scale on mobile (text-4xl → text-6xl)

### 2.18.2 Add Feature List with Icons
- [ ] Add feature list below hero
  - 3 features in grid layout (grid-cols-1 md:grid-cols-3)
  - Feature 1: Real-time (Users icon) - "See changes instantly"
  - Feature 2: Fast (Zap icon) - "60 FPS performance"
  - Feature 3: Simple (Shapes icon) - "Easy to use"
  - Each feature: icon, title, description
  - **Success:** Features showcase app benefits
  - **Test:** Responsive grid (stacks on mobile)
  - **Edge Case:** Icons should be large enough (w-12 h-12)

### 2.18.3 Style Get Started Button
- [ ] Update "Get Started" button
  - Large size: px-8 py-4
  - Primary color: bg-primary-500
  - Hover effect: hover:bg-primary-600 hover:shadow-lg
  - Rounded: rounded-lg
  - Prominent call-to-action
  - **Success:** Button is attention-grabbing
  - **Test:** Button stands out on page
  - **Edge Case:** Button accessible (keyboard focus visible)

### 2.18.4 Add Footer with GitHub Link
- [ ] Add footer at bottom of landing page
  - Link to GitHub repository (if public)
  - Copyright notice
  - Built with: React, Konva, Firebase (optional credits)
  - Small text, neutral color
  - **Success:** Footer provides attribution
  - **Test:** GitHub link works (opens in new tab)
  - **Edge Case:** Footer should stick to bottom on short content

### 2.18.5 Make Landing Page Responsive
- [ ] Test responsive design
  - Mobile (320px - 640px): Single column, smaller text
  - Tablet (640px - 1024px): Balanced layout
  - Desktop (1024px+): Full hero, grid features
  - All breakpoints: Readable text, clickable buttons
  - **Success:** Landing page works on all screen sizes
  - **Test:** Chrome DevTools responsive mode
  - **Edge Case:** Very wide screens (1920px+)

### 2.18.6 Test Landing Page
- [ ] Manual testing:
  - Desktop: Hero looks impressive, features in grid
  - Mobile: Content stacks nicely, button accessible
  - Tablet: Balanced layout
  - Click "Get Started" → auth modal opens
  - If logged in: Auto-redirect to /canvas
  - GitHub link in footer works
  - All text readable (contrast, size)
  - **Success:** Landing page is polished and professional
  - **Test:** Cross-browser (Chrome, Safari, Firefox)
  - **Edge Case:** Very small screens (iPhone SE)

---

## 2.19 Code Quality and Architecture Review

### 2.19.1 Verify All Files Under 500 Lines
- [ ] Use tool or script to check file line counts
  - Run: `find src -name "*.tsx" -o -name "*.ts" | xargs wc -l | sort -nr`
  - Identify files over 500 lines
  - Split large files into smaller modules
  - **Success:** All files ≤ 500 lines
  - **Test:** Automated check passes
  - **Edge Case:** Files close to limit (450-500 lines) should be watched

### 2.19.2 Check Barrel Exports Functionality
- [ ] Test all barrel exports (index.ts files)
  - Test: `import { Circle } from '@/features/canvas-core/shapes'` works
  - Test: `import { Toolbar } from '@/features/toolbar/components'` works
  - Test: `import { useCanvasStore } from '@/stores'` works
  - All barrel exports functional
  - **Success:** All imports via barrels work
  - **Test:** No import errors in any file
  - **Edge Case:** Circular dependency warnings

### 2.19.3 Verify Vertical Slice Structure
- [ ] Check folder structure matches architecture.md
  - features/ contains feature slices (canvas-core, collaboration, toolbar, auth)
  - Each feature has components/, hooks/, utils/ as needed
  - Shared code in components/, lib/, stores/
  - No cross-feature imports (features don't import from each other directly)
  - **Success:** Structure matches architecture
  - **Test:** Visual inspection of src/ folder
  - **Edge Case:** Any architectural violations (document if necessary)

### 2.19.4 Add JSDoc Comments to All Functions
- [ ] Review all exported functions
  - All have JSDoc comments with:
    - Description
    - @param tags
    - @returns tag
    - @example (for complex functions)
  - All files have header comments
  - **Success:** Full JSDoc coverage
  - **Test:** Hover over function in IDE → see documentation
  - **Edge Case:** Private/internal functions can have brief comments

### 2.19.5 Run TypeScript Strict Checks
- [ ] Verify tsconfig.json has strict mode enabled
  - `"strict": true` in compilerOptions
  - Run: `npm run build` → no TypeScript errors
  - Fix any type errors
  - No 'any' types used (or minimal, with justification)
  - **Success:** TypeScript strict mode passes
  - **Test:** Build completes without errors
  - **Edge Case:** External library types may require 'any' (acceptable)

### 2.19.6 Remove Console Logs
- [ ] Search for console.log statements
  - Run: `grep -r "console.log" src/`
  - Remove or comment out all console.logs
  - Keep console.error and console.warn for error handling
  - **Success:** No console.log in production code
  - **Test:** Build passes, no console output when using app
  - **Edge Case:** Debug logs should use environment variable check

### 2.19.7 Update README if Needed
- [ ] Review README.md
  - Update features list (now 3 shape types, delete, duplicate, keyboard shortcuts)
  - Update screenshots if available
  - Update development instructions if changed
  - Add Phase 2 completion note
  - **Success:** README is current
  - **Test:** New developer could follow README to set up project
  - **Edge Case:** Keep README concise (detailed docs in _docs/)

### 2.19.8 Run Final Build Test
- [ ] Build and preview production build
  - Run: `npm run build`
  - Build completes without errors
  - Run: `npm run preview`
  - Preview loads correctly
  - All features work in production build
  - **Success:** Production build works perfectly
  - **Test:** Test all features in preview mode
  - **Edge Case:** Environment variables loaded correctly

---

## 2.20 Phase 2 Validation Checklist

**Must pass ALL before Phase 2 complete:**

### Functional Requirements - Shape Types
- [ ] Rectangles work (from Phase 1) ✅
- [ ] Circles can be created with circle tool (C key)
- [ ] Circles render with correct radius
- [ ] Circles can be selected and dragged
- [ ] Text shapes can be created with text tool (T key)
- [ ] Text shapes display correct content
- [ ] Text shapes can be selected and dragged
- [ ] All three shape types coexist without conflicts
- [ ] All shape types sync to Firestore correctly
- [ ] All shape types sync in real-time to other users

### Functional Requirements - Operations
- [ ] Delete button in toolbar works
- [ ] Delete key (Del) deletes selected object
- [ ] Backspace key deletes selected object
- [ ] Delete button disabled when nothing selected
- [ ] Duplicate button in toolbar works
- [ ] Cmd+D (Mac) duplicates selected object
- [ ] Ctrl+D (Windows) duplicates selected object
- [ ] Duplicate button disabled when nothing selected
- [ ] Duplicates offset by 20px x and y
- [ ] Duplicate preserves all shape properties
- [ ] All operations sync to Firestore within 500ms

### Functional Requirements - Keyboard Shortcuts
- [ ] V key activates select tool
- [ ] R key activates rectangle tool
- [ ] C key activates circle tool
- [ ] T key activates text tool
- [ ] Delete/Backspace deletes selected object
- [ ] Cmd/Ctrl+D duplicates selected object
- [ ] Escape deselects current object
- [ ] Shortcuts don't trigger when typing in input fields
- [ ] ? key opens keyboard shortcuts modal
- [ ] Shortcuts modal displays all shortcuts correctly

### Functional Requirements - UI/UX
- [ ] Toolbar has clear sections (shapes | operations | zoom | help)
- [ ] Toolbar has visual dividers between sections
- [ ] Toolbar is responsive (works on mobile)
- [ ] All toolbar buttons have tooltips
- [ ] Zoom in button increases zoom
- [ ] Zoom out button decreases zoom
- [ ] Reset zoom button returns to 100%
- [ ] Clicking empty canvas deselects current object
- [ ] Selection border is clear and obvious (3px blue)
- [ ] Selection has smooth animation when applied

### Functional Requirements - Animations
- [ ] Toolbar fades in on page load
- [ ] Toolbar buttons have hover effects
- [ ] Selection outline transitions smoothly
- [ ] Cursors fade in when users join
- [ ] Presence indicator slides in on mount
- [ ] All animations maintain 60 FPS

### Functional Requirements - Loading States
- [ ] Auth forms show loading during login/signup
- [ ] Canvas shows loading on initial load
- [ ] Sync indicator shows "Syncing..." during operations
- [ ] Sync indicator shows "Synced ✓" after completion
- [ ] Offline indicator shows "Offline" when disconnected

### Functional Requirements - Toasts
- [ ] Toast appears after deleting object: "Object deleted"
- [ ] Toast appears after duplicating object: "Object duplicated"
- [ ] Toast appears on sync error: "Failed to save. Retrying..."
- [ ] Toast appears on retry success: "Saved successfully"
- [ ] Toasts auto-dismiss after 3 seconds
- [ ] Multiple toasts stack correctly

### Functional Requirements - Mobile
- [ ] Canvas works on iOS Safari
- [ ] Canvas works on Android Chrome
- [ ] Touch targets are at least 44x44px
- [ ] Tap selects objects
- [ ] Drag moves objects
- [ ] Pinch-to-zoom works
- [ ] Two-finger pan works
- [ ] Toolbar is usable on mobile (not too small)
- [ ] No double-tap zoom interference
- [ ] Software keyboard doesn't break layout

### Performance Requirements
- [ ] 60 FPS during pan
- [ ] 60 FPS during zoom
- [ ] 60 FPS while dragging shapes
- [ ] 60 FPS with 100+ mixed shapes on canvas
- [ ] <100ms sync latency for shape changes
- [ ] <50ms sync latency for cursor positions
- [ ] No memory leaks after 10 minutes of use
- [ ] Smooth performance on slow 3G network

### Multi-User Requirements
- [ ] Open 3 browser windows as different users
- [ ] User A creates circle → Users B and C see it
- [ ] User B creates text → Users A and C see it
- [ ] User C deletes shape → Users A and B see deletion
- [ ] User A duplicates shape → Users B and C see duplicate
- [ ] All users' cursors visible to others
- [ ] All users appear in presence list
- [ ] User closes window → disappears from presence within 3s
- [ ] Concurrent operations don't cause conflicts
- [ ] Rapid simultaneous edits (5 users creating shapes) → all sync

### Error Handling Requirements
- [ ] Network disconnect → operations queued
- [ ] Network reconnect → queue flushes, all operations sync
- [ ] Firestore write error → retries 3 times
- [ ] Failed retry → shows error toast
- [ ] Offline mode → offline indicator visible
- [ ] Offline operations → sync when back online
- [ ] Slow network (3G) → app still usable
- [ ] No console errors during normal operation

### Code Quality Requirements
- [ ] All files ≤ 500 lines
- [ ] All functions have JSDoc comments
- [ ] All exports have type definitions
- [ ] No 'any' types (or justified exceptions)
- [ ] All barrel exports (index.ts) work
- [ ] Imports use @ alias (no relative ../../..)
- [ ] Components in correct feature slices
- [ ] Vertical slice architecture maintained
- [ ] No cross-feature imports (features → stores → services)
- [ ] TypeScript strict mode passes
- [ ] No console.log statements in code

### Deployment Requirements
- [ ] Build succeeds: `npm run build`
- [ ] Preview works: `npm run preview`
- [ ] Deploy succeeds: `firebase deploy --only hosting`
- [ ] Deployed app accessible at Firebase URL
- [ ] All features work in production build
- [ ] Environment variables loaded correctly
- [ ] Multiple users can access deployed app
- [ ] Real-time collaboration works in production

### Edge Cases Tested
- [ ] Create shape at canvas edge (stays within bounds)
- [ ] Delete while dragging (doesn't crash)
- [ ] Duplicate while creating new shape (no conflicts)
- [ ] Tool switch during shape creation (preview clears)
- [ ] Rapid tool switching (V,R,C,T,V,R) → no errors
- [ ] Select during zoom/pan → coords correct
- [ ] Long text strings (100+ characters) work
- [ ] Very small shapes (minimum size enforced)
- [ ] Very large canvas (1000+ objects) performance
- [ ] Multiple simultaneous deletions → all sync
- [ ] Offline for extended period (hours) → syncs on reconnect

---

## 2.21 Comprehensive Edge Case Testing

**Purpose:** Systematically test critical edge cases that could break the application or cause data loss.

### 2.21.1 Shape Creation Boundary Tests
- [ ] **Off-canvas creation tests:**
  - Create rectangle at x=-1000, y=-1000 (negative coordinates)
  - Create circle at x=10000, y=10000 (far positive coordinates)
  - Verify shapes are created but clamped or tracked correctly
  - Test pan to find off-canvas shapes
  - **Success:** Shapes created anywhere don't cause crashes
  - **Test:** Can navigate to and select off-canvas shapes
  - **Edge Case:** Negative coordinates vs canvas coordinate system

- [ ] **Minimum size enforcement:**
  - Create circle by clicking without dragging (radius = 0)
  - Verify minimum radius enforced (10px)
  - Create rectangle with 1px drag
  - Verify minimum width/height enforced (10x10px)
  - Create text with empty string
  - Verify default text appears or creation prevented
  - **Success:** All shapes have minimum viable size
  - **Test:** No 0-size or 1px shapes exist
  - **Edge Case:** What happens with text containing only whitespace?

- [ ] **Extreme zoom coordinate precision:**
  - Zoom to 0.1x (minimum)
  - Create rectangle at apparent position 100,100
  - Verify actual coordinates are correct (accounting for zoom)
  - Zoom to 5.0x (maximum)
  - Create circle, verify coordinates don't overflow
  - **Success:** Coordinate precision maintained at all zoom levels
  - **Test:** Shape positions are mathematically correct
  - **Edge Case:** Floating point precision errors at extreme scales

### 2.21.2 Delete Operation Stress Tests
- [ ] **Delete during other operations:**
  - Start creating shape (mouse down, dragging preview)
  - Press Delete key while preview active
  - Verify no crash, preview cancelled or ignored
  - Start dragging existing shape
  - Press Delete while dragging
  - Verify safe behavior (either delete or ignore)
  - **Success:** Delete never crashes during other operations
  - **Test:** All combinations of delete + other operation
  - **Edge Case:** Delete during Firebase sync (debounce window)

- [ ] **Empty canvas state:**
  - Delete the last shape on canvas
  - Verify empty state UI appears (if designed)
  - Verify no JavaScript errors
  - Try to delete again (nothing selected)
  - Verify graceful handling
  - **Success:** Empty canvas is valid, stable state
  - **Test:** Can create shapes after deleting all
  - **Edge Case:** Canvas with 0 objects syncs correctly to Firestore

- [ ] **Rapid deletion stress test:**
  - Create 50 shapes
  - Spam Delete key 100 times rapidly
  - Verify debouncing/throttling works
  - Check for memory leaks
  - Verify Firestore write quota not exceeded
  - **Success:** Rapid deletes handled gracefully
  - **Test:** No more than 10 Firestore writes/second
  - **Edge Case:** Queue fills up, oldest deletes dropped?

### 2.21.3 Duplicate Operation Edge Cases
- [ ] **Rapid duplication test:**
  - Select single shape
  - Press Cmd+D 100 times rapidly
  - Verify not all duplicates created (debounce works)
  - Check memory usage doesn't spike
  - Verify Firestore write quota respected
  - **Success:** Duplicates created reasonably (max 20-30)
  - **Test:** No memory leaks, no quota exceeded
  - **Edge Case:** What's the rate limit on duplicates?

- [ ] **Boundary offset test:**
  - Create shape at x=5000, y=5000 (near edge)
  - Duplicate 10 times (offset +20,+20 each time)
  - Verify duplicates don't go to infinity
  - Option A: Offset wraps to stay in bounds
  - Option B: Offset allowed off-canvas
  - **Success:** Defined, predictable behavior
  - **Test:** Document what happens at boundaries
  - **Edge Case:** Duplicate at canvas limits

- [ ] **Duplicate-then-delete race condition:**
  - Select shape
  - Press Cmd+D (duplicate starts)
  - Immediately press Delete (within debounce window)
  - Verify both operations don't conflict
  - Check if original deleted, duplicate survives
  - **Success:** Atomic operations, no race condition
  - **Test:** Result is predictable and correct
  - **Edge Case:** Debounce windows overlap

### 2.21.4 Keyboard Shortcut Conflicts
- [ ] **Multiple modifiers:**
  - Press Cmd+Ctrl+D simultaneously (Mac + Windows combo)
  - Verify only one interpretation
  - Test with all modifier combinations
  - **Success:** Unambiguous shortcut handling
  - **Test:** Each combo has single defined behavior
  - **Edge Case:** International keyboards (Option/Alt keys)

- [ ] **Browser extension conflicts:**
  - Install Grammarly, LastPass (common extensions)
  - Test all keyboard shortcuts
  - Verify preventDefault() works
  - Check if extensions intercept first
  - **Success:** Most shortcuts work despite extensions
  - **Test:** Document any known conflicts
  - **Edge Case:** Some extensions may be unblockable

- [ ] **Shortcuts during modal animations:**
  - Open ShortcutsModal
  - Immediately press V (select tool)
  - Verify shortcut doesn't fire during animation
  - Close modal (animating out)
  - Press R (rectangle tool)
  - Verify appropriate behavior
  - **Success:** Shortcuts disabled during modal lifecycle
  - **Test:** Modal captures focus correctly
  - **Edge Case:** Rapid modal open/close

### 2.21.5 Zoom and Pan Edge Cases
- [ ] **Extreme zoom with many objects:**
  - Create 100+ shapes
  - Zoom to 5.0x (maximum)
  - Pan around canvas
  - Verify 60 FPS maintained
  - Verify no object rendering glitches
  - **Success:** Performance acceptable at max zoom
  - **Test:** Frame rate stable
  - **Edge Case:** Text rendering may slow down at high zoom

- [ ] **Rapid zoom in/out clicking:**
  - Click zoom in button 20 times rapidly
  - Verify debouncing works (max 5.0x enforced)
  - Click zoom out button 20 times rapidly
  - Verify min 0.1x enforced
  - **Success:** Zoom limits respected, no overshoot
  - **Test:** Zoom changes are smooth, not janky
  - **Edge Case:** Mouse wheel + button clicks simultaneously

- [ ] **Zoom + create shape coordination:**
  - Zoom to 3.0x
  - Create rectangle with circle tool active
  - Verify coordinates calculated correctly
  - Verify shape size appropriate for zoom level
  - **Success:** Shape creation works at any zoom
  - **Test:** Shapes appear where clicked visually
  - **Edge Case:** Stage transform affects mouse coordinates

### 2.21.6 Mobile Touch Gesture Conflicts
- [ ] **Three-finger gesture (iOS screenshot):**
  - Use three fingers on canvas while dragging shape
  - Verify shape drag cancelled gracefully
  - Test iOS screenshot gesture doesn't break state
  - **Success:** App recovers from unexpected gestures
  - **Test:** State remains consistent
  - **Edge Case:** iOS-specific gestures

- [ ] **Screen rotation during interaction:**
  - Start dragging shape in portrait mode
  - Rotate device to landscape mid-drag
  - Verify shape position updated correctly
  - Verify drag continues or cancels gracefully
  - **Success:** Rotation doesn't break interactions
  - **Test:** Canvas resizes, shapes stay positioned
  - **Edge Case:** Orientation change event timing

- [ ] **Home button during canvas interaction:**
  - Start creating shape
  - Press home button (app backgrounds)
  - Return to app
  - Verify state recovered correctly
  - Verify preview cleared or operation resumed
  - **Success:** Backgrounding preserves state
  - **Test:** No zombie operations or ghost shapes
  - **Edge Case:** iOS vs Android backgrounding behavior

- [ ] **Simultaneous pinch + pan:**
  - Start pinch-to-zoom gesture
  - While pinching, start panning (moving fingers parallel)
  - Verify gesture priority is clear
  - Option A: Pinch takes precedence
  - Option B: Transitions to pan when fingers parallel
  - **Success:** One gesture wins, no jittery behavior
  - **Test:** Visual feedback is smooth
  - **Edge Case:** Touch event interpretation ambiguity

### 2.21.7 Firebase Quota and Limit Tests
- [ ] **Approach document size limit:**
  - Create shapes until array approaches 1MB (Firestore doc limit)
  - Estimate: ~5000-10000 simple shapes
  - Monitor document size in Firestore console
  - Verify graceful handling at 900KB (warning threshold)
  - Test what happens at 1MB (write fails?)
  - **Success:** App warns before hitting limit
  - **Test:** Users notified of approaching limit
  - **Edge Case:** Need to implement pagination or multiple docs

- [ ] **Firestore write quota test:**
  - Simulate 50,000 document writes (daily quota for free tier)
  - Monitor quota in Firebase console
  - Verify app handles "quota exceeded" error
  - Test retry logic backs off appropriately
  - **Success:** Quota exceeded handled gracefully
  - **Test:** User sees error message, operations queued
  - **Edge Case:** How long to wait before retrying?

- [ ] **Concurrent write contention:**
  - Open 5 browser windows as different users
  - All users create/delete/move shapes simultaneously
  - Monitor for write conflicts in Firestore
  - Verify last-write-wins is acceptable
  - Check for any data loss scenarios
  - **Success:** No data corruption, all writes eventually succeed
  - **Test:** Final state is consistent across all clients
  - **Edge Case:** Thundering herd problem with 10+ users

- [ ] **Very large object properties:**
  - Create text shape with 10,000 character string
  - Verify Firestore write succeeds
  - Verify performance doesn't degrade
  - Test sync time within acceptable limits
  - **Success:** Large text shapes handled correctly
  - **Test:** <1 second sync time even for large objects
  - **Edge Case:** Text with special characters, emojis

### 2.21.8 Error Recovery and Data Persistence
- [ ] **Offline queue overflow:**
  - Go offline
  - Create 100+ operations (create, delete, move shapes)
  - Verify queue has size limit (prevent memory issues)
  - Go back online
  - Verify queue flushes in order
  - **Success:** Queue limited to reasonable size (100-500 operations)
  - **Test:** Oldest operations dropped if queue full (FIFO)
  - **Edge Case:** User offline for days, creates 1000s of operations

- [ ] **Auth token expiration during retry:**
  - Start operation that requires Firebase auth
  - Invalidate auth token (log out in another tab)
  - Verify retry logic detects auth failure
  - Verify user prompted to re-authenticate
  - **Success:** Auth errors handled differently than network errors
  - **Test:** User can re-auth without losing queued operations
  - **Edge Case:** Refresh token also expired

- [ ] **Browser storage full (IndexedDB quota):**
  - Fill IndexedDB to 80% quota (use browser tools)
  - Enable Firestore persistence
  - Create shapes (persistence tries to cache)
  - Verify graceful degradation (persistence disabled?)
  - **Success:** App continues working without persistence
  - **Test:** User notified storage full, online-only mode
  - **Edge Case:** Different quota on different browsers

- [ ] **Partial Firestore document corruption:**
  - Manually corrupt one shape in Firestore (invalid type)
  - Verify app handles corrupted data gracefully
  - Verify other shapes still render
  - Verify corrupted shape skipped or repaired
  - **Success:** One bad shape doesn't break entire canvas
  - **Test:** Error logged, user potentially notified
  - **Edge Case:** How to repair or remove corrupted data?

### 2.21.9 Performance Under Stress
- [ ] **1000+ objects on canvas:**
  - Create 1000 mixed shapes (333 rectangles, 333 circles, 334 text)
  - Measure initial render time (target: <3 seconds)
  - Pan canvas, measure FPS (target: 30-60 FPS)
  - Zoom in/out, measure FPS (target: 30-60 FPS)
  - Create new shape, measure lag (target: <100ms)
  - **Success:** Acceptable performance with 1000 objects
  - **Test:** Chrome Performance profiler
  - **Edge Case:** May need virtualization or culling for >1000 objects

- [ ] **Memory leak detection:**
  - Open canvas page
  - Create 100 shapes
  - Delete all shapes
  - Repeat 10 times
  - Monitor memory in Chrome Task Manager
  - Verify memory returns to baseline (no leak)
  - **Success:** Memory usage stable over time
  - **Test:** No continuous memory growth
  - **Edge Case:** Event listeners properly cleaned up?

- [ ] **Slow network simulation:**
  - Chrome DevTools: set network to "Slow 3G"
  - Create 20 shapes
  - Verify all shapes eventually sync
  - Monitor sync indicator accuracy
  - Verify no timeout errors
  - **Success:** App usable on slow network
  - **Test:** Offline queue handles slow uploads
  - **Edge Case:** Network so slow writes time out (60s?)

---

## Phase 2 Success Criteria

Phase 2 is complete when:

1. ✅ **All validation checklist items above pass**
2. ✅ **Demo-ready:** You can show: "Create circles, text, rectangles → Delete/duplicate with keyboard → Mobile friendly → Smooth animations"
3. ✅ **Feature complete:** 3 shape types, delete, duplicate, keyboard shortcuts, zoom controls, mobile support all work
4. ✅ **Performance targets met:** 60 FPS with 100+ objects, <100ms sync, smooth animations
5. ✅ **No console errors in production**
6. ✅ **Mobile tested:** Works on iOS Safari and Android Chrome
7. ✅ **Deployed and publicly accessible**
8. ✅ **Code follows architecture:** Vertical slices, ≤500 lines/file, proper imports, JSDoc comments

**When all complete, commit with:**
```
feat: Complete Phase 2 - Enhanced Canvas with multiple shapes and operations

- Add circle and text shape types with creation tools
- Implement delete and duplicate operations with keyboard shortcuts
- Add comprehensive keyboard shortcuts system (V,R,C,T,Del,Cmd+D,Esc)
- Improve toolbar organization with sections and dividers
- Add zoom controls UI (in, out, reset)
- Implement smooth UI animations (toolbar, selection, cursors)
- Add loading states and toast notifications
- Implement error recovery with retry logic and offline queue
- Optimize mobile touch support (44px targets, gestures)
- Improve landing page with hero and features
- Optimize canvas performance (layer separation, caching, batching)
- All features tested cross-browser and mobile
- Maintain 60 FPS with 100+ objects

Phase 2 deliverables complete. Ready for Phase 3 (AI Canvas Agent).
```

---

## Phase 2 File Structure (Updated)

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
│   ├── canvas-core/
│   │   ├── components/
│   │   │   ├── CanvasStage.tsx
│   │   │   └── index.ts
│   │   ├── shapes/
│   │   │   ├── Rectangle.tsx
│   │   │   ├── Circle.tsx           # ← NEW
│   │   │   ├── TextShape.tsx        # ← NEW
│   │   │   └── index.ts
│   │   ├── hooks/
│   │   │   ├── useShapeCreation.ts  # ← UPDATED (circle, text)
│   │   │   └── index.ts
│   │   └── utils/
│   │       ├── coordinates.ts
│   │       ├── shapeDefaults.ts     # ← NEW
│   │       ├── objectHelpers.ts     # ← NEW (duplicate logic)
│   │       └── index.ts
│   ├── collaboration/
│   │   ├── components/
│   │   │   ├── Cursor.tsx           # ← UPDATED (fade-in)
│   │   │   ├── ActiveUsers.tsx
│   │   │   └── index.ts
│   │   ├── hooks/
│   │   │   ├── useCursors.ts
│   │   │   ├── usePresence.ts
│   │   │   └── index.ts
│   │   └── utils/
│   └── toolbar/
│       ├── components/
│       │   ├── Toolbar.tsx          # ← UPDATED (organized sections)
│       │   ├── ToolButton.tsx       # ← NEW
│       │   ├── ToolbarDivider.tsx   # ← NEW
│       │   ├── ZoomControls.tsx     # ← NEW
│       │   └── index.ts
│       └── hooks/
│           ├── useToolShortcuts.ts  # ← UPDATED (all shortcuts)
│           └── index.ts
├── components/
│   └── common/
│       ├── Loading.tsx
│       ├── ErrorBoundary.tsx
│       ├── SyncIndicator.tsx        # ← NEW
│       ├── ShortcutsModal.tsx       # ← NEW
│       └── index.ts
├── stores/
│   ├── canvasStore.ts               # ← UPDATED (removeObject action)
│   ├── toolStore.ts                 # ← UPDATED (circle, text tools)
│   └── index.ts
├── lib/
│   ├── firebase/
│   │   ├── config.ts
│   │   ├── auth.ts
│   │   ├── canvasService.ts         # ← UPDATED (retry logic)
│   │   ├── cursorService.ts
│   │   ├── presenceService.ts
│   │   ├── offlineQueue.ts          # ← NEW
│   │   └── index.ts
│   └── utils/
│       ├── debounce.ts
│       ├── throttle.ts
│       ├── retry.ts                 # ← NEW
│       ├── deviceDetection.ts       # ← NEW
│       └── index.ts
├── types/
│   ├── auth.types.ts
│   ├── canvas.types.ts              # ← UPDATED (Circle, TextShape)
│   ├── tool.types.ts                # ← UPDATED (circle, text)
│   └── index.ts
├── constants/
│   ├── keyboardShortcuts.ts         # ← NEW
│   └── index.ts
├── pages/
│   ├── LandingPage.tsx              # ← UPDATED (hero, features)
│   └── CanvasPage.tsx
└── styles/
    ├── globals.css
    └── animations.css               # ← NEW (if needed)
```

---

## How to Use This Checklist

1. **Work sequentially** - Don't skip ahead, each task builds on previous
2. **Test each task** - Verify before checking off
3. **Watch for edge cases** - Listed with each task
4. **Use context7 MCP** - For all library documentation
5. **Use Firebase MCP** - For all Firebase operations
6. **Build incrementally** - Everything should work after each task
7. **Commit frequently** - After each major section (2.1, 2.2, etc.)

---

## Progress Tracking

Track your progress:
- **Phase 0:** 50 / 50 tasks complete ✅
- **Phase 1:** ~100 / ~100 tasks complete ✅ (pending validation)
- **Phase 2:** ___ / ~120 tasks complete
- **Phase 3:** Not yet added

**Total Project:** ___ / 270+ tasks complete

---

## Verification Before Moving to Next Phase

**Before Phase 2:** All Phase 1 tasks checked ✅
**Before Phase 3:** All Phase 2 tasks checked ✅
**Project Complete:** All tasks checked ✅

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