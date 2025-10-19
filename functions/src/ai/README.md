**# AI Canvas Agent**

## Overview

The AI Canvas Agent enables natural language control of canvas operations using LangChain and OpenAI's GPT models. It provides tools for creating, manipulating, and arranging canvas objects through conversational commands.

## Architecture

### Core Components

1. **Tools** (`tools/`) - Individual canvas operation tools
2. **Chain** (`chain.ts`) - LangGraph React agent with memory
3. **Handler** (`handlers/processAICommand.ts`) - Firebase callable function entry point
4. **Utilities** (`utils/`) - Helper functions for context optimization, patterns, etc.

### Tool System

All tools extend the `CanvasTool` base class which provides:
- ✅ Zod schema validation
- ✅ Shared context (canvas state, viewport, user info)
- ✅ Standardized result format
- ✅ Automatic error handling and logging
- ✅ Conversation memory tracking

### Available Tools

**Creation Tools:**
- `createRectangle` - Create single rectangle
- `createCircle` - Create single circle
- `createText` - Create single text object
- `createLine` - Create single line
- `createBatch` - **NEW:** Create 2-100 objects in patterns (circle, spiral, grid, etc.)

**Manipulation Tools:**
- `moveObject` - Move object to new position
- `resizeObject` - Change object dimensions
- `rotateObject` - Rotate object
- `updateAppearance` - Change colors, stroke, opacity
- `deleteObjects` - Remove one or more objects

**Layout Tools:**
- `arrangeInRow` - Arrange objects horizontally
- `arrangeInColumn` - Arrange objects vertically
- `arrangeInGrid` - Arrange objects in grid

**Query Tools:**
- `getCanvasState` - Get current canvas information
- `getViewportCenter` - Get user's current view center
- `findEmptySpace` - Find available space for new objects

**AI Generation Tools:**
- `generateAppIcon` - Generate AI app icons
- `generateFeatureGraphic` - Generate AI feature graphics

## Batch Operations

### When to Use `createBatch`

**ALWAYS use `createBatch` for creating 2+ objects** instead of calling individual create tools multiple times.

**Why?**
- ✅ Sequential execution prevents system overload
- ✅ Progressive UI updates (objects appear one-by-one)
- ✅ Position tracking (each object knows about previous ones)
- ✅ Graceful error handling (reports partial success)
- ✅ Pattern-based positioning (no manual calculation needed)

### Supported Patterns

| Pattern | Description | Use Case | Key Parameters |
|---------|-------------|----------|----------------|
| `circle` | Objects arranged in a circle | "Create 30 squares in a circle" | `circleRadius` |
| `spiral` | Objects arranged in a spiral | "Make a spiral of 20 circles" | `circleRadius`, `spacing` |
| `grid` | Objects arranged in rows/columns | "Create 12 rectangles in a grid" | `columns`, `spacing` |
| `wave` | Objects following a sine wave | "Make a wave of 25 circles" | `amplitude`, `frequency` |
| `hexagon` | Honeycomb arrangement | "Create hexagonal pattern of 18 circles" | `spacing`, `columns` |
| `scatter` | Random positions with min distance | "Scatter 50 circles randomly" | `spacing` (min distance) |
| `line` | Objects in a straight line | "Create 5 text boxes in a line" | `spacing` |

### Example Usage

```typescript
// Command: "Create 30 blue squares in a circle"
await createBatch({
  type: 'rectangle',
  count: 30,
  pattern: 'circle',
  width: 100,
  height: 100,
  fill: '#3b82f6',
  circleRadius: 250,
  namePrefix: 'Square'
});
```

## Streaming & Progressive Updates

### Current Behavior

**Firebase Callable Functions are request-response** - they don't support true server-sent streaming. However, batch operations still provide progressive visual feedback:

1. **Sequential Creation**: Objects created one-at-a-time in a loop
2. **Firebase RTDB Real-time Listeners**: Frontend automatically detects new objects
3. **Progressive Rendering**: Objects appear on canvas as they're created (not all at once)

**Typical Timeline:**
- Object 1 created → Firebase RTDB update → Frontend listener fires → Renders
- Object 2 created → Firebase RTDB update → Frontend listener fires → Renders
- ... continues for all objects

**User Experience:**
- ✅ Objects appear progressively (feels like streaming)
- ✅ No UI freeze or "all at once" rendering
- ✅ Clear visual feedback during batch operations

### Limitations

- ❌ No intermediate progress percentage
- ❌ No cancellation mid-batch
- ❌ No real-time error reporting during execution

### Future Streaming Improvements (Optional)

If true streaming is needed, consider:

1. **HTTP Streaming Endpoint** (instead of callable):
   ```typescript
   // Server-Sent Events
   res.setHeader('Content-Type', 'text/event-stream');
   for (const object of objects) {
     const id = await createObject(object);
     res.write(`data: ${JSON.stringify({id, progress: i/total})}\n\n`);
   }
   ```

2. **Pub/Sub Progress Updates**:
   ```typescript
   // Publish progress events to topic
   await pubsub.topic('batch-progress').publish({
     batchId,
     current: i,
     total: count,
     objectId: id
   });
   ```

3. **Firestore Progress Document**:
   ```typescript
   // Write progress to Firestore doc
   await db.doc(`batches/${batchId}`).update({
     progress: i / count,
     objectIds: [...ids]
   });
   ```

**Current approach is sufficient** for most use cases (2-100 objects).

## Best Practices

### Tool Development

1. **Extend `CanvasTool` base class** - Provides standardized structure
2. **Use Zod schemas** - Type-safe parameter validation
3. **Validate colors** - Use `this.isValidColor()` helper
4. **Use viewport center** - Default position to `viewportBounds.center{X,Y}`
5. **Avoid overlaps** - Use `findEmptySpace()` when `avoidOverlap: true`
6. **Update context** - Set `lastCreatedObjectIds` for memory
7. **Atomic updates** - Use `db.ref().update()` for batch Firebase operations
8. **Comprehensive JSDoc** - Document all parameters and return values
9. **Error handling** - Return `{success: false, error}` instead of throwing
10. **Logging** - Use `logger.info/error` for debugging

### System Prompt Guidelines

The AI agent's behavior is defined by the system prompt in `chain.ts`:

- **Action-oriented** - Execute immediately, don't ask unless truly ambiguous
- **Use sensible defaults** - Don't request every parameter
- **Viewport-aware** - Place new objects in user's current view
- **Memory-enabled** - Remember last created objects for "it", "them", etc.
- **No suggestions** - Confirm actions without recommending next steps

### Context Optimization

The `context-optimizer.ts` reduces token usage by:

- ✅ Limiting to 100 closest objects to viewport
- ✅ Including selected objects even if far away
- ✅ Calculating viewport bounds for spatial awareness
- ✅ Caching optimized contexts (5-minute TTL)

### Rate Limiting

- **10 commands per minute** per user (configurable in `rate-limiter.ts`)
- Enforced at handler level before AI invocation
- Prevents abuse and excessive API costs

## Performance

### Benchmarks

| Operation | Avg Latency | Notes |
|-----------|-------------|-------|
| Single object creation | 800-1200ms | Includes OpenAI call + Firebase write |
| Batch 30 objects | 10-15s | Sequential creation (300-500ms/object) |
| Move/resize existing | 700-1000ms | Simpler operations |
| Context optimization | 5-10ms | Cached after first call |

### Optimization Strategies

1. **Context caching** - Reduces repeated calculations
2. **Tool schema simplification** - Fewer parameters = faster validation
3. **Batch Firebase updates** - `update()` instead of individual `set()` calls
4. **Viewport filtering** - Only send relevant objects to AI
5. **Memory trimming** - Keep last 10 messages only

## Error Handling

### Tool-Level Errors

Tools return `ToolResult` with graceful failure reporting:

```typescript
{
  success: false,
  error: "Invalid color: #GGGGGG",
  message: "Failed to create rectangle"
}
```

### Batch-Level Errors

`createBatch` supports partial success:

```typescript
{
  success: true, // Some succeeded
  message: "Created 28 of 30 circles (2 failed)",
  objectsCreated: [...28 IDs...],
  data: {
    created: 28,
    failed: 2,
    errors: [{index: 15, error: "..."}, ...]
  }
}
```

### Handler-Level Errors

Thrown as `HttpsError` for proper client-side handling:

```typescript
throw new HttpsError('invalid-argument', 'Command too long (max 500 characters)');
```

## Testing

### Manual Testing Commands

```bash
# Test single creation
"Create a blue square"
"Make a red circle"

# Test batch operations
"Create 30 blue squares in a circle"
"Make a spiral of 20 circles"
"Create 12 rectangles in a 3x4 grid"

# Test memory
"Create 5 yellow circles"
"Now arrange them in a row"
"Make them bigger"

# Test patterns
"Create a wave of 25 circles"
"Make a honeycomb of 18 hexagons"
"Scatter 30 random circles"
```

### Unit Testing (Future)

```typescript
// Example tool test
describe('CreateBatchTool', () => {
  it('should create 30 circles in circle pattern', async () => {
    const tool = new CreateBatchTool(mockContext);
    const result = await tool.execute({
      type: 'circle',
      count: 30,
      pattern: 'circle',
      fill: '#3b82f6',
      circleRadius: 200
    });
    expect(result.success).toBe(true);
    expect(result.objectsCreated).toHaveLength(30);
  });
});
```

## Analytics

All AI commands are logged to Firebase RTDB for analytics:

- User ID, provider, model name
- Token usage (prompt, completion, total)
- Response time
- Objects created/modified
- Tools used
- Success/failure status

## Future Enhancements

- [ ] True streaming progress updates (SSE or Pub/Sub)
- [ ] Batch operation cancellation
- [ ] Undo/redo support for batch operations
- [ ] More patterns (fractal, mandala, polygon)
- [ ] Smart grouping (auto-group batch-created objects)
- [ ] Animation paths (move objects along patterns over time)
- [ ] Batch image generation (multiple icons/graphics at once)
- [ ] Natural language queries ("how many circles are there?")
- [ ] Canvas export via AI ("export this as PNG")

## Resources

- [LangChain Documentation](https://js.langchain.com/)
- [LangGraph React Agent](https://langchain-ai.github.io/langgraphjs/how-tos/create-react-agent/)
- [OpenAI API Reference](https://platform.openai.com/docs)
- [Firebase Callable Functions](https://firebase.google.com/docs/functions/callable)
