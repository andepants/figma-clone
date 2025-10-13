# CollabCanvas

A real-time collaborative canvas application enabling multiple users to simultaneously create and manipulate shapes on a shared workspace. Built with modern web technologies and designed with an AI-first codebase architecture.

## Overview

CollabCanvas is a proof-of-concept for collaborative design tools, demonstrating the core technical infrastructure required for building multiplayer applications similar to Figma. The project focuses on solving complex real-time synchronization challenges with clean, maintainable code.

**Core Philosophy:** A simple, solid, multiplayer canvas beats a feature-rich app with broken collaboration.

## Key Features

- **Real-Time Collaboration**: Multiple users can edit simultaneously with instant synchronization
- **Multiplayer Cursors**: See other users' cursors with username labels
- **Presence Awareness**: Track who's online in real-time
- **Canvas Navigation**: Smooth pan and zoom controls
- **Shape Manipulation**: Create and move shapes with 60 FPS performance
- **State Persistence**: All changes are automatically saved and survive browser refreshes
- **User Authentication**: Secure email/password authentication

## Tech Stack

### Frontend
- **React 18+** - Functional components with hooks
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Konva.js** - High-performance 2D canvas rendering
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Accessible UI components
- **Zustand** - Lightweight state management
- **React Router v6** - Client-side routing

### Backend & Real-Time
- **Firebase Authentication** - Email/password auth
- **Cloud Firestore** - Canvas objects persistence
- **Firebase Realtime Database** - Cursor positions & presence
- **Firebase Hosting** - Static site hosting

## Architecture

### Vertical Slice Architecture
CollabCanvas uses a feature-based organization:
- **Features** � **Stores** � **Services** (no circular dependencies)
- Multiple focused Zustand stores (canvas, auth, ui)
- Real-time sync with optimized update frequencies:
  - Firestore for objects (500ms debounce)
  - Realtime DB for cursors (50ms throttle)

### Code Organization
- **Max 500 lines per file** - Split into smaller modules if exceeded
- **Descriptive names** - Files and functions clearly indicate their purpose
- **JSDoc comments** - All files have headers; all functions have documentation
- **Functional patterns** - Use `function` keyword; avoid classes
- **Feature-based structure** - Organize by feature (canvas, collaboration, toolbar)

## Project Structure

**Vertical Slice Architecture:** Features are self-contained with their own components, hooks, and utilities.

```
src/
   features/            # Feature slices (vertical architecture)
      auth/            # Authentication feature
         components/   # AuthModal, LoginForm, ProtectedRoute
         hooks/        # useAuth
         utils/        # Auth helpers
      canvas-core/     # Canvas rendering feature
         components/   # CanvasStage, CanvasLayer
         shapes/       # Rectangle, Circle, Text components
         hooks/        # useCanvas, useShapes
         utils/        # Canvas calculations
      collaboration/   # Real-time multiplayer feature
         components/   # Cursor, PresenceList
         hooks/        # usePresence, useCursors
         utils/        # Cursor calculations
      toolbar/         # Tools and controls feature
         components/   # Toolbar, ToolButton
         hooks/        # useSelectedTool
      ai-agent/        # AI commands (Phase 3)
         components/   # AIPanel, AIChat
         hooks/        # useAI
         utils/        # AI parsing
   components/         # Shared components ONLY
      ui/              # shadcn/ui primitives (Button, Dialog)
      common/          # Generic components (Loading, Error)
      layout/          # Page layouts (AppLayout, CanvasLayout)
   pages/              # Top-level route components
   stores/             # Zustand stores (shared state)
   lib/                # Infrastructure services
      firebase/        # Firebase config and services
      canvas/          # Canvas utilities
      utils/           # General utilities
   types/              # Shared TypeScript types
   constants/          # App constants
   styles/             # Global styles
```

**Key Principle:** If only one feature needs it, it lives in that feature. If multiple features need it, it's shared.
## Performance Targets

| Metric | Target |
|--------|--------|
| Canvas FPS | 60 FPS |
| Object Sync | <100ms |
| Cursor Sync | <50ms |
| Initial Load | <3s |
| Concurrent Users | 5+ without degradation |
| Canvas Objects | 500+ without FPS drops |

## Development Conventions

### Code Style
- Functional and declarative patterns
- Descriptive variable names with auxiliary verbs (isLoading, hasError)
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

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd figma-clone
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure Firebase**

   a. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)

   b. Enable the following services:
   - **Authentication** → Email/Password provider
   - **Firestore Database** → Start in test mode
   - **Realtime Database** → Start in test mode

   c. Register a web app in Project Settings

   d. Copy your Firebase configuration

4. **Set up environment variables**
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

**⚠️ Important:** Never commit `.env` to version control. The `.env.example` file provides the template.

5. **Start the development server**
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

### Firebase Hosting Setup

1. **Install Firebase CLI** (if not already installed)
```bash
npm install -g firebase-tools
```

2. **Login to Firebase**
```bash
firebase login
```

3. **Initialize Firebase Hosting** (if not already done)
```bash
firebase init hosting
```
- Select your existing project
- Set public directory to `dist`
- Configure as single-page app: Yes
- Set up automatic builds: No

4. **Deploy to Firebase Hosting**
```bash
npm run deploy
```

Your app will be live at `https://your-project-id.web.app`

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

### Canvas Interactions
- **Pan**: Click and drag background
- **Zoom**: Mouse wheel
- **Create Shape**: Click shape button, then click canvas
- **Move Shape**: Click and drag any shape
- **Real-Time Sync**: See other users' changes instantly

## Design Principles

- **Canvas-First**: Workspace dominates, minimal UI chrome
- **Figma-Inspired**: Minimalist design with subtle shadows and soft borders
- **Fast Feedback**: Optimistic updates with <100ms sync
- **60 FPS Always**: Smooth rendering during all interactions
- **Functional Color**: 90% neutral grays, color only for actions/states

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

feat(canvas): add circle shape support
fix(auth): resolve login redirect loop
refactor(hooks): split useCanvas into smaller hooks
```

## Testing

Run tests:
```bash
npm test
```

Test coverage:
```bash
npm run test:coverage
```

## Contributing

This is an AI-first codebase designed for easy understanding and modification:

1. Keep files under 500 lines
2. Document all exports with JSDoc
3. Use descriptive names
4. Follow single responsibility principle
5. Write tests for new features

## License

[License Type] - See LICENSE file for details

## Acknowledgments

Built as part of Gauntlet AI project sprint, demonstrating real-time collaborative infrastructure for design tools.

---

**Note**: This project prioritizes collaborative infrastructure over feature richness. The goal is to prove that multiplayer synchronization works flawlessly before adding advanced features.
