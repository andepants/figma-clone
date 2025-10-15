# AI System Architecture

## Overview

The AI Canvas Agent uses Firebase Functions, LangChain, and LLMs (OpenAI/Claude) to process natural language commands and manipulate canvas objects in real-time.

## Architecture Diagram

```
┌─────────────┐
│  Frontend   │
│  (React)    │
└──────┬──────┘
       │ 1. Command + Canvas State
       │
       ▼
┌─────────────────────┐
│  Firebase Function  │
│  processAICommand   │
└──────┬──────────────┘
       │ 2. Create Agent
       │
       ▼
┌─────────────┐
│  LangChain  │
│   Agent     │
└──────┬──────┘
       │ 3. Interpret Command
       │
       ▼
┌─────────────┐
│     LLM     │
│  (Claude/   │
│   OpenAI)   │
└──────┬──────┘
       │ 4. Choose Tools
       │
       ▼
┌─────────────┐
│    Tools    │
│ (Create,    │
│ Move, etc)  │
└──────┬──────┘
       │ 5. Execute Operations
       │
       ▼
┌─────────────┐
│  Firebase   │
│    RTDB     │
└──────┬──────┘
       │ 6. Real-time Sync
       │
       ▼
┌─────────────┐
│ All Clients │
│  (Canvas)   │
└─────────────┘
```

## Component Breakdown

### Frontend (`src/features/ai-agent/`)

**AIInput.tsx**
- User input component with loading states
- Textarea with auto-resize
- Submit button with keyboard shortcuts (Enter)
- Error/success message display
- Command history (future enhancement)

**useAIAgent.ts**
- React hook for calling Firebase Functions
- Manages loading/error states
- Calls `processAICommand` callable function
- Returns result or error to UI

**aiStore.ts** (if exists)
- Zustand store for AI-related state
- Command history
- Loading states
- Error messages
- Usage statistics

### Backend (`functions/src/`)

**index.ts**
- Entry point for Firebase Functions
- `processAICommand` callable function
- Authentication and authorization
- Rate limiting
- Input validation
- Context optimization
- Analytics logging
- Error handling

**ai/chain.ts**
- LangChain agent setup
- System prompt configuration
- Agent executor creation
- Provider abstraction (OpenAI/Claude)

**ai/config.ts**
- LLM provider configuration
- Model selection (GPT-4o-mini, Claude 3.5 Haiku)
- API key management
- Temperature and parameter settings

**ai/tools/**
- Tool implementations for canvas operations
- Base tool class with common functionality
- Zod schemas for validation
- Individual tools:
  - `createRectangle.ts`, `createCircle.ts`, `createText.ts`, `createLine.ts`
  - `moveObject.ts`, `resizeObject.ts`, `rotateObject.ts`
  - `deleteObjects.ts`, `updateAppearance.ts`
  - `arrangeInRow.ts`, `arrangeInColumn.ts`, `arrangeInGrid.ts`
  - `getCanvasState.ts`

**services/canvas-objects.ts**
- RTDB manipulation utilities
- Create, read, update, delete operations
- Object validation
- Real-time sync helpers

**services/analytics.ts**
- Token usage tracking
- Cost calculation
- Usage statistics
- RTDB logging (analytics/ai-usage)

**services/rate-limiter.ts**
- Per-user rate limiting (10 commands/minute)
- RTDB-based distributed limiting
- Reset logic

**services/authorization.ts**
- Canvas permission checking
- Owner, edit, view permissions
- RTDB permission lookup

## Data Flow

### 1. Command Submission

```typescript
// Frontend: User types command
const { execute, loading, error } = useAIAgent();
await execute({
  command: "Create a blue rectangle",
  canvasId: currentCanvasId,
  canvasState: {
    objects: [...],
    selectedObjectIds: [...],
    canvasSize: { width: 5000, height: 5000 }
  }
});
```

### 2. Function Processing

```typescript
// Backend: processAICommand callable function
export const processAICommand = onCall(async (request) => {
  const { auth, data } = request;

  // 1. Authenticate
  if (!auth) throw new HttpsError('unauthenticated', '...');

  // 2. Rate limit
  const allowed = await checkRateLimit(auth.uid);
  if (!allowed) throw new HttpsError('resource-exhausted', '...');

  // 3. Validate input
  validateCommand(data.command);

  // 4. Authorize
  const canModify = await canUserModifyCanvas(auth.uid, data.canvasId);
  if (!canModify) throw new HttpsError('permission-denied', '...');

  // 5. Optimize context
  const optimized = optimizeContext(data.canvasState);

  // 6. Create agent
  const tools = getTools({ canvasId, userId, ... });
  const chain = await createAIChain(tools);

  // 7. Execute
  const result = await chain.invoke({ input: data.command });

  // 8. Log analytics
  await logAIUsage({ ... });

  // 9. Return result
  return { success: true, message: result.output, actions: [...] };
});
```

### 3. Tool Execution

```typescript
// Example: createRectangle tool
async execute(input) {
  // Validate color
  if (!this.isValidColor(input.fill)) {
    return { success: false, error: '...' };
  }

  // Create in RTDB
  const objectId = await createCanvasObject({
    canvasId: this.context.canvasId,
    type: 'rectangle',
    position: { x: input.x, y: input.y },
    dimensions: { width: input.width, height: input.height },
    appearance: { fill: input.fill },
    userId: this.context.userId,
  });

  return {
    success: true,
    message: 'Created rectangle...',
    objectsCreated: [objectId],
  };
}
```

### 4. Real-time Sync

```typescript
// RTDB structure
canvases/
  <canvas-id>/
    objects/
      <object-id>: {
        type: 'rectangle',
        x: 100,
        y: 200,
        width: 150,
        height: 100,
        fill: '#3b82f6',
        createdBy: '<user-id>',
        createdAt: 1234567890,
      }
```

All connected clients receive real-time updates via Firebase RTDB listeners.

## Adding New Tools

### 1. Create Tool File

```typescript
// functions/src/ai/tools/myNewTool.ts
import { z } from 'zod';
import { CanvasTool } from './base';
import { ToolResult, CanvasToolContext } from './types';

const MyToolSchema = z.object({
  param1: z.string().describe('Description for LLM'),
  param2: z.number().min(0).max(100),
});

export class MyNewTool extends CanvasTool {
  constructor(context: CanvasToolContext) {
    super(
      'myNewTool',
      'Human-readable description of what this tool does',
      MyToolSchema,
      context
    );
  }

  async execute(input: z.infer<typeof MyToolSchema>): Promise<ToolResult> {
    try {
      // 1. Validate input
      // 2. Perform RTDB operations
      // 3. Return result

      return {
        success: true,
        message: 'Operation completed',
        objectsCreated: [...], // optional
        objectsModified: [...], // optional
        data: { ... }, // optional
      };
    } catch (error) {
      return {
        success: false,
        error: String(error),
        message: 'Operation failed',
      };
    }
  }
}
```

### 2. Register Tool

```typescript
// functions/src/ai/tools/index.ts
import { MyNewTool } from './myNewTool';

export function getTools(context: CanvasToolContext): DynamicStructuredTool[] {
  return [
    // ... existing tools
    new MyNewTool(context).toDynamicTool(),
  ];
}
```

### 3. Test

```typescript
// Test with a command that would use your tool
// The LLM will automatically discover and use it if relevant
```

## Switching LLM Providers

### Environment Variables

```bash
# Use OpenAI (default)
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...

# Use Claude
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
```

### Code Configuration

```typescript
// functions/src/ai/config.ts
export function getAIProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER?.toLowerCase();
  return provider === 'anthropic' ? 'anthropic' : 'openai';
}

export function getLLM(provider: AIProvider) {
  if (provider === 'anthropic') {
    return new ChatAnthropic({
      modelName: 'claude-3-5-haiku-20241022',
      temperature: 0,
      anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return new ChatOpenAI({
    modelName: 'gpt-4o-mini',
    temperature: 0,
    openAIApiKey: process.env.OPENAI_API_KEY,
  });
}
```

### Model Comparison

| Provider | Model | Speed | Cost | Quality |
|----------|-------|-------|------|---------|
| Anthropic | Claude 3.5 Haiku | ⚡️⚡️⚡️ | 💰 | ⭐️⭐️⭐️⭐️ |
| OpenAI | GPT-4o-mini | ⚡️⚡️ | 💰💰 | ⭐️⭐️⭐️⭐️⭐️ |
| OpenAI | GPT-4 | ⚡️ | 💰💰💰💰 | ⭐️⭐️⭐️⭐️⭐️ |

**Current Recommendation:** Claude 3.5 Haiku (best speed/cost ratio)

## Cost Optimization

### Context Optimization

The `optimizeContext` function reduces token usage:

1. **Prioritize selected objects** (always included)
2. **Filter visible/unlocked objects** (most relevant)
3. **Limit to 100 objects max**
4. **Round coordinates** (precision not critical)
5. **Remove unnecessary fields** (internal state, metadata)

```typescript
// Before: 500 objects, ~50K tokens
// After: 100 objects, ~10K tokens (80% reduction)
```

### Token Usage Tracking

```typescript
// Analytics logged for every command
{
  userId: 'abc123',
  provider: 'anthropic',
  model: 'claude-3-5-haiku-20241022',
  promptTokens: 1234,
  completionTokens: 567,
  totalTokens: 1801,
  cost: 0.002, // Calculated based on model pricing
  command: 'Create a blue rectangle',
  success: true,
  responseTime: 1850, // ms
  canvasId: 'canvas-xyz',
  objectsCreated: 1,
  objectsModified: 0,
  toolsUsed: ['createRectangle'],
  timestamp: 1234567890,
}
```

### Cost Analysis

```typescript
// Query analytics for cost analysis
const ref = db.ref('analytics/ai-usage');
const snapshot = await ref
  .orderByChild('userId')
  .equalTo(userId)
  .limitToLast(100)
  .once('value');

const usage = snapshot.val();
const totalCost = Object.values(usage).reduce((sum, u) => sum + u.cost, 0);
```

## Performance Optimization

### Response Time Targets

- **Simple commands** (create one object): < 2 seconds
- **Medium commands** (create + arrange 3 objects): < 4 seconds
- **Complex commands** (login form, 6+ objects): < 6 seconds

### Optimization Strategies

1. **Cold start reduction**: Keep functions warm with scheduled pings
2. **Context size**: Limit to 100 objects (see above)
3. **Parallel tool execution**: Agent can call multiple tools in parallel
4. **Caching**: Optional response caching for common commands (future)
5. **Model selection**: Faster models for simpler tasks

### Monitoring

```typescript
// Response time logged for every command
logger.info('AI chain completed', {
  responseTime: `${Date.now() - startTime}ms`,
  toolCount: result.intermediateSteps.length,
});
```

## Security Considerations

### Authentication

- All requests must be authenticated (Firebase Auth)
- `auth.uid` used for authorization and analytics

### Authorization

- Canvas owner check
- Explicit permission check (owner/edit/view)
- View-only users cannot use AI

### Rate Limiting

- 10 commands per minute per user
- RTDB-based (works across multiple function instances)
- Prevents abuse and cost overruns

### Input Validation

- Command length: max 500 characters
- Canvas ID format: alphanumeric + hyphens/underscores
- Canvas state structure validation
- Tool parameter validation via Zod schemas

### Data Privacy

- Only canvas object data sent to LLM (no personal info)
- API keys stored in Firebase Functions config (not in code)
- Analytics anonymized (user ID only, no PII)

## Testing

### Unit Tests

```typescript
// functions/test/ai-tools.test.ts
describe('CreateRectangleTool', () => {
  it('should create rectangle with valid input', async () => {
    const tool = new CreateRectangleTool(mockContext);
    const result = await tool.execute({
      x: 100,
      y: 200,
      width: 150,
      height: 100,
      fill: '#ff0000',
    });
    expect(result.success).to.be.true;
  });
});
```

### Integration Tests

```bash
# Use Firebase emulators
firebase emulators:start --only functions,database

# Run tests against emulator
npm test
```

### Manual Testing

```bash
# Deploy to staging
firebase use staging
firebase deploy --only functions

# Test in staging environment
# Use staging frontend to send commands
```

## Troubleshooting

### Function Deployment Fails

- Check TypeScript build errors: `npm run build`
- Verify IAM permissions for service account
- Check Firebase project quota limits

### LLM API Errors

- Verify API key in Functions config: `firebase functions:config:get`
- Check API key validity in provider dashboard
- Monitor rate limits on provider side

### Tool Not Being Called

- Check tool description clarity
- Verify schema matches LLM expectations
- Review agent logs for reasoning
- Test with more explicit command

### High Costs

- Review analytics: `firebase database:get /analytics/ai-usage`
- Check context optimization is working
- Consider switching to cheaper model
- Add usage limits per user/canvas

## Future Enhancements

### Planned Features

- **Multi-turn conversations**: Remember context across commands
- **Undo/redo AI actions**: Separate undo stack for AI changes
- **Voice input**: Speech-to-text integration
- **AI suggestions**: Proactive suggestions based on user actions
- **Template library**: Predefined complex components
- **Image generation**: DALL-E/Stable Diffusion integration
- **Code export**: HTML/CSS/SVG generation from canvas

### Architecture Improvements

- **Streaming responses**: Stream tool execution progress to UI
- **Batch operations**: Optimize multiple object creation
- **Caching layer**: Redis cache for common command patterns
- **Webhook integration**: Trigger commands from external systems
- **Plugin system**: Allow custom tool registration

## Resources

- [LangChain JS Documentation](https://js.langchain.com/docs/)
- [Firebase Functions Guide](https://firebase.google.com/docs/functions)
- [OpenAI Function Calling](https://platform.openai.com/docs/guides/function-calling)
- [Claude Tool Use](https://docs.anthropic.com/claude/docs/tool-use)
- [Zod Validation](https://zod.dev/)

---

**Maintainer Notes:**

- Keep system prompt updated with new capabilities
- Monitor token usage and adjust context optimization
- Review analytics monthly for cost trends
- Update model selection as providers release better/cheaper models
- Document any new tools in this guide
