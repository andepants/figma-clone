# Image Handling - Quick Start Checklist

**Use this as your starting point before beginning implementation.**

---

## ✅ Pre-Implementation Checklist (Complete These First!)

### 1. Firebase Configuration (CRITICAL - 30 min)

- [x] **Storage rules updated** (`storage.rules`)
  - File size limit: 10MB ✓
  - Path validation: `/images/{roomId}/{userId}/{fileName}` ✓
  - MIME type: `image/*` only ✓
  - User ownership validation ✓

- [x] **Database rules updated** (`database.rules.json`)
  - 'image' type added to enum ✓
  - 9 image-specific field validations added ✓

- [x] **Firebase config updated** (`src/lib/firebase/config.ts`)
  - Storage service initialized ✓
  - Emulator connection added ✓

- [ ] **Test rules in emulator** (DO THIS NEXT!)
  ```bash
  firebase emulators:start
  # In browser, test:
  # 1. Upload image → should work
  # 2. Upload >10MB → should fail
  # 3. Upload PDF → should fail
  ```

- [ ] **Deploy rules to production**
  ```bash
  firebase deploy --only storage,database
  ```

### 2. Install Dependencies (10 min)

```bash
npm install browser-image-compression react-dropzone
npm install --save-dev @types/react-dropzone
```

### 3. Review Documentation (20 min)

- [ ] Read `image-handling.md` (main plan)
- [ ] Read `image-handling-additions.md` (critical additions)
- [ ] Read `image-handling-review-summary.md` (this review)

---

## 🚀 Implementation Order

### Phase 0: Firebase Setup (MUST DO FIRST)
**Time:** 1 hour
**Priority:** CRITICAL

- [x] 0.3.1: Verify storage.rules updated ✓
- [x] 0.3.2: Verify database.rules.json updated ✓
- [x] 0.3.3: Verify storage service initialized ✓
- [ ] 0.3.4: Test rules in emulator ⚠️ DO THIS NOW
- [ ] 0.3.5: Deploy rules to production

---

### Phase 1: Core Infrastructure
**Time:** 3-4 hours
**Priority:** HIGH

Main plan tasks (image-handling.md):
- [ ] 1.1: Type Definitions (ImageObject, unions, type guards)
- [ ] 1.2: Firebase Storage Service (storage.ts, imageUploadService.ts)
- [ ] 1.3: Image Utilities (image.ts - validation, compression, etc.)
- [ ] 1.4: Install Dependencies

**⚠️ ALSO ADD from additions.md:**
- [ ] 1.5.1: HEIF/HEIC format detection
- [ ] 1.5.2: Compression fallback logic
- [ ] 1.5.3: Fix calculateDisplayDimensions (min 1px)
- [ ] 1.5.4: Filename uniqueness (random suffix)

---

### Phase 2: Upload System
**Time:** 3-4 hours
**Priority:** HIGH

Main plan:
- [ ] 2.1: useImageUpload Hook
- [ ] 2.2: Image Factory & Deletion Cleanup
- [ ] 2.3: Progress UI (UploadProgress, ErrorToast)

**⚠️ ALSO ADD from additions.md:**
- [ ] 2.5.1: AbortController for cancellation
- [ ] 2.5.2: Cleanup on unmount
- [ ] 2.5.3: Retry logic (3 attempts, exponential backoff)

---

### Phase 3: Canvas Integration
**Time:** 4-5 hours
**Priority:** HIGH

Main plan:
- [ ] 3.1: ImageShape Component
- [ ] 3.2: CanvasStage Integration
- [ ] 3.3: Aspect Ratio Lock

**⚠️ ALSO ADD from additions.md:**
- [ ] 3.5.1: Image load timeout (10s)
- [ ] 3.5.2: Minimum resize dimensions (5×5px)
- [ ] 3.5.3: Dynamic src change handling

---

### Phase 4: Toolbar & UI
**Time:** 2-3 hours
**Priority:** MEDIUM

- [ ] 4.1: Toolbar Integration (Image tool, modal, keyboard shortcut)
- [ ] 4.2: Properties Panel (ImageProperties component)

---

### Phase 5: Drag & Drop
**Time:** 3-4 hours
**Priority:** MEDIUM

- [ ] 5.1: Canvas Dropzone (useCanvasDropzone hook)
- [ ] 5.2: Drop Position Calculation

---

### Phase 6: Performance
**Time:** 2-3 hours
**Priority:** HIGH

Main plan:
- [ ] 6.1: Image Caching (basic imagePool.ts)
- [ ] 6.2: Lazy Loading (OPTIONAL - can defer)

**⚠️ CRITICAL from additions.md:**
- [ ] 6.5.1: LRU Cache (50 images / 200MB limit)
- [ ] 6.5.2: Low memory events (OPTIONAL)

---

### Phase 7: Testing
**Time:** 2-3 hours
**Priority:** CRITICAL

Main plan:
- [ ] 7.1: Integration Tests (upload flow, multi-user, performance)
- [ ] 7.2: Error Handling Tests
- [ ] 7.3: Browser Compatibility

**⚠️ CRITICAL from additions.md:**
- [ ] 7.5.1: Firebase Storage rules tests
- [ ] 7.5.2: Firebase RTDB rules tests
- [ ] 7.5.3: CORS testing
- [ ] 7.6.1: 3G network test
- [ ] 7.6.2: Memory leak test
- [ ] 7.6.3: FPS impact test

---

## 📊 Progress Tracking

### Current Status
- ✅ Firebase configuration updated
- ✅ Documentation reviewed
- ⏳ Emulator testing (NEXT STEP)
- ⏳ Rules deployment
- ⏳ Implementation phases 1-7

### Completion Estimate
- **Optimistic:** 24 hours
- **Realistic:** 28 hours
- **Pessimistic:** 32 hours

### Critical Path
1. Phase 0.3.4-5 (Firebase rules) ← **YOU ARE HERE**
2. Phase 1 (Core Infrastructure)
3. Phase 2 (Upload System)
4. Phase 3 (Canvas Integration)
5. Phase 6.5 (LRU Cache)
6. Phase 7.5 (Security Tests)

---

## 🎯 Success Criteria (Before Deployment)

### MUST HAVE ✅
- [ ] All Firebase rules deployed and tested
- [ ] Upload works (small files via data URL)
- [ ] Upload works (large files via Storage)
- [ ] Drag & drop works
- [ ] Images render on canvas
- [ ] Resize works with aspect ratio lock
- [ ] No memory leaks (tested)
- [ ] Security tests pass
- [ ] Works in Chrome, Firefox, Safari

### SHOULD HAVE 🎯
- [ ] Upload cancellation works
- [ ] Retry logic works
- [ ] LRU cache implemented
- [ ] Performance targets met (30+ FPS)
- [ ] Works on 3G networks

### NICE TO HAVE ⭐
- [ ] HEIF detection
- [ ] Low memory handling
- [ ] Lazy loading

---

## ⚠️ Common Pitfalls to Avoid

1. **Skipping Firebase Rules Testing**
   - ❌ Don't deploy rules without testing in emulator first
   - ✅ Use emulator, test all scenarios, then deploy

2. **Forgetting Upload Cleanup**
   - ❌ Don't ignore component unmount during upload
   - ✅ Implement AbortController and cleanup (Phase 2.5)

3. **Ignoring Memory Leaks**
   - ❌ Don't use unlimited image cache
   - ✅ Implement LRU cache with limits (Phase 6.5)

4. **Missing Edge Cases**
   - ❌ Don't assume all uploads succeed
   - ✅ Add timeout, retry, validation (Phases 1.5, 2.5, 3.5)

5. **Skipping Security Tests**
   - ❌ Don't deploy without testing Firebase rules
   - ✅ Complete Phase 7.5 before production

---

## 🚨 Blockers & Dependencies

### Current Blockers
1. ⚠️ **Firebase rules not tested in emulator** (Phase 0.3.4)
2. ⚠️ **Firebase rules not deployed** (Phase 0.3.5)

### External Dependencies
- `browser-image-compression` - ⏳ Install
- `react-dropzone` - ⏳ Install
- Firebase Storage emulator - ⏳ Test
- Firebase RTDB emulator - ⏳ Test

---

## 📞 Quick Reference

### File Locations
```
Firebase Config:
- storage.rules (✓ updated)
- database.rules.json (✓ updated)
- src/lib/firebase/config.ts (✓ updated)

Plans:
- _docs/plans/image-handling.md (main plan)
- _docs/plans/image-handling-additions.md (critical additions)
- _docs/plans/image-handling-review-summary.md (review)
- _docs/plans/image-handling-quick-start.md (this file)
```

### Key Commands
```bash
# Start emulators
firebase emulators:start

# Deploy rules
firebase deploy --only storage,database

# Install dependencies
npm install browser-image-compression react-dropzone

# Run tests (if test framework exists)
npm test
```

### Performance Targets
- Upload (3G, 500KB): < 30s
- Upload (4G, 2MB): < 10s
- FPS (10 images): 60 FPS
- FPS during upload: 30+ FPS
- Memory (50 images): < 500MB

---

## 🎬 Next Steps (Right Now!)

1. **START HERE:**
   ```bash
   firebase emulators:start
   ```

2. **Test in browser console:**
   ```javascript
   // Try uploading a test image
   // Verify it works in emulator
   ```

3. **If tests pass, deploy:**
   ```bash
   firebase deploy --only storage,database
   ```

4. **Then begin Phase 1:**
   - Create type definitions
   - Set up storage services
   - Build image utilities

---

**You're ready to start! Begin with Firebase emulator testing (Phase 0.3.4).**

Good luck! 🚀
