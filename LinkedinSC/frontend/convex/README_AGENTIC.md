# Agentic Query Builder - Convex Backend

Complete Convex backend implementation for AI-powered LinkedIn search query generation, scoring, and execution.

## Quick Links

- **[Quick Start Guide](./QUICK_START.md)** - Get started in 5 minutes
- **[Schema Documentation](./AGENTIC_QUERY_BUILDER_SCHEMA.md)** - Detailed schema reference
- **[Types Reference](./TYPES_REFERENCE.md)** - TypeScript types and examples
- **[Implementation Summary](../AGENTIC_QUERY_BUILDER_SUMMARY.md)** - High-level overview

## What's Included

### 1. Schema (schema.ts)
Two new tables for managing agentic sessions:
- `agentSessions` - AI agent session configurations
- `generatedQueries` - Individual queries with scoring

### 2. Agent Sessions API (agentSessions.ts)
CRUD operations for managing AI agent sessions:
- Create, read, update, delete sessions
- Track iteration rounds
- Manage session state transitions
- Store round history

### 3. Generated Queries API (generatedQueries.ts)
CRUD operations for managing generated queries:
- Batch query insertion
- Two-pass scoring system
- Query execution tracking
- Results storage

### 4. Documentation
Comprehensive guides for developers:
- Schema documentation
- TypeScript types reference
- Quick start examples
- Implementation summary

## File Structure

```
convex/
├── schema.ts                        # Schema with 2 new tables
├── agentSessions.ts                 # Session CRUD (4 queries, 6 mutations)
├── generatedQueries.ts              # Query CRUD (4 queries, 5 mutations)
├── README_AGENTIC.md               # This file
├── QUICK_START.md                  # Quick start guide
├── AGENTIC_QUERY_BUILDER_SCHEMA.md # Schema documentation
└── TYPES_REFERENCE.md              # TypeScript types
```

## Key Concepts

### Two-Pass Scoring
1. **Pass 1** (Quick Filter): Scores queries 0-100 for basic relevance
2. **Pass 2** (Quality Check): Scores passed queries with sample results
3. **Composite Score**: Weighted average: `(Pass1 * 0.4) + (Pass2 * 0.6)`

### Session Lifecycle
```
idle → generating_queries → scoring_pass1 → 
scoring_pass2 → executing_queries → completed
```

### Round-Based Iteration
- Each round generates N queries (configurable budget)
- Queries are scored and executed
- Round stats are tracked in history
- Session advances to next round

## Example Usage

### Create a Session
```typescript
const sessionId = await createSession({
  persona: "LinkedIn recruiter",
  seedQuery: "software engineers in SF",
  scoringMasterPrompt: "Rate this query...",
  pass1Threshold: 75,
  queryBudgetPerRound: 10
});
```

### Add Queries
```typescript
await addBatch(sessionId, 1, [
  { query: "senior software engineer startup SF", reasoning: "..." },
  { query: "lead engineer SaaS Bay Area", reasoning: "..." }
]);
```

### Score & Execute
```typescript
// Pass 1
await updatePass1(queryId, 85, "passed", "Good query");

// Pass 2 (if passed)
await updatePass2(queryId, 78, "passed", "Quality results", samples, 81.2);

// Execute
await updateExecution(queryId, "completed", fullResults, 100);
```

### Get Top Results
```typescript
const topQueries = await getTopByCompositeScore(sessionId, 5);
```

## API Reference

### agentSessions

**Queries:**
- `get(id)` - Get single session
- `getByUser(userId?, limit?)` - Get user sessions
- `getActive(userId?)` - Get active sessions
- `list(limit?)` - List all sessions

**Mutations:**
- `create(...)` - Create session
- `update(id, ...)` - Update config
- `updateStatus(id, status, error?)` - Change status
- `completeRound(id, stats)` - Finish round
- `remove(id)` - Delete session

### generatedQueries

**Queries:**
- `getBySession(sessionId, limit?)` - All queries
- `getBySessionAndRound(sessionId, round)` - Round queries
- `getTopByCompositeScore(sessionId, limit?)` - Top queries
- `getByStatus(sessionId, status, limit?)` - Filter by status

**Mutations:**
- `addBatch(sessionId, round, queries[])` - Add queries
- `updatePass1(id, ...)` - Update Pass 1 score
- `updatePass2(id, ...)` - Update Pass 2 score
- `updateExecution(id, ...)` - Update execution
- `deleteBatch(sessionId, round?)` - Delete queries

## Next Steps

### Backend Services
1. Implement query generation agent (LLM)
2. Build Pass 1 scorer (lightweight LLM)
3. Build Pass 2 scorer (with sample execution)
4. Integrate SERP API for execution
5. Add concurrency control

### Frontend UI
1. Session configuration form
2. Round progress visualizer
3. Query scoring interface
4. Results dashboard
5. Session history viewer

### Optimization
1. Result caching
2. Query deduplication
3. Batch processing
4. Analytics dashboard
5. Export functionality

## Testing

Run TypeScript check:
```bash
npx tsc --noEmit
```

Start Convex dev server:
```bash
npx convex dev
```

## Support

For questions or issues:
1. Check the documentation files
2. Review example code in QUICK_START.md
3. Inspect schema in schema.ts
4. See implementation summary

---

**Status**: Backend Complete, Frontend Pending
**Version**: 1.0.0
**Last Updated**: 2026-01-04
