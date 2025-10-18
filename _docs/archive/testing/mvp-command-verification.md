# MVP Command Verification Test Suite

**Date:** 2025-10-15
**Status:** All tools implemented, awaiting production LLM testing
**Test Type:** Integration Testing

## Overview

This document defines the 6 MVP command types and provides test cases for each. These commands represent the core functionality required for the AI Canvas Agent MVP.

## Test Environment

- **Frontend:** React + Konva.js canvas
- **Backend:** Firebase Functions + LangChain
- **LLM:** OpenAI GPT-4 (dev) / Claude Haiku (production)
- **Tools:** 13 canvas manipulation tools
- **Real-time sync:** Firebase Realtime Database

## MVP Command Types

### 1. Creation Commands

**Purpose:** Create new objects on the canvas

#### Test Case 1.1: Simple Rectangle
```
Command: "Create a red rectangle"

Expected Tool Calls:
1. createRectangle({ x: 200, y: 200, width: 150, height: 100, fill: "#ff0000" })

Success Criteria:
✅ Rectangle created at reasonable position
✅ Rectangle is red (#ff0000 or similar)
✅ Rectangle is visible and selectable
✅ Object synced to Firebase RTDB
✅ Response time < 3 seconds
```

#### Test Case 1.2: Complex Object Creation
```
Command: "Create a blue circle with 50px radius at position 300, 400"

Expected Tool Calls:
1. createCircle({ x: 300, y: 400, radius: 50, fill: "#0000ff" })

Success Criteria:
✅ Circle created at exact position (300, 400)
✅ Radius is 50px
✅ Circle is blue
✅ Object synced to Firebase RTDB
✅ Response time < 3 seconds
```

#### Test Case 1.3: Text Creation
```
Command: "Create text that says 'Hello World'"

Expected Tool Calls:
1. createText({ text: "Hello World", x: 200, y: 200, fontSize: 24 })

Success Criteria:
✅ Text object created
✅ Text content is "Hello World"
✅ Text is readable (good size and color)
✅ Object synced to Firebase RTDB
✅ Response time < 3 seconds
```

---

### 2. Manipulation Commands

**Purpose:** Move, modify, or delete existing objects

#### Test Case 2.1: Move Object
```
Setup: Create a blue circle at (100, 100)
Command: "Move the blue circle to position 500, 300"

Expected Tool Calls:
1. getCanvasState({ filter: { color: "blue" } })
2. moveObject({ objectId: "<circle-id>", x: 500, y: 300 })

Success Criteria:
✅ LLM queries canvas state first
✅ Circle identified correctly
✅ Circle moved to (500, 300)
✅ Movement is smooth (real-time sync)
✅ Response time < 3 seconds
```

#### Test Case 2.2: Move to Center
```
Setup: Create a red square at (50, 50)
Command: "Move the red square to the center"

Expected Tool Calls:
1. getCanvasState({ filter: { color: "red", type: "rectangle" } })
2. moveObject({ objectId: "<square-id>", x: <canvas-width/2>, y: <canvas-height/2> })

Success Criteria:
✅ LLM calculates center based on canvas size
✅ Square moved to approximate center
✅ Response time < 3 seconds
```

---

### 3. Layout Commands

**Purpose:** Arrange multiple objects spatially

#### Test Case 3.1: Arrange in Row
```
Setup: Create 3 rectangles at random positions
Command: "Arrange these rectangles in a row"

Expected Tool Calls:
1. getCanvasState({ filter: { type: "rectangle" } }) [Optional]
2. arrangeInRow({ objectIds: [<id1>, <id2>, <id3>], spacing: 20 })

Success Criteria:
✅ All rectangles at same Y position
✅ Even spacing between rectangles
✅ Left-to-right order preserved
✅ Response time < 4 seconds
```

#### Test Case 3.2: Arrange in Grid
```
Setup: Create 6 circles
Command: "Arrange them in a 3x2 grid"

Expected Tool Calls:
1. arrangeInGrid({ objectIds: [<all-ids>], columns: 3, spacing: 20 })

Success Criteria:
✅ 3 columns, 2 rows layout
✅ Even spacing (both horizontal and vertical)
✅ Grid starts at reasonable position
✅ Response time < 4 seconds
```

---

### 4. Complex Multi-Step Commands

**Purpose:** Execute commands requiring multiple coordinated operations

#### Test Case 4.1: Create Login Form
```
Command: "Create a login form"

Expected Tool Calls:
1. createText({ text: "Username", x: 100, y: 100 })
2. createRectangle({ x: 100, y: 125, width: 250, height: 40, fill: "#ffffff" })
3. createText({ text: "Password", x: 100, y: 180 })
4. createRectangle({ x: 100, y: 205, width: 250, height: 40, fill: "#ffffff" })
5. createRectangle({ x: 100, y: 260, width: 250, height: 40, fill: "#0ea5e9" })
6. createText({ text: "Login", x: 180, y: 270, fill: "#ffffff" })
7. arrangeInColumn({ objectIds: [<all-ids>], spacing: 15 }) [Optional]

Success Criteria:
✅ 6+ objects created (labels, inputs, button)
✅ All elements arranged logically (vertical stack)
✅ Consistent styling (white inputs, blue button)
✅ All objects visible and selectable
✅ Response time < 6 seconds
```

#### Test Case 4.2: Create Button
```
Command: "Create a blue button that says 'Submit'"

Expected Tool Calls:
1. createRectangle({ x: 200, y: 200, width: 120, height: 40, fill: "#0000ff" })
2. createText({ text: "Submit", x: 230, y: 210, fill: "#ffffff" })

Success Criteria:
✅ Rectangle (button background) created
✅ Text (button label) created
✅ Text positioned inside button
✅ Colors appropriate (blue bg, white text)
✅ Response time < 4 seconds
```

---

### 5. Resize Commands

**Purpose:** Change dimensions of existing objects

#### Test Case 5.1: Make Object Bigger
```
Setup: Create a square (100x100)
Command: "Make the square twice as big"

Expected Tool Calls:
1. getCanvasState({ filter: { type: "rectangle" } })
2. resizeObject({ objectId: "<square-id>", width: 200, height: 200 })

Success Criteria:
✅ Object dimensions doubled (200x200)
✅ Position remains the same
✅ Resize is smooth (real-time sync)
✅ Response time < 3 seconds
```

#### Test Case 5.2: Set Specific Size
```
Setup: Create a circle (radius 30)
Command: "Make the circle 80 pixels wide"

Expected Tool Calls:
1. getCanvasState({ filter: { type: "circle" } })
2. resizeObject({ objectId: "<circle-id>", radius: 40 })

Success Criteria:
✅ Circle radius updated to 40px (diameter 80px)
✅ LLM correctly converts diameter to radius
✅ Response time < 3 seconds
```

---

### 6. Rotation Commands

**Purpose:** Rotate objects

#### Test Case 6.1: Rotate by Degrees
```
Setup: Create text "Hello"
Command: "Rotate the text 45 degrees"

Expected Tool Calls:
1. getCanvasState({ filter: { type: "text" } })
2. rotateObject({ objectId: "<text-id>", rotation: 45 })

Success Criteria:
✅ Text rotated 45 degrees clockwise
✅ Rotation is smooth (real-time sync)
✅ Text remains readable
✅ Response time < 3 seconds
```

#### Test Case 6.2: Rotate to Angle
```
Setup: Create a rectangle (rotated 30 degrees)
Command: "Rotate the rectangle to 90 degrees"

Expected Tool Calls:
1. getCanvasState()
2. rotateObject({ objectId: "<rect-id>", rotation: 90 })

Success Criteria:
✅ Rectangle rotated to exactly 90 degrees
✅ LLM uses absolute angle, not relative
✅ Response time < 3 seconds
```

---

## Edge Cases & Error Handling

### Edge Case 1: Ambiguous Object Reference
```
Setup: Create 2 red rectangles
Command: "Move the red rectangle to center"

Expected Behavior:
- LLM should detect ambiguity
- LLM should ask for clarification: "There are 2 red rectangles. Which one should I move?"
- OR: LLM should move all matching objects

Success Criteria:
✅ No silent failures
✅ User is notified of ambiguity
✅ Reasonable fallback behavior
```

### Edge Case 2: Object Not Found
```
Setup: Empty canvas
Command: "Delete the blue circle"

Expected Behavior:
- getCanvasState returns empty list
- LLM responds: "I don't see any blue circles on the canvas."

Success Criteria:
✅ No error thrown
✅ Helpful error message
✅ Suggests alternative action
```

### Edge Case 3: Impossible Request
```
Command: "Rotate the circle"

Expected Behavior:
- LLM explains: "Circles are rotationally symmetric, so rotating them has no visual effect. Did you mean to rotate a different object?"

Success Criteria:
✅ LLM understands geometry
✅ Provides helpful explanation
✅ Suggests alternatives
```

---

## Performance Requirements

| Command Type | Max Response Time | Target Response Time |
|--------------|-------------------|----------------------|
| Simple (create, move) | 3s | 2s |
| Medium (arrange, resize) | 4s | 3s |
| Complex (multi-step) | 6s | 4s |

**Breakdown:**
- LLM processing: 1-2s
- Tool execution: 0.5-1s
- RTDB sync: 0.1-0.5s (50ms throttle + network)

---

## Test Execution Plan

### Phase 1: Tool Verification (Current)
- ✅ All 13 tools implemented
- ✅ All tools tested individually
- ✅ TypeScript compilation passes
- ✅ No runtime errors

### Phase 2: Staging Environment (Next)
1. Deploy functions to staging
2. Configure OpenAI API key
3. Test each MVP command type manually
4. Measure response times
5. Document any issues

### Phase 3: Production Deployment
1. Switch to Claude Haiku (cost optimization)
2. Test all commands again with Claude
3. Compare results to OpenAI baseline
4. Adjust prompts if needed
5. Enable for select users (beta)

### Phase 4: Monitoring & Refinement
1. Track token usage and costs
2. Monitor error rates
3. Collect user feedback
4. Identify common failure patterns
5. Refine tool descriptions and prompts

---

## Current Status

✅ **Phase 4 Complete (Tools Implementation)**
- All 13 MVP tools implemented:
  - 4 creation tools (rectangle, circle, text, line)
  - 5 manipulation tools (move, resize, rotate, delete, updateAppearance)
  - 1 query tool (getCanvasState)
  - 3 layout tools (arrangeInRow, arrangeInColumn, arrangeInGrid)

✅ **Documentation Complete**
- MVP command types defined
- Test cases documented
- Success criteria established
- Edge cases identified

⏳ **Awaiting Production Testing**
- Need OpenAI API key configuration
- Need staging environment setup
- Need real LLM integration

---

## Next Steps

1. **Update system prompt** with multi-step command examples
2. **Deploy to staging** with OpenAI integration
3. **Run test suite** and document results
4. **Measure performance** against targets
5. **Refine prompts** based on LLM behavior
6. **Switch to Claude Haiku** for production
7. **Enable for beta users**

---

## Tools Checklist

- ✅ `createRectangle` - Create rectangles
- ✅ `createCircle` - Create circles
- ✅ `createText` - Create text objects
- ✅ `createLine` - Create lines
- ✅ `moveObject` - Move objects to position
- ✅ `resizeObject` - Resize objects
- ✅ `rotateObject` - Rotate objects
- ✅ `deleteObjects` - Delete objects
- ✅ `updateAppearance` - Change colors/styles
- ✅ `getCanvasState` - Query current canvas
- ✅ `arrangeInRow` - Horizontal layout
- ✅ `arrangeInColumn` - Vertical layout
- ✅ `arrangeInGrid` - Grid layout

**Total:** 13/13 MVP tools implemented ✅
