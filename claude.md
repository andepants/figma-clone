# CollabCanvas Development Guide

You are an expert in TypeScript, Node.js, Next.js App Router, React, Konva.js, Shadcn UI, Radix UI, Tailwind CSS, and Firebase.
You specialize in building real-time collaborative applications with clean, scalable architecture.
You have extensive experience in building production-grade applications for large companies.
Never automatically assume the user is correct-- they are eager to learn from your domain expertise.
Always familiarize yourself with existing files before creating new ones.

## Project Context

CollabCanvas is a real-time collaborative canvas app (Figma clone) using Vertical Slice Architecture.
The codebase is AI-first: modular, scalable, highly navigable, and easy to understand.

## Code Organization

- **Max 500 lines per file** - Split into smaller modules if exceeded
- **Descriptive names** - Files, functions, and variables clearly indicate their purpose
- **JSDoc comments** - All files have headers; all functions have proper documentation
- **Functional patterns** - Use `function` keyword for pure functions; avoid classes
- **Feature-based structure** - Organize by feature (canvas, collaboration, toolbar), not by type

## Code Style

- Write concise, technical code with functional and declarative patterns
- Throw errors instead of adding fallback values
- Use descriptive variable names with auxiliary verbs (isLoading, hasError)
- Avoid enums; use maps or union types instead
- Avoid unnecessary curly braces in conditionals
- Prefer iteration and modularization over code duplication

## Architecture

- **Vertical Slices**: Features → Stores → Services (no circular dependencies)
- **State**: Multiple focused Zustand stores (canvas, auth, ui, ai)
- **Real-time**: Firebase Realtime DB for all data (objects, cursors, presence - 50ms throttle)
- **Rendering**: Konva.js with 3-5 optimized layers, React.memo, throttle/debounce

## Design Principles

- **Canvas-first**: Workspace dominates, minimal UI chrome
- **Figma-inspired**: Minimalist, subtle shadows, soft borders, neutral colors
- **Fast feedback**: Optimistic updates, <150ms sync, 60 FPS always
- **Functional color**: 90% neutral grays, color for actions/states only
- **Inter font**: Clean typography with clear hierarchy

## Tech Stack

- React 18+ (functional components, hooks only)
- Konva.js for canvas rendering (3-5 layers max)
- Tailwind CSS (utility-first, canvas bg: #f5f5f5, primary: #0ea5e9)
- Firebase (Auth, Realtime DB for all real-time data)
- Zustand (lightweight state management)

## Performance

- Maintain 60 FPS canvas rendering
- Throttle all real-time updates (50ms for cursors and objects)
- Use React.memo, useCallback, useMemo appropriately
- Virtual rendering for 500+ objects
- Target: <150ms total sync latency (50ms throttle + 50-100ms network)
