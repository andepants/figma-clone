# Phase 3: AI Canvas Agent

## Overview

**Goal:** Add AI agent that manipulates the canvas through natural language using function calling.

**Timeline:** 8-10 hours

**Deliverable:** An AI agent that can create, modify, and arrange canvas objects through natural language commands.

**Success Criteria:**
- ✅ AI can create shapes via natural language ("create a blue rectangle")
- ✅ AI can move objects ("move the circle to the center")
- ✅ AI can perform layout operations ("arrange in a grid")
- ✅ AI supports at least 6 distinct command types
- ✅ All users see AI-generated results in real-time
- ✅ AI agent has visible UI with chat interface
- ✅ AI Development Log document completed

---

## Phase Scope

This phase adds AI-powered canvas manipulation—the "wow" factor feature.

**What's Included:**
- OpenAI GPT-4 or Anthropic Claude integration
- Function calling setup for canvas operations
- Natural language command processing
- AI chat interface
- Tool functions for: create, move, resize, rotate, arrange
- Complex multi-step operations (login form, navigation bar)
- AI Development Log (required deliverable)

**What's NOT Included:**
- Image generation
- AI design suggestions
- Style recommendations
- Voice commands
- Animation creation

**Development Strategy:**
Build AI capabilities incrementally:
1. Setup → Simple Commands → Complex Commands → UI → Log

---

## Features & Tasks

### Feature 1: AI Service Selection & Setup

**Objective:** Choose and set up AI service (OpenAI or Anthropic).

**Steps:**
1. Decide: OpenAI GPT-4 (recommended) or Anthropic Claude
2. Create API account and get API key
3. Install SDK: `npm install openai` or `npm install @anthropic-ai/sdk`
4. Add API key to `.env.local` as `VITE_AI_API_KEY`
5. Test API connection with simple completion

**Verification:** Can call AI API and get response.

**Recommendation: OpenAI GPT-4**
- Best function calling support
- Good documentation
- Reliable performance
- Standard choice for this use case

---

### Feature 2: AI Tool Schema Definition

**Objective:** Define function schema for AI to call.

**Steps:**
1. Create `lib/ai/tools.ts` with tool definitions
2. Define tool for `createShape` (type, x, y, width, height, color)
3. Define tool for `moveShape` (shapeId, x, y)
4. Define tool for `getCanvasState` (returns all objects)
5. Document each tool with descriptions and parameters

**Verification:** Tool schema is valid and well-documented.

**Example tool schema (OpenAI format):**
```typescript
export const canvasTools = [
  {
    type: "function",
    function: {
      name: "createShape",
      description: "Create a new shape on the canvas",
      parameters: {
        type: "object",
        properties: {
          shapeType: {
            type: "string",
            enum: ["rectangle", "circle", "text"],
            description: "Type of shape to create"
          },
          x: {
            type: "number",
            description: "X coordinate on canvas"
          },
          y: {
            type: "number",
            description: "Y coordinate on canvas"
          },
          width: {
            type: "number",
            description: "Width (for rectangles)"
          },
          height: {
            type: "number",
            description: "Height (for rectangles)"
          },
          radius: {
            type: "number",
            description: "Radius (for circles)"
          },
          text: {
            type: "string",
            description: "Text content (for text shapes)"
          },
          color: {
            type: "string",
            description: "Fill color (hex format)"
          }
        },
        required: ["shapeType", "x", "y"]
      }
    }
  },
  // More tools...
];
```

---

### Feature 3: Tool Execution Functions

**Objective:** Implement functions that AI will call.

**Steps:**
1. Create `lib/ai/executors.ts` with tool executor functions
2. Implement `executeCreateShape` - adds object to store
3. Implement `executeMoveShape` - updates object position
4. Implement `executeGetCanvasState` - returns all objects as JSON
5. Add error handling and validation

**Verification:** Functions work when called manually.

**Example executor:**
```typescript
export function executeCreateShape(params: CreateShapeParams): string {
  try {
    const newShape: CanvasObject = {
      id: crypto.randomUUID(),
      type: params.shapeType,
      x: params.x,
      y: params.y,
      width: params.width,
      height: params.height,
      radius: params.radius,
      color: params.color || '#3b82f6',
      text: params.text,
      createdBy: 'ai',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    useCanvasStore.getState().addObject(newShape);

    return `Created ${params.shapeType} at (${params.x}, ${params.y})`;
  } catch (error) {
    return `Error creating shape: ${error.message}`;
  }
}
```

---

### Feature 4: AI Service Integration

**Objective:** Connect AI service with function calling.

**Steps:**
1. Create `lib/ai/service.ts` with AI chat function
2. Send user message to AI with tool definitions
3. Parse AI response for tool calls
4. Execute requested tools
5. Send tool results back to AI and get final response

**Verification:** AI can call tools and generate response.

**Example integration:**
```typescript
export async function chatWithAI(
  userMessage: string,
  conversationHistory: Message[]
): Promise<string> {
  const messages = [
    ...conversationHistory,
    { role: 'user', content: userMessage }
  ];

  // Initial AI call
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages,
    tools: canvasTools,
    tool_choice: 'auto',
  });

  const assistantMessage = response.choices[0].message;

  // Check if AI wants to call tools
  if (assistantMessage.tool_calls) {
    const toolResults = [];

    for (const toolCall of assistantMessage.tool_calls) {
      const functionName = toolCall.function.name;
      const args = JSON.parse(toolCall.function.arguments);

      // Execute the tool
      const result = executeTool(functionName, args);

      toolResults.push({
        tool_call_id: toolCall.id,
        role: 'tool',
        content: result,
      });
    }

    // Get final response from AI
    const finalResponse = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        ...messages,
        assistantMessage,
        ...toolResults,
      ],
    });

    return finalResponse.choices[0].message.content;
  }

  return assistantMessage.content;
}
```

---

### Feature 5: AI Chat UI Component

**Objective:** Create chat interface for AI commands.

**Steps:**
1. Create `components/ai/AIChat.tsx` with chat UI
2. Add input field for user messages
3. Show conversation history
4. Display AI responses and tool executions
5. Position as floating panel (collapsible)

**Verification:** Can type messages and see AI responses.

**AIChat.tsx structure:**
```typescript
export function AIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages([...messages, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await chatWithAI(input, messages);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      console.error('AI error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`
      fixed bottom-4 right-4 bg-white rounded-lg shadow-xl
      ${isOpen ? 'w-96 h-96' : 'w-14 h-14'}
    `}>
      {isOpen ? (
        <>
          <div className="p-4 overflow-y-auto h-80">
            {messages.map((msg, i) => (
              <ChatBubble key={i} {...msg} />
            ))}
          </div>
          <div className="p-4 border-t">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask AI to create shapes..."
            />
          </div>
        </>
      ) : (
        <button onClick={() => setIsOpen(true)}>
          <Sparkles />
        </button>
      )}
    </div>
  );
}
```

---

### Feature 6: Simple Creation Commands

**Objective:** Test basic AI shape creation.

**Steps:**
1. Test: "Create a blue rectangle"
2. Test: "Add a red circle"
3. Test: "Create text that says Hello World"
4. Verify AI calls correct tool with parameters
5. Verify shapes appear on canvas for all users

**Verification:** Basic creation commands work reliably.

---

### Feature 7: Movement Commands

**Objective:** Enable AI to move existing objects.

**Steps:**
1. Add `moveShape` tool to schema
2. Implement executor that updates object position
3. Test: "Move the blue rectangle to position 300, 400"
4. Test: "Move the circle to the center"
5. Handle object selection by color, type, or position

**Verification:** AI can move shapes by description.

---

### Feature 8: Arrangement Commands

**Objective:** Enable AI to arrange multiple objects.

**Steps:**
1. Add `arrangeShapes` tool for layout operations
2. Implement grid layout algorithm
3. Implement horizontal/vertical row layout
4. Test: "Arrange these shapes in a grid"
5. Test: "Space these elements evenly"

**Verification:** AI can arrange multiple objects in patterns.

**Grid layout example:**
```typescript
function arrangeInGrid(
  objectIds: string[],
  columns: number,
  spacing: number
): string {
  const objects = useCanvasStore.getState().objects;
  const toArrange = objects.filter(obj => objectIds.includes(obj.id));

  toArrange.forEach((obj, index) => {
    const row = Math.floor(index / columns);
    const col = index % columns;

    useCanvasStore.getState().updateObject(obj.id, {
      x: col * spacing,
      y: row * spacing,
    });
  });

  return `Arranged ${toArrange.length} objects in ${columns} columns`;
}
```

---

### Feature 9: Complex Multi-Step Commands

**Objective:** Enable AI to execute multi-step operations.

**Steps:**
1. Add system prompt teaching AI to break down complex tasks
2. Test: "Create a login form with username and password fields"
3. Test: "Build a navigation bar with 4 menu items"
4. Verify AI plans steps before executing
5. Verify all steps complete successfully

**Verification:** AI can create complex layouts with one command.

**System prompt addition:**
```typescript
const SYSTEM_PROMPT = `You are a canvas assistant that helps users create and manipulate shapes.

When given complex requests like "create a login form":
1. Break it down into steps
2. Create each component (labels, inputs, button)
3. Arrange them in a logical layout
4. Use appropriate colors and sizes

Always call tools sequentially for multi-step operations.`;
```

---

### Feature 10: Canvas Context Awareness

**Objective:** Make AI aware of current canvas state.

**Steps:**
1. Add `getCanvasState` tool that returns all objects
2. Have AI call this tool before operations that need context
3. Test: "Move all rectangles to the left"
4. Test: "What shapes are on the canvas?"
5. Test: "Make all blue shapes red"

**Verification:** AI can query and reason about canvas state.

---

### Feature 11: Error Handling & Validation

**Objective:** Handle AI errors gracefully.

**Steps:**
1. Validate tool parameters before execution
2. Return clear error messages to AI
3. Show errors in chat UI
4. Add retry button for failed operations
5. Test with invalid commands

**Verification:** Errors don't crash app, user gets helpful feedback.

---

### Feature 12: AI Visual Feedback

**Objective:** Show when AI is working on canvas.

**Steps:**
1. Add loading indicator to AI chat when processing
2. Show temporary ghost shapes while AI creates them
3. Highlight objects AI is modifying
4. Add animation when AI places objects
5. Show confirmation when operation completes

**Verification:** Users see clear visual feedback for AI actions.

---

### Feature 13: Multi-User AI Access

**Objective:** Allow multiple users to use AI simultaneously.

**Steps:**
1. Ensure AI operations sync via Firestore
2. Test with 2 users issuing commands at once
3. Handle race conditions gracefully
4. Show AI activity indicator to all users
5. Attribute AI-created objects to requesting user

**Verification:** Multiple users can use AI without conflicts.

---

### Feature 14: AI Command History

**Objective:** Track and display recent AI commands.

**Steps:**
1. Store AI command history in local state
2. Show recent commands in AI chat
3. Add button to reuse previous commands
4. Clear history button
5. Persist history to localStorage (optional)

**Verification:** Users can see and reuse past commands.

---

### Feature 15: AI Rate Limiting

**Objective:** Prevent abuse and control API costs.

**Steps:**
1. Implement rate limit (e.g., 10 commands per minute)
2. Show remaining quota in UI
3. Display cooldown timer when limit reached
4. Store usage in Firestore (per user)
5. Reset quota after time period

**Verification:** Rate limiting works, users see clear feedback.

---

### Feature 16: AI Tool Documentation

**Objective:** Document AI capabilities for users.

**Steps:**
1. Create help section in AI chat
2. List example commands users can try
3. Show what AI can and cannot do
4. Add "Try this" buttons for examples
5. Update based on user feedback

**Verification:** Users understand AI capabilities.

**Example commands:**
```
Creation:
- "Create a blue rectangle at 100, 200"
- "Add 3 circles in a row"
- "Create text that says Welcome"

Manipulation:
- "Move the red circle to the center"
- "Make the rectangle twice as big"
- "Rotate all shapes 45 degrees"

Layouts:
- "Create a login form"
- "Build a navigation bar"
- "Arrange these in a grid"
```

---

### Feature 17: AI Development Log

**Objective:** Document AI-first development process (required deliverable).

**Steps:**
1. Create `_docs/ai-development-log.md`
2. Document AI tools used (Cursor, GitHub Copilot, ChatGPT, etc.)
3. List 3-5 effective prompts that worked well
4. Estimate AI-generated vs hand-written code percentage
5. Document where AI excelled and where it struggled

**Verification:** Complete 1-page log submitted.

**Template structure:**
```markdown
# AI Development Log

## Tools & Workflow
- [List AI coding tools used]
- [Describe integration into workflow]

## Effective Prompts
1. "[Prompt that worked well]"
2. "[Another effective prompt]"
3. "[Third example]"

## Code Analysis
- Estimated AI-generated: X%
- Estimated hand-written: Y%
- [Breakdown by feature]

## AI Strengths
- [Where AI excelled]

## AI Limitations
- [Where AI struggled]

## Key Learnings
- [Insights about AI-assisted development]
```

---

### Feature 18: AI Response Streaming

**Objective:** Stream AI responses for better UX.

**Steps:**
1. Enable streaming in AI API calls
2. Show AI response as it types (word by word)
3. Update UI in real-time
4. Handle stream errors gracefully
5. Test with long responses

**Verification:** AI responses stream smoothly.

---

### Feature 19: AI Testing & Validation

**Objective:** Test all AI capabilities thoroughly.

**Steps:**
1. Test all 6+ command types
2. Test with multiple users
3. Test error cases (invalid commands, API failures)
4. Test rate limiting
5. Test complex multi-step operations

**Verification:** All AI features work reliably.

---

### Feature 20: AI Performance Optimization

**Objective:** Ensure AI features are fast and cost-effective.

**Steps:**
1. Cache common AI responses
2. Optimize tool schemas for faster parsing
3. Batch multiple tool calls when possible
4. Monitor API costs and usage
5. Add cost tracking to admin dashboard (optional)

**Verification:** AI features are fast and within budget.

---

## Testing Phase 3

### Manual Testing Checklist

**Basic AI Commands:**
- [ ] "Create a rectangle" works
- [ ] "Add a circle" works
- [ ] "Create text" works
- [ ] AI uses correct parameters
- [ ] Shapes appear on canvas

**Movement Commands:**
- [ ] "Move shape to position X, Y" works
- [ ] "Move to center" works
- [ ] "Move all rectangles" works
- [ ] AI identifies objects correctly

**Layout Commands:**
- [ ] "Arrange in grid" works
- [ ] "Space evenly" works
- [ ] "Align horizontally" works
- [ ] Multiple objects arranged correctly

**Complex Commands:**
- [ ] "Create login form" works
- [ ] "Build navigation bar" works
- [ ] Multiple components created
- [ ] Layout is logical and usable

**Multi-User:**
- [ ] Two users can use AI simultaneously
- [ ] AI changes sync to all users
- [ ] No conflicts or race conditions

**Error Handling:**
- [ ] Invalid commands show errors
- [ ] API failures handled gracefully
- [ ] Rate limiting works
- [ ] Users get helpful feedback

---

## Deliverables

At the end of Phase 3, you should have:

1. **Working AI Agent**
   - Natural language interface
   - Function calling integration
   - 6+ command types supported

2. **Canvas Manipulation**
   - Create shapes via AI
   - Move and arrange objects
   - Complex multi-step operations

3. **Polished AI UI**
   - Chat interface
   - Visual feedback
   - Command history
   - Help documentation

4. **Multi-User Support**
   - All users see AI actions
   - No conflicts
   - Smooth synchronization

5. **AI Development Log**
   - Complete 1-page document
   - Submitted with project

---

## Success Metrics

**AI Capability:**
- 6+ distinct command types ✅
- Complex operations work ✅
- <2 second response time ✅

**User Experience:**
- Clear visual feedback ✅
- Error handling works ✅
- Help documentation ✅

**Multi-User:**
- Synchronization works ✅
- No conflicts ✅
- All users see results ✅

**Documentation:**
- AI Development Log complete ✅

---

## Project Complete

After Phase 3, CollabCanvas is feature-complete:

✅ **Phase 0:** Project setup and infrastructure
✅ **Phase 1:** MVP collaborative canvas
✅ **Phase 2:** Enhanced features and polish
✅ **Phase 3:** AI agent integration

**Final Deliverables:**
- Deployed application with all features
- AI Development Log
- Complete documentation
- Demo video (if required)
- GitHub repository

**Congratulations!** You've built a real-time collaborative canvas with AI capabilities from scratch.