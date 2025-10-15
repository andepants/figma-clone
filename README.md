# CollabCanvas

> **Real-time collaborative canvas with AI-powered design** — Create, collaborate, and design with natural language commands.

**[Live Demo →](https://figma-clone-d33e3.web.app)**

## What is CollabCanvas?

A production-grade Figma clone built to explore real-time collaboration and AI-assisted design. Multiple users can simultaneously create and manipulate shapes with <100ms sync latency. What sets it apart: an **AI Canvas Agent** that executes natural language commands like "create a login form" or "arrange these in a grid."

## Key Features

- **AI Canvas Agent** — Create complex UIs with natural language (powered by Claude 3.5 Haiku)
- **Real-time Collaboration** — Sub-100ms sync for cursors, selections, and object updates
- **Professional Canvas** — Konva.js rendering at 60 FPS with zoom, pan, and layer optimization
- **Hierarchy & Locking** — Parent-child relationships, object grouping, Figma-style lock behavior
- **Advanced Editing** — Properties panel, multi-select, drag-to-arrange, line shapes, typography controls

## Tech Stack & Strategic Decisions

| Technology | Why We Chose It |
|------------|-----------------|
| **React 19 + TypeScript** | Type safety, latest hooks, performance optimizations |
| **Konva.js** | Canvas rendering without WebGL complexity, proven at scale |
| **Firebase Realtime DB** | <100ms sync, simpler than Firestore for frequent updates ([decision doc](_docs/decisions/realtime-db-vs-firestore.md)) |
| **Zustand** | 10x lighter than Redux, perfect for focused stores (canvas, tools, auth, AI) |
| **Vertical Slice Architecture** | Features → Stores → Services (no circular deps, easy to navigate) |
| **Claude 3.5 Haiku** | 3x faster than GPT-4o-mini, better tool use, lower cost |

## Quick Start

```bash
npm install
cp .env.example .env  # Add your Firebase config (see _docs/setup/api-keys.md)
npm run emulators     # Terminal 1: Firebase emulators (Auth + RTDB)
npm run dev           # Terminal 2: Vite dev server
```

Open [http://localhost:5173](http://localhost:5173) and start creating. Try the AI agent with `Ctrl/Cmd + K`.

**First time?** See [Setup Guide](_docs/setup/quick-start.md) for Firebase project creation and API keys.

## Architecture

**Vertical Slice Architecture** — No circular dependencies, feature-based organization:

```
src/
├── features/        # Self-contained slices (canvas, toolbar, ai-agent, layers-panel)
├── stores/          # Zustand stores (canvasStore, authStore, aiStore)
├── services/        # Firebase utilities (auth, database, storage)
└── lib/             # Shared utilities (no business logic)
```

**Real-time Sync Model:**
- **Last Write Wins** — No operational transforms, optimistic updates, automatic conflict resolution
- **50ms throttle** — Batches cursor/object updates to minimize Firebase writes
- **Layer-based rendering** — 3-5 Konva layers (background, objects, selection, cursors)

See [Architecture Overview](_docs/architecture/overview.md) for details.

## AI Canvas Agent

The standout feature. Describe what you want, AI creates it:

```
"Create a login form"
→ Generates username field, password field, submit button, labels, proper spacing

"Arrange these 6 cards in a 2x3 grid with 20px spacing"
→ Calculates positions, moves all objects, maintains alignment

"Make the blue rectangle 50% bigger and move it to the center"
→ Resizes, repositions, updates properties
```

**How it works:**
- Frontend sends command + canvas state to Firebase Function
- LangChain agent (Claude 3.5 Haiku) interprets command and chooses tools
- Tools execute operations (create, move, resize, arrange, etc.)
- Changes sync to all clients via Firebase RTDB in <100ms

See [AI Canvas Agent](_docs/features/ai-canvas-agent.md) for examples and [AI System Architecture](_docs/architecture/ai-system.md) for internals.

## Development Philosophy

**AI-First Codebase:**
- **Max 500 lines per file** — Split into smaller modules when exceeded
- **Descriptive names** — Files/functions clearly indicate purpose
- **JSDoc everywhere** — File headers, function documentation
- **Functional patterns** — Pure functions over classes
- **No cruft** — No unused code, no premature abstractions

See [CLAUDE.md](CLAUDE.md) for full development guide.

## Documentation

- **Setup:** [Quick Start](_docs/setup/quick-start.md) | [API Keys](_docs/setup/api-keys.md) | [Development Environment](_docs/setup/development-environment.md)
- **Features:** [AI Agent](_docs/features/ai-canvas-agent.md) | [Hierarchy System](_docs/features/hierarchy-system.md) | [Lock System](_docs/features/lock-system.md)
- **Architecture:** [Overview](_docs/architecture/overview.md) | [AI System](_docs/architecture/ai-system.md)
- **Testing:** [Manual Testing Guide](_docs/testing/manual-testing-guide.md)

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server (port 5173) |
| `npm run emulators` | Start Firebase emulators (Auth + RTDB + Functions) |
| `npm run build` | Build for production |
| `npm run deploy` | Deploy to Firebase Hosting |

## Project Status

**Production-ready MVP** with active development:
- ✅ Real-time collaboration
- ✅ AI Canvas Agent
- ✅ Hierarchy & locking
- ✅ Advanced editing tools
- 🚧 Voice input for AI
- 🚧 Multi-turn AI conversations
- 🚧 Code export (HTML/CSS/SVG)

## License

MIT — Use freely, attribution appreciated.
