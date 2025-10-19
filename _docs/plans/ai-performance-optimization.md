# AI Performance Optimization Plan

## Objective
Reduce AI command latency from 800-1200ms to 400-700ms for single-step commands while maintaining reliability and exceeding all benchmarks.

## Target Benchmarks
- ✅ Latency: <2s for single-step (target: <700ms)
- ✅ Breadth: 6+ command types (current: 18 tools)
- ✅ Complexity: Multi-step operations (memory + threading)
- ✅ Reliability: Consistent execution with graceful errors
- ✅ UX: Natural interaction with immediate feedback

## Phase 1: Quick Wins (30-40% latency reduction)

### Task 1.1: Reduce Message History Window
**File**: `functions/src/ai/chain.ts`
**Changes**:
- Change `maxTokens: 10` to `maxTokens: 5` in messageModifier
- Update comment to reflect "last 5 messages"
**Success Criteria**: Message trimmer keeps only 5 messages
**Expected Impact**: -100-200ms on LLM processing
**Test**: Send 10 sequential commands, verify only last 5 in context

### Task 1.2: Increase Context Cache TTL
**File**: `functions/src/ai/utils/context-cache.ts`
**Changes**:
- Change `CACHE_TTL_MS` from `30 * 1000` to `5 * 60 * 1000` (5 minutes)
- Update comment to reflect 5-minute TTL
**Success Criteria**: Cache entries valid for 5 minutes
**Expected Impact**: -50-100ms on cache hits
**Test**: Make same command twice within 5 min, verify cache hit in logs

### Task 1.3: Reduce Viewport Object Limit
**File**: `functions/src/ai/utils/context-optimizer.ts`
**Changes**:
- Change `.slice(0, 50)` to `.slice(0, 30)` in viewportObjects calculation
- Update comment "Limit to 30 viewport objects"
**Success Criteria**: Max 30 viewport objects sent to LLM
**Expected Impact**: -20-50ms on context processing
**Test**: Canvas with 100 objects, verify only 30 in optimized context

### Task 1.4: Streamline System Prompt
**File**: `functions/src/ai/chain.ts`
**Changes**:
- Remove verbose example sections (Action-Oriented Examples, Memory Examples)
- Condense Batch Operation Guidelines to 3-4 lines
- Keep essential instructions only
- Reduce prompt tokens by ~40%
**Success Criteria**: System prompt under 500 tokens
**Expected Impact**: -50-100ms on prompt processing
**Test**: Count tokens before/after, verify functionality unchanged

## Phase 2: Medium Effort Optimizations

### Task 2.1: Implement Fast Path Pattern Matching
**File**: `functions/src/ai/utils/fast-path.ts` (NEW)
**Changes**:
- Create regex patterns for simple commands
- Match patterns: "create {color} {shape}", "delete selected", "move {direction}"
- Direct tool invocation without LLM call
- Fallback to LLM if no match or ambiguous
**Success Criteria**: 30% of commands use fast path
**Expected Impact**: -500-800ms for matched commands
**Test**: "create blue circle" should bypass LLM, "create something cool" should use LLM

### Task 2.2: Add Fast Path Integration
**File**: `functions/src/handlers/processAICommand.ts`
**Changes**:
- Import fast path matcher
- Try fast path before LLM invocation
- Log fast path hits for analytics
- Fallback to LLM on any uncertainty
**Success Criteria**: Fast path integrated seamlessly
**Expected Impact**: Enables fast path savings
**Test**: Simple commands complete in <400ms

### Task 2.3: Optimize Rate Limiter with In-Memory Cache
**File**: `functions/src/services/rate-limiter.ts`
**Changes**:
- Add in-memory Map cache for rate limit status
- Cache TTL: 100ms
- Only check RTDB on cache miss
- Async cleanup of expired cache entries
**Success Criteria**: 90%+ cache hit rate on repeated requests
**Expected Impact**: -30-50ms on cache hits
**Test**: 10 sequential commands, verify only 1-2 RTDB reads

### Task 2.4: Skip Context Optimization for Small Canvases
**File**: `functions/src/ai/utils/context-optimizer.ts`
**Changes**:
- Add early return if `objects.length < 20`
- Return original state unmodified
- Log skip decision
**Success Criteria**: Canvases with <20 objects skip optimization
**Expected Impact**: -20-40ms for small canvases
**Test**: Canvas with 10 objects should skip optimization in logs

### Task 2.5: Implement LLM Response Caching
**File**: `functions/src/ai/utils/context-cache.ts`
**Changes**:
- Add response cache Map with command hash keys
- Cache LLM responses for identical commands
- TTL: 5 minutes
- Hash includes: command + canvas state summary
**Success Criteria**: Repeated commands use cached response
**Expected Impact**: -500-1000ms on exact cache hits
**Test**: Same command twice returns instantly second time

## Phase 3: Advanced Optimizations

### Task 3.1: Add Model Routing by Complexity
**File**: `functions/src/ai/config.ts`
**Changes**:
- Create `analyzeCommandComplexity()` function
- Route simple commands to gpt-3.5-turbo
- Route complex commands to gpt-4o-mini
- Complexity signals: word count, tool count, batch operations
**Success Criteria**: Simple commands use faster model
**Expected Impact**: -100-200ms for simple commands
**Test**: "create blue circle" uses gpt-3.5-turbo, "create 30 circles in spiral" uses gpt-4o-mini

### Task 3.2: Add Parallel Processing to Handler
**File**: `functions/src/handlers/processAICommand.ts`
**Changes**:
- Run rate limit check and context optimization in parallel with Promise.all
- Parallel validation of viewport and threadId
- Keep sequential LLM invocation
**Success Criteria**: Rate limit + optimization run concurrently
**Expected Impact**: -50-100ms
**Test**: Measure time for parallel vs sequential in logs

### Task 3.3: Add Anthropic Prompt Caching Support
**File**: `functions/src/ai/config.ts`, `functions/src/ai/chain.ts`
**Changes**:
- Add Claude 3.5 Haiku as alternative model
- Implement Anthropic prompt caching for system prompt
- Cache prefix: first 1000 tokens of system prompt
- Route based on environment variable
**Success Criteria**: Anthropic requests use prompt caching
**Expected Impact**: -200-400ms for Claude users
**Test**: Anthropic requests show cache creation/hit in logs

## Success Metrics

**Phase 1 Complete**:
- Simple commands: 500-700ms (down from 800-1200ms)
- Cache hit rate: 60%+
- No reliability regression

**Phase 2 Complete**:
- Simple commands: 400-600ms
- Fast path usage: 30%+
- Cache hit rate: 75%+
- No accuracy regression

**Phase 3 Complete**:
- Simple commands: 200-400ms
- Complex commands: 500-800ms
- Cache hit rate: 85%+
- Model routing working
- Anthropic option available

## Testing Procedure

For each task:
1. Create before/after benchmark
2. Test with real commands (simple, complex, batch)
3. Verify error handling unchanged
4. Check analytics/logging
5. Measure latency improvement
6. Ensure no accuracy loss

## Rollback Plan

- Keep old code in commented blocks
- Feature flags for each optimization
- Monitor error rates for 24h after each phase
- Revert individual tasks if issues detected
- Full rollback procedure documented

## Notes

- All latency targets are P50 (median), not P99
- Maintain 60 FPS canvas rendering throughout
- No reduction in command breadth or reliability
- UX feedback must remain immediate
- Cache invalidation on canvas mutations
