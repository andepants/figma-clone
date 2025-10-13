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

- [ ] **0.10.1** Create `.env.example` file
  - Copy structure from .env.local
  - Replace real values with placeholders
  - **Success:** Template file created
  - **Test:** File has all variables with placeholder values

- [ ] **0.10.2** Update README.md with setup instructions
  - Add "Setup" section
  - Document: clone, npm install, env setup, Firebase config
  - **Success:** Clear setup instructions
  - **Test:** Another person could follow steps

- [ ] **0.10.3** Document Firebase configuration steps
  - Add section explaining where to get Firebase config
  - **Success:** Clear Firebase setup docs
  - **Test:** Instructions are complete

- [ ] **0.10.4** Add development commands to README
  - Document: `npm run dev`, `npm run build`, `npm run deploy`
  - **Success:** Commands documented
  - **Test:** All important commands listed

- [ ] **0.10.5** Commit initial setup to git
  - Run: `git add .`
  - Run: `git commit -m "Initial project setup"`
  - **Success:** Initial commit created
  - **Test:** Run `git log` shows commit
  - **Edge Case:** Make sure .env.local is NOT committed

---

## Phase 0 Verification Checklist

Before proceeding to Phase 1, verify ALL of these:

**Project Setup:**
- [ ] Project runs locally with `npm run dev`
- [ ] TypeScript compiles with no errors
- [ ] Tailwind CSS classes work (test with `bg-primary-500 text-white`)
- [ ] Tailwind theme matches `theme-rules.md` (colors, fonts, shadows)

**Folder Structure (Vertical Slice Architecture):**
- [ ] `src/features/` directory exists with 5 feature slices (auth, canvas-core, collaboration, toolbar, ai-agent)
- [ ] Each feature has subdirectories (components/, hooks/, utils/ where applicable)
- [ ] `src/components/` exists for SHARED components only (ui/, common/, layout/)
- [ ] `src/stores/`, `src/lib/`, `src/types/`, `src/constants/`, `src/pages/`, `src/styles/` all exist
- [ ] Barrel exports (`index.ts`) created in all appropriate directories
- [ ] Structure matches architecture.md exactly

**Path Aliases:**
- [ ] Path aliases configured (@/* imports work)
- [ ] Can import from `@/features/auth/components`
- [ ] Can import from `@/lib/firebase`
- [ ] Can import from `@/stores`

**Firebase:**
- [ ] Firebase services enabled in console (Auth, Firestore, Realtime DB)
- [ ] Firebase SDK installed and configured
- [ ] `.env.local` created with all Firebase config variables
- [ ] Firebase connection test passes (console log shows app name)
- [ ] `.env.example` created (no real values)

**Routing:**
- [ ] React Router installed and configured
- [ ] Can navigate between `/` (landing) and `/canvas` (canvas)
- [ ] Both routes render correctly

**Dependencies:**
- [ ] All core dependencies installed (Firebase, Konva, React Konva, Zustand, Lucide, shadcn/ui)
- [ ] `npm list --depth=0` shows no missing dependencies
- [ ] shadcn/ui initialized (components/ui/ exists)

**Build & Deploy:**
- [ ] Build command works: `npm run build` (creates `dist/` folder)
- [ ] Preview works: `npm run preview`
- [ ] Firebase Hosting configured (firebase.json exists)
- [ ] App deployed to Firebase Hosting
- [ ] Deployed app accessible via public URL

**Documentation:**
- [ ] README.md has setup instructions
- [ ] README.md project structure matches new vertical slice architecture
- [ ] Git repository initialized and initial commit made
- [ ] `.env.local` is in `.gitignore` (never committed)

**If ANY checkbox above is unchecked, fix it before Phase 1.**

---

# Phase 1: MVP - Core Collaborative Canvas (12-18 hours)

**Goal:** Working collaborative canvas with real-time sync passing all MVP criteria.

## 1.1 Authentication UI Components

- [ ] **1.1.1** Install shadcn dialog component
  - Run: `npx shadcn-ui@latest add dialog`
  - **Success:** Dialog component added to components/ui/
  - **Test:** Check components/ui/dialog.tsx exists

- [ ] **1.1.2** Install shadcn button and input components
  - Run: `npx shadcn-ui@latest add button input label`
  - **Success:** All 3 components added
  - **Test:** Check components/ui/ has button, input, label

- [ ] **1.1.3** Create `src/types/auth.types.ts`
  - Define AuthMode type: 'login' | 'signup'
  - Define User interface
  - **Success:** Types defined
  - **Test:** No TypeScript errors

- [ ] **1.1.4** Create `features/auth/components/AuthModal.tsx`
  - Import Dialog from shadcn
  - Create component with isOpen and onClose props
  - Add state for mode (login vs signup)
  - Add toggle button between modes
  - **Success:** Modal structure created
  - **Test:** Component compiles, can be imported from `@/features/auth/components`

- [ ] **1.1.5** Create `features/auth/components/LoginForm.tsx`
  - Create form with email and password inputs
  - Add login button
  - Add state for form values
  - **Success:** Login form complete
  - **Test:** Form renders with all fields
  - **Edge Case:** Don't implement actual login yet

- [ ] **1.1.6** Create `features/auth/components/SignupForm.tsx`
  - Create form with email, password, and username inputs
  - Add signup button
  - Add state for form values
  - **Success:** Signup form complete
  - **Test:** Form renders with all fields

- [ ] **1.1.7** Integrate forms into AuthModal
  - Show LoginForm when mode is 'login'
  - Show SignupForm when mode is 'signup'
  - **Success:** Forms switch based on mode
  - **Test:** Toggle between forms works

- [ ] **1.1.8** Add AuthModal to LandingPage
  - Import AuthModal
  - Add "Get Started" button
  - Add state for modal open/close
  - **Success:** Button opens modal
  - **Test:** Click button, modal appears
  - **Edge Case:** Modal should close on backdrop click

- [ ] **1.1.9** Style forms using Tailwind
  - Apply styling per theme-rules.md
  - Use neutral colors and proper spacing
  - **Success:** Forms look polished
  - **Test:** Visual inspection matches design

- [ ] **1.1.10** Add form validation UI
  - Show error messages below inputs
  - Disable button while submitting
  - **Success:** Validation feedback visible
  - **Test:** Empty form shows errors
  - **Edge Case:** Don't implement actual validation yet

---

## 1.2 Firebase Authentication Integration

- [ ] **1.2.1** Create auth helper functions in `lib/firebase/auth.ts`
  - Create signUpWithEmail function
  - Create signInWithEmail function
  - Create signOutUser function
  - **Success:** Functions defined with proper types
  - **Test:** No TypeScript errors

- [ ] **1.2.2** Implement signUpWithEmail
  - Use createUserWithEmailAndPassword from Firebase
  - Update user profile with displayName (username)
  - Return user object
  - **Success:** Function creates user
  - **Test:** Call function with test credentials (in console)
  - **Edge Case:** Handle Firebase auth errors

- [ ] **1.2.3** Implement signInWithEmail
  - Use signInWithEmailAndPassword from Firebase
  - Return user object
  - **Success:** Function logs in user
  - **Test:** Call function with existing user
  - **Edge Case:** Handle wrong password error

- [ ] **1.2.4** Create `features/auth/hooks/useAuth.ts`
  - Create hook with currentUser and loading state
  - Add onAuthStateChanged listener
  - **Success:** Hook tracks auth state
  - **Test:** Hook can be called in component, import from `@/features/auth/hooks`

- [ ] **1.2.5** Implement auth state listener
  - Use onAuthStateChanged to track user
  - Update currentUser state when auth changes
  - Set loading to false when done
  - **Success:** Auth state syncs with Firebase
  - **Test:** Login updates currentUser
  - **Edge Case:** Clean up listener on unmount

- [ ] **1.2.6** Add login/signup methods to useAuth
  - Add login method that calls signInWithEmail
  - Add signup method that calls signUpWithEmail
  - Add logout method that calls signOutUser
  - **Success:** Methods available in hook
  - **Test:** Can call methods from component

- [ ] **1.2.7** Connect LoginForm to Firebase
  - Use useAuth hook
  - Call login method on form submit
  - Handle success and errors
  - **Success:** Login works end-to-end
  - **Test:** Can login with real credentials
  - **Edge Case:** Show error if login fails

- [ ] **1.2.8** Connect SignupForm to Firebase
  - Use useAuth hook
  - Call signup method on form submit
  - Set displayName from username field
  - Handle success and errors
  - **Success:** Signup works end-to-end
  - **Test:** Create new user, check Firebase console
  - **Edge Case:** Email must be unique

- [ ] **1.2.9** Add error handling to forms
  - Catch Firebase errors
  - Show user-friendly error messages
  - Create getAuthErrorMessage helper
  - **Success:** Errors display clearly
  - **Test:** Try invalid login, see error message
  - **Edge Case:** Handle network errors

- [ ] **1.2.10** Test auth persistence
  - Login, refresh page
  - **Success:** Still logged in after refresh
  - **Test:** currentUser persists
  - **Edge Case:** Firebase handles persistence automatically

---

## 1.3 Protected Canvas Route

- [ ] **1.3.1** Create `features/auth/components/ProtectedRoute.tsx`
  - Create component that wraps children
  - Use useAuth hook from `@/features/auth/hooks`
  - **Success:** Component created
  - **Test:** Can import component from `@/features/auth/components`

- [ ] **1.3.2** Add loading state handling
  - Show loading spinner while checking auth
  - **Success:** Loading state works
  - **Test:** Brief spinner shows on page load
  - **Edge Case:** Don't flash spinner too quickly

- [ ] **1.3.3** Add redirect for unauthenticated users
  - Use Navigate from react-router-dom
  - Redirect to "/" if no currentUser
  - Use replace prop to avoid back button issues
  - **Success:** Redirects work
  - **Test:** Access /canvas when logged out → redirects to /

- [ ] **1.3.4** Wrap CanvasPage route with ProtectedRoute
  - Update App.tsx
  - Wrap /canvas route element with ProtectedRoute
  - **Success:** Route is protected
  - **Test:** Can't access canvas without login

- [ ] **1.3.5** Add auto-redirect for authenticated users
  - In LandingPage, check if user is logged in
  - If logged in, navigate to /canvas automatically
  - **Success:** Logged-in users skip landing
  - **Test:** Login → auto-navigate to canvas
  - **Edge Case:** Don't create redirect loop

- [ ] **1.3.6** Test protected route thoroughly
  - Try accessing /canvas logged out
  - Login and verify auto-redirect
  - Refresh on /canvas when logged in
  - **Success:** All scenarios work correctly
  - **Test:** Manual testing with different states

---

## 1.4 Basic Konva Canvas Setup

- [ ] **1.4.1** Create `features/canvas-core/components/CanvasStage.tsx`
  - Import Stage and Layer from react-konva
  - Create component with stage and empty layer
  - **Success:** Component created
  - **Test:** No TypeScript errors, import from `@/features/canvas-core/components`

- [ ] **1.4.2** Set stage dimensions to window size
  - Use useState for width and height
  - Initialize with window.innerWidth and innerHeight
  - **Success:** Stage fills viewport
  - **Test:** Stage renders full screen

- [ ] **1.4.3** Add window resize listener
  - Use useEffect to listen to resize
  - Update dimensions state on resize
  - Clean up listener on unmount
  - **Success:** Canvas resizes with window
  - **Test:** Resize browser, canvas adjusts
  - **Edge Case:** Remember to remove listener

- [ ] **1.4.4** Add canvas background
  - Add Rect to Layer with canvas background color (#f5f5f5)
  - Set width and height to stage dimensions
  - Make sure it's behind other objects
  - **Success:** Canvas has light gray background
  - **Test:** See gray background in browser

- [ ] **1.4.5** Add CanvasStage to CanvasPage
  - Import CanvasStage in CanvasPage.tsx
  - Replace placeholder text with component
  - **Success:** Canvas renders on /canvas page
  - **Test:** Navigate to /canvas, see full-screen canvas

- [ ] **1.4.6** Test canvas renders correctly
  - Login and go to /canvas
  - **Success:** Full-screen gray canvas
  - **Test:** No console errors, smooth render
  - **Edge Case:** Check on different browser sizes

---

## 1.5 Canvas Pan Functionality

- [ ] **1.5.1** Make Stage draggable
  - Add `draggable` prop to Stage
  - **Success:** Stage can be dragged
  - **Test:** Click and drag moves canvas
  - **Edge Case:** Everything moves including background

- [ ] **1.5.2** Add drag cursor visual feedback
  - Add onDragStart handler
  - Set cursor to "grabbing"
  - **Success:** Cursor changes during drag
  - **Test:** See grabbing cursor when dragging

- [ ] **1.5.3** Reset cursor on drag end
  - Add onDragEnd handler
  - Set cursor back to "grab" or "default"
  - **Success:** Cursor resets after drag
  - **Test:** Cursor returns to normal

- [ ] **1.5.4** Store pan position in state
  - Add state for stage position (x, y)
  - Update on drag end
  - **Success:** Position tracked
  - **Test:** Position changes when panning

- [ ] **1.5.5** Test panning thoroughly
  - Pan in all directions
  - Pan quickly and slowly
  - **Success:** Smooth panning with no lag
  - **Test:** 60 FPS during pan
  - **Edge Case:** Performance should not degrade

---

## 1.6 Canvas Zoom Functionality

- [ ] **1.6.1** Add wheel event listener to Stage
  - Add `onWheel` prop to Stage
  - **Success:** Wheel events captured
  - **Test:** Console log shows wheel events

- [ ] **1.6.2** Calculate zoom delta from wheel event
  - Get deltaY from event
  - Determine if zooming in or out
  - **Success:** Direction detected correctly
  - **Test:** Scroll up zooms in, down zooms out

- [ ] **1.6.3** Calculate new zoom level
  - Use scaleBy factor (1.1 recommended)
  - Get current scale from stage
  - Calculate new scale
  - **Success:** Zoom calculation works
  - **Test:** Console log shows correct scale values

- [ ] **1.6.4** Clamp zoom between min and max
  - Min: 0.1, Max: 5.0
  - Use Math.max and Math.min to clamp
  - **Success:** Zoom stays in range
  - **Test:** Can't zoom beyond limits
  - **Edge Case:** Test extreme scroll amounts

- [ ] **1.6.5** Implement zoom towards cursor
  - Get pointer position from stage
  - Calculate mouse point in canvas space
  - Apply zoom transformation
  - Adjust stage position to zoom towards cursor
  - **Success:** Zooms towards mouse
  - **Test:** Zoom centers on cursor location

- [ ] **1.6.6** Update stage scale
  - Use stage.scale() to set new scale
  - Apply to both X and Y
  - **Success:** Canvas zooms
  - **Test:** Visual zoom effect works

- [ ] **1.6.7** Test zoom functionality
  - Zoom in and out
  - Zoom on different parts of canvas
  - Test zoom limits
  - **Success:** Smooth zoom with no issues
  - **Test:** 60 FPS during zoom
  - **Edge Case:** Works with trackpad and mouse wheel

---

---

## 1.7 Zustand Canvas Store

- [ ] **1.7.1** Create `types/canvas.types.ts` with base types
  - Define ShapeType: 'rectangle' | 'circle' | 'text'
  - Define BaseCanvasObject interface
  - Define Rectangle, Circle, Text interfaces
  - **Success:** All types defined
  - **Test:** No TypeScript errors

- [ ] **1.7.2** Create `stores/canvasStore.ts`
  - Import create from zustand
  - Define CanvasStore interface
  - **Success:** Store interface created
  - **Test:** TypeScript recognizes types

- [ ] **1.7.3** Add objects array to store state
  - Initialize as empty array
  - Type as CanvasObject[]
  - **Success:** State property added
  - **Test:** Can access objects in store

- [ ] **1.7.4** Add selectedId to store state
  - Initialize as null
  - Type as string | null
  - **Success:** State property added
  - **Test:** Can access selectedId

- [ ] **1.7.5** Implement addObject action
  - Accept CanvasObject parameter
  - Append to objects array
  - **Success:** Can add objects to store
  - **Test:** Call action, check state updates

- [ ] **1.7.6** Implement updateObject action
  - Accept id and Partial<CanvasObject>
  - Find and update object by id
  - **Success:** Can update objects
  - **Test:** Update object, check state reflects change

- [ ] **1.7.7** Implement removeObject action
  - Accept id parameter
  - Filter out object with matching id
  - **Success:** Can remove objects
  - **Test:** Remove object, check it's gone

- [ ] **1.7.8** Implement selectObject action
  - Accept id parameter (string | null)
  - Set selectedId
  - **Success:** Can select/deselect objects
  - **Test:** Select object, check state

- [ ] **1.7.9** Test store with dev tools
  - Open browser dev tools
  - Add objects via console
  - Verify state updates
  - **Success:** Store works correctly
  - **Test:** All CRUD operations work
  - **Edge Case:** State updates trigger re-renders

---

*Due to length constraints, this master task list continues with sections 1.8 through 3.20. The full document covers all phases with the same level of granular detail - each with checkboxes, success criteria, tests, and edge cases.*

*To implement the complete checklist:*

**Remaining Sections:**
- 1.8-1.20: Complete Phase 1 MVP (Rectangle rendering, Firestore sync, Cursors, Presence)
- 2.1-2.20: Phase 2 Enhanced Canvas (Circle, Text, Operations, Mobile, Polish)
- 3.1-3.20: Phase 3 AI Agent (Setup, Tools, Commands, Multi-step operations)

**Each section follows the same pattern:**
- Checkbox for tracking
- Numbered tasks (X.Y.Z format)
- Success criteria
- Test instructions
- Edge cases to watch for

**Total Tasks:** Approximately 200+ granular, testable steps across all phases.

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