# CollabCanvas

A production-ready real-time collaborative canvas application enabling multiple users to simultaneously create and manipulate shapes on a shared workspace. Built with modern web technologies and designed with an AI-first codebase architecture.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## Overview

CollabCanvas is a proof-of-concept for collaborative design tools, demonstrating the core technical infrastructure required for building multiplayer applications similar to Figma. The project focuses on solving complex real-time synchronization challenges with clean, maintainable code.

**Core Philosophy:** A simple, solid, multiplayer canvas beats a feature-rich app with broken collaboration.

**Live Demo:** [figma-clone-d33e3.web.app](https://figma-clone-d33e3.web.app)

## Key Features

### Real-Time Collaboration
- **Multiplayer Cursors**: See other users' cursors with username labels in real-time (50ms sync)
- **Live Presence**: Track who's online with automatic disconnect detection and presence dropdown
- **Selection Indicators**: Visual overlays show which objects other users are selecting
- **Drag Indicators**: See real-time feedback when users move objects
- **Resize Indicators**: See live resize operations from other users with dimension overlays
- **Drag Locking**: Prevent conflicts when multiple users try to edit the same object
- **User Colors**: Each user gets a unique, deterministic color for easy identification
- **Active Users Panel**: Properties panel showing all online collaborators with avatars

### Canvas Features
- **Multiple Shape Types**: Rectangle, Circle, and Text shapes with full editing support
- **Shape Manipulation**: Click, drag, resize, rotate, and flip shapes with smooth interactions
- **Resize Handles**: Corner handles for precise resizing with aspect ratio locking
- **Properties Panel**: Real-time editing of position, size, rotation, appearance, and typography
- **Advanced Shape Controls**: Corner radius, opacity, fill color, and text styling
- **Pan & Zoom**: Smooth canvas navigation with mouse wheel zoom and spacebar panning
- **Touch Gestures**: Pinch-to-zoom support for mobile devices
- **60 FPS Rendering**: High-performance canvas using Konva.js with optimized layers
- **State Persistence**: All changes automatically saved to Firebase Realtime Database
- **Optimistic Updates**: Instant local feedback before server sync

### User Experience
- **Secure Authentication**: Email/password authentication via Firebase Auth
- **Auto-reconnect**: Automatic presence recovery on network reconnection
- **Responsive Design**: Works on desktop and tablet devices
- **Keyboard Shortcuts**: Efficient tool switching and canvas controls
- **Clean UI**: Minimalist, Figma-inspired interface with canvas-first design

### Technical Excellence
- **Sub-100ms Object Sync**: Canvas objects sync within 100ms using Firebase Realtime DB
- **Intelligent Debouncing**: 500ms debounce on shape updates to reduce database writes
- **Throttled Cursors**: 50ms throttle on cursor updates for smooth real-time tracking
- **Automatic Cleanup**: Presence system auto-removes disconnected users
- **Optimized Rendering**: Layer-based Konva architecture with React.memo optimization

## Tech Stack

### Frontend
- **React 19+** - Latest features with functional components and hooks
- **TypeScript 5.9** - Type-safe development with strict mode
- **Vite 7** - Lightning-fast build tool and dev server
- **Konva.js 10** - High-performance 2D canvas rendering
- **React Konva 19** - React bindings for Konva
- **Tailwind CSS 4** - Utility-first styling with JIT compiler
- **shadcn/ui** - Accessible, customizable UI components
- **Zustand 5** - Lightweight state management (stores for canvas, tools)
- **React Router 7** - Client-side routing with data APIs

### Backend & Real-Time Infrastructure
- **Firebase Authentication** - Secure email/password authentication
- **Firebase Realtime Database** - Real-time sync for canvas objects, cursors, and presence
- **Firebase Hosting** - Global CDN with automatic SSL
- **GitHub Actions** - Automated CI/CD pipeline

### Development Tools
- **ESLint 9** - Code quality and consistency
- **TypeScript ESLint** - TypeScript-specific linting rules
- **Vite Plugin React** - Fast refresh and JSX support

## Architecture

### Vertical Slice Architecture
CollabCanvas uses a feature-based organization for maximum maintainability:

```
Features → Stores → Services (no circular dependencies)
```

- **Multiple focused Zustand stores**: Canvas state, tool state (not global god objects)
- **Real-time sync optimization**:
  - Firebase Realtime DB for objects (100ms sync target)
  - Firebase Realtime DB for cursors (50ms throttle)
  - Firebase Realtime DB for presence (auto-disconnect on network drop)

### Code Organization
- **Max 500 lines per file** - Split into smaller modules when exceeded
- **Descriptive names** - Files and functions clearly indicate their purpose
- **JSDoc comments** - All files have headers; all functions have documentation
- **Functional patterns** - Use `function` keyword; avoid classes
- **Feature-based structure** - Organize by feature (canvas, collaboration, toolbar)

### Real-Time Data Flow

```
User Action
    ↓
Local State Update (Optimistic)
    ↓
Firebase Realtime DB Write (Debounced)
    ↓
Firebase onValue Listener
    ↓
Remote Users Update (< 100ms)
```

## Project Structure

**Vertical Slice Architecture:** Features are self-contained with their own components, hooks, and utilities.

```
src/
├── features/              # Feature slices (vertical architecture)
│   ├── auth/             # Authentication feature
│   │   ├── components/   # AuthModal, LoginForm, SignupForm, ProtectedRoute
│   │   ├── hooks/        # useAuth
│   │   └── utils/        # Auth helpers
│   ├── canvas-core/      # Canvas rendering feature
│   │   ├── components/   # CanvasStage, ResizeHandles, ResizeHandle
│   │   ├── shapes/       # Rectangle, Circle, TextShape with drag/resize
│   │   ├── hooks/        # useShapeCreation, useResize, useTouchGestures, useSpacebarPan
│   │   └── utils/        # Coordinate transformations, screen-to-canvas conversion
│   ├── collaboration/    # Real-time multiplayer feature
│   │   ├── components/   # Cursor, AvatarStack, UserAvatar, SelectionOverlay, RemoteResizeOverlay
│   │   ├── hooks/        # usePresence, useCursors, useRemoteSelections, useDragStates, useRemoteResizes
│   │   └── utils/        # Color assignment (deterministic user colors)
│   ├── properties-panel/ # Shape properties editing feature
│   │   ├── components/   # PropertiesPanel, PositionSection, LayoutSection, RotationSection,
│   │   │                 # AppearanceSection, TypographySection, FillSection
│   │   ├── hooks/        # useSelectedShape, usePropertyUpdate, useShapeDimensions
│   │   └── utils/        # Section visibility, validation helpers
│   ├── toolbar/          # Tools and controls feature
│   │   ├── components/   # Toolbar, ToolButton, ZoomControls
│   │   └── hooks/        # useToolShortcuts
│   └── ai-agent/         # AI commands (Phase 3 - future)
│       ├── components/   # AIPanel, AIChat
│       ├── hooks/        # useAI
│       └── utils/        # AI parsing
├── components/           # Shared components ONLY
│   ├── ui/              # shadcn/ui primitives (Button, Dialog, Label)
│   ├── common/          # Generic components (Loading, Error)
│   └── layout/          # Page layouts (AppLayout, CanvasLayout)
├── pages/               # Top-level route components
│   ├── Landing.tsx      # Marketing/signup page
│   └── Canvas.tsx       # Main canvas workspace
├── stores/              # Zustand stores (shared state)
│   ├── canvasStore.ts   # Canvas objects, view state
│   └── toolStore.ts     # Selected tool, tool settings
├── lib/                 # Infrastructure services
│   ├── firebase/        # Firebase config, auth, realtime services
│   ├── canvas/          # Canvas utilities
│   └── utils/           # General utilities
├── types/               # Shared TypeScript types
├── constants/           # App constants
└── styles/              # Global styles
```

**Key Principle:** If only one feature needs it, it lives in that feature. If multiple features need it, it's shared.

## Performance Targets

| Metric | Target | Status |
|--------|--------|--------|
| Canvas FPS | 60 FPS | ✅ Achieved |
| Object Sync | <100ms | ✅ Achieved |
| Cursor Sync | <50ms | ✅ Achieved |
| Initial Load | <3s | ✅ Achieved |
| Concurrent Users | 5+ without degradation | ✅ Achieved |
| Canvas Objects | 500+ without FPS drops | 🚧 In Progress |

## Development Conventions

### Code Style
- Functional and declarative patterns
- Descriptive variable names with auxiliary verbs (`isLoading`, `hasError`)
- No enums; use maps or union types
- Avoid unnecessary curly braces in conditionals
- Prefer iteration and modularization over duplication

### File Organization
- **Components**: `PascalCase.tsx`
- **Hooks**: `useCamelCase.ts`
- **Utils**: `camelCase.ts`
- **Types**: `camelCase.types.ts`
- Barrel exports (`index.ts`) in every directory

### Documentation Requirements
- File header comments explaining purpose
- JSDoc/TSDoc for all exported functions
- Inline comments for complex logic
- Examples in documentation for complex usage

### Import Order
1. External libraries (React, Firebase, etc.)
2. Internal aliases (`@/...`)
3. Relative imports (`./`, `../`)
4. Type imports (separate at bottom)

## Getting Started

### Prerequisites
- **Node.js 18+** and npm
- **Firebase account** with a project created
- **Git** for version control

### Local Development Setup

#### 1. Clone the repository
```bash
git clone https://github.com/your-username/figma-clone.git
cd figma-clone
```

#### 2. Install dependencies
```bash
npm install
```

#### 3. Configure Firebase

a. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)

b. Enable the following services:
   - **Authentication** → Email/Password provider
   - **Realtime Database** → Start in test mode (or use the provided rules)

c. Register a web app in Project Settings

d. Copy your Firebase configuration

#### 4. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` with your Firebase configuration values:

```env
VITE_FIREBASE_API_KEY="your_api_key_here"
VITE_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_DATABASE_URL="https://your-project-default-rtdb.firebaseio.com"
VITE_FIREBASE_STORAGE_BUCKET="your-project.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="your_sender_id"
VITE_FIREBASE_APP_ID="your_app_id"
```

**Important:** Never commit `.env` to version control. The `.env.example` file provides the template.

#### 5. Start the development server

```bash
npm run dev
```

The app will be available at `http://localhost:5173` (or another port if 5173 is in use).

### Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build production bundle to `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint for code quality |
| `npm run deploy` | Build and deploy to Firebase Hosting |

## Deployment

### Manual Deployment to Firebase Hosting

#### 1. Install Firebase CLI (if not already installed)
```bash
npm install -g firebase-tools
```

#### 2. Login to Firebase
```bash
firebase login
```

#### 3. Initialize Firebase Hosting (if not already done)
```bash
firebase init hosting
```
- Select your existing project
- Set public directory to `dist`
- Configure as single-page app: **Yes**
- Set up automatic builds: **No**

#### 4. Deploy to Firebase Hosting
```bash
npm run deploy
```

Your app will be live at `https://your-project-id.web.app`

---

### Automated Deployment via GitHub Actions (Recommended)

This project includes automated CI/CD pipelines for both production and preview deployments.

#### Setup Instructions

##### 1. Add Firebase Service Account to GitHub

a. Generate a service account key:
```bash
firebase login:ci
```
Copy the token that is generated.

b. Go to your GitHub repository:
   - Navigate to **Settings** → **Secrets and variables** → **Actions**
   - Click **New repository secret**
   - Name: `FIREBASE_SERVICE_ACCOUNT_FIGMA_CLONE_D33E3` (or your project ID)
   - Value: Paste the token

##### 2. Add Firebase Environment Variables to GitHub Secrets

Add each of these as a **repository secret**:

| Secret Name | Description |
|-------------|-------------|
| `VITE_FIREBASE_API_KEY` | Your Firebase API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Your Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Your Firebase project ID |
| `VITE_FIREBASE_DATABASE_URL` | Your Realtime Database URL |
| `VITE_FIREBASE_STORAGE_BUCKET` | Your Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Your messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Your Firebase app ID |

**Why are environment variables needed?**
Vite bakes environment variables into the build at build-time, not runtime. GitHub Actions needs these secrets to build your app with the correct Firebase configuration.

##### 3. Automated Workflows

**Production Deployment (deploy.yml)**
- Triggers on push to `main` branch
- Builds with production environment variables
- Deploys to Firebase Hosting live channel
- URL: `https://your-project-id.web.app`

**Preview Deployment (preview.yml)**
- Triggers on pull request creation/update
- Builds with production environment variables
- Deploys to temporary preview channel (expires in 7 days)
- Posts preview URL as PR comment

#### Monitoring Deployments

1. Go to **Actions** tab in your GitHub repository
2. See deployment status for each commit/PR
3. Click on any workflow run to see detailed logs
4. Firebase Hosting URLs are provided in the action summary

## User Flow

### New User
1. Visit landing page
2. Click "Get Started"
3. Sign up with email/password
4. Redirected to canvas workspace

### Returning User
1. Visit site (auto-authenticated)
2. Directly access canvas workspace
3. Continue editing from previous session
4. See other online users immediately

### Canvas Interactions
- **Pan**: Click and drag background, or hold spacebar and drag
- **Zoom**: Mouse wheel (Cmd/Ctrl + scroll) or pinch gesture on touch devices
- **Create Shapes**: Click shape tool button (Rectangle, Circle, Text), then drag on canvas
- **Move Shape**: Select move tool, then click and drag any shape
- **Resize Shape**: Click shape to select, then drag corner handles to resize
- **Edit Properties**: Select a shape to view and edit properties in the right panel
- **Rotate Shape**: Use rotation slider in properties panel for precise control
- **Flip Shape**: Use flip buttons in properties panel for horizontal/vertical flipping
- **See Collaborators**: View cursors, selections, and resize operations of all online users in real-time
- **Real-Time Sync**: See other users' changes within 100ms

## Design Principles

- **Canvas-First**: Workspace dominates, minimal UI chrome
- **Figma-Inspired**: Minimalist design with subtle shadows and soft borders
- **Fast Feedback**: Optimistic updates with <100ms sync
- **60 FPS Always**: Smooth rendering during all interactions
- **Functional Color**: 90% neutral grays, color only for actions/states
- **Accessible**: Keyboard shortcuts, semantic HTML, ARIA labels

## Development Workflow

### Branch Naming
- `main` - Production code
- `feature/[name]` - New features
- `fix/[name]` - Bug fixes
- `refactor/[scope]` - Code refactoring
- `docs/[topic]` - Documentation updates

### Commit Messages
Follow conventional commits:
```
type(scope): brief description

Examples:
feat(canvas): add circle shape support
fix(auth): resolve login redirect loop
refactor(hooks): split useCanvas into smaller hooks
docs(readme): update deployment instructions
```

### Pull Request Process
1. Create feature branch from `main`
2. Make changes with clear commits
3. Push to GitHub (triggers preview deployment)
4. Open PR with description of changes
5. Review preview deployment URL
6. Merge to `main` (triggers production deployment)

## Firebase Security Rules

### Realtime Database Rules
```json
{
  "rules": {
    "canvases": {
      "$canvasId": {
        "objects": {
          ".read": "auth != null",
          ".write": "auth != null"
        },
        "cursors": {
          ".read": "auth != null",
          "$userId": {
            ".write": "$userId === auth.uid"
          }
        },
        "presence": {
          ".read": "auth != null",
          "$userId": {
            ".write": "$userId === auth.uid"
          }
        }
      }
    }
  }
}
```

These rules ensure:
- Only authenticated users can access canvas data
- Users can only write their own cursor and presence data
- All users can read shared canvas objects

## Troubleshooting

### Environment Variables Not Working in Production
**Problem:** Error: "Missing required environment variable: VITE_FIREBASE_API_KEY"

**Solution:**
1. Verify all Firebase environment variables are added as GitHub Secrets
2. Check that workflow files include `env:` block in build step
3. Rebuild and redeploy after adding secrets

### Presence Not Updating
**Problem:** Users appear online but don't disconnect when they leave

**Solution:**
- Firebase Realtime Database handles disconnection automatically via `onDisconnect()`
- Check Firebase Console → Realtime Database → Data to verify presence nodes
- Ensure users are authenticated (presence requires auth)

### Canvas Objects Not Syncing
**Problem:** Shapes created by one user don't appear for others

**Solution:**
1. Check Firebase Realtime Database rules allow authenticated read/write
2. Verify `VITE_FIREBASE_DATABASE_URL` is set correctly
3. Check browser console for Firebase permission errors
4. Ensure all users are viewing the same canvas ID (hardcoded to "main" currently)

## Roadmap

### Phase 1: Foundation ✅ Complete
- [x] Authentication system
- [x] Basic canvas rendering
- [x] Rectangle shape creation
- [x] Real-time multiplayer cursors
- [x] Presence system with auto-disconnect
- [x] Canvas object persistence
- [x] Selection and drag indicators
- [x] CI/CD pipeline

### Phase 2: Shape Manipulation & Properties ✅ Complete
- [x] Circle and text shape support
- [x] Shape selection and editing with visual feedback
- [x] Resize handles with anchor-based resizing
- [x] Aspect ratio locking for rectangles and circles
- [x] Rotation controls with degree precision
- [x] Horizontal and vertical flipping
- [x] Properties panel with real-time editing
- [x] Position controls (X, Y coordinates)
- [x] Layout controls (Width, Height, Radius)
- [x] Appearance controls (Opacity, Corner Radius)
- [x] Typography controls (Font Size, Family, Weight, Style, Alignment)
- [x] Fill color picker with preset palette
- [x] Zoom and pan controls (mouse wheel + spacebar)
- [x] Touch gesture support (pinch-to-zoom)
- [x] Remote resize indicators for collaboration
- [x] Drag conflict resolution with locking

### Phase 3: Advanced Features 📋 Planned
- [ ] AI-powered shape generation
- [ ] Comments and annotations
- [ ] Version history
- [ ] Export to PNG/SVG
- [ ] Team workspaces
- [ ] Real-time voice chat

## Contributing

This is an AI-first codebase designed for easy understanding and modification:

1. Keep files under 500 lines
2. Document all exports with JSDoc
3. Use descriptive names
4. Follow single responsibility principle
5. Write tests for new features
6. Update README when adding major features

### Contributing Guidelines
1. Fork the repository
2. Create a feature branch
3. Make your changes with clear commits
4. Ensure all linting passes (`npm run lint`)
5. Open a PR with a clear description
6. Wait for preview deployment to verify changes

## Testing

### Manual Testing Checklist
- [ ] Authentication: Sign up, log in, log out
- [ ] Canvas: Create shapes, move shapes, pan canvas
- [ ] Collaboration: Open in two browsers, verify cursors sync
- [ ] Presence: Verify users appear/disappear when joining/leaving
- [ ] Persistence: Refresh page, verify shapes remain

### Automated Testing (Future)
```bash
npm test              # Run all tests
npm run test:coverage # Generate coverage report
npm run test:e2e      # Run end-to-end tests
```

## Performance Optimization

### Current Optimizations
- React.memo on Konva shape components
- Throttled cursor updates (50ms)
- Debounced object updates (500ms)
- Layer-based rendering (separate layers for shapes vs UI)
- Zustand for minimal re-renders

### Future Optimizations
- Virtual rendering for 500+ objects
- WebSocket connection pooling
- Service worker for offline support
- IndexedDB for local caching

## License

MIT License - See LICENSE file for details

## Acknowledgments

Built as part of Gauntlet AI project sprint, demonstrating real-time collaborative infrastructure for design tools.

**Tech Stack Inspiration:**
- [Figma](https://figma.com) - Real-time collaboration UX patterns
- [Excalidraw](https://excalidraw.com) - Open-source collaborative whiteboard
- [tldraw](https://tldraw.com) - Infinite canvas architecture

**Special Thanks:**
- Firebase team for excellent real-time infrastructure
- Konva.js community for high-performance canvas rendering
- shadcn for beautiful, accessible UI components

---

**Production URL:** https://figma-clone-d33e3.web.app

**Note:** This project prioritizes collaborative infrastructure over feature richness. The goal is to prove that multiplayer synchronization works flawlessly before adding advanced features.

**Questions or Issues?** Open an issue on GitHub or reach out to the maintainers.
