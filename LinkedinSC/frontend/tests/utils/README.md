# Test Utilities

Centralized testing utilities for the LinkedinSC frontend test suite.

## Files

### `testUtils.tsx`

Mock factories and helpers for creating test data.

#### Mock Factories

```typescript
import {
  createMockSearchHistoryEntry,
  createMockSavedSearch,
  createMockCustomPreset,
  createMockUnifiedResult,
  createMockAggregatedResult,
  createMockRawSearchResponse,
  createMockPipelineStats,
} from '@/tests/utils'

// Create a search history entry with defaults
const entry = createMockSearchHistoryEntry()

// Override specific fields
const customEntry = createMockSearchHistoryEntry({
  compressed: true,
  query: { baseQuery: 'custom query' }
})
```

#### Batch Creators

```typescript
import {
  createMockSearchHistoryBatch,
  createMockUnifiedResultBatch,
} from '@/tests/utils'

// Create 10 search history entries
const entries = createMockSearchHistoryBatch(10)

// Create 5 unified results
const results = createMockUnifiedResultBatch(5)
```

#### Store Utilities

```typescript
import { resetAllStores, waitForStoreUpdate } from '@/tests/utils'

// Reset all Zustand stores before each test
beforeEach(() => {
  resetAllStores()
})

// Wait for async store updates
await waitForStoreUpdate()
```

#### Convex Test Wrapper

```typescript
import { ConvexTestWrapper } from '@/tests/utils'

render(
  <ConvexTestWrapper>
    <YourComponent />
  </ConvexTestWrapper>
)
```

---

### `convexMocks.ts`

Mocks for Convex React hooks and API structure.

#### Basic Setup

```typescript
import { setupConvexMocks, resetConvexMocks } from '@/tests/utils'

// At the top of your test file (outside describe blocks)
setupConvexMocks()

// In beforeEach
beforeEach(() => {
  resetConvexMocks()
})
```

#### Mocking Queries

```typescript
import {
  mockUseQuery,
  mockApi,
  setMockQueryReturn,
  setMockQueryLoading,
  setMockQuerySequence,
  setMockQueryByName,
} from '@/tests/utils'

// Return specific data
setMockQueryReturn([{ _id: '1', name: 'Test' }])

// Return loading state (undefined)
setMockQueryLoading()

// Return sequence of values (loading -> data)
setMockQuerySequence([
  undefined,           // loading
  [],                  // empty array
  [{ _id: '1' }]       // data
])

// Return different data per query
setMockQueryByName({
  [mockApi.searchHistory.list]: [{ _id: '1' }],
  [mockApi.savedSearches.list]: [{ _id: '2' }],
})
```

#### Mocking Mutations

```typescript
import {
  mockUseMutation,
  setMockMutationSuccess,
  setMockMutationError,
  spyOnMutationCalls,
} from '@/tests/utils'

// Mutation succeeds
const mutationFn = setMockMutationSuccess({ _id: 'new-id' })
await mutationFn({ data: 'test' })

// Mutation fails
const errorFn = setMockMutationError(new Error('Failed'))
await expect(errorFn()).rejects.toThrow('Failed')

// Spy on mutation calls
const spy = spyOnMutationCalls()
const mutation = mockUseMutation()
await mutation({ data: 'test' })
expect(spy).toHaveBeenCalledWith({ data: 'test' })
```

#### Mocking Auth

```typescript
import {
  setMockAuthAuthenticated,
  setMockAuthUnauthenticated,
  setMockAuthLoading,
} from '@/tests/utils'

// Authenticated user
setMockAuthAuthenticated('user-123')

// Unauthenticated
setMockAuthUnauthenticated()

// Loading
setMockAuthLoading()
```

#### Using Mock API

```typescript
import { mockApi } from '@/tests/utils'

// Use in component tests instead of real api
const { result } = renderHook(() =>
  useQuery(mockApi.searchHistory.list, { limit: 50 })
)
```

#### Verification Helpers

```typescript
import { wasQueryCalledWith } from '@/tests/utils'

// Check if query was called with specific args
expect(wasQueryCalledWith(mockApi.searchHistory.list, { limit: 50 })).toBe(true)
```

---

## Complete Example

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  setupConvexMocks,
  resetConvexMocks,
  setMockQueryReturn,
  createMockSearchHistoryEntry,
  mockApi,
} from '@/tests/utils'

setupConvexMocks()

describe('SearchHistory Component', () => {
  beforeEach(() => {
    resetConvexMocks()
  })

  it('displays search history entries', () => {
    const entries = [
      createMockSearchHistoryEntry({ id: '1' }),
      createMockSearchHistoryEntry({ id: '2' }),
    ]

    setMockQueryReturn(entries)

    render(<SearchHistory />)

    expect(screen.getByText(/Result 1/)).toBeInTheDocument()
    expect(screen.getByText(/Result 2/)).toBeInTheDocument()
  })

  it('shows loading state', () => {
    setMockQueryLoading()

    render(<SearchHistory />)

    expect(screen.getByText(/Loading/)).toBeInTheDocument()
  })
})
```

---

## API Reference

### Mock Factories

| Function | Description | Returns |
|----------|-------------|---------|
| `createMockSearchHistoryEntry(overrides?)` | Create search history entry | `SearchHistoryEntry` |
| `createMockSavedSearch(overrides?)` | Create saved search | `SavedSearch` |
| `createMockCustomPreset(overrides?)` | Create custom preset | `CustomPreset` |
| `createMockUnifiedResult(overrides?)` | Create unified result | `UnifiedResult` |
| `createMockAggregatedResult(overrides?)` | Create aggregated result | `AggregatedResult` |
| `createMockRawSearchResponse(overrides?)` | Create raw search response | `RawSearchResponse` |
| `createMockPipelineStats(overrides?)` | Create pipeline stats | `PipelineStats` |
| `createMockSearchHistoryBatch(count)` | Create N history entries | `SearchHistoryEntry[]` |
| `createMockUnifiedResultBatch(count)` | Create N results | `UnifiedResult[]` |

### Convex Mocks

| Function | Description |
|----------|-------------|
| `setupConvexMocks()` | Mock convex/react module |
| `resetConvexMocks()` | Clear mock call history |
| `setMockQueryReturn(value)` | Set query return value |
| `setMockQueryLoading()` | Set query to loading state |
| `setMockQuerySequence(values[])` | Return values in sequence |
| `setMockQueryByName(map)` | Return values by query name |
| `setMockMutationSuccess(value?)` | Configure mutation to succeed |
| `setMockMutationError(error)` | Configure mutation to fail |
| `setMockAuthAuthenticated(userId?)` | Set authenticated state |
| `setMockAuthUnauthenticated()` | Set unauthenticated state |
| `setMockAuthLoading()` | Set auth loading state |
| `wasQueryCalledWith(name, args?)` | Check if query was called |
| `spyOnMutationCalls()` | Spy on mutation arguments |

### Store Utilities

| Function | Description |
|----------|-------------|
| `resetAllStores()` | Reset all Zustand stores |
| `waitForStoreUpdate()` | Wait for async updates |

---

## Best Practices

1. **Always call `setupConvexMocks()` at file level** - Outside describe blocks
2. **Reset mocks in `beforeEach`** - Prevents test pollution
3. **Use batch creators for large datasets** - More efficient than loops
4. **Use `setMockQuerySequence` for loading states** - Test loading transitions
5. **Spy on mutations to verify calls** - Use `spyOnMutationCalls()`
6. **Use `wasQueryCalledWith` to verify queries** - Check query arguments
7. **Reset stores between tests** - Use `resetAllStores()` in beforeEach

---

## Testing Patterns

### Testing Loading State

```typescript
it('shows loading spinner', () => {
  setMockQueryLoading()
  render(<Component />)
  expect(screen.getByRole('status')).toBeInTheDocument()
})
```

### Testing Data Display

```typescript
it('displays data', () => {
  const data = [createMockSearchHistoryEntry()]
  setMockQueryReturn(data)
  render(<Component />)
  expect(screen.getByText(data[0].query.baseQuery)).toBeInTheDocument()
})
```

### Testing Mutations

```typescript
it('saves data', async () => {
  const spy = spyOnMutationCalls()
  const mutationFn = setMockMutationSuccess({ _id: 'new-id' })

  render(<Component />)
  await userEvent.click(screen.getByRole('button', { name: /save/i }))

  expect(spy).toHaveBeenCalledWith(expect.objectContaining({
    name: 'Test',
  }))
})
```

### Testing Error States

```typescript
it('handles errors', async () => {
  setMockMutationError(new Error('Failed to save'))

  render(<Component />)
  await userEvent.click(screen.getByRole('button', { name: /save/i }))

  expect(screen.getByText(/error/i)).toBeInTheDocument()
})
```
