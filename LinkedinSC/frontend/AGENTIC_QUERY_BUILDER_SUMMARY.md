# Agentic Query Builder - Implementation Summary

## Overview
This document summarizes the Convex backend implementation for the Agentic Query Builder feature, which enables AI-powered iterative query generation, scoring, and execution for LinkedIn search.

## Files Created/Modified

### 1. Schema Updates
**File**: `/Users/dennyleonardo/conductor/workspaces/Linkedin-SC/bucharest/LinkedinSC/frontend/convex/schema.ts`

**Added Tables**:
- `agentSessions`: Stores AI agent session configurations and state
- `generatedQueries`: Stores individual queries with scoring and execution results

**Changes**:
- Added 2 new table definitions with validators and indexes
- Maintained consistency with existing schema patterns
- Reused `unifiedResultValidator` from existing schema

### 2. Agent Sessions API
**File**: `/Users/dennyleonardo/conductor/workspaces/Linkedin-SC/bucharest/LinkedinSC/frontend/convex/agentSessions.ts`

**Queries** (4):
- `get(id)`: Retrieve single session
- `getByUser(userId?, limit?)`: Get user's sessions
- `getActive(userId?)`: Get non-completed sessions
- `list(limit?)`: List all sessions

**Mutations** (6):
- `create(...)`: Create new agent session
- `update(id, ...)`: Update session configuration
- `updateStatus(id, status, lastError?)`: Change session state
- `completeRound(id, roundStats)`: Finish iteration round
- `remove(id)`: Delete session and associated queries

### 3. Generated Queries API
**File**: `/Users/dennyleonardo/conductor/workspaces/Linkedin-SC/bucharest/LinkedinSC/frontend/convex/generatedQueries.ts`

**Queries** (4):
- `getBySession(sessionId, limit?)`: All queries for session
- `getBySessionAndRound(sessionId, round)`: Queries for specific round
- `getTopByCompositeScore(sessionId, limit?)`: Top-scoring queries
- `getByStatus(sessionId, pass1Status, limit?)`: Filter by status

**Mutations** (5):
- `addBatch(sessionId, round, queries[])`: Insert multiple queries
- `updatePass1(id, ...)`: Update Pass 1 scoring
- `updatePass2(id, ...)`: Update Pass 2 scoring
- `updateExecution(id, ...)`: Update execution results
- `deleteBatch(sessionId, round?)`: Delete queries

### 4. Documentation
**Files**:
- `convex/AGENTIC_QUERY_BUILDER_SCHEMA.md`: Comprehensive schema documentation
- `convex/TYPES_REFERENCE.md`: TypeScript types and usage examples

## Key Features

### Session Management
- Configurable thresholds (Pass 1: 70, Pass 2: 60)
- Query budget per round (default: 10)
- Concurrency limits (default: 5)
- Round-based iteration tracking
- Status flow: idle → generating → scoring → executing → completed

### Two-Pass Scoring System
**Pass 1**: Quick relevance filter
- Scores queries 0-100
- Filters out low-quality queries early
- Minimal API calls

**Pass 2**: Detailed quality check
- Scores remaining queries 0-100
- Includes sample result analysis
- Generates composite score: `(Pass1 * 0.4) + (Pass2 * 0.6)`

### Batch Operations
- Atomic multi-query insertion
- Bulk status updates
- Cascade deletion (session → queries)

### Data Integrity
- Strong typing with Convex validators
- Indexed relationships (sessionId → queries)
- Automatic timestamp management
- Error state tracking

## Database Indexes

### agentSessions
```typescript
.index("by_user", ["userId", "createdAt"])
.index("by_status", ["status"])
```

### generatedQueries
```typescript
.index("by_session", ["sessionId", "createdAt"])
.index("by_session_status", ["sessionId", "pass1Status"])
.index("by_composite_score", ["sessionId", "compositeScore"])
```

## Status Enums

### AgentSessionStatus
```
idle → generating_queries → scoring_pass1 → scoring_pass2 → 
executing_queries → completed
                    ↓
                  error (can retry)
```

### QueryStatus (Pass 1 & 2)
```
pending → passed/failed
```

### ExecStatus
```
pending → running → completed/error
```

## Usage Flow

### 1. Create Session
```typescript
const sessionId = await agentSessions.create({
  persona: "LinkedIn recruiter",
  seedQuery: "senior software engineers SF",
  scoringMasterPrompt: "Rate this query...",
  pass1Threshold: 75,
  queryBudgetPerRound: 10
});
```

### 2. Generate Queries (Round 1)
```typescript
await agentSessions.updateStatus(sessionId, "generating_queries");
await generatedQueries.addBatch(sessionId, 1, [
  { query: "senior software engineer startup SF", reasoning: "..." },
  { query: "lead engineer SaaS Bay Area", reasoning: "..." }
]);
```

### 3. Score Pass 1
```typescript
await agentSessions.updateStatus(sessionId, "scoring_pass1");
const queries = await generatedQueries.getBySessionAndRound(sessionId, 1);
for (const query of queries) {
  await generatedQueries.updatePass1(query._id, score, status, reasoning);
}
```

### 4. Score Pass 2 (for passed queries)
```typescript
await agentSessions.updateStatus(sessionId, "scoring_pass2");
const passedQueries = await generatedQueries.getByStatus(sessionId, "passed");
for (const query of passedQueries) {
  await generatedQueries.updatePass2(
    query._id, 
    score, 
    status, 
    reasoning, 
    sampleResults,
    compositeScore
  );
}
```

### 5. Execute Top Queries
```typescript
await agentSessions.updateStatus(sessionId, "executing_queries");
const topQueries = await generatedQueries.getTopByCompositeScore(sessionId, 5);
for (const query of topQueries) {
  await generatedQueries.updateExecution(query._id, "running");
  const results = await executeSearch(query.query);
  await generatedQueries.updateExecution(
    query._id, 
    "completed", 
    results,
    results.length
  );
}
```

### 6. Complete Round
```typescript
await agentSessions.completeRound(sessionId, {
  queriesGenerated: 10,
  queriesPassedPass1: 8,
  queriesPassedPass2: 5,
  avgCompositeScore: 79.2
});
await agentSessions.updateStatus(sessionId, "completed");
```

## Integration Points

### Frontend Components (To Be Built)
- Session creation form
- Round progress visualization
- Query scoring UI
- Results dashboard
- Session history viewer

### Backend Services (To Be Built)
- Query generation agent (LLM integration)
- Pass 1 scorer (lightweight LLM)
- Pass 2 scorer (with sample execution)
- Query executor (SERP API integration)
- Concurrency manager

### API Endpoints (To Be Built)
- `POST /api/agent/sessions`: Create session
- `POST /api/agent/sessions/:id/generate`: Generate queries
- `POST /api/agent/sessions/:id/score`: Score queries
- `POST /api/agent/sessions/:id/execute`: Execute queries
- `GET /api/agent/sessions/:id/results`: Get results

## Testing Checklist

- [ ] Schema validation passes
- [ ] TypeScript compilation succeeds
- [ ] All queries return expected data shape
- [ ] All mutations update database correctly
- [ ] Indexes improve query performance
- [ ] Cascade deletion works (session → queries)
- [ ] Status transitions are valid
- [ ] Round history accumulates correctly
- [ ] Composite score calculation is accurate
- [ ] Error states are handled properly

## Next Steps

### Phase 1: Backend Services
1. Implement query generation agent
2. Build Pass 1 scoring service
3. Build Pass 2 scoring service
4. Integrate SERP execution
5. Add concurrency control

### Phase 2: Frontend UI
1. Create session configuration form
2. Build round progress visualizer
3. Implement query scoring interface
4. Create results dashboard
5. Add session history viewer

### Phase 3: Optimization
1. Add result caching
2. Implement query deduplication
3. Add batch processing optimization
4. Create analytics dashboard
5. Add export functionality

## Performance Considerations

### Storage
- Each query can store ~100 results (maxResultsPerQuery)
- Sample results typically 5-10 items
- Round history grows linearly with rounds
- Consider archiving completed sessions

### Concurrency
- Default limit: 5 parallel operations
- Adjustable per session
- Prevents API rate limiting
- Balances speed vs. cost

### Indexing
- All queries use indexed lookups
- Composite score sorting optimized
- Session-based filtering efficient
- User-based filtering supported

## Security & Access Control

### Current State
- Optional userId field for multi-user support
- No authentication implemented yet
- All data accessible to all users

### Future Enhancements
- Add row-level security (RLS)
- Implement user authentication
- Add role-based access control
- Enable session sharing permissions

## Monitoring & Debugging

### Key Metrics
- Sessions created per day
- Queries generated per session
- Pass 1 pass rate
- Pass 2 pass rate
- Average composite scores
- Execution success rate

### Error Tracking
- lastError field on sessions
- Status transitions to "error"
- Round completion failures
- Query execution errors

### Debug Queries
```typescript
// Find failing sessions
const errorSessions = await agentSessions.list()
  .filter(s => s.status === "error");

// Find low-scoring queries
const lowScoreQueries = await generatedQueries.getBySession(sessionId)
  .filter(q => q.compositeScore && q.compositeScore < 50);

// Get round statistics
const session = await agentSessions.get(sessionId);
const roundStats = session.roundHistory;
```

## Reference Documentation

For detailed information, see:
- `convex/AGENTIC_QUERY_BUILDER_SCHEMA.md`: Full schema documentation
- `convex/TYPES_REFERENCE.md`: TypeScript types and examples
- `convex/schema.ts`: Source of truth for validators
- `convex/agentSessions.ts`: Session API implementation
- `convex/generatedQueries.ts`: Query API implementation

---

**Implementation Date**: 2026-01-04
**Status**: Backend Complete, Frontend Pending
**Version**: 1.0.0
