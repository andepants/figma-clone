# Tech Stack: CollabCanvas

## Stack Overview

| Category | Technology | Purpose |
|----------|------------|---------|
| **Language** | TypeScript | Type-safe JavaScript with better DX |
| **UI Library** | React 18+ | Component-based UI |
| **Build Tool** | Vite | Fast dev server and building |
| **Canvas Rendering** | Konva.js + react-konva | 2D canvas manipulation |
| **Styling** | Tailwind CSS | Utility-first CSS framework |
| **Components** | shadcn/ui | Pre-built accessible components |
| **State Management** | Zustand | Lightweight global state |
| **Backend - Real-time** | Firebase Realtime Database | Cursor positions, presence |
| **Backend - Persistence** | Cloud Firestore | Canvas objects storage |
| **Authentication** | Firebase Authentication | User management |
| **Routing** | React Router v6 | Client-side routing |
| **Deployment** | Firebase Hosting | Static site hosting |

---

## 1. TypeScript

### What We're Using
- **Version:** TypeScript 5+
- **Config:** Strict mode enabled

### Best Practices

**Type Everything:**
```typescript
// Good
interface CanvasObject {
  id: string;
  type: 'rectangle' | 'circle' | 'text';
  x: number;
  y: number;
  width?: number;
  height?: number;
}

// Bad - using 'any'
const object: any = { ... };
```

**Use Type Inference:**
```typescript
// Good - let TypeScript infer
const count = 0; // inferred as number
const items = canvasObjects.map(obj => obj.id); // inferred as string[]

// Avoid over-typing when not needed
const count: number = 0; // unnecessary
```

**Prefer Interfaces for Objects:**
```typescript
// Good for object shapes
interface User {
  id: string;
  email: string;
  username: string;
}

// Use type for unions
type ShapeType = 'rectangle' | 'circle' | 'text';
```

### Common Pitfalls

❌ **Don't use 'any'** - defeats the purpose of TypeScript
❌ **Don't ignore TS errors** - fix them, don't suppress with @ts-ignore
❌ **Don't over-complicate types** - keep them readable
✅ **Do use 'unknown' instead of 'any' when type is truly unknown**
✅ **Do leverage TypeScript with Firebase** - use typed collections

### Limitations
- Build time slightly longer than plain JavaScript
- Learning curve for advanced types
- Some libraries have poor TypeScript support (use @types packages)

---

## 2. React 18+

### What We're Using
- **Version:** React 18+
- **Paradigm:** Functional components with Hooks

### Best Practices

**Functional Components Only:**
```typescript
// Good
function CanvasToolbar() {
  return <div>...</div>;
}

// Bad - no class components
class CanvasToolbar extends React.Component { ... }
```

**Use Hooks Properly:**
```typescript
// Good
function Canvas() {
  const [selectedObject, setSelectedObject] = useState<string | null>(null);

  useEffect(() => {
    // Side effects here
  }, [dependencies]);

  return <Stage>...</Stage>;
}
```

**Avoid Unnecessary Re-renders:**
```typescript
// Use React.memo for expensive components
const CursorLabel = React.memo(({ username, x, y }) => {
  return <Text text={username} x={x} y={y} />;
});

// Use useCallback for functions passed to children
const handleObjectClick = useCallback((id: string) => {
  setSelectedObject(id);
}, []);
```

**Component Organization:**
```typescript
// 1. Imports
import { useState, useEffect } from 'react';

// 2. Types/Interfaces
interface Props {
  canvasId: string;
}

// 3. Component
export function Canvas({ canvasId }: Props) {
  // 4. Hooks (state, effects, custom hooks)
  const [objects, setObjects] = useState([]);

  // 5. Event handlers
  const handleClick = () => { ... };

  // 6. Render
  return <div>...</div>;
}
```

### Common Pitfalls

❌ **Don't mutate state directly** - always use setState
❌ **Don't forget dependency arrays** in useEffect
❌ **Don't use index as key** in lists - use unique IDs
✅ **Do clean up effects** - return cleanup function in useEffect
✅ **Do use proper key props** - helps React optimize re-renders

### Limitations
- Virtual DOM overhead (mitigated with proper optimization)
- Bundle size (tree-shaking helps)
- Learning curve for proper hook usage

---

## 3. Vite

### What We're Using
- **Version:** Vite 5+
- **Template:** react-ts

### Best Practices

**Project Structure:**
```
src/
  ├── components/     # React components
  ├── hooks/          # Custom hooks
  ├── lib/            # Utilities, Firebase config
  ├── stores/         # Zustand stores
  ├── types/          # TypeScript types
  └── main.tsx        # Entry point
```

**Environment Variables:**
```typescript
// Access with import.meta.env
const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;

// .env.local file:
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
```

**Build Optimization:**
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          'konva': ['konva', 'react-konva'],
        }
      }
    }
  }
});
```

### Common Pitfalls

❌ **Don't use process.env** - use import.meta.env instead
❌ **Don't forget VITE_ prefix** on environment variables
✅ **Do use absolute imports** - configure in tsconfig.json
✅ **Do leverage hot module replacement** - saves development time

### Limitations
- Different from Create React App (some tutorials won't match)
- Smaller ecosystem than webpack (but growing)
- Some plugins may not be available

---

## 4. Konva.js + react-konva

### What We're Using
- **Konva:** v9+
- **react-konva:** v18+

### Best Practices

**Basic Structure:**
```typescript
import { Stage, Layer, Rect, Circle, Text } from 'react-konva';

function Canvas() {
  return (
    <Stage width={window.innerWidth} height={window.innerHeight}>
      <Layer>
        <Rect x={100} y={100} width={200} height={100} fill="blue" />
        <Circle x={300} y={200} radius={50} fill="red" />
      </Layer>
    </Stage>
  );
}
```

**Performance Optimization:**
```typescript
// Use separate layers for different update frequencies
<Stage>
  {/* Static background - rarely updates */}
  <Layer>
    <Rect ... />
  </Layer>

  {/* Dynamic objects - updates on user action */}
  <Layer>
    {objects.map(obj => <Rect key={obj.id} {...obj} />)}
  </Layer>

  {/* Cursors - updates constantly */}
  <Layer listening={false}> {/* Don't capture events */}
    {cursors.map(cursor => <Circle key={cursor.userId} {...cursor} />)}
  </Layer>
</Stage>
```

**Event Handling:**
```typescript
function DraggableRect({ id, x, y, onDragEnd }) {
  return (
    <Rect
      x={x}
      y={y}
      draggable
      onDragEnd={(e) => {
        const newX = e.target.x();
        const newY = e.target.y();
        onDragEnd(id, newX, newY);
      }}
      onMouseEnter={(e) => {
        e.target.getStage().container().style.cursor = 'pointer';
      }}
      onMouseLeave={(e) => {
        e.target.getStage().container().style.cursor = 'default';
      }}
    />
  );
}
```

**Coordinate Transformation:**
```typescript
// Convert screen coordinates to canvas coordinates
const stage = stageRef.current;
const point = stage.getPointerPosition();
const transform = stage.getAbsoluteTransform().copy().invert();
const canvasPoint = transform.point(point);
```

### Common Pitfalls

❌ **Don't create shapes in render without keys** - causes re-mount
❌ **Don't update Konva nodes directly** - use React state
❌ **Don't put too many objects in one layer** - split into multiple layers
✅ **Do use listening={false}** on layers that don't need events
✅ **Do throttle frequently updating values** - especially cursor positions
✅ **Do use React.memo** for complex Konva components

### Performance Considerations

**Layer Optimization:**
- Keep static content in separate layers
- Set `listening={false}` on cursor layer
- Use layer caching when appropriate

**Throttling:**
```typescript
// Throttle cursor updates
const throttledCursorUpdate = useCallback(
  throttle((x: number, y: number) => {
    updateCursorPosition(x, y);
  }, 50), // 50ms = ~20fps for cursors
  []
);
```

### Limitations
- Canvas-based (not DOM) - can't use browser DevTools to inspect
- Event handling different from regular HTML
- Text rendering less flexible than HTML
- Some learning curve for coordinate systems

---

## 5. Tailwind CSS

### What We're Using
- **Version:** Tailwind CSS 3+
- **Config:** Custom configuration in tailwind.config.js

### Best Practices

**Component Styling:**
```typescript
// Good - utility classes
<button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
  Create Shape
</button>

// For repeated patterns, extract to components
function PrimaryButton({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600
                 transition-colors duration-200"
    >
      {children}
    </button>
  );
}
```

**Responsive Design:**
```typescript
<div className="w-full md:w-1/2 lg:w-1/3">
  {/* Mobile: full width, Tablet: half, Desktop: third */}
</div>
```

**Custom Theme (tailwind.config.js):**
```javascript
export default {
  theme: {
    extend: {
      colors: {
        canvas: {
          bg: '#f5f5f5',
          grid: '#e0e0e0',
        }
      }
    }
  }
}
```

### Common Pitfalls

❌ **Don't use arbitrary values everywhere** - use theme when possible
❌ **Don't fight Tailwind** - embrace utility-first approach
✅ **Do use @apply sparingly** - only for repeated patterns
✅ **Do configure purge** - keeps bundle size small

### Limitations
- HTML can get verbose with many classes
- Need to learn utility class names
- Some complex layouts easier with custom CSS

---

## 6. shadcn/ui

### What We're Using
- **Version:** Latest (components copied into project)
- **Components Needed:** Button, Input, Dialog (for auth modal), Card, Label

### Best Practices

**Installation:**
```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add dialog
```

**Usage:**
```typescript
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';

function AuthModal() {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>Login</DialogHeader>
        <Input type="email" placeholder="Email" />
        <Input type="password" placeholder="Password" />
        <Button>Login</Button>
      </DialogContent>
    </Dialog>
  );
}
```

**Customization:**
```typescript
// Components are in your codebase - modify directly
// src/components/ui/button.tsx
export function Button({ className, ...props }) {
  return (
    <button
      className={cn(
        "base-button-styles",
        className // Your custom classes
      )}
      {...props}
    />
  );
}
```

### Common Pitfalls

❌ **Don't install all components** - only add what you need
❌ **Don't forget to configure paths** - update tsconfig.json
✅ **Do customize components** - they're yours to modify
✅ **Do use composition** - combine components for complex UI

### Limitations
- Components live in your codebase (more files)
- Initial setup required
- Need to update components manually (no npm update)

---

## 7. Zustand

### What We're Using
- **Version:** Zustand 4+

### Best Practices

**Store Structure:**
```typescript
// src/stores/canvasStore.ts
import { create } from 'zustand';

interface CanvasObject {
  id: string;
  type: 'rectangle' | 'circle' | 'text';
  x: number;
  y: number;
  width?: number;
  height?: number;
  color: string;
}

interface CanvasStore {
  objects: CanvasObject[];
  selectedId: string | null;

  // Actions
  addObject: (object: CanvasObject) => void;
  updateObject: (id: string, updates: Partial<CanvasObject>) => void;
  removeObject: (id: string) => void;
  selectObject: (id: string | null) => void;
}

export const useCanvasStore = create<CanvasStore>((set) => ({
  objects: [],
  selectedId: null,

  addObject: (object) => set((state) => ({
    objects: [...state.objects, object]
  })),

  updateObject: (id, updates) => set((state) => ({
    objects: state.objects.map(obj =>
      obj.id === id ? { ...obj, ...updates } : obj
    )
  })),

  removeObject: (id) => set((state) => ({
    objects: state.objects.filter(obj => obj.id !== id)
  })),

  selectObject: (id) => set({ selectedId: id }),
}));
```

**Using the Store:**
```typescript
function Canvas() {
  // Subscribe to specific slices
  const objects = useCanvasStore((state) => state.objects);
  const addObject = useCanvasStore((state) => state.addObject);

  // Or use multiple values
  const { selectedId, selectObject } = useCanvasStore((state) => ({
    selectedId: state.selectedId,
    selectObject: state.selectObject,
  }));

  return <Stage>...</Stage>;
}
```

**Outside React Components:**
```typescript
// Can use store outside React (useful for Konva events)
import { useCanvasStore } from './stores/canvasStore';

function handleKonvaEvent() {
  const addObject = useCanvasStore.getState().addObject;
  addObject({ ... });
}
```

### Common Pitfalls

❌ **Don't select entire state** - causes unnecessary re-renders
❌ **Don't put Firebase listeners in Zustand** - keep them separate
✅ **Do use selectors** - only subscribe to what you need
✅ **Do keep actions simple** - complex logic in separate functions

### Performance

**Optimize Selectors:**
```typescript
// Bad - re-renders on any state change
const state = useCanvasStore();

// Good - only re-renders when objects change
const objects = useCanvasStore((state) => state.objects);

// Better - use shallow comparison for objects
import { shallow } from 'zustand/shallow';
const { objects, selectedId } = useCanvasStore(
  (state) => ({ objects: state.objects, selectedId: state.selectedId }),
  shallow
);
```

### Limitations
- No built-in DevTools (but can add middleware)
- Manual TypeScript typing
- Need to be careful with selector performance

---

## 8. Firebase Realtime Database

### What We're Using
- **Purpose:** Real-time cursor positions and user presence
- **Version:** Firebase SDK 9+ (modular)

### Best Practices

**Database Structure:**
```
/canvases/
  /main/
    /cursors/
      /{userId}/
        x: number
        y: number
        username: string
        color: string
        lastUpdate: timestamp

    /presence/
      /{userId}/
        username: string
        online: boolean
        lastSeen: timestamp
```

**Initialization:**
```typescript
// src/lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const app = initializeApp(firebaseConfig);
export const realtimeDb = getDatabase(app);
```

**Writing Data (Cursors):**
```typescript
import { ref, set } from 'firebase/database';

// Throttled cursor update
const updateCursor = throttle((x: number, y: number) => {
  const userId = auth.currentUser?.uid;
  if (!userId) return;

  const cursorRef = ref(realtimeDb, `canvases/main/cursors/${userId}`);
  set(cursorRef, {
    x,
    y,
    username: auth.currentUser.displayName,
    color: userColor,
    lastUpdate: Date.now(),
  });
}, 50); // Update every 50ms
```

**Reading Data (Subscribe to Cursors):**
```typescript
import { ref, onValue, off } from 'firebase/database';

useEffect(() => {
  const cursorsRef = ref(realtimeDb, 'canvases/main/cursors');

  const unsubscribe = onValue(cursorsRef, (snapshot) => {
    const cursors = snapshot.val() || {};
    setCursors(Object.entries(cursors).map(([userId, data]) => ({
      userId,
      ...data
    })));
  });

  return () => off(cursorsRef, 'value', unsubscribe);
}, []);
```

**Presence System:**
```typescript
import { ref, onDisconnect, set } from 'firebase/database';

function setupPresence(userId: string, username: string) {
  const presenceRef = ref(realtimeDb, `canvases/main/presence/${userId}`);

  // Set online
  set(presenceRef, {
    username,
    online: true,
    lastSeen: Date.now(),
  });

  // Set offline on disconnect
  onDisconnect(presenceRef).set({
    username,
    online: false,
    lastSeen: Date.now(),
  });
}
```

### Common Pitfalls

❌ **Don't send every mousemove event** - throttle to 50ms
❌ **Don't forget onDisconnect** - clean up presence
❌ **Don't store large data** - use Firestore for objects
✅ **Do use shallow listeners** - limit depth with limitToFirst/Last
✅ **Do clean up listeners** - return unsubscribe in useEffect

### Security Rules

```javascript
{
  "rules": {
    "canvases": {
      "$canvasId": {
        "cursors": {
          "$userId": {
            ".write": "$userId === auth.uid",
            ".read": true
          }
        },
        "presence": {
          "$userId": {
            ".write": "$userId === auth.uid",
            ".read": true
          }
        }
      }
    }
  }
}
```

### Limitations
- Simple JSON structure only (no complex queries)
- Limited to 1MB per write
- Best for frequently changing data only

---

## 9. Cloud Firestore

### What We're Using
- **Purpose:** Canvas objects persistence
- **Version:** Firebase SDK 9+ (modular)

### Best Practices

**Database Structure:**
```
/canvases/
  /main/
    objects: [
      {
        id: string
        type: 'rectangle' | 'circle' | 'text'
        x: number
        y: number
        width?: number
        height?: number
        radius?: number
        color: string
        text?: string
        createdBy: userId
        createdAt: timestamp
        updatedAt: timestamp
      }
    ]
    metadata: {
      createdAt: timestamp
      lastModified: timestamp
    }
```

**Initialization:**
```typescript
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const app = initializeApp(firebaseConfig);
export const firestore = getFirestore(app);
```

**Writing Data:**
```typescript
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';

async function addCanvasObject(object: CanvasObject) {
  const canvasRef = doc(firestore, 'canvases', 'main');

  await updateDoc(canvasRef, {
    objects: arrayUnion(object),
    'metadata.lastModified': Date.now(),
  });
}

async function updateCanvasObject(objectId: string, updates: Partial<CanvasObject>) {
  const canvasRef = doc(firestore, 'canvases', 'main');
  const canvas = await getDoc(canvasRef);
  const objects = canvas.data()?.objects || [];

  const updatedObjects = objects.map(obj =>
    obj.id === objectId ? { ...obj, ...updates, updatedAt: Date.now() } : obj
  );

  await updateDoc(canvasRef, { objects: updatedObjects });
}
```

**Reading Data (Real-time):**
```typescript
import { doc, onSnapshot } from 'firebase/firestore';

useEffect(() => {
  const canvasRef = doc(firestore, 'canvases', 'main');

  const unsubscribe = onSnapshot(canvasRef, (snapshot) => {
    const data = snapshot.data();
    if (data?.objects) {
      setCanvasObjects(data.objects);
    }
  });

  return () => unsubscribe();
}, []);
```

**Optimistic Updates:**
```typescript
function moveObject(id: string, x: number, y: number) {
  // 1. Update local state immediately
  useCanvasStore.getState().updateObject(id, { x, y });

  // 2. Update Firestore (eventual consistency)
  updateCanvasObject(id, { x, y }).catch((error) => {
    // 3. Rollback on error
    console.error('Failed to update:', error);
    // Could reload from Firestore here
  });
}
```

### Common Pitfalls

❌ **Don't update entire document on every change** - use field updates
❌ **Don't forget to handle offline mode** - Firestore caches data
❌ **Don't store high-frequency updates** - use Realtime DB for that
✅ **Do use transactions** for critical updates
✅ **Do implement optimistic updates** - better UX
✅ **Do batch writes** when adding multiple objects

### Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /canvases/{canvasId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

### Limitations
- 1 write per second per document limit (can be issue with rapid updates)
- Array operations can be inefficient with large arrays
- Pricing based on reads/writes (can get expensive)

---

## 10. Firebase Authentication

### What We're Using
- **Method:** Email/Password
- **Version:** Firebase SDK 9+ (modular)

### Best Practices

**Initialization:**
```typescript
import { getAuth } from 'firebase/auth';

export const auth = getAuth(app);
```

**Sign Up:**
```typescript
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

async function signUp(email: string, password: string, username: string) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    // Set display name
    await updateProfile(userCredential.user, {
      displayName: username,
    });

    return userCredential.user;
  } catch (error) {
    throw error;
  }
}
```

**Login:**
```typescript
import { signInWithEmailAndPassword } from 'firebase/auth';

async function login(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw error;
  }
}
```

**Auth State Management:**
```typescript
import { onAuthStateChanged } from 'firebase/auth';

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (user) {
      setCurrentUser({
        uid: user.uid,
        email: user.email,
        username: user.displayName || 'Anonymous',
      });
    } else {
      setCurrentUser(null);
    }
  });

  return () => unsubscribe();
}, []);
```

**Protected Routes:**
```typescript
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  return currentUser ? children : <Navigate to="/" />;
}
```

### Common Pitfalls

❌ **Don't store passwords in state** - Firebase handles this
❌ **Don't forget to handle loading state** - auth state is async
✅ **Do persist auth state** - Firebase does this automatically
✅ **Do handle errors properly** - show user-friendly messages

### Error Handling

```typescript
function getAuthErrorMessage(error: any): string {
  switch (error.code) {
    case 'auth/email-already-in-use':
      return 'Email already in use';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters';
    case 'auth/invalid-email':
      return 'Invalid email address';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Invalid email or password';
    default:
      return 'Authentication error. Please try again.';
  }
}
```

### Limitations
- Requires internet connection
- Email verification requires email service setup
- Limited customization of auth UI (build your own)

---

## 11. React Router v6

### What We're Using
- **Version:** React Router 6+

### Best Practices

**Router Setup:**
```typescript
// src/main.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/canvas"
          element={
            <ProtectedRoute>
              <CanvasPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
```

**Navigation:**
```typescript
import { useNavigate } from 'react-router-dom';

function LoginModal() {
  const navigate = useNavigate();

  const handleLogin = async () => {
    await login(email, password);
    navigate('/canvas');
  };

  return <div>...</div>;
}
```

**Protected Routes:**
```typescript
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
```

### Common Pitfalls

❌ **Don't use old v5 syntax** - useHistory is now useNavigate
❌ **Don't forget 'replace' prop** - prevents back button issues
✅ **Do use absolute paths** - start with '/'
✅ **Do handle loading states** - auth is async

### Limitations
- Different API from v5 (breaking changes)
- Smaller community resources than v5

---

## 12. Firebase Hosting

### What We're Using
- **Service:** Firebase Hosting
- **Build:** Vite production build

### Best Practices

**Setup:**
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
```

**firebase.json Configuration:**
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

**Deployment:**
```bash
# Build
npm run build

# Deploy
firebase deploy --only hosting
```

**Environment Variables:**
```typescript
// Set in .env.local (NOT committed to git)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...

// For production, set in Firebase Hosting environment
```

### Common Pitfalls

❌ **Don't commit .env files** - use .gitignore
❌ **Don't forget rewrites** - needed for SPA routing
❌ **Don't deploy dev build** - always build first
✅ **Do test locally** - firebase serve
✅ **Do use preview channels** - firebase hosting:channel:deploy preview

### Limitations
- Static hosting only (no server-side code)
- Preview channels limited on free tier
- Some advanced CDN features require paid tier

---

## Development Workflow

### Initial Setup Checklist

1. **Create Firebase Project**
   - Go to console.firebase.google.com
   - Create new project
   - Enable Realtime Database, Firestore, Authentication

2. **Initialize React Project**
   ```bash
   npm create vite@latest collabcanvas -- --template react-ts
   cd collabcanvas
   npm install
   ```

3. **Install Dependencies**
   ```bash
   npm install firebase zustand react-router-dom konva react-konva
   npm install -D tailwindcss postcss autoprefixer
   npx tailwindcss init -p
   ```

4. **Setup shadcn/ui**
   ```bash
   npx shadcn-ui@latest init
   npx shadcn-ui@latest add button input dialog label
   ```

5. **Configure Environment Variables**
   - Create `.env.local`
   - Add Firebase config
   - Add to .gitignore

6. **Setup Firebase Hosting**
   ```bash
   firebase init hosting
   ```

### Build Commands

```bash
# Development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to Firebase
firebase deploy --only hosting
```

---

## Performance Targets

| Metric | Target | Measured By |
|--------|--------|-------------|
| Canvas FPS | 60 FPS | Browser DevTools Performance |
| Object Sync | <100ms | Network tab, user experience |
| Cursor Sync | <50ms | Network tab, user experience |
| Initial Load | <3s | Lighthouse, PageSpeed |
| Bundle Size | <500kb (gzipped) | Build output |

---

## Security Checklist

- [ ] Environment variables not committed to git
- [ ] Firebase security rules configured
- [ ] Protected routes implemented
- [ ] Input validation on forms
- [ ] Error messages don't leak sensitive info
- [ ] HTTPS enabled (automatic with Firebase Hosting)

---

## Resources

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [Konva.js Documentation](https://konvajs.org/)
- [react-konva Documentation](https://konvajs.org/docs/react/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Zustand Documentation](https://docs.pmnd.rs/zustand/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [React Router Documentation](https://reactrouter.com/)