/**
 * Convex Mock Utilities
 *
 * Mocks for Convex React hooks and API structure
 */

import { vi } from 'vitest'

// ============ Mock Hooks ============

/**
 * Mock useQuery that supports skip option
 * Returns undefined by default (loading state)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const mockUseQuery: any = vi.fn((query, args, options) => {
  // If skip is true, return undefined immediately
  if (options?.skip) {
    return undefined
  }

  // Default to undefined (loading state)
  return undefined
})

/**
 * Mock useMutation that returns a mutation function
 * The returned function can be spied on in tests
 */
export const mockUseMutation = vi.fn(() => {
  return vi.fn().mockResolvedValue(undefined)
})

/**
 * Mock useConvexAuth hook
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const mockUseConvexAuth: any = vi.fn(() => ({
  isLoading: false,
  isAuthenticated: false,
}))

// ============ Mock API Object ============

/**
 * Mock API object matching @/convex/_generated/api structure
 * Use this in tests instead of importing the real api object
 */
export const mockApi = {
  searchHistory: {
    list: 'searchHistory:list',
    listStarred: 'searchHistory:listStarred',
    getById: 'searchHistory:getById',
    search: 'searchHistory:search',
    getStorageStats: 'searchHistory:getStorageStats',
    add: 'searchHistory:add',
    remove: 'searchHistory:remove',
    removeMany: 'searchHistory:removeMany',
    clearAll: 'searchHistory:clearAll',
    toggleStar: 'searchHistory:toggleStar',
    compressOldEntries: 'searchHistory:compressOldEntries',
    pruneOldest: 'searchHistory:pruneOldest',
  },
  savedSearches: {
    list: 'savedSearches:list',
    getById: 'savedSearches:getById',
    getRecent: 'savedSearches:getRecent',
    getMostUsed: 'savedSearches:getMostUsed',
    add: 'savedSearches:add',
    update: 'savedSearches:update',
    remove: 'savedSearches:remove',
    recordUsage: 'savedSearches:recordUsage',
  },
  customPresets: {
    list: 'customPresets:list',
    getById: 'customPresets:getById',
    getByCategory: 'customPresets:getByCategory',
    add: 'customPresets:add',
    update: 'customPresets:update',
    remove: 'customPresets:remove',
  },
}

// ============ Setup Helpers ============

/**
 * Setup common Convex mocks
 * Call this at the top of test files that use Convex hooks
 */
export function setupConvexMocks() {
  // Mock convex/react module
  vi.mock('convex/react', () => ({
    useQuery: mockUseQuery,
    useMutation: mockUseMutation,
    useConvexAuth: mockUseConvexAuth,
  }))

  // Mock the generated api
  vi.mock('@/convex/_generated/api', () => ({
    api: mockApi,
  }))
}

/**
 * Reset all Convex mocks to initial state
 * Call this in beforeEach or afterEach
 */
export function resetConvexMocks() {
  mockUseQuery.mockClear()
  mockUseMutation.mockClear()
  mockUseConvexAuth.mockClear()
}

// ============ Mock Response Builders ============

/**
 * Configure mockUseQuery to return a specific value
 * @param returnValue - The value to return from useQuery
 * @example
 * setMockQueryReturn([{ _id: '1', name: 'Test' }])
 */
export function setMockQueryReturn<T>(returnValue: T) {
  mockUseQuery.mockReturnValue(returnValue)
}

/**
 * Configure mockUseQuery to return undefined (loading state)
 */
export function setMockQueryLoading() {
  mockUseQuery.mockReturnValue(undefined)
}

/**
 * Configure mockUseMutation to return a successful promise
 * @param resolveValue - The value to resolve with
 * @example
 * setMockMutationSuccess({ _id: 'new-id' })
 */
export function setMockMutationSuccess<T>(resolveValue?: T) {
  const mockMutationFn = vi.fn().mockResolvedValue(resolveValue)
  mockUseMutation.mockReturnValue(mockMutationFn)
  return mockMutationFn
}

/**
 * Configure mockUseMutation to reject with an error
 * @param error - The error to reject with
 * @example
 * setMockMutationError(new Error('Failed to save'))
 */
export function setMockMutationError(error: Error) {
  const mockMutationFn = vi.fn().mockRejectedValue(error)
  mockUseMutation.mockReturnValue(mockMutationFn)
  return mockMutationFn
}

/**
 * Configure mockUseConvexAuth to return authenticated state
 */
export function setMockAuthAuthenticated(userId?: string) {
  mockUseConvexAuth.mockReturnValue({
    isLoading: false,
    isAuthenticated: true,
    userId,
  })
}

/**
 * Configure mockUseConvexAuth to return unauthenticated state
 */
export function setMockAuthUnauthenticated() {
  mockUseConvexAuth.mockReturnValue({
    isLoading: false,
    isAuthenticated: false,
  })
}

/**
 * Configure mockUseConvexAuth to return loading state
 */
export function setMockAuthLoading() {
  mockUseConvexAuth.mockReturnValue({
    isLoading: true,
    isAuthenticated: false,
  })
}

// ============ Query Argument Matchers ============

/**
 * Helper to check if useQuery was called with specific arguments
 * @example
 * expect(wasQueryCalledWith(mockApi.searchHistory.list, { limit: 50 })).toBe(true)
 */
export function wasQueryCalledWith(queryName: string, args?: any): boolean {
  return mockUseQuery.mock.calls.some(
    (call: any[]) =>
      call[0] === queryName &&
      (args === undefined || JSON.stringify(call[1]) === JSON.stringify(args))
  )
}

/**
 * Helper to get the mutation function that was returned by useMutation
 * @example
 * const addMutation = getMutationFn(mockApi.searchHistory.add)
 * await addMutation({ query: { ... } })
 */
export function getMutationFn(mutationName: string): any {
  const call = mockUseMutation.mock.results.find((result) => result.value !== undefined)
  return call?.value
}

// ============ Advanced Mock Scenarios ============

/**
 * Configure mockUseQuery to return different values on successive calls
 * Useful for testing loading -> data transitions
 * @example
 * setMockQuerySequence([undefined, [], [{ _id: '1' }]])
 */
export function setMockQuerySequence<T>(values: T[]) {
  let callCount = 0
  mockUseQuery.mockImplementation(() => {
    const value = values[Math.min(callCount, values.length - 1)]
    callCount++
    return value
  })
}

/**
 * Configure mockUseQuery to return values based on query name
 * @example
 * setMockQueryByName({
 *   [mockApi.searchHistory.list]: [{ _id: '1' }],
 *   [mockApi.savedSearches.list]: [],
 * })
 */
export function setMockQueryByName(queryMap: Record<string, any>) {
  mockUseQuery.mockImplementation((queryName: string) => {
    return queryMap[queryName]
  })
}

/**
 * Spy on mutation calls and return their arguments
 * Useful for verifying what data was sent to the backend
 * @example
 * const spy = spyOnMutationCalls()
 * // ... trigger mutation ...
 * expect(spy).toHaveBeenCalledWith({ query: { ... } })
 */
export function spyOnMutationCalls() {
  const spy = vi.fn()
  const mockMutationFn = vi.fn(async (...args) => {
    spy(...args)
    return undefined
  })
  mockUseMutation.mockReturnValue(mockMutationFn)
  return spy
}
