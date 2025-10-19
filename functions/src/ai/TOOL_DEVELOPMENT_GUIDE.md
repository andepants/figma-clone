**# AI Tool Development Guide**

## Best Practices for Canvas Tool Development

This guide outlines best practices for creating new AI tools and maintaining existing ones.

## Tool Structure

### 1. File Organization

```
functions/src/ai/tools/
├── base.ts                    # Base class (DO NOT MODIFY)
├── types.ts                   # Shared types (extend as needed)
├── index.ts                   # Tool registry (add new tools here)
├── createRectangle.ts         # Example: Single object creation
├── createBatch.ts             # Example: Batch operations
├── arrangeInGrid.ts           # Example: Layout tool
└── generateAppIcon.ts         # Example: AI generation tool
```

### 2. Tool Class Template

```typescript
/**
 * [Tool Name] Tool
 *
 * [Brief description of what this tool does]
 *
 * Features:
 * - [Feature 1]
 * - [Feature 2]
 * - [Feature 3]
 */

import {z} from "zod";
import {CanvasTool} from "./base";
import {ToolResult, CanvasToolContext} from "./types";
import {createCanvasObject} from "../../services/canvas-objects";
import * as logger from "firebase-functions/logger";

/**
 * Schema for [tool name] parameters
 *
 * Define all parameters with:
 * - Appropriate types (number, string, enum, etc.)
 * - Validation constraints (min, max, regex, etc.)
 * - Default values where sensible
 * - Clear descriptions for the LLM
 */
const MyToolSchema = z.object({
  requiredParam: z.string()
    .min(1)
    .describe("Clear description for the AI"),
  optionalParam: z.number()
    .optional()
    .default(100)
    .describe("Description with default value"),
});

/**
 * Tool for [purpose]
 *
 * [Detailed explanation of when and how to use this tool]
 */
export class MyTool extends CanvasTool {
  constructor(context: CanvasToolContext) {
    super(
      "myTool",  // Name used by LLM to call this tool
      "Short description for LLM to understand when to use this tool. " +
      "Include key parameters and default behavior.",
      MyToolSchema,
      context
    );
  }

  /**
   * Execute [tool operation]
   *
   * @param input - Validated parameters matching MyToolSchema
   * @returns Tool result with success status and details
   */
  async execute(
    input: z.infer<typeof MyToolSchema>
  ): Promise<ToolResult> {
    try {
      // 1. Validate inputs beyond Zod schema
      // 2. Perform calculations/preparations
      // 3. Execute Firebase operations
      // 4. Return success result

      logger.info("Tool executed successfully", {
        param: input.requiredParam
      });

      return {
        success: true,
        message: "Clear user-facing message about what was done",
        objectsCreated: ["id1", "id2"],  // If applicable
        objectsModified: ["id3"],        // If applicable
        objectsDeleted: ["id4"],         // If applicable
        data: {
          // Additional structured data
        },
      };
    } catch (error) {
      logger.error("Tool execution failed", {error});
      return {
        success: false,
        error: String(error),
        message: "User-friendly error message",
      };
    }
  }
}
```

## Best Practice Checklist

### ✅ Schema Design

- [ ] **All parameters described** - Clear descriptions for LLM
- [ ] **Sensible defaults** - Minimize required user input
- [ ] **Proper validation** - Min/max, regex, enum constraints
- [ ] **Optional parameters** - Use `.optional()` for non-required fields
- [ ] **Type safety** - Use appropriate Zod types (number, string, enum, etc.)

### ✅ Input Validation

```typescript
// Validate colors
if (!this.isValidColor(input.fill)) {
  return {
    success: false,
    error: `Invalid color: ${input.fill}`,
    message: "Color validation failed",
  };
}

// Validate required relationships
if (input.type === "text" && !input.text) {
  return {
    success: false,
    error: "Text content required for text objects",
    message: "Missing required parameter",
  };
}

// Validate object existence
const object = this.findObject(input.objectId);
if (!object) {
  return {
    success: false,
    error: `Object ${input.objectId} not found`,
    message: "Object doesn't exist",
  };
}
```

### ✅ Position Handling

```typescript
// Default to viewport center (user's current view)
const x = input.x ??
  (this.context.viewportBounds?.centerX ||
   this.context.canvasSize.width / 2);
const y = input.y ??
  (this.context.viewportBounds?.centerY ||
   this.context.canvasSize.height / 2);

// Avoid overlaps when requested
if (input.avoidOverlap) {
  const emptyPos = findEmptySpace(
    x, y, width, height,
    this.context.currentObjects
  );
  x = emptyPos.x;
  y = emptyPos.y;
}
```

### ✅ Firebase Operations

```typescript
// ✅ GOOD: Atomic batch update
const updates: Record<string, unknown> = {};
updates[`canvases/${canvasId}/objects/${id1}/x`] = 100;
updates[`canvases/${canvasId}/objects/${id2}/x`] = 200;
await getDatabase().ref().update(updates);

// ❌ BAD: Multiple sequential writes (not atomic)
await db.ref(`canvases/${canvasId}/objects/${id1}/x`).set(100);
await db.ref(`canvases/${canvasId}/objects/${id2}/x`).set(200);
```

### ✅ Error Handling

```typescript
// ✅ GOOD: Return error result (graceful)
try {
  // ... operation
} catch (error) {
  logger.error("Operation failed", {error, context});
  return {
    success: false,
    error: String(error),
    message: "User-friendly message",
  };
}

// ❌ BAD: Throw error (breaks LangChain flow)
if (invalid) {
  throw new Error("Something went wrong");
}
```

### ✅ Memory Management

```typescript
// Update context with created objects for conversation memory
if (result.objectsCreated && result.objectsCreated.length > 0) {
  this.context.lastCreatedObjectIds = result.objectsCreated;
}
```

### ✅ Logging

```typescript
// Log at appropriate levels
logger.info("Starting operation", {
  userId: this.context.userId,
  params: input,
});

logger.error("Operation failed", {
  error,
  userId: this.context.userId,
  params: input,
});

// Include context for debugging
logger.info("Position calculated", {
  original: {x: inputX, y: inputY},
  adjusted: {x, y},
  reason: "viewport center",
});
```

### ✅ Return Values

```typescript
return {
  success: true,
  message: "Created 30 circles in spiral pattern",  // Clear, specific
  objectsCreated: [...ids],
  data: {
    // Structured data for debugging/analytics
    pattern: "spiral",
    count: 30,
    radius: 200,
  },
};
```

### ✅ Documentation

```typescript
/**
 * Generate positions for objects arranged in a circle
 *
 * @param count - Number of objects to arrange
 * @param centerX - X coordinate of circle center
 * @param centerY - Y coordinate of circle center
 * @param radius - Radius of the circle
 * @param startAngle - Starting angle in degrees (0 = right, 90 = top)
 * @returns Array of positions in circular arrangement
 *
 * @example
 * // Arrange 8 circles around a point
 * const positions = generateCirclePattern(8, 500, 500, 200);
 */
```

## Common Patterns

### Pattern 1: Single Object Creation

```typescript
const objectId = await createCanvasObject({
  canvasId: this.context.canvasId,
  type: "rectangle",
  position: {x, y},
  dimensions: {width, height},
  appearance: {fill, stroke, strokeWidth},
  name: input.name,
  userId: this.context.userId,
});

return {
  success: true,
  message: `Created rectangle at (${x}, ${y})`,
  objectsCreated: [objectId],
};
```

### Pattern 2: Batch Object Creation

```typescript
const createdIds: string[] = [];
const errors: Array<{index: number; error: string}> = [];

for (let i = 0; i < positions.length; i++) {
  try {
    const id = await createCanvasObject({...});
    createdIds.push(id);

    // Update memory for position awareness
    this.context.lastCreatedObjectIds = createdIds;
  } catch (error) {
    errors.push({index: i, error: String(error)});
  }
}

// Report partial success
return {
  success: createdIds.length > 0,
  message: errors.length === 0
    ? `Created ${createdIds.length} objects`
    : `Created ${createdIds.length} of ${positions.length} objects (${errors.length} failed)`,
  objectsCreated: createdIds,
  data: {errors: errors.length > 0 ? errors : undefined},
};
```

### Pattern 3: Object Manipulation

```typescript
// Find object
const object = this.findObject(input.objectId);
if (!object) {
  return {
    success: false,
    error: `Object ${input.objectId} not found`,
    message: "Object doesn't exist",
  };
}

// Update in Firebase
await getDatabase()
  .ref(`canvases/${this.context.canvasId}/objects/${object.id}`)
  .update({
    x: newX,
    y: newY,
  });

return {
  success: true,
  message: `Moved object to (${newX}, ${newY})`,
  objectsModified: [object.id],
};
```

### Pattern 4: Layout/Arrangement

```typescript
// Calculate positions for all objects
const positions = calculateLayout(objects, input);

// Batch update for atomicity
const updates: Record<string, number> = {};
for (let i = 0; i < objects.length; i++) {
  const obj = objects[i];
  const pos = positions[i];
  updates[`canvases/${canvasId}/objects/${obj.id}/x`] = pos.x;
  updates[`canvases/${canvasId}/objects/${obj.id}/y`] = pos.y;
}

await getDatabase().ref().update(updates);

return {
  success: true,
  message: `Arranged ${objects.length} objects in grid`,
  objectsModified: objects.map(o => o.id),
};
```

## Testing Your Tool

### Manual Testing Checklist

- [ ] **Happy path**: Tool works with valid inputs
- [ ] **Default values**: Tool works with minimal parameters
- [ ] **Invalid inputs**: Tool gracefully handles bad data
- [ ] **Edge cases**: Empty arrays, boundary values, etc.
- [ ] **Memory**: Tool updates `lastCreatedObjectIds`
- [ ] **Viewport**: Tool respects user's current view
- [ ] **Concurrency**: Tool handles rapid sequential calls

### Example Test Commands

```bash
# Test your new tool through the AI assistant
"Create [object] using [tool]"
"Make [operation] with [parameters]"
"Test [edge case]"
```

## Performance Considerations

### Optimization Tips

1. **Minimize Firebase calls** - Use batch updates
2. **Validate early** - Check inputs before Firebase operations
3. **Cache when possible** - Reuse calculated values
4. **Log strategically** - Important events only (not every loop iteration)
5. **Limit batch sizes** - Max 100 objects for createBatch
6. **Avoid nested loops** - O(n²) algorithms slow down with many objects

### Performance Targets

| Operation | Target Latency | Notes |
|-----------|---------------|-------|
| Single create | < 1s | Includes OpenAI + Firebase |
| Batch create (per object) | < 500ms | Sequential creation |
| Manipulation | < 800ms | Move, resize, rotate |
| Layout | < 1s | Arrange up to 50 objects |
| Query | < 500ms | Read-only operations |

## Common Mistakes

### ❌ Mistake 1: Throwing Errors

```typescript
// ❌ BAD: Breaks LangChain flow
if (!valid) {
  throw new Error("Invalid input");
}

// ✅ GOOD: Returns error result
if (!valid) {
  return {
    success: false,
    error: "Invalid input",
    message: "Validation failed",
  };
}
```

### ❌ Mistake 2: Non-Atomic Updates

```typescript
// ❌ BAD: Multiple writes (can partially fail)
for (const obj of objects) {
  await db.ref(`objects/${obj.id}/x`).set(newX);
}

// ✅ GOOD: Single atomic batch update
const updates = {};
for (const obj of objects) {
  updates[`objects/${obj.id}/x`] = newX;
}
await db.ref().update(updates);
```

### ❌ Mistake 3: Missing Descriptions

```typescript
// ❌ BAD: No description for LLM
width: z.number().optional()

// ✅ GOOD: Clear description
width: z.number()
  .min(1)
  .max(5000)
  .optional()
  .default(200)
  .describe("Width in pixels (default: 200)")
```

### ❌ Mistake 4: Ignoring Viewport

```typescript
// ❌ BAD: Always defaults to canvas center
const x = input.x || this.context.canvasSize.width / 2;

// ✅ GOOD: Uses viewport center (where user is looking)
const x = input.x ||
  (this.context.viewportBounds?.centerX ||
   this.context.canvasSize.width / 2);
```

### ❌ Mistake 5: Vague Messages

```typescript
// ❌ BAD: Generic message
return {
  success: true,
  message: "Done",
};

// ✅ GOOD: Specific, informative message
return {
  success: true,
  message: `Created 30 circles in spiral pattern at (${centerX}, ${centerY})`,
  objectsCreated: ids,
};
```

## Adding Your Tool to the System

### 1. Create Tool File

```bash
touch functions/src/ai/tools/myNewTool.ts
```

### 2. Implement Tool Class

Follow the template and best practices above.

### 3. Register Tool

**Edit `functions/src/ai/tools/index.ts`:**

```typescript
// Add import
import {MyNewTool} from "./myNewTool";

// Add to tools array
export function getTools(context: CanvasToolContext): DynamicStructuredTool[] {
  const tools = [
    // ... existing tools ...
    new MyNewTool(context),  // Add here
  ];
  return tools.map((tool) => tool.getTool());
}
```

### 4. Update System Prompt (Optional)

**Edit `functions/src/ai/chain.ts`** if your tool needs special instructions:

```typescript
const SYSTEM_PROMPT = `...
Special Tool Guidelines:
- MyNewTool: Use this when [specific scenario]
  Example: "Do [task]" → myNewTool({params})
...`;
```

### 5. Test Thoroughly

Test your tool with various commands through the AI assistant.

## Getting Help

- **Review existing tools**: `createBatch.ts`, `arrangeInGrid.ts`
- **Check documentation**: `functions/src/ai/README.md`
- **Debug with logs**: Use `logger.info()` liberally
- **Ask questions**: Comment in your PR for review

## Resources

- [Zod Documentation](https://zod.dev/)
- [LangChain Tools](https://js.langchain.com/docs/modules/agents/tools/)
- [Firebase RTDB](https://firebase.google.com/docs/database)
- [Project README](./README.md)
