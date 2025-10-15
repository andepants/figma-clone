# Line Feature - Deployment Guide

**Document:** Deployment Guide for Line Feature (Section 2.9)

**Status:** Ready for deployment process

**Date:** 2025-10-14

---

## Purpose

This guide provides step-by-step instructions for building, testing, and deploying the Line feature to production. Follow each step carefully to ensure a successful deployment.

---

## Prerequisites

Before starting deployment:

- [ ] All items in `LINE-FEATURE-FINAL-VALIDATION-CHECKLIST.md` pass ✅
- [ ] No console errors in development mode
- [ ] Firebase project configured and accessible
- [ ] Firebase CLI installed (`firebase --version`)
- [ ] Git repository clean (all changes committed)

---

## Deployment Process

### Phase 1: Pre-Deployment Validation

#### 1.1 Final Code Review

**Check all line-related files:**

```bash
# List all line-related files
ls -la /Users/andre/coding/figma-clone/src/types/canvas.types.ts
ls -la /Users/andre/coding/figma-clone/src/features/canvas-core/shapes/Line.tsx
ls -la /Users/andre/coding/figma-clone/src/features/canvas-core/utils/lineHelpers.ts
ls -la /Users/andre/coding/figma-clone/src/features/toolbar/components/Toolbar.tsx
```

**Verify:**
- [ ] No TypeScript errors
- [ ] No console.log statements
- [ ] All files under 500 lines
- [ ] All JSDoc comments present
- [ ] No `any` types used

#### 1.2 Run Linter

```bash
cd /Users/andre/coding/figma-clone
npm run lint
```

**Expected Result:** No errors or warnings

- [ ] Linter passes with no errors
- [ ] Fix any linting issues before proceeding

#### 1.3 Clean Development Build

```bash
# Clean any existing build
rm -rf dist/

# Run development server one more time
npm run dev
```

**Test in development mode:**
- [ ] Create line → works ✓
- [ ] Drag line → works ✓
- [ ] Resize line → works ✓
- [ ] Multi-user sync → works ✓
- [ ] No console errors ✓

Stop dev server (`Ctrl+C`) when validation complete.

---

### Phase 2: Production Build

#### 2.1 Build for Production

```bash
cd /Users/andre/coding/figma-clone
npm run build
```

**What this does:**
1. Runs TypeScript compilation (`tsc -b`)
2. Runs Vite production build
3. Creates optimized bundle in `dist/` folder
4. Minifies and tree-shakes code

**Expected Output:**
```
✓ TypeScript compilation successful
✓ Vite build successful
✓ dist/ folder created
✓ Build size reasonable (~2-3 MB total)
```

**Validation checklist:**
- [ ] Build completes with no errors
- [ ] No TypeScript errors
- [ ] dist/ folder exists
- [ ] dist/index.html exists
- [ ] dist/assets/ folder contains JS and CSS bundles

**If build fails:**
- Read error messages carefully
- Fix TypeScript errors
- Fix any import issues
- Ensure all dependencies installed (`npm install`)
- Retry build

#### 2.2 Verify Build Size

```bash
# Check dist folder size
du -sh dist/

# List dist contents
ls -lh dist/
ls -lh dist/assets/
```

**Expected:**
- Total dist size: 2-5 MB
- JavaScript bundles: ~1-2 MB (gzipped)
- CSS bundles: ~50-100 KB
- index.html: ~5-10 KB

**Validation:**
- [ ] Build size reasonable
- [ ] No unexpectedly large files
- [ ] All assets present

---

### Phase 3: Local Preview Testing

#### 3.1 Run Production Preview

```bash
cd /Users/andre/coding/figma-clone
npm run preview
```

**What this does:**
- Serves production build locally
- Usually runs on `http://localhost:4173`

**Expected Output:**
```
  ➜  Local:   http://localhost:4173/
  ➜  Network: http://[your-ip]:4173/
  ➜  press h + enter to show help
```

#### 3.2 Test Production Build Locally

**Open:** `http://localhost:4173` in browser

**Test all line features:**

- [ ] **Line creation:**
  - [ ] Press 'L' → line tool activates
  - [ ] Click-drag-release → line appears
  - [ ] Tool auto-switches to move
  - [ ] Preview shows during drag

- [ ] **Line selection:**
  - [ ] Click line with move tool → selects
  - [ ] Blue selection border appears
  - [ ] Endpoint handles appear

- [ ] **Line drag:**
  - [ ] Drag line → moves smoothly
  - [ ] Position updates
  - [ ] Rotation and width unchanged

- [ ] **Line resize:**
  - [ ] Drag endpoint 1 → line resizes
  - [ ] Drag endpoint 2 → line resizes
  - [ ] Position recalculates correctly
  - [ ] Rotation updates

- [ ] **Multi-user sync:**
  - [ ] Open second window/incognito
  - [ ] Sign in as different user
  - [ ] Create line in Window A → appears in Window B
  - [ ] Drag line in Window B → moves in Window A
  - [ ] Sync latency <150ms

- [ ] **Performance:**
  - [ ] Create 20 lines → 60 FPS
  - [ ] Drag lines → smooth, 60 FPS
  - [ ] Resize lines → smooth, 60 FPS
  - [ ] No console errors

- [ ] **Edge cases:**
  - [ ] Click without drag → 10px line
  - [ ] Multi-select lines → works
  - [ ] Copy/paste line → works
  - [ ] Delete line → works
  - [ ] Zoom/pan → works at all levels

**If any test fails:**
- Document the issue
- Stop preview (`Ctrl+C`)
- Fix the issue in source code
- Rebuild: `npm run build`
- Retest: `npm run preview`

Stop preview server when testing complete: `Ctrl+C`

---

### Phase 4: Firebase Deployment

#### 4.1 Verify Firebase Configuration

```bash
# Check Firebase config
cat /Users/andre/coding/figma-clone/.firebaserc
cat /Users/andre/coding/figma-clone/firebase.json
```

**Expected `.firebaserc`:**
```json
{
  "projects": {
    "default": "your-firebase-project-id"
  }
}
```

**Expected `firebase.json`:**
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

**Validation:**
- [ ] Firebase project ID is correct
- [ ] Hosting config points to `dist/` folder
- [ ] SPA rewrite rule present

#### 4.2 Login to Firebase (if needed)

```bash
firebase login
```

**Expected:**
- Opens browser for Google sign-in
- Sign in with Google account that has Firebase access
- Returns: "✔ Success! Logged in as your-email@gmail.com"

**Validation:**
- [ ] Logged in successfully
- [ ] Have access to Firebase project

#### 4.3 Deploy to Firebase Hosting

```bash
cd /Users/andre/coding/figma-clone
firebase deploy --only hosting
```

**What this does:**
1. Uploads dist/ contents to Firebase Hosting
2. Configures hosting rules
3. Makes app publicly accessible

**Expected Output:**
```
=== Deploying to 'your-project-id'...

i  deploying hosting
i  hosting[your-project-id]: beginning deploy...
i  hosting[your-project-id]: found 15 files in dist
✔  hosting[your-project-id]: file upload complete
i  hosting[your-project-id]: finalizing version...
✔  hosting[your-project-id]: version finalized
i  hosting[your-project-id]: releasing new version...
✔  hosting[your-project-id]: release complete

✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/your-project-id/overview
Hosting URL: https://your-project-id.web.app
```

**Validation:**
- [ ] Deploy completes successfully
- [ ] Hosting URL provided
- [ ] No deployment errors

**If deployment fails:**
- Check Firebase CLI is up to date: `npm install -g firebase-tools`
- Check internet connection
- Verify Firebase project exists
- Check Firebase quota/billing
- Retry deployment

---

### Phase 5: Production Testing

#### 5.1 Test Deployed Application

**Open:** `https://your-project-id.web.app` (your actual Hosting URL)

**Test all line features on production:**

- [ ] **Basic functionality:**
  - [ ] App loads successfully
  - [ ] No 404 errors
  - [ ] Firebase connection works
  - [ ] Authentication works
  - [ ] Canvas loads

- [ ] **Line tool:**
  - [ ] Line button in toolbar visible
  - [ ] Press 'L' → activates line tool
  - [ ] Click-drag-release → creates line
  - [ ] Tool auto-switches to move
  - [ ] Line appears on canvas

- [ ] **Line interaction:**
  - [ ] Select line → shows selection
  - [ ] Drag line → moves smoothly
  - [ ] Resize line → endpoints work
  - [ ] Multi-select works
  - [ ] Copy/paste works
  - [ ] Delete works

- [ ] **Performance:**
  - [ ] Canvas renders at 60 FPS
  - [ ] No lag during operations
  - [ ] Smooth interactions

- [ ] **No console errors:**
  - [ ] Open DevTools Console
  - [ ] Perform all line operations
  - [ ] No errors or warnings

#### 5.2 Multi-User Production Test

**Critical: Test collaborative features in production**

**Setup:**
- Device 1: Desktop browser (your account)
- Device 2: Mobile/tablet OR incognito window (different account)
- Device 3: Different browser/device (third account) - optional

**Test concurrent operations:**

- [ ] **Test 1: Line creation sync**
  - Device 1: Create line
  - Device 2: See line appear within 50-100ms
  - Device 3: See line appear within 50-100ms
  - All devices: Line properties match exactly

- [ ] **Test 2: Line drag sync**
  - Device 2: Drag line
  - Device 1 & 3: See line move in real-time
  - All devices: Final position matches

- [ ] **Test 3: Line resize sync**
  - Device 3: Drag endpoint to resize
  - Device 1 & 2: See line resize in real-time
  - All devices: Final rotation and width match

- [ ] **Test 4: Rapid concurrent creation**
  - All devices: Create 3-5 lines each simultaneously
  - All devices: See all lines (15 total)
  - No duplicate IDs
  - No sync conflicts
  - No lost lines

- [ ] **Test 5: Mixed operations**
  - Device 1: Create line
  - Device 2: Drag different line
  - Device 3: Resize third line
  - All: All operations sync correctly
  - All: No conflicts

**Validation:**
- [ ] All multi-user tests pass
- [ ] Sync latency <200ms (acceptable for production)
- [ ] No sync conflicts
- [ ] No data loss
- [ ] Professional, polished experience

#### 5.3 Cross-Browser Testing (Optional but Recommended)

**Test on multiple browsers:**

- [ ] **Chrome:** All features work
- [ ] **Firefox:** All features work
- [ ] **Safari:** All features work
- [ ] **Edge:** All features work
- [ ] **Mobile Safari (iOS):** Basic features work
- [ ] **Chrome Mobile (Android):** Basic features work

**If issues found on specific browser:**
- Document browser and version
- Document specific issue
- Assess severity (blocker vs. minor)
- Fix if critical, or add to known issues

#### 5.4 Performance Testing in Production

**Use production URL:**

```javascript
// In production app console
window.generateTestLines(20);
// ... test performance ...
window.clearTestShapes();
```

**Validation:**
- [ ] 60 FPS with 20 lines
- [ ] 60 FPS with 50 lines
- [ ] 60 FPS with 100 lines
- [ ] Smooth pan/zoom
- [ ] No performance degradation

---

### Phase 6: Firebase RTDB Verification

#### 6.1 Check Realtime Database

**Open Firebase Console:**
1. Go to: `https://console.firebase.google.com`
2. Select your project
3. Click "Realtime Database" in left sidebar
4. Navigate to: `/canvases/main/objects`

**Verify line objects:**

- [ ] **Line objects exist:**
  - [ ] Type: `line`
  - [ ] All required fields present

- [ ] **Check properties:**
  - [ ] `id`: String (unique)
  - [ ] `type`: `"line"`
  - [ ] `x`: Number (can be negative)
  - [ ] `y`: Number (can be negative)
  - [ ] `points`: Array of 4 numbers
  - [ ] `width`: Number (>= 10)
  - [ ] `rotation`: Number (-180 to 179, never 180-360)
  - [ ] `stroke`: String (color)
  - [ ] `strokeWidth`: Number (>= 1)
  - [ ] `createdBy`: String (user ID)
  - [ ] `createdAt`: Number (timestamp)
  - [ ] `updatedAt`: Number (timestamp)

- [ ] **Data integrity:**
  - [ ] No `null` values
  - [ ] No `NaN` values
  - [ ] No `undefined` values
  - [ ] All numbers are valid
  - [ ] Rotation in correct range

**Take screenshots for documentation (optional)**

---

### Phase 7: Post-Deployment Validation

#### 7.1 Monitor for Errors

**Monitor for 24-48 hours:**

- [ ] Check Firebase Console → Analytics
- [ ] Check Firebase Console → Crashlytics (if enabled)
- [ ] Monitor user reports/feedback
- [ ] Check for any unusual activity

**If errors found:**
- Document error details
- Assess severity
- Roll back if critical
- Fix and redeploy if needed

#### 7.2 User Acceptance Testing

**Share with team/users:**
- [ ] Share production URL with team
- [ ] Request feedback on line feature
- [ ] Document any issues reported
- [ ] Address high-priority feedback

#### 7.3 Performance Monitoring

**Check production performance:**
- [ ] Firebase Console → Performance tab
- [ ] Check page load times
- [ ] Check API response times
- [ ] Check RTDB sync times

**Expected:**
- Page load: <3 seconds
- First paint: <1 second
- RTDB sync: <150ms

---

## Deployment Success Criteria

### Line Feature is Successfully Deployed When:

1. ✅ **Build succeeds** with no errors
2. ✅ **Preview testing** passes all tests
3. ✅ **Firebase deployment** completes successfully
4. ✅ **Production app** loads and works
5. ✅ **All line features** work in production:
   - Line creation (with auto-switch to move)
   - Line selection
   - Line drag
   - Line resize (endpoint handles)
   - Multi-user sync
6. ✅ **Performance targets met:**
   - 60 FPS canvas rendering
   - <200ms sync latency (production)
   - Smooth interactions
7. ✅ **Multi-user testing** passes:
   - Line creation syncs across users
   - Line drag syncs correctly
   - Line resize syncs correctly
   - Concurrent operations work
   - No sync conflicts
8. ✅ **Firebase RTDB** contains valid line data:
   - All properties present
   - Rotation -180° to 179°
   - Position is MIN of endpoints
   - No null/NaN values
9. ✅ **No console errors** in production
10. ✅ **Cross-browser** compatibility (at least Chrome, Firefox, Safari)

---

## Rollback Plan

### If Critical Issues Found After Deployment

#### Option 1: Quick Fix and Redeploy

If fix is simple and quick (< 30 minutes):

```bash
# 1. Fix the issue in source code
# 2. Test locally
npm run dev
# ... test fix ...

# 3. Rebuild
npm run build

# 4. Test preview
npm run preview
# ... verify fix ...

# 5. Redeploy
firebase deploy --only hosting
```

#### Option 2: Rollback to Previous Version

If issue is critical and fix will take time:

```bash
# List previous deployments
firebase hosting:versions:list

# Rollback to previous version
firebase hosting:rollback
```

**Then:**
1. Fix issue thoroughly
2. Test extensively locally
3. Redeploy when confident

#### Option 3: Disable Line Feature

If rollback not possible, temporarily disable:

```typescript
// In Toolbar.tsx, comment out line tool:
const TOOLS: Tool[] = [
  // ... other tools ...
  // {
  //   id: 'line',
  //   name: 'Line',
  //   icon: Minus,
  //   shortcut: 'L',
  // },
];
```

Then rebuild and redeploy.

---

## Post-Deployment Checklist

After successful deployment:

- [ ] **Update documentation:**
  - [ ] Mark all line plan sections complete in `_docs/plan/line.md`
  - [ ] Update project README with line feature
  - [ ] Document known limitations (if any)

- [ ] **Git commit:**
  ```bash
  git add .
  git commit -m "feat: Complete Line tool deployment with Figma-style behavior

  - Implemented Line shape with endpoint resize
  - Auto-switch to move tool after creation
  - Position is MIN of endpoints
  - Rotation always -179° to 179°
  - Full real-time multi-user sync
  - Performance: 60 FPS with 100+ lines
  - Deployed to production

  Closes: Line feature implementation (Sections 2.1-2.9)

  Generated with [Claude Code](https://claude.com/claude-code)

  Co-Authored-By: Claude <noreply@anthropic.com>"
  ```

- [ ] **Create PR (if using PR workflow):**
  ```bash
  git push origin main
  # Or create feature branch and PR
  ```

- [ ] **Announce deployment:**
  - [ ] Notify team of new feature
  - [ ] Share production URL
  - [ ] Provide quick start guide for users

- [ ] **Archive test documentation:**
  - [ ] Save test reports
  - [ ] Save performance metrics
  - [ ] Save screenshots/videos (optional)

---

## Troubleshooting

### Common Deployment Issues

#### Build Fails

**Symptoms:** `npm run build` errors

**Solutions:**
- Check TypeScript errors: `npx tsc --noEmit`
- Verify all imports are correct
- Run `npm install` to ensure dependencies
- Check for circular dependencies
- Review error messages carefully

#### Preview Works but Production Doesn't

**Symptoms:** Preview OK, but deployed app has issues

**Possible causes:**
- Environment variables not set in production
- Firebase config incorrect
- CORS issues
- Firebase RTDB rules too restrictive

**Solutions:**
- Check Firebase Console → Project Settings
- Verify RTDB rules allow authenticated access
- Check browser console for specific errors
- Compare preview and production environments

#### Multi-User Sync Doesn't Work

**Symptoms:** Lines don't sync across users

**Possible causes:**
- Firebase RTDB rules blocking writes
- Network issues
- Throttling too aggressive
- User authentication issues

**Solutions:**
- Check Firebase RTDB rules: read and write allowed for authenticated users
- Test with Firebase RTDB debugger
- Check network tab for failed requests
- Verify users are authenticated

#### Performance Issues in Production

**Symptoms:** Lag, low FPS, slow sync

**Possible causes:**
- Too many objects on canvas
- Network latency
- Browser/device limitations
- Firebase region far from users

**Solutions:**
- Implement virtual rendering for 100+ objects
- Use Firebase region closest to users
- Optimize bundle size
- Use React.memo and useCallback effectively

#### Firebase Deployment Fails

**Symptoms:** `firebase deploy` errors

**Possible causes:**
- Not logged in
- Incorrect project
- Firebase quota exceeded
- Network issues

**Solutions:**
- Run `firebase login`
- Check `.firebaserc` has correct project
- Check Firebase Console for quota/billing
- Retry deployment

---

## Quick Reference Commands

```bash
# Development
npm run dev                    # Start dev server

# Build
npm run build                  # Production build
npm run lint                   # Run linter

# Preview
npm run preview                # Test production build locally

# Deploy
firebase login                 # Login to Firebase
firebase deploy --only hosting # Deploy to Firebase Hosting

# Rollback
firebase hosting:rollback      # Rollback to previous version

# Performance testing (in browser console)
window.generateTestLines(20)   # Generate test lines
window.clearTestShapes()       # Clear test shapes
await window.runPerformanceTest(20, 10)  # Automated test
```

---

## Deployment Timeline

| Phase | Duration | Description |
|-------|----------|-------------|
| **Pre-Deployment** | 15 min | Code review, linting |
| **Build** | 2-5 min | Production build |
| **Preview Testing** | 30 min | Test production build locally |
| **Firebase Deploy** | 5-10 min | Upload and deploy |
| **Production Testing** | 30 min | Test deployed app |
| **Multi-User Test** | 30 min | Test collaborative features |
| **Verification** | 15 min | RTDB check, monitoring |
| **Documentation** | 15 min | Update docs, commit |
| **Total** | ~2.5 hours | Complete deployment |

---

## Success Indicators

### Green Flags (Good to Go) ✅

- Build completes successfully
- No TypeScript errors
- No console errors
- Preview testing passes all tests
- Firebase deployment successful
- Production app loads and works
- All line features functional
- 60 FPS performance maintained
- Multi-user sync works (<200ms)
- Firebase RTDB data valid
- No user-reported issues

### Red Flags (Stop and Fix) ❌

- Build fails with errors
- TypeScript errors present
- Console errors in production
- Line features don't work
- Performance < 30 FPS
- Multi-user sync broken
- Firebase RTDB errors
- Critical user-reported issues

---

## Final Deployment Sign-Off

**Deployment Engineer:** ___________________________

**Date:** ___________________________

**Build Status:** [ ] SUCCESS  [ ] FAILURE

**Deployment Status:** [ ] SUCCESS  [ ] FAILURE

**Production URL:** ___________________________

**Testing Status:** [ ] PASS  [ ] FAIL

**Ready for Release:** [ ] YES  [ ] NO

**Comments:**
_____________________________________________
_____________________________________________
_____________________________________________

---

**Document Version:** 1.0

**Last Updated:** 2025-10-14

**Status:** Ready for deployment execution
