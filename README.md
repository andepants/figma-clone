# CollabCanvas

**Live Demo:** [figma-clone-d33e3.web.app](https://figma-clone-d33e3.web.app)

A real-time collaborative canvas app (Figma clone) where multiple users can simultaneously create and manipulate shapes with seamless synchronization.

## Tech Stack

- **React 19** + **TypeScript** + **Vite**
- **Konva.js** - High-performance 2D canvas rendering
- **Firebase** - Realtime Database for <100ms sync, Authentication, Hosting
- **Zustand** - Lightweight state management
- **Tailwind CSS** + **shadcn/ui** - Modern UI components

## Features

- Real-time multiplayer cursors, selections, and presence (50ms sync)
- Shape creation and manipulation (rectangles, circles, text)
- Properties panel for position, size, rotation, appearance, and typography
- Pan, zoom, and touch gesture support
- Optimistic updates with automatic conflict resolution
- 60 FPS canvas rendering with layer-based optimization

## Quick Start

```bash
npm install
cp .env.example .env  # Add your Firebase config
npm run dev
```

See detailed setup instructions in the [Getting Started](#getting-started) section below.

---

## Getting Started

### Prerequisites
- Node.js 18+
- Firebase project with Authentication and Realtime Database enabled

### Setup

1. Clone and install:
```bash
git clone https://github.com/your-username/figma-clone.git
cd figma-clone
npm install
```

2. Configure Firebase:
   - Create a project at [console.firebase.google.com](https://console.firebase.google.com)
   - Enable Authentication (Email/Password) and Realtime Database
   - Copy your Firebase config to `.env`:

```bash
cp .env.example .env
```

3. Start dev server:
```bash
npm run dev
```

### Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run deploy` | Deploy to Firebase Hosting |

## Architecture

Built with **Vertical Slice Architecture** for maximum maintainability:

```
Features → Stores → Services (no circular dependencies)
```

- Feature-based organization (auth, canvas, collaboration, toolbar)
- Multiple focused Zustand stores (canvas, tools)
- Firebase Realtime DB for all real-time data
- Functional patterns with strict TypeScript

## License

MIT
