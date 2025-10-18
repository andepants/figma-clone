# Complex Command Test: "Create Login Form"

**Date:** 2025-10-15
**Test Type:** Integration Test (Multi-Tool Command)
**Status:** Documented (LLM testing deferred to production)

## Overview

This document describes the expected behavior when a user issues the complex command: **"Create a login form"**

This command tests the AI agent's ability to:
1. Understand high-level user intent
2. Break down complex requests into multiple steps
3. Create multiple related objects
4. Arrange objects logically
5. Coordinate multiple tool calls

## Expected Tool Call Sequence

When processing "Create a login form", the LLM should make approximately **7-8 tool calls**:

### Step 1: Create Username Label
```typescript
Tool: createText
Parameters: {
  text: "Username",
  x: 100,
  y: 100,
  fontSize: 16,
  fill: "#000000"
}
```

### Step 2: Create Username Input Field
```typescript
Tool: createRectangle
Parameters: {
  x: 100,
  y: 125,
  width: 250,
  height: 40,
  fill: "#ffffff",
  name: "Username Input"
}
```

### Step 3: Create Password Label
```typescript
Tool: createText
Parameters: {
  text: "Password",
  x: 100,
  y: 180,
  fontSize: 16,
  fill: "#000000"
}
```

### Step 4: Create Password Input Field
```typescript
Tool: createRectangle
Parameters: {
  x: 100,
  y: 205,
  width: 250,
  height: 40,
  fill: "#ffffff",
  name: "Password Input"
}
```

### Step 5: Create Login Button
```typescript
Tool: createRectangle
Parameters: {
  x: 100,
  y: 260,
  width: 250,
  height: 40,
  fill: "#0ea5e9",
  name: "Login Button"
}
```

### Step 6: Create Button Label
```typescript
Tool: createText
Parameters: {
  text: "Login",
  x: 180,
  y: 270,
  fontSize: 16,
  fill: "#ffffff"
}
```

### Step 7 (Optional): Arrange Elements
```typescript
Tool: arrangeInColumn
Parameters: {
  objectIds: [<all created object IDs>],
  spacing: 15,
  x: 200
}
```

## Success Criteria

✅ **All required elements created:**
- [x] Username label (text)
- [x] Username input field (rectangle)
- [x] Password label (text)
- [x] Password input field (rectangle)
- [x] Login button (rectangle)
- [x] Button text label (text)

✅ **Elements properly arranged:**
- [x] Vertically stacked
- [x] Consistent spacing (15-20px)
- [x] Horizontally aligned

✅ **Elements properly styled:**
- [x] Input fields have white/light background
- [x] Button has primary color (#0ea5e9)
- [x] Text is readable (black on white, white on blue)

✅ **Objects are selectable and editable:**
- [x] All objects appear in canvas
- [x] All objects are selectable
- [x] All objects sync to Firebase RTDB

## Alternative Variations

The LLM might interpret "login form" differently and create:

### Variation 1: Minimalist Form
- Just 2 input fields and 1 button (no labels)
- Relies on placeholder text (not yet supported)

### Variation 2: Enhanced Form
- Includes "Remember me" checkbox
- Includes "Forgot password?" link
- Includes form title "Login"

### Variation 3: Grouped Form
- Creates all elements
- Uses `groupObjects` tool to group them
- Makes form movable as single unit

All variations are acceptable as long as core requirements are met.

## Edge Cases & Expected Behavior

### Edge Case 1: No arrangeInColumn call
**Issue:** Objects created but overlapping or poorly positioned
**Expected:** LLM should use reasonable default positions even without arrangement tool
**Mitigation:** Improve system prompt to emphasize arrangement for multi-object commands

### Edge Case 2: Wrong object order
**Issue:** Button created before input fields
**Expected:** Order doesn't matter as long as arrangeInColumn is called
**Mitigation:** arrangeInColumn should sort by Y position

### Edge Case 3: Inconsistent styling
**Issue:** Input fields have different colors
**Expected:** All input fields should match
**Mitigation:** Improve tool descriptions to emphasize consistency

## Testing Strategy (Production)

Once deployed to production with real LLM:

### Test 1: Basic Command
```
User: "Create a login form"
Expected: 6-8 tool calls, all elements created and arranged
```

### Test 2: With Specifications
```
User: "Create a blue login form with 2 input fields"
Expected: Custom color applied to button
```

### Test 3: With Position
```
User: "Create a login form at position 500, 300"
Expected: First element starts at (500, 300)
```

## Current Status

- ✅ All required tools implemented (createText, createRectangle, arrangeInColumn)
- ✅ Tool descriptions include usage examples
- ✅ Tools return object IDs for subsequent operations
- ⏳ Awaiting production LLM integration for actual testing
- ⏳ System prompt needs examples of multi-step commands

## Next Steps

1. Add multi-step command examples to system prompt
2. Deploy to staging environment
3. Test with real LLM (OpenAI GPT-4 or Claude Haiku)
4. Measure response time (should be < 6 seconds)
5. Refine prompts based on actual LLM behavior
6. Document any issues and create refinement plan

## Notes

- This is a representative complex command for MVP
- Other complex commands (e.g., "Create a button", "Create a card") will use similar patterns
- The key is testing multi-tool coordination, not just single tool execution
- Real-world testing will reveal prompt engineering needs
