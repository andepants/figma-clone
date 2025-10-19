# AI Model Routing Guide

## Overview
The AI system now automatically routes commands to the most appropriate model based on complexity analysis.

## How It Works

### Complexity Analysis
Commands are analyzed based on five signals:

1. **Word Count**: Commands >15 words are considered complex
2. **Batch Operations**: Keywords like "multiple", "spiral", "grid", "pattern"
3. **Multiple Actions**: Multiple verbs like "create AND move" or "update AND delete"
4. **Conditional Logic**: Keywords like "if", "when", "where", "only", "except"
5. **Large Numbers**: Requests for 20+ objects (e.g., "create 30 circles")

### Model Selection

#### OpenAI (Default Provider)
- **Simple Commands** → `gpt-3.5-turbo`
  - Faster response (~100-200ms improvement)
  - Lower cost
  - Handles straightforward operations

- **Complex Commands** → `gpt-4o-mini`
  - Better reasoning
  - Handles multi-step operations
  - Better at batch operations

#### Anthropic Provider
- **All Commands** → `claude-3-5-haiku-20241022`
  - Already fast and capable
  - Prompt caching reduces latency by 200-400ms
  - No routing needed

## Examples

### Simple Commands (→ gpt-3.5-turbo)
```
"create blue circle"
"delete selected"
"move left"
"change color to red"
"resize to 200x200"
```

### Complex Commands (→ gpt-4o-mini)
```
"create 30 circles in spiral pattern"
"create grid of rectangles with 5 rows and 4 columns"
"move all red shapes to the left and rotate them"
"create multiple buttons arranged in a horizontal layout"
"find all circles and change their color to blue"
```

## Configuration

### Default Configuration (No Changes Needed)
```typescript
// Automatic routing based on command complexity
// No environment variables required
```

### Force Specific Model (Override Routing)
```bash
# Force gpt-4o-mini for all commands
OPENAI_MODEL=gpt-4o-mini

# Force gpt-3.5-turbo for all commands
OPENAI_MODEL=gpt-3.5-turbo
```

### Switch to Anthropic
```bash
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-5-haiku-20241022  # (default)
```

## Monitoring

### Check Model Routing in Logs
```typescript
// Look for this log entry
"Command complexity analysis"
{
  isComplex: true/false,
  signals: {
    wordCount: number,
    hasBatchOperation: boolean,
    hasMultipleActions: boolean,
    hasConditionalLogic: boolean
  },
  provider: "openai"
}

// And this one
"Initializing LLM"
{
  provider: "openai",
  modelName: "gpt-3.5-turbo" | "gpt-4o-mini"
}
```

### Firebase Functions Logs
```bash
# View routing decisions
firebase functions:log --only processAICommand

# Filter for complexity analysis
firebase functions:log | grep "Command complexity analysis"
```

## Performance Expectations

### Simple Commands (gpt-3.5-turbo)
- **Latency**: 200-400ms (vs 400-600ms with gpt-4o-mini)
- **Cost**: ~50% cheaper
- **Accuracy**: >95% for simple operations

### Complex Commands (gpt-4o-mini)
- **Latency**: 500-800ms
- **Cost**: Standard pricing
- **Accuracy**: >95% for complex operations

### With Anthropic Prompt Caching
- **First request**: 500-700ms (cache creation)
- **Subsequent requests**: 200-300ms (cache hit)
- **Cache TTL**: 5 minutes

## Complexity Analysis Algorithm

```typescript
function analyzeCommandComplexity(command: string) {
  const words = command.trim().split(/\s+/);
  const wordCount = words.length;
  const lowerCommand = command.toLowerCase();

  // Batch operation keywords
  const batchKeywords = [
    "multiple", "several", "many", "bunch", "group",
    "spiral", "grid", "circle", "wave", "pattern",
    "distribute", "arrange", "layout", "rows", "columns"
  ];

  // Action keywords
  const actionKeywords = [
    "create", "make", "add", "move", "delete",
    "remove", "update", "change", "rotate", "resize"
  ];

  // Conditional keywords
  const conditionalKeywords = [
    "if", "when", "where", "only", "except",
    "all", "every", "each"
  ];

  // Complex if ANY of:
  // - >15 words
  // - Has batch keywords
  // - Has 2+ action keywords
  // - Has conditional logic
  // - Requests 20+ objects
  return {
    isComplex:
      wordCount > 15 ||
      hasBatchOperation ||
      hasMultipleActions ||
      hasConditionalLogic ||
      hasLargeNumber
  };
}
```

## Troubleshooting

### Command Routed to Wrong Model

**Problem**: Simple command using gpt-4o-mini
```
Command: "create blue circle"
Expected: gpt-3.5-turbo
Actual: gpt-4o-mini
```

**Solution**: Check if `OPENAI_MODEL` is set in environment
```bash
# Remove override
unset OPENAI_MODEL

# Or set explicitly
export OPENAI_MODEL=""
```

### Complex Command Failing with gpt-3.5-turbo

**Problem**: Complex command not working well
```
Command: "create 30 circles in spiral"
Error: Inconsistent results
```

**Solution**: Force gpt-4o-mini
```bash
export OPENAI_MODEL=gpt-4o-mini
```

### Want to Disable Routing

**Solution**: Set fixed model
```bash
# Use gpt-4o-mini for everything
export OPENAI_MODEL=gpt-4o-mini

# Or switch to Anthropic (no routing needed)
export AI_PROVIDER=anthropic
export ANTHROPIC_API_KEY=sk-ant-...
```

## Cost Optimization

### Estimated Savings
Based on OpenAI pricing:
- gpt-3.5-turbo: ~50% cheaper than gpt-4o-mini
- If 40% of commands are simple: ~20% total cost reduction

### Example Calculation
```
Before Routing:
- 100 commands/day
- All use gpt-4o-mini
- Cost: $X/day

After Routing:
- 40 simple commands → gpt-3.5-turbo (50% cheaper)
- 60 complex commands → gpt-4o-mini (same)
- Cost: ~$0.8X/day
- Savings: ~20%
```

## Best Practices

1. **Monitor Routing Decisions**: Check logs to ensure proper routing
2. **Track Performance**: Measure latency improvements
3. **Cost Analysis**: Monitor API bills for savings
4. **Error Rates**: Ensure accuracy doesn't degrade
5. **User Feedback**: Watch for quality issues with simple commands

## Related Documentation
- [AI Performance Optimization Plan](/Users/andre/coding/figma-clone/_docs/plans/ai-performance-optimization.md)
- [Phase 3 Completion Report](/Users/andre/coding/figma-clone/_docs/performance/phase-3-completion-report.md)
- [Anthropic Prompt Caching](https://docs.anthropic.com/claude/docs/prompt-caching)
