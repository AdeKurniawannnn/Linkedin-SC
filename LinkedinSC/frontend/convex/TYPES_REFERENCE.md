# Agentic Query Builder - Types Reference

Quick reference for TypeScript types used in the Agentic Query Builder.

## Enums

### AgentSessionStatus
```typescript
type AgentSessionStatus = 
  | "idle"
  | "generating_queries"
  | "scoring_pass1"
  | "scoring_pass2"
  | "executing_queries"
  | "completed"
  | "error";
```

### QueryStatus (Pass 1 & Pass 2)
```typescript
type QueryStatus = 
  | "pending"
  | "passed"
  | "failed";
```

### ExecStatus
```typescript
type ExecStatus = 
  | "pending"
  | "running"
  | "completed"
  | "error";
```

---

## Main Types

### AgentSession
```typescript
interface AgentSession {
  _id: Id<"agentSessions">;
  _creationTime: number;
  
  // User & Config
  userId?: string;
  persona: string;
  seedQuery: string;
  scoringMasterPrompt: string;
  
  // Thresholds & Limits
  pass1Threshold: number;      // default: 70
  pass2Threshold: number;      // default: 60
  queryBudgetPerRound: number; // default: 10
  concurrencyLimit: number;    // default: 5
  maxResultsPerQuery: number;  // default: 100
  
  // State
  currentRound: number;
  roundHistory: RoundHistoryEntry[];
  status: AgentSessionStatus;
  
  // Timestamps
  createdAt: number;
  updatedAt: number;
  lastError?: string;
}
```

### RoundHistoryEntry
```typescript
interface RoundHistoryEntry {
  round: number;
  queriesGenerated: number;
  queriesPassedPass1: number;
  queriesPassedPass2: number;
  avgCompositeScore?: number;
  timestamp: number;
}
```

### GeneratedQuery
```typescript
interface GeneratedQuery {
  _id: Id<"generatedQueries">;
  _creationTime: number;
  
  // Session Reference
  sessionId: Id<"agentSessions">;
  round: number;
  
  // Query Data
  query: string;
  generationReasoning?: string;
  
  // Pass 1 Scoring
  pass1Score?: number;
  pass1Status: QueryStatus;
  pass1Reasoning?: string;
  
  // Pass 2 Scoring
  pass2Score?: number;
  pass2Status?: QueryStatus;
  pass2Reasoning?: string;
  pass2SampleResults?: UnifiedResult[];
  
  // Final Score
  compositeScore?: number;
  
  // Execution
  execStatus?: ExecStatus;
  fullResults?: UnifiedResult[];
  resultsCount?: number;
  
  // Timestamps
  createdAt: number;
  updatedAt: number;
}
```

### UnifiedResult (Reused from existing schema)
```typescript
interface UnifiedResult {
  url: string;
  title: string;
  description: string;
  type: "profile" | "company" | "post" | "job" | "other";
  rank: number;
  author_name?: string | null;
  company_name?: string | null;
  followers?: number | null;
  location?: string | null;
}
```

---

## API Input Types

### CreateSessionArgs
```typescript
interface CreateSessionArgs {
  userId?: string;
  persona: string;
  seedQuery: string;
  scoringMasterPrompt: string;
  pass1Threshold?: number;      // default: 70
  pass2Threshold?: number;      // default: 60
  queryBudgetPerRound?: number; // default: 10
  concurrencyLimit?: number;    // default: 5
  maxResultsPerQuery?: number;  // default: 100
}
```

### AddBatchArgs
```typescript
interface AddBatchArgs {
  sessionId: Id<"agentSessions">;
  round: number;
  queries: Array<{
    query: string;
    generationReasoning?: string;
  }>;
}
```

### UpdatePass1Args
```typescript
interface UpdatePass1Args {
  id: Id<"generatedQueries">;
  pass1Score: number;
  pass1Status: QueryStatus;
  pass1Reasoning?: string;
}
```

### UpdatePass2Args
```typescript
interface UpdatePass2Args {
  id: Id<"generatedQueries">;
  pass2Score: number;
  pass2Status: QueryStatus;
  pass2Reasoning?: string;
  pass2SampleResults?: UnifiedResult[];
  compositeScore: number;
}
```

### UpdateExecutionArgs
```typescript
interface UpdateExecutionArgs {
  id: Id<"generatedQueries">;
  execStatus: ExecStatus;
  fullResults?: UnifiedResult[];
  resultsCount?: number;
}
```

### RoundStats
```typescript
interface RoundStats {
  queriesGenerated: number;
  queriesPassedPass1: number;
  queriesPassedPass2: number;
  avgCompositeScore?: number;
}
```

---

## Usage Examples with Types

### Creating a Session
```typescript
import { api } from "./convex/_generated/api";
import { useMutation } from "convex/react";
import type { Id } from "./convex/_generated/dataModel";

const createSession = useMutation(api.agentSessions.create);

const sessionId: Id<"agentSessions"> = await createSession({
  persona: "LinkedIn recruiter",
  seedQuery: "software engineers in SF",
  scoringMasterPrompt: "Rate this query...",
  pass1Threshold: 75, // override default
});
```

### Adding Queries
```typescript
import { api } from "./convex/_generated/api";
import { useMutation } from "convex/react";

const addQueries = useMutation(api.generatedQueries.addBatch);

await addQueries({
  sessionId,
  round: 1,
  queries: [
    { 
      query: "senior software engineer startup SF",
      generationReasoning: "Focuses on seniority + company type"
    },
    { 
      query: "lead engineer SaaS Bay Area",
      generationReasoning: "Broader location, focuses on role"
    }
  ]
});
```

### Updating Scores
```typescript
import { api } from "./convex/_generated/api";
import { useMutation } from "convex/react";

const updatePass1 = useMutation(api.generatedQueries.updatePass1);
const updatePass2 = useMutation(api.generatedQueries.updatePass2);

// Pass 1 scoring
await updatePass1({
  id: queryId,
  pass1Score: 85,
  pass1Status: "passed",
  pass1Reasoning: "Query is relevant and well-structured"
});

// Pass 2 scoring (if passed Pass 1)
await updatePass2({
  id: queryId,
  pass2Score: 78,
  pass2Status: "passed",
  pass2Reasoning: "Results contain high-quality profiles",
  pass2SampleResults: sampleResults,
  compositeScore: 81.2 // weighted combination
});
```

### Querying Data
```typescript
import { api } from "./convex/_generated/api";
import { useQuery } from "convex/react";
import type { Id } from "./convex/_generated/dataModel";

// Get session
const sessionId: Id<"agentSessions"> = "...";
const session = useQuery(api.agentSessions.get, { id: sessionId });

// Get top queries
const topQueries = useQuery(api.generatedQueries.getTopByCompositeScore, {
  sessionId,
  limit: 10
});

// Get queries for specific round
const roundQueries = useQuery(api.generatedQueries.getBySessionAndRound, {
  sessionId,
  round: 1
});

// Get active sessions
const activeSessions = useQuery(api.agentSessions.getActive, {
  userId: "user_123"
});
```

---

## Validation Helpers

When working with status transitions, ensure valid state changes:

```typescript
const isValidStatusTransition = (
  from: AgentSessionStatus,
  to: AgentSessionStatus
): boolean => {
  const validTransitions: Record<AgentSessionStatus, AgentSessionStatus[]> = {
    idle: ["generating_queries", "error"],
    generating_queries: ["scoring_pass1", "error"],
    scoring_pass1: ["scoring_pass2", "completed", "error"],
    scoring_pass2: ["executing_queries", "completed", "error"],
    executing_queries: ["completed", "error"],
    completed: [],
    error: ["idle", "generating_queries"], // can retry
  };
  
  return validTransitions[from]?.includes(to) ?? false;
};
```

---

## Composite Score Calculation

Recommended formula for combining Pass 1 and Pass 2 scores:

```typescript
const calculateCompositeScore = (
  pass1Score: number,
  pass2Score: number,
  pass1Weight: number = 0.4,
  pass2Weight: number = 0.6
): number => {
  return Math.round((pass1Score * pass1Weight) + (pass2Score * pass2Weight));
};

// Example
const compositeScore = calculateCompositeScore(85, 78);
// Result: 81 (rounded from 81.2)
```

---

## Type Guards

Useful type guards for runtime checks:

```typescript
const isCompletedSession = (
  session: AgentSession
): session is AgentSession & { status: "completed" } => {
  return session.status === "completed";
};

const hasPass2Results = (
  query: GeneratedQuery
): query is GeneratedQuery & { 
  pass2Score: number;
  pass2Status: QueryStatus;
  compositeScore: number;
} => {
  return query.pass2Score !== undefined && 
         query.pass2Status !== undefined &&
         query.compositeScore !== undefined;
};

const isExecutedQuery = (
  query: GeneratedQuery
): query is GeneratedQuery & { 
  fullResults: UnifiedResult[];
  resultsCount: number;
} => {
  return query.execStatus === "completed" &&
         query.fullResults !== undefined &&
         query.resultsCount !== undefined;
};
```
