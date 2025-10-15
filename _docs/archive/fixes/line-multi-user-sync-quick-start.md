# Multi-User Line Sync - Quick Start

## Fast Setup (2 minutes)

### 1. Open Two Browser Windows

**Option A: Same Computer**
```bash
# Regular window + Incognito window
# OR
# Chrome + Firefox
```

**Option B: Multiple Devices**
```bash
# Get local IP (on dev machine)
ifconfig | grep "inet " | grep -v 127.0.0.1

# Access from other device
# http://192.168.1.xxx:5173
```

---

## 2. Quick Tests (5 minutes)

### Test A: Create Line (30 seconds)
1. **Window A:** Press 'L' → Draw line
2. **Window B:** See line appear (within 50ms)
3. ✅ **Pass:** Line appears instantly

### Test B: Drag Line (30 seconds)
1. **Window A:** Create line
2. **Window B:** Select line → Drag to new position
3. **Window A:** Watch line move in real-time
4. ✅ **Pass:** Line moves smoothly

### Test C: Resize Line (30 seconds)
1. **Window A:** Create line
2. **Window B:** Select line → Drag endpoint
3. **Window A:** Watch line resize
4. ✅ **Pass:** Line angle/length changes

### Test D: Rapid Creation (1 minute)
1. **Both windows:** Create 5 lines each (10 total in 5 seconds)
2. **Both windows:** Count lines
   ```javascript
   useCanvasStore.getState().objects.filter(obj => obj.type === 'line').length
   // Should be 10
   ```
3. ✅ **Pass:** All 10 lines visible, no duplicates

---

## 3. Verify in Console (1 minute)

```javascript
// Check line count
const lines = useCanvasStore.getState().objects.filter(obj => obj.type === 'line');
console.log(`Lines: ${lines.length}`);

// Check sync
lines.forEach(line => console.log({
  id: line.id,
  x: line.x,
  y: line.y,
  rotation: line.rotation,
  createdBy: line.createdBy
}));
```

---

## 4. Firebase Console Check (1 minute)

1. Open: https://console.firebase.google.com
2. Navigate to: `Realtime Database` → `canvases/main/objects`
3. Verify lines exist with correct properties
4. ✅ **Pass:** Lines visible in RTDB

---

## Success Checklist

- [ ] Line appears in other window within 50ms
- [ ] Line drag syncs in real-time
- [ ] Endpoint resize syncs correctly
- [ ] 10 concurrent lines created without conflicts
- [ ] No console errors
- [ ] Lines visible in Firebase Console

---

## Common Issues

**Line doesn't appear:**
- Check Firebase permissions
- Check console for errors
- Verify RTDB URL in config

**Line position wrong:**
- Verify rotation is -180° to 179°
- Check x, y is MIN of endpoints
- Verify points array is relative

**Slow sync (>150ms):**
- Check network latency
- Verify throttling is 50ms
- Check Firebase region

---

## Next Steps

✅ All tests pass? → Section 2.5.7 Complete!

❌ Tests fail? → See full guide:
`_docs/fixes/line-multi-user-sync-test-guide.md`

---

**Test Time:** ~5 minutes
**Success Criteria:** All 4 quick tests pass
**Full Documentation:** `line-multi-user-sync-test-guide.md`
