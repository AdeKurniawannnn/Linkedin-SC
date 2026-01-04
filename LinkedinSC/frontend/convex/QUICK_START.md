# Agentic Query Builder - Quick Start Guide

Get started with the Agentic Query Builder in 5 minutes.

## Prerequisites

- Convex development server running
- Frontend connected to Convex

## Basic Usage

### 1. Import the API

```typescript
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import type { Id } from "@/convex/_generated/dataModel";
```

### 2. Create a Session

```typescript
function CreateSessionButton() {
  const createSession = useMutation(api.agentSessions.create);

  const handleCreate = async () => {
    const sessionId = await createSession({
      persona: "LinkedIn recruiter finding software engineers",
      seedQuery: "senior software engineer San Francisco",
      scoringMasterPrompt: `Evaluate if this search query will find qualified software engineering candidates.
      
Score 0-100 based on:
- Specificity of role/seniority
- Location targeting
- Likelihood of relevant results`,
      pass1Threshold: 75,
      pass2Threshold: 65,
      queryBudgetPerRound: 10,
    });

    console.log("Session created:", sessionId);
  };

  return <button onClick={handleCreate}>Create Session</button>;
}
```

### 3. Add Generated Queries

```typescript
const addQueries = useMutation(api.generatedQueries.addBatch);

await addQueries({
  sessionId: "xyz123...",
  round: 1,
  queries: [
    {
      query: "senior software engineer startup San Francisco",
      generationReasoning: "Targets startups specifically",
    },
    {
      query: "lead engineer SaaS Bay Area",
      generationReasoning: "Broader location, focuses on SaaS",
    },
    {
      query: "staff engineer fintech SF",
      generationReasoning: "High seniority, finance vertical",
    },
  ],
});
```

### 4. Display Session Data

```typescript
function SessionDashboard({ sessionId }: { sessionId: Id<"agentSessions"> }) {
  const session = useQuery(api.agentSessions.get, { id: sessionId });
  const queries = useQuery(api.generatedQueries.getBySession, { sessionId });

  if (!session) return <div>Loading...</div>;

  return (
    <div>
      <h2>{session.persona}</h2>
      <p>Status: {session.status}</p>
      <p>Round: {session.currentRound}</p>
      <p>Seed Query: {session.seedQuery}</p>

      <h3>Generated Queries ({queries?.length ?? 0})</h3>
      <ul>
        {queries?.map((q) => (
          <li key={q._id}>
            {q.query} - Pass 1: {q.pass1Status}
            {q.compositeScore && ` - Score: ${q.compositeScore}`}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### 5. Update Scores

```typescript
const updatePass1 = useMutation(api.generatedQueries.updatePass1);

// Score a query after evaluation
await updatePass1({
  id: queryId,
  pass1Score: 85,
  pass1Status: "passed",
  pass1Reasoning: "Query is specific and well-targeted",
});
```

### 6. Get Top Queries

```typescript
function TopQueries({ sessionId }: { sessionId: Id<"agentSessions"> }) {
  const topQueries = useQuery(api.generatedQueries.getTopByCompositeScore, {
    sessionId,
    limit: 5,
  });

  return (
    <div>
      <h3>Top 5 Queries</h3>
      <ol>
        {topQueries?.map((q) => (
          <li key={q._id}>
            {q.query} - Score: {q.compositeScore}
          </li>
        ))}
      </ol>
    </div>
  );
}
```

## Common Patterns

### Check if Session is Active

```typescript
const isActive = (status: string) => {
  return !["completed", "error"].includes(status);
};

const session = useQuery(api.agentSessions.get, { id: sessionId });
if (session && isActive(session.status)) {
  console.log("Session is still running");
}
```

### Filter Queries by Status

```typescript
const passedQueries = useQuery(api.generatedQueries.getByStatus, {
  sessionId,
  pass1Status: "passed",
});

const failedQueries = useQuery(api.generatedQueries.getByStatus, {
  sessionId,
  pass1Status: "failed",
});
```

### Get Queries for Current Round

```typescript
const session = useQuery(api.agentSessions.get, { id: sessionId });
const currentRoundQueries = useQuery(
  api.generatedQueries.getBySessionAndRound,
  session
    ? {
        sessionId,
        round: session.currentRound,
      }
    : "skip"
);
```

### Complete a Round

```typescript
const completeRound = useMutation(api.agentSessions.completeRound);

await completeRound({
  id: sessionId,
  roundStats: {
    queriesGenerated: 10,
    queriesPassedPass1: 8,
    queriesPassedPass2: 5,
    avgCompositeScore: 79.2,
  },
});
```

### Delete a Session

```typescript
const deleteSession = useMutation(api.agentSessions.remove);

// This will also delete all associated queries
await deleteSession({ id: sessionId });
```

## Status Flow Example

```typescript
const updateStatus = useMutation(api.agentSessions.updateStatus);

// 1. Start generating queries
await updateStatus({ id: sessionId, status: "generating_queries" });

// 2. Score Pass 1
await updateStatus({ id: sessionId, status: "scoring_pass1" });

// 3. Score Pass 2
await updateStatus({ id: sessionId, status: "scoring_pass2" });

// 4. Execute queries
await updateStatus({ id: sessionId, status: "executing_queries" });

// 5. Complete
await updateStatus({ id: sessionId, status: "completed" });

// Handle errors
await updateStatus({
  id: sessionId,
  status: "error",
  lastError: "API rate limit exceeded",
});
```

## Complete Workflow Example

```typescript
async function runAgenticSession() {
  // 1. Create session
  const sessionId = await createSession({
    persona: "LinkedIn recruiter",
    seedQuery: "software engineers",
    scoringMasterPrompt: "Score this query...",
  });

  // 2. Generate queries (imagine this calls an LLM)
  await updateStatus(sessionId, "generating_queries");
  await addQueries(sessionId, 1, generatedQueries);

  // 3. Score Pass 1
  await updateStatus(sessionId, "scoring_pass1");
  for (const query of queries) {
    const score = await scoreQuery(query.query);
    await updatePass1(query._id, score, score >= 70 ? "passed" : "failed");
  }

  // 4. Score Pass 2 (only passed queries)
  await updateStatus(sessionId, "scoring_pass2");
  const passedQueries = await getByStatus(sessionId, "passed");
  for (const query of passedQueries) {
    const { score, sampleResults } = await scoreWithResults(query.query);
    const compositeScore = (query.pass1Score! * 0.4 + score * 0.6);
    await updatePass2(
      query._id,
      score,
      score >= 60 ? "passed" : "failed",
      "Quality check passed",
      sampleResults,
      compositeScore
    );
  }

  // 5. Execute top queries
  await updateStatus(sessionId, "executing_queries");
  const topQueries = await getTopByCompositeScore(sessionId, 5);
  for (const query of topQueries) {
    await updateExecution(query._id, "running");
    const results = await fetchResults(query.query);
    await updateExecution(query._id, "completed", results, results.length);
  }

  // 6. Complete round
  await completeRound(sessionId, {
    queriesGenerated: 10,
    queriesPassedPass1: 8,
    queriesPassedPass2: 5,
    avgCompositeScore: 79.2,
  });

  await updateStatus(sessionId, "completed");
}
```

## Debugging Tips

### View All Sessions

```typescript
const allSessions = useQuery(api.agentSessions.list, { limit: 100 });
console.table(allSessions);
```

### Find Error Sessions

```typescript
const sessions = useQuery(api.agentSessions.list);
const errorSessions = sessions?.filter((s) => s.status === "error");
console.log("Error sessions:", errorSessions);
```

### Check Round History

```typescript
const session = useQuery(api.agentSessions.get, { id: sessionId });
console.log("Round history:", session?.roundHistory);
```

## Next Steps

- Build UI components for session management
- Implement LLM integration for query generation
- Add scoring logic with LLM evaluation
- Integrate SERP API for query execution
- Create analytics dashboard

For more details, see:
- `AGENTIC_QUERY_BUILDER_SCHEMA.md` - Full schema documentation
- `TYPES_REFERENCE.md` - TypeScript types
- `AGENTIC_QUERY_BUILDER_SUMMARY.md` - Implementation overview
