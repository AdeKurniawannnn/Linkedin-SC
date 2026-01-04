# Agent Pipeline State Machine

## Overview

The pipeline orchestrates the agentic query builder through a multi-stage workflow:

```
idle → generating → pass1 → pass2 → executing → aggregating → complete
         ↓          ↓        ↓        ↓           ↓
       error ←───────────────────────────────────┘
```

## Pipeline Stages

### 1. **idle**
- Initial state, no active work
- Transitions to: `generating`

### 2. **generating**
- LLM generates new search queries
- Input: Persona, seed query, previous top queries (for rounds > 1)
- Output: Array of `GeneratedQuery` objects
- Transitions to: `pass1`, `error`

### 3. **pass1** (Pass 1 Scoring)
- Score queries BEFORE execution
- Evaluates: expected yield, persona relevance, uniqueness
- Filters: Queries below `pass1Threshold` are rejected
- Transitions to: `pass2`, `error`

### 4. **pass2** (Pass 2 Validation)
- Execute sample searches (10 results)
- Score actual results with LLM
- Evaluates: result relevance, quality signals, diversity
- Filters: Queries below `pass2Threshold` are rejected
- Transitions to: `executing`, `error`

### 5. **executing**
- Execute full searches (100 results) for validated queries
- Parallel execution with concurrency limit
- Stores full results in database
- Transitions to: `aggregating`, `error`

### 6. **aggregating**
- Deduplicate results by URL
- Merge source queries for duplicates
- Calculate round statistics
- Save round history
- Transitions to: `complete`, `generating` (for next round)

### 7. **complete**
- Round completed successfully
- Terminal state
- Transitions to: `generating` (next round), `idle` (reset)

### 8. **error**
- Error occurred during execution
- Terminal state
- Error message stored in state
- Transitions to: `idle` (reset), `generating` (retry)

## Hook Usage

### Basic Usage

```typescript
import { useAgentPipeline } from '@/hooks/useAgentPipeline';

function AgentComponent() {
  const {
    start,
    pause,
    resume,
    stop,
    generateMore,
    currentStage,
    isRunning,
    isPaused,
    progress,
    stats,
    aggregatedResults,
  } = useAgentPipeline({
    sessionId: 'session-123',
    config: {
      persona: 'CTO in fintech',
      seedQuery: 'site:linkedin.com/in/ CTO fintech',
      scoringMasterPrompt: 'Target senior technical leaders...',
      pass1Threshold: 70,
      pass2Threshold: 60,
      queryBudgetPerRound: 10,
      concurrencyLimit: 5,
      maxResultsPerQuery: 100,
    },
    onProgress: (progress) => {
      console.log(`${progress.stage}: ${progress.current}/${progress.total}`);
    },
    onStageComplete: (stage, stats) => {
      console.log(`Stage ${stage} complete:`, stats);
    },
    onComplete: (totalResults) => {
      console.log(`Pipeline complete! ${totalResults} total results`);
    },
    onError: (error) => {
      console.error('Pipeline error:', error);
    },
  });

  return (
    <div>
      <button onClick={start} disabled={isRunning}>Start</button>
      <button onClick={pause} disabled={!isRunning || isPaused}>Pause</button>
      <button onClick={resume} disabled={!isPaused}>Resume</button>
      <button onClick={stop}>Stop</button>
      <button onClick={generateMore} disabled={isRunning}>Generate More</button>

      <div>Stage: {currentStage}</div>
      <div>Progress: {progress.current}/{progress.total}</div>
      <div>Results: {aggregatedResults.length}</div>
    </div>
  );
}
```

### State Flow

```typescript
// Start execution
await start();

// State transitions:
// idle → generating (LLM generates queries)
// generating → pass1 (Score queries)
// pass1 → pass2 (Validate with sample results)
// pass2 → executing (Execute full searches)
// executing → aggregating (Deduplicate results)
// aggregating → complete (Round complete)

// Generate next round
await generateMore();

// State transitions:
// complete → generating (Increment round, reset queues)
// (Pipeline continues from generating stage)
```

## Pipeline Statistics

The `stats` object provides real-time metrics:

```typescript
interface PipelineStats {
  generated: number;       // Total queries generated
  pass1Pending: number;    // Queries awaiting Pass 1
  pass1Passed: number;     // Queries passed Pass 1
  pass1Rejected: number;   // Queries failed Pass 1
  pass2Pending: number;    // Queries awaiting Pass 2
  pass2Passed: number;     // Queries passed Pass 2
  pass2Rejected: number;   // Queries failed Pass 2
  executing: number;       // Queries currently executing
  completed: number;       // Queries completed execution
}
```

## Progress Tracking

```typescript
interface PipelineProgress {
  stage: 'generating' | 'pass1' | 'pass2' | 'executing' | 'complete';
  current: number;  // Current item count
  total: number;    // Total items in stage
  message: string;  // User-facing message
}
```

## Concurrency Control

The pipeline respects `config.concurrencyLimit` for parallel operations:

- **Pass 1 Scoring**: Batches of N queries scored in parallel
- **Pass 2 Validation**: Batches of N searches + scores in parallel
- **Execution**: Batches of N full searches in parallel

Example with `concurrencyLimit: 5`:

```
10 queries → [5 queries batch 1] → [5 queries batch 2]
            ↓ parallel scoring    ↓ parallel scoring
            (all complete)        (all complete)
```

## Error Handling

Errors at any stage transition to `error` state:

```typescript
try {
  await runPass1Scoring(queries);
} catch (error) {
  transitionStage('error', error.message);
  onError?.(error.message);
}
```

Recovery options:
- **Reset**: Transition to `idle`, clear state
- **Retry**: Transition to `generating`, restart from beginning

## Pause/Resume

```typescript
// Pause during execution
pause();
// Sets pauseRequestedRef.current = true
// Batches check this flag between iterations

// Resume
resume();
// Clears pauseRequestedRef.current
// Continues from current batch
```

## Multi-Round Execution

Each round:
1. Generates new queries (using context from previous round's top queries)
2. Scores and validates queries
3. Executes validated queries
4. Aggregates results with previous rounds
5. Saves round history

```typescript
// Round 1
start();  // Generates 10 queries based on seed

// After completion
generateMore();  // Round 2: Uses top 3 queries from Round 1 as context

// After Round 2 completion
generateMore();  // Round 3: Uses top 3 queries from Round 2 as context
```

## Integration Points

### Required Integrations

1. **Convex Database**
   - Save/update `agentSessions` table
   - Save/update `generatedQueries` table
   - Query for session state restoration

2. **OpenRouter LLM**
   - Generate queries: `buildQueryGenerationPrompt()`
   - Score Pass 1: `buildPass1ScoringPrompt()`
   - Score Pass 2: `buildPass2ScoringPrompt()`

3. **SERP API**
   - Sample search (10 results): `searchRaw({ max_results: 10 })`
   - Full search (100 results): `searchRaw({ max_results: 100 })`

4. **Results Store**
   - Deduplicate results: `deduplicateResults()`
   - Append results: `appendResults()`

## Testing

### Unit Tests

```typescript
import { createInitialState, transition, canTransition } from '@/lib/agent/pipeline';

describe('Pipeline State Machine', () => {
  it('transitions from idle to generating', () => {
    const state = createInitialState();
    expect(canTransition('idle', 'generating')).toBe(true);

    const nextState = transition(state, 'generating');
    expect(nextState.stage).toBe('generating');
  });

  it('rejects invalid transitions', () => {
    const state = createInitialState();
    expect(() => transition(state, 'executing')).toThrow();
  });
});
```

### Integration Tests

```typescript
describe('useAgentPipeline', () => {
  it('executes full pipeline', async () => {
    const { result } = renderHook(() => useAgentPipeline({ ... }));

    act(() => {
      result.current.start();
    });

    await waitFor(() => {
      expect(result.current.currentStage).toBe('complete');
    });

    expect(result.current.aggregatedResults.length).toBeGreaterThan(0);
  });
});
```

## TODOs

### Critical (for MVP)

- [ ] Implement actual OpenRouter LLM integration
  - [ ] Query generation
  - [ ] Pass 1 scoring
  - [ ] Pass 2 scoring
- [ ] Implement Convex mutations
  - [ ] `createAgentSession`
  - [ ] `updateAgentSessionStatus`
  - [ ] `createGeneratedQuery`
  - [ ] `updateQueryPass1Score`
  - [ ] `updateQueryPass2Score`
  - [ ] `updateQueryResults`
- [ ] Implement state restoration from database
  - [ ] Load session on mount
  - [ ] Resume from last known stage
- [ ] Error retry logic
  - [ ] Exponential backoff
  - [ ] Max retry attempts

### Nice-to-Have

- [ ] Pause/resume persistence (save to database)
- [ ] Progress persistence (restore after page reload)
- [ ] Streaming LLM responses (show reasoning in real-time)
- [ ] Partial result display (show results as they arrive)
- [ ] Query performance analytics (track which queries perform best)
- [ ] A/B testing (compare different scoring prompts)
