# Project Overview: CollabCanvas

## Project Purpose

CollabCanvas is a real-time collaborative design canvas that enables multiple users to simultaneously create and manipulate simple shapes on a shared workspace. The project demonstrates the core technical infrastructure required for building multiplayer design tools, similar to Figma's collaborative canvas.

**Primary Goal:** Prove that collaborative infrastructure works flawlessly before adding advanced features.

## Problem Statement

Building real-time collaborative tools requires solving complex technical challenges:
- Real-time synchronization across multiple users
- Conflict resolution when users edit simultaneously
- Maintaining 60 FPS performance while streaming data over the network
- Persistent state management across disconnects

This project focuses on solving these foundational multiplayer challenges with a simple, working implementation.

## Core Objectives

### MVP Success Criteria (24-Hour Checkpoint)
The MVP must demonstrate:

1. **Real-Time Collaboration**
   - Multiple users editing simultaneously without conflicts
   - Instant synchronization of changes across all clients
   - Multiplayer cursors with username labels
   - Presence awareness (who's online)

2. **Basic Canvas Functionality**
   - Pan and zoom controls
   - Create at least one shape type (rectangle, circle, or text)
   - Move objects around the canvas
   - Selection and manipulation of objects

3. **Core Infrastructure**
   - User authentication (users have accounts/names)
   - State persistence (survives browser refresh)
   - Deployed and publicly accessible
   - Supports 2-5 concurrent users minimum

### Performance Requirements

- **60 FPS** during all interactions (pan, zoom, object manipulation)
- **<150ms** sync latency for object changes (50ms throttle + 50-100ms network)
- **<150ms** sync latency for cursor positions (50ms throttle + 50-100ms network)
- Support **500+ simple objects** without FPS drops
- Support **5+ concurrent users** without degradation

**Note**: Achieving <50ms sync requires custom WebSocket infrastructure. Firebase Realtime Database provides 100-150ms total latency, which is excellent for collaborative editing.

## Project Scope

### In Scope for MVP
- Pan/zoom canvas navigation
- Single shape type creation (rectangle, circle, OR text)
- Basic object manipulation (move only)
- Real-time cursor synchronization
- Object creation/movement synchronization
- User authentication
- Presence system (online users)
- State persistence
- Public deployment

### Explicitly Out of Scope for MVP
- Multiple shape types (pick ONE)
- Resize/rotate transformations
- Multi-select functionality
- Layer management
- Delete/duplicate operations
- Undo/redo
- Styling options (colors, borders, opacity)
- Keyboard shortcuts
- AI agent integration (later phase)
- Chat or comments
- Permissions/roles

## Technical Constraints

### Performance
- Must maintain 60 FPS during all interactions
- Sub-150ms synchronization for object updates (realistic with Firebase)
- Sub-150ms synchronization for cursor positions (realistic with Firebase)

### Scalability
- Support minimum 5 concurrent users
- Handle 500+ objects on canvas without degradation
- Graceful handling of disconnects/reconnects

### Timeline
- **MVP Deadline:** 24 hours from start
- **Testing Approach:** Multiple browser windows, simulated network conditions, rapid simultaneous edits

## Success Validation

The MVP passes if all of the following are true:

1. ✅ 2 users can edit simultaneously in different browsers
2. ✅ One user can refresh mid-edit without losing canvas state
3. ✅ Multiple shapes can be created and moved rapidly with visible sync
4. ✅ Multiplayer cursors appear with name labels
5. ✅ Application is deployed and publicly accessible
6. ✅ Performance maintains 60 FPS during interactions
7. ✅ Users must authenticate to access canvas

## Key Principles

**Vertical Development:** Build one complete feature at a time rather than many half-finished features.

**Multiplayer First:** Real-time synchronization is the hardest part and must be proven early. A simple canvas with perfect multiplayer beats a feature-rich canvas with broken sync.

**Test Continuously:** Use multiple browser windows, throttle network speed, test with multiple users performing simultaneous actions.

## Project Context

This is a one-week sprint project for Gauntlet AI with three key deadlines:
- **MVP:** Tuesday (24 hours) - HARD GATE
- **Early Submission:** Friday (4 days)
- **Final Submission:** Sunday (7 days)

The MVP focuses exclusively on collaborative infrastructure. Later phases will add AI agent integration for natural language canvas manipulation, but that is NOT part of the initial MVP scope.

---

**Core Philosophy:** A simple, solid, multiplayer canvas beats a feature-rich app with broken collaboration.