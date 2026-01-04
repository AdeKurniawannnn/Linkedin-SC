import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock convex/react module
vi.mock('convex/react', async () => {
  const actual = await vi.importActual('@/tests/utils/convexMocks')
  return {
    useQuery: actual.mockUseQuery,
    useMutation: actual.mockUseMutation,
    useConvexAuth: actual.mockUseConvexAuth,
  }
})

// Mock the generated api
vi.mock('@/convex/_generated/api', async () => {
  const actual = await vi.importActual('@/tests/utils/convexMocks')
  return {
    api: actual.mockApi,
  }
})

// Mock the Zustand store
vi.mock('@/stores/agentSessionStore', () => {
  const mockStoreState = {
    activeSessionId: null,
  }

  const mockUseAgentSessionStore = vi.fn((selector) => {
    if (typeof selector === 'function') {
      return selector(mockStoreState)
    }
    return mockStoreState
  })

  mockUseAgentSessionStore.setState = vi.fn((updates) => {
    Object.assign(mockStoreState, typeof updates === 'function' ? updates(mockStoreState) : updates)
  })

  mockUseAgentSessionStore.getState = vi.fn(() => mockStoreState)

  return {
    useAgentSessionStore: mockUseAgentSessionStore,
  }
})

// Import after mocks are set up
import { useAgentSession } from '@/hooks/useAgentSession'
import type { AgentSessionConfig } from '@/lib/agent/types'
import type { UnifiedResult } from '@/lib/api'
import {
  resetConvexMocks,
  mockUseQuery,
  mockUseMutation,
  mockApi,
  setMockQueryReturn,
  setMockQueryLoading,
  setMockMutationSuccess,
  setMockMutationError,
  setMockQueryByName,
} from '@/tests/utils/convexMocks'

// Get mocked modules
const { toast: mockToast } = await import('sonner')
const { useAgentSessionStore } = await import('@/stores/agentSessionStore')

describe('useAgentSession', () => {
  const mockSessionConfig: AgentSessionConfig = {
    persona: 'Fintech CTOs',
    seedQuery: 'site:linkedin.com/in/ CTO fintech',
    scoringMasterPrompt: 'Score based on relevance to fintech CTOs',
    pass1Threshold: 60,
    pass2Threshold: 50,
    queryBudgetPerRound: 10,
    concurrencyLimit: 3,
    maxResultsPerQuery: 100,
  }

  const mockSession = {
    _id: 'session-123' as any,
    _creationTime: Date.now(),
    config: mockSessionConfig,
    currentRound: 1,
    roundHistory: [],
    status: 'idle' as const,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  const mockQueries = [
    {
      _id: 'query-1' as any,
      _creationTime: Date.now(),
      sessionId: 'session-123' as any,
      round: 1,
      query: 'site:linkedin.com/in/ CTO fintech payments',
      generationReasoning: 'Targets fintech CTOs in payments space',
      pass1Status: 'passed' as const,
      pass1Score: 75,
      pass1Reasoning: 'High potential for relevant results',
      pass2Status: 'passed' as const,
      pass2Score: 80,
      pass2Reasoning: 'Sample results show high quality profiles',
      compositeScore: 77.5,
      execStatus: 'pending' as const,
      generatedAt: Date.now(),
    },
    {
      _id: 'query-2' as any,
      _creationTime: Date.now(),
      sessionId: 'session-123' as any,
      round: 1,
      query: 'site:linkedin.com/in/ "Chief Technology Officer" blockchain',
      generationReasoning: 'Targets blockchain CTOs',
      pass1Status: 'pending' as const,
      generatedAt: Date.now(),
    },
    {
      _id: 'query-3' as any,
      _creationTime: Date.now(),
      sessionId: 'session-123' as any,
      round: 1,
      query: 'site:linkedin.com/in/ VP Engineering crypto',
      generationReasoning: 'Targets senior engineers in crypto',
      pass1Status: 'failed' as const,
      pass1Score: 45,
      pass1Reasoning: 'Too broad, likely low quality results',
      generatedAt: Date.now(),
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    resetConvexMocks()
    // Reset store state via setState
    useAgentSessionStore.setState({ activeSessionId: null })
    mockToast.success.mockClear()
    mockToast.error.mockClear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initial state', () => {
    it('returns undefined session when no active session', () => {
      setMockQueryReturn(undefined)
      const { result } = renderHook(() => useAgentSession())

      expect(result.current.session).toBeUndefined()
      expect(result.current.queries).toEqual([])
      expect(result.current.isLoading).toBe(true)
      expect(result.current.activeSessionId).toBeNull()
    })

    it('returns empty queries array when loading', () => {
      setMockQueryLoading()
      const { result } = renderHook(() => useAgentSession())

      expect(result.current.queries).toEqual([])
      expect(result.current.isLoading).toBe(true)
    })

    it('exposes all session actions', () => {
      const { result } = renderHook(() => useAgentSession())

      expect(typeof result.current.create).toBe('function')
      expect(typeof result.current.update).toBe('function')
      expect(typeof result.current.updateStatus).toBe('function')
      expect(typeof result.current.completeRound).toBe('function')
      expect(typeof result.current.deleteSession).toBe('function')
      expect(typeof result.current.setActiveSession).toBe('function')
    })

    it('exposes all query actions', () => {
      const { result } = renderHook(() => useAgentSession())

      expect(typeof result.current.addQueryBatch).toBe('function')
      expect(typeof result.current.updatePass1).toBe('function')
      expect(typeof result.current.updatePass2).toBe('function')
      expect(typeof result.current.updateExecution).toBe('function')
      expect(typeof result.current.deleteQueries).toBe('function')
    })

    it('exposes all helper functions', () => {
      const { result } = renderHook(() => useAgentSession())

      expect(typeof result.current.getTopQueriesForContext).toBe('function')
      expect(typeof result.current.getQueriesByStatus).toBe('function')
      expect(typeof result.current.getQueriesByPass2Status).toBe('function')
      expect(typeof result.current.getCurrentRoundQueries).toBe('function')
      expect(typeof result.current.getSessionStats).toBe('function')
    })
  })

  describe('session state tracking', () => {
    it('loads session when activeSessionId is set', () => {
      useAgentSessionStore.setState({ activeSessionId: 'session-123' })
      setMockQueryByName({
        [mockApi.agentSessions.get]: mockSession,
        [mockApi.generatedQueries.getBySession]: mockQueries,
        [mockApi.agentSessions.list]: [],
        [mockApi.agentSessions.getActive]: [],
      })

      const { result } = renderHook(() => useAgentSession())

      expect(result.current.session).toEqual(mockSession)
      expect(result.current.activeSessionId).toBe('session-123')
      expect(result.current.isLoading).toBe(false)
    })

    it('loads queries for active session', () => {
      useAgentSessionStore.setState({ activeSessionId: 'session-123' })
      setMockQueryByName({
        [mockApi.agentSessions.get]: mockSession,
        [mockApi.generatedQueries.getBySession]: mockQueries,
        [mockApi.agentSessions.list]: [],
        [mockApi.agentSessions.getActive]: [],
      })

      const { result } = renderHook(() => useAgentSession())

      expect(result.current.queries).toEqual(mockQueries)
      expect(result.current.queries).toHaveLength(3)
    })

    it('returns isLoading true when session or queries are undefined', () => {
      useAgentSessionStore.setState({ activeSessionId: 'session-123' })
      setMockQueryByName({
        [mockApi.agentSessions.get]: undefined,
        [mockApi.generatedQueries.getBySession]: undefined,
        [mockApi.agentSessions.list]: [],
        [mockApi.agentSessions.getActive]: [],
      })

      const { result } = renderHook(() => useAgentSession())

      expect(result.current.isLoading).toBe(true)
    })

    it('returns isLoading false when both session and queries are loaded', () => {
      useAgentSessionStore.setState({ activeSessionId: 'session-123' })
      setMockQueryByName({
        [mockApi.agentSessions.get]: mockSession,
        [mockApi.generatedQueries.getBySession]: mockQueries,
        [mockApi.agentSessions.list]: [],
        [mockApi.agentSessions.getActive]: [],
      })

      const { result } = renderHook(() => useAgentSession())

      expect(result.current.isLoading).toBe(false)
    })

    it('loads all sessions list', () => {
      const allSessions = [mockSession, { ...mockSession, _id: 'session-456' as any }]
      setMockQueryByName({
        [mockApi.agentSessions.get]: 'skip',
        [mockApi.generatedQueries.getBySession]: 'skip',
        [mockApi.agentSessions.list]: allSessions,
        [mockApi.agentSessions.getActive]: [],
      })

      const { result } = renderHook(() => useAgentSession())

      expect(result.current.allSessions).toEqual(allSessions)
      expect(result.current.allSessions).toHaveLength(2)
    })

    it('loads active sessions', () => {
      const activeSessions = [mockSession]
      setMockQueryByName({
        [mockApi.agentSessions.get]: 'skip',
        [mockApi.generatedQueries.getBySession]: 'skip',
        [mockApi.agentSessions.list]: [],
        [mockApi.agentSessions.getActive]: activeSessions,
      })

      const { result } = renderHook(() => useAgentSession())

      expect(result.current.activeSessions).toEqual(activeSessions)
      expect(result.current.activeSessions).toHaveLength(1)
    })
  })

  describe('create session', () => {
    it('creates new session and sets it as active', async () => {
      const mockCreate = setMockMutationSuccess('session-new')
      const { result } = renderHook(() => useAgentSession())

      let sessionId: string | undefined
      await act(async () => {
        sessionId = await result.current.create(mockSessionConfig)
      })

      expect(mockCreate).toHaveBeenCalledWith(mockSessionConfig)
      expect(sessionId).toBe('session-new')
      expect(useAgentSessionStore.getState().activeSessionId).toBe('session-new')
      expect(mockToast.success).toHaveBeenCalledWith('Agent session created')
    })

    it('handles create session error', async () => {
      const error = new Error('Failed to create session')
      setMockMutationError(error)
      const { result } = renderHook(() => useAgentSession())

      await expect(
        act(async () => {
          await result.current.create(mockSessionConfig)
        })
      ).rejects.toThrow('Failed to create session')

      expect(mockToast.error).toHaveBeenCalledWith('Failed to create session')
    })

    it('logs error to console on create failure', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const error = new Error('Network error')
      setMockMutationError(error)
      const { result } = renderHook(() => useAgentSession())

      await expect(
        act(async () => {
          await result.current.create(mockSessionConfig)
        })
      ).rejects.toThrow()

      expect(consoleSpy).toHaveBeenCalledWith('Failed to create agent session:', error)
      consoleSpy.mockRestore()
    })
  })

  describe('update session', () => {
    it('updates session configuration', async () => {
      const mockUpdate = setMockMutationSuccess()
      const { result } = renderHook(() => useAgentSession())

      const updates: Partial<AgentSessionConfig> = {
        pass1Threshold: 70,
        pass2Threshold: 60,
      }

      await act(async () => {
        await result.current.update('session-123' as any, updates)
      })

      expect(mockUpdate).toHaveBeenCalledWith({
        id: 'session-123',
        ...updates,
      })
      expect(mockToast.success).toHaveBeenCalledWith('Session updated')
    })

    it('handles update session error', async () => {
      const error = new Error('Update failed')
      setMockMutationError(error)
      const { result } = renderHook(() => useAgentSession())

      await expect(
        act(async () => {
          await result.current.update('session-123' as any, { pass1Threshold: 70 })
        })
      ).rejects.toThrow('Update failed')

      expect(mockToast.error).toHaveBeenCalledWith('Failed to update session')
    })
  })

  describe('update session status', () => {
    it('updates session status without error', async () => {
      const mockUpdateStatus = setMockMutationSuccess()
      const { result } = renderHook(() => useAgentSession())

      await act(async () => {
        await result.current.updateStatus('session-123' as any, 'generating_queries')
      })

      expect(mockUpdateStatus).toHaveBeenCalledWith({
        id: 'session-123',
        status: 'generating_queries',
        lastError: undefined,
      })
    })

    it('updates session status with error message', async () => {
      const mockUpdateStatus = setMockMutationSuccess()
      const { result } = renderHook(() => useAgentSession())

      await act(async () => {
        await result.current.updateStatus('session-123' as any, 'error', 'LLM rate limited')
      })

      expect(mockUpdateStatus).toHaveBeenCalledWith({
        id: 'session-123',
        status: 'error',
        lastError: 'LLM rate limited',
      })
    })

    it('handles update status error', async () => {
      const error = new Error('Status update failed')
      setMockMutationError(error)
      const { result } = renderHook(() => useAgentSession())

      await expect(
        act(async () => {
          await result.current.updateStatus('session-123' as any, 'idle')
        })
      ).rejects.toThrow('Status update failed')

      expect(mockToast.error).toHaveBeenCalledWith('Failed to update status')
    })
  })

  describe('complete round', () => {
    it('completes round and shows success toast', async () => {
      const mockCompleteRound = setMockMutationSuccess({
        newRound: 2,
        avgCompositeScore: 72.5,
      })
      const { result } = renderHook(() => useAgentSession())

      const roundStats = {
        queriesGenerated: 10,
        queriesPassedPass1: 8,
        queriesPassedPass2: 6,
        avgCompositeScore: 72.5,
      }

      let completionResult
      await act(async () => {
        completionResult = await result.current.completeRound('session-123' as any, roundStats)
      })

      expect(mockCompleteRound).toHaveBeenCalledWith({
        id: 'session-123',
        roundStats,
      })
      expect(completionResult).toEqual({ newRound: 2, avgCompositeScore: 72.5 })
      expect(mockToast.success).toHaveBeenCalledWith('Round 1 completed')
    })

    it('handles complete round error', async () => {
      const error = new Error('Round completion failed')
      setMockMutationError(error)
      const { result } = renderHook(() => useAgentSession())

      const roundStats = {
        queriesGenerated: 10,
        queriesPassedPass1: 8,
        queriesPassedPass2: 6,
      }

      await expect(
        act(async () => {
          await result.current.completeRound('session-123' as any, roundStats)
        })
      ).rejects.toThrow('Round completion failed')

      expect(mockToast.error).toHaveBeenCalledWith('Failed to complete round')
    })
  })

  describe('delete session', () => {
    it('deletes session and shows deleted query count', async () => {
      const mockRemove = setMockMutationSuccess({ deletedQueries: 15 })
      const { result } = renderHook(() => useAgentSession())

      await act(async () => {
        await result.current.deleteSession('session-123' as any)
      })

      expect(mockRemove).toHaveBeenCalledWith({ id: 'session-123' })
      expect(mockToast.success).toHaveBeenCalledWith('Deleted session and 15 queries')
    })

    it('clears active session if deleted session is active', async () => {
      useAgentSessionStore.setState({ activeSessionId: 'session-123' })
      setMockMutationSuccess({ deletedQueries: 10 })
      const { result } = renderHook(() => useAgentSession())

      await act(async () => {
        await result.current.deleteSession('session-123' as any)
      })

      expect(useAgentSessionStore.getState().activeSessionId).toBeNull()
    })

    it('does not clear active session if deleted session is not active', async () => {
      useAgentSessionStore.setState({ activeSessionId: 'session-456' })
      setMockMutationSuccess({ deletedQueries: 10 })
      const { result } = renderHook(() => useAgentSession())

      await act(async () => {
        await result.current.deleteSession('session-123' as any)
      })

      expect(useAgentSessionStore.getState().activeSessionId).toBe('session-456')
    })

    it('handles delete session error', async () => {
      const error = new Error('Delete failed')
      setMockMutationError(error)
      const { result } = renderHook(() => useAgentSession())

      await expect(
        act(async () => {
          await result.current.deleteSession('session-123' as any)
        })
      ).rejects.toThrow('Delete failed')

      expect(mockToast.error).toHaveBeenCalledWith('Failed to delete session')
    })
  })

  describe('add query batch', () => {
    it('adds batch of queries to session', async () => {
      const mockAddBatch = setMockMutationSuccess({ inserted: 5 })
      const { result } = renderHook(() => useAgentSession())

      const queries = [
        { query: 'query 1', generationReasoning: 'reason 1' },
        { query: 'query 2', generationReasoning: 'reason 2' },
        { query: 'query 3' },
      ]

      let batchResult
      await act(async () => {
        batchResult = await result.current.addQueryBatch('session-123' as any, 1, queries)
      })

      expect(mockAddBatch).toHaveBeenCalledWith({
        sessionId: 'session-123',
        round: 1,
        queries,
      })
      expect(batchResult).toEqual({ inserted: 5 })
    })

    it('handles add query batch error', async () => {
      const error = new Error('Batch insert failed')
      setMockMutationError(error)
      const { result } = renderHook(() => useAgentSession())

      await expect(
        act(async () => {
          await result.current.addQueryBatch('session-123' as any, 1, [{ query: 'test' }])
        })
      ).rejects.toThrow('Batch insert failed')

      expect(mockToast.error).toHaveBeenCalledWith('Failed to save generated queries')
    })
  })

  describe('update Pass 1 scoring', () => {
    it('updates Pass 1 score and status', async () => {
      const mockUpdatePass1 = setMockMutationSuccess()
      const { result } = renderHook(() => useAgentSession())

      await act(async () => {
        await result.current.updatePass1('query-1' as any, 75, 'passed', 'High quality potential')
      })

      expect(mockUpdatePass1).toHaveBeenCalledWith({
        id: 'query-1',
        pass1Score: 75,
        pass1Status: 'passed',
        pass1Reasoning: 'High quality potential',
      })
    })

    it('updates Pass 1 without reasoning', async () => {
      const mockUpdatePass1 = setMockMutationSuccess()
      const { result } = renderHook(() => useAgentSession())

      await act(async () => {
        await result.current.updatePass1('query-1' as any, 40, 'failed')
      })

      expect(mockUpdatePass1).toHaveBeenCalledWith({
        id: 'query-1',
        pass1Score: 40,
        pass1Status: 'failed',
        pass1Reasoning: undefined,
      })
    })

    it('handles update Pass 1 error', async () => {
      const error = new Error('Pass 1 update failed')
      setMockMutationError(error)
      const { result } = renderHook(() => useAgentSession())

      await expect(
        act(async () => {
          await result.current.updatePass1('query-1' as any, 75, 'passed')
        })
      ).rejects.toThrow('Pass 1 update failed')

      expect(mockToast.error).toHaveBeenCalledWith('Failed to update Pass 1 score')
    })
  })

  describe('update Pass 2 scoring', () => {
    it('updates Pass 2 score with all fields', async () => {
      const mockUpdatePass2 = setMockMutationSuccess()
      const { result } = renderHook(() => useAgentSession())

      const sampleResults: UnifiedResult[] = [
        {
          url: 'https://linkedin.com/in/test',
          title: 'Test CTO',
          description: 'Fintech leader',
          type: 'profile',
          rank: 1,
        },
      ]

      await act(async () => {
        await result.current.updatePass2(
          'query-1' as any,
          80,
          'passed',
          77.5,
          'Excellent results',
          sampleResults
        )
      })

      expect(mockUpdatePass2).toHaveBeenCalledWith({
        id: 'query-1',
        pass2Score: 80,
        pass2Status: 'passed',
        pass2Reasoning: 'Excellent results',
        pass2SampleResults: sampleResults,
        compositeScore: 77.5,
      })
    })

    it('updates Pass 2 without optional fields', async () => {
      const mockUpdatePass2 = setMockMutationSuccess()
      const { result } = renderHook(() => useAgentSession())

      await act(async () => {
        await result.current.updatePass2('query-1' as any, 45, 'failed', 50)
      })

      expect(mockUpdatePass2).toHaveBeenCalledWith({
        id: 'query-1',
        pass2Score: 45,
        pass2Status: 'failed',
        pass2Reasoning: undefined,
        pass2SampleResults: undefined,
        compositeScore: 50,
      })
    })

    it('handles update Pass 2 error', async () => {
      const error = new Error('Pass 2 update failed')
      setMockMutationError(error)
      const { result } = renderHook(() => useAgentSession())

      await expect(
        act(async () => {
          await result.current.updatePass2('query-1' as any, 80, 'passed', 77.5)
        })
      ).rejects.toThrow('Pass 2 update failed')

      expect(mockToast.error).toHaveBeenCalledWith('Failed to update Pass 2 score')
    })
  })

  describe('update execution status', () => {
    it('updates execution status with full results', async () => {
      const mockUpdateExec = setMockMutationSuccess()
      const { result } = renderHook(() => useAgentSession())

      const fullResults: UnifiedResult[] = [
        {
          url: 'https://linkedin.com/in/test1',
          title: 'CTO Test 1',
          description: 'Description 1',
          type: 'profile',
          rank: 1,
        },
        {
          url: 'https://linkedin.com/in/test2',
          title: 'CTO Test 2',
          description: 'Description 2',
          type: 'profile',
          rank: 2,
        },
      ]

      await act(async () => {
        await result.current.updateExecution('query-1' as any, 'completed', fullResults, 2)
      })

      expect(mockUpdateExec).toHaveBeenCalledWith({
        id: 'query-1',
        execStatus: 'completed',
        fullResults,
        resultsCount: 2,
      })
    })

    it('updates execution status without results', async () => {
      const mockUpdateExec = setMockMutationSuccess()
      const { result } = renderHook(() => useAgentSession())

      await act(async () => {
        await result.current.updateExecution('query-1' as any, 'pending')
      })

      expect(mockUpdateExec).toHaveBeenCalledWith({
        id: 'query-1',
        execStatus: 'pending',
        fullResults: undefined,
        resultsCount: undefined,
      })
    })

    it('handles update execution error', async () => {
      const error = new Error('Execution update failed')
      setMockMutationError(error)
      const { result } = renderHook(() => useAgentSession())

      await expect(
        act(async () => {
          await result.current.updateExecution('query-1' as any, 'completed')
        })
      ).rejects.toThrow('Execution update failed')

      expect(mockToast.error).toHaveBeenCalledWith('Failed to update execution status')
    })
  })

  describe('delete queries', () => {
    it('deletes queries for session and round', async () => {
      const mockDeleteBatch = setMockMutationSuccess({ deleted: 10 })
      const { result } = renderHook(() => useAgentSession())

      let deleteResult
      await act(async () => {
        deleteResult = await result.current.deleteQueries('session-123' as any, 1)
      })

      expect(mockDeleteBatch).toHaveBeenCalledWith({
        sessionId: 'session-123',
        round: 1,
      })
      expect(deleteResult).toEqual({ deleted: 10 })
      expect(mockToast.success).toHaveBeenCalledWith('Deleted 10 queries')
    })

    it('deletes all queries for session when round is not specified', async () => {
      const mockDeleteBatch = setMockMutationSuccess({ deleted: 25 })
      const { result } = renderHook(() => useAgentSession())

      await act(async () => {
        await result.current.deleteQueries('session-123' as any)
      })

      expect(mockDeleteBatch).toHaveBeenCalledWith({
        sessionId: 'session-123',
        round: undefined,
      })
      expect(mockToast.success).toHaveBeenCalledWith('Deleted 25 queries')
    })

    it('handles delete queries error', async () => {
      const error = new Error('Delete failed')
      setMockMutationError(error)
      const { result } = renderHook(() => useAgentSession())

      await expect(
        act(async () => {
          await result.current.deleteQueries('session-123' as any, 1)
        })
      ).rejects.toThrow('Delete failed')

      expect(mockToast.error).toHaveBeenCalledWith('Failed to delete queries')
    })
  })

  describe('set active session', () => {
    it('sets active session ID in store', () => {
      const { result } = renderHook(() => useAgentSession())

      act(() => {
        result.current.setActiveSession('session-789')
      })

      expect(useAgentSessionStore.getState().activeSessionId).toBe('session-789')
    })

    it('clears active session when null', () => {
      useAgentSessionStore.setState({ activeSessionId: 'session-123' })
      const { result } = renderHook(() => useAgentSession())

      act(() => {
        result.current.setActiveSession(null)
      })

      expect(useAgentSessionStore.getState().activeSessionId).toBeNull()
    })
  })

  describe('helper: getTopQueriesForContext', () => {
    it('returns top queries by composite score', () => {
      setMockQueryByName({
        [mockApi.agentSessions.get]: 'skip',
        [mockApi.generatedQueries.getBySession]: [
          { ...mockQueries[0], compositeScore: 90, pass2Status: 'passed' },
          { ...mockQueries[1], compositeScore: 85, pass2Status: 'passed' },
          { ...mockQueries[2], compositeScore: 70, pass2Status: 'passed' },
        ],
        [mockApi.agentSessions.list]: [],
        [mockApi.agentSessions.getActive]: [],
      })

      const { result } = renderHook(() => useAgentSession())
      const topQueries = result.current.getTopQueriesForContext(2)

      expect(topQueries).toHaveLength(2)
      expect(topQueries[0].compositeScore).toBe(90)
      expect(topQueries[1].compositeScore).toBe(85)
    })

    it('filters out queries without composite score', () => {
      setMockQueryByName({
        [mockApi.agentSessions.get]: 'skip',
        [mockApi.generatedQueries.getBySession]: [
          { ...mockQueries[0], compositeScore: 90, pass2Status: 'passed' },
          { ...mockQueries[1], compositeScore: undefined, pass2Status: 'passed' },
          { ...mockQueries[2], compositeScore: 70, pass2Status: 'passed' },
        ],
        [mockApi.agentSessions.list]: [],
        [mockApi.agentSessions.getActive]: [],
      })

      const { result } = renderHook(() => useAgentSession())
      const topQueries = result.current.getTopQueriesForContext()

      expect(topQueries).toHaveLength(2)
      expect(topQueries.every((q) => q.compositeScore !== undefined)).toBe(true)
    })

    it('filters out queries that did not pass Pass 2', () => {
      setMockQueryByName({
        [mockApi.agentSessions.get]: 'skip',
        [mockApi.generatedQueries.getBySession]: [
          { ...mockQueries[0], compositeScore: 90, pass2Status: 'passed' },
          { ...mockQueries[1], compositeScore: 85, pass2Status: 'failed' },
          { ...mockQueries[2], compositeScore: 70, pass2Status: 'passed' },
        ],
        [mockApi.agentSessions.list]: [],
        [mockApi.agentSessions.getActive]: [],
      })

      const { result } = renderHook(() => useAgentSession())
      const topQueries = result.current.getTopQueriesForContext()

      expect(topQueries).toHaveLength(2)
      expect(topQueries.every((q) => q.pass2Status === 'passed')).toBe(true)
    })

    it('returns empty array when no queries', () => {
      setMockQueryByName({
        [mockApi.agentSessions.get]: 'skip',
        [mockApi.generatedQueries.getBySession]: undefined,
        [mockApi.agentSessions.list]: [],
        [mockApi.agentSessions.getActive]: [],
      })

      const { result } = renderHook(() => useAgentSession())
      const topQueries = result.current.getTopQueriesForContext()

      expect(topQueries).toEqual([])
    })

    it('respects limit parameter', () => {
      setMockQueryByName({
        [mockApi.agentSessions.get]: 'skip',
        [mockApi.generatedQueries.getBySession]: Array.from({ length: 20 }, (_, i) => ({
          ...mockQueries[0],
          _id: `query-${i}` as any,
          compositeScore: 100 - i,
          pass2Status: 'passed' as const,
        })),
        [mockApi.agentSessions.list]: [],
        [mockApi.agentSessions.getActive]: [],
      })

      const { result } = renderHook(() => useAgentSession())
      const topQueries = result.current.getTopQueriesForContext(5)

      expect(topQueries).toHaveLength(5)
    })
  })

  describe('helper: getQueriesByStatus', () => {
    it('filters queries by pass1 status', () => {
      setMockQueryByName({
        [mockApi.agentSessions.get]: 'skip',
        [mockApi.generatedQueries.getBySession]: mockQueries,
        [mockApi.agentSessions.list]: [],
        [mockApi.agentSessions.getActive]: [],
      })

      const { result } = renderHook(() => useAgentSession())
      const pendingQueries = result.current.getQueriesByStatus('pending')

      expect(pendingQueries).toHaveLength(1)
      expect(pendingQueries[0].pass1Status).toBe('pending')
    })

    it('returns empty array when no matches', () => {
      setMockQueryByName({
        [mockApi.agentSessions.get]: 'skip',
        [mockApi.generatedQueries.getBySession]: mockQueries,
        [mockApi.agentSessions.list]: [],
        [mockApi.agentSessions.getActive]: [],
      })

      const { result } = renderHook(() => useAgentSession())
      const queries = result.current.getQueriesByStatus('pending')

      expect(queries).toHaveLength(1)
    })

    it('returns empty array when queries is undefined', () => {
      setMockQueryByName({
        [mockApi.agentSessions.get]: 'skip',
        [mockApi.generatedQueries.getBySession]: undefined,
        [mockApi.agentSessions.list]: [],
        [mockApi.agentSessions.getActive]: [],
      })

      const { result } = renderHook(() => useAgentSession())
      const queries = result.current.getQueriesByStatus('passed')

      expect(queries).toEqual([])
    })
  })

  describe('helper: getQueriesByPass2Status', () => {
    it('filters queries by pass2 status', () => {
      setMockQueryByName({
        [mockApi.agentSessions.get]: 'skip',
        [mockApi.generatedQueries.getBySession]: mockQueries,
        [mockApi.agentSessions.list]: [],
        [mockApi.agentSessions.getActive]: [],
      })

      const { result } = renderHook(() => useAgentSession())
      const passedQueries = result.current.getQueriesByPass2Status('passed')

      expect(passedQueries).toHaveLength(1)
      expect(passedQueries[0].pass2Status).toBe('passed')
    })

    it('returns empty array when queries is undefined', () => {
      setMockQueryByName({
        [mockApi.agentSessions.get]: 'skip',
        [mockApi.generatedQueries.getBySession]: undefined,
        [mockApi.agentSessions.list]: [],
        [mockApi.agentSessions.getActive]: [],
      })

      const { result } = renderHook(() => useAgentSession())
      const queries = result.current.getQueriesByPass2Status('passed')

      expect(queries).toEqual([])
    })
  })

  describe('helper: getCurrentRoundQueries', () => {
    it('filters queries by current round', () => {
      setMockQueryByName({
        [mockApi.agentSessions.get]: { ...mockSession, currentRound: 1 },
        [mockApi.generatedQueries.getBySession]: [
          ...mockQueries,
          { ...mockQueries[0], _id: 'query-4' as any, round: 2 },
        ],
        [mockApi.agentSessions.list]: [],
        [mockApi.agentSessions.getActive]: [],
      })

      const { result } = renderHook(() => useAgentSession())
      const currentRoundQueries = result.current.getCurrentRoundQueries()

      expect(currentRoundQueries).toHaveLength(3)
      expect(currentRoundQueries.every((q) => q.round === 1)).toBe(true)
    })

    it('returns empty array when no session', () => {
      setMockQueryByName({
        [mockApi.agentSessions.get]: undefined,
        [mockApi.generatedQueries.getBySession]: mockQueries,
        [mockApi.agentSessions.list]: [],
        [mockApi.agentSessions.getActive]: [],
      })

      const { result } = renderHook(() => useAgentSession())
      const queries = result.current.getCurrentRoundQueries()

      expect(queries).toEqual([])
    })

    it('returns empty array when no queries', () => {
      setMockQueryByName({
        [mockApi.agentSessions.get]: mockSession,
        [mockApi.generatedQueries.getBySession]: undefined,
        [mockApi.agentSessions.list]: [],
        [mockApi.agentSessions.getActive]: [],
      })

      const { result } = renderHook(() => useAgentSession())
      const queries = result.current.getCurrentRoundQueries()

      expect(queries).toEqual([])
    })
  })

  describe('helper: getSessionStats', () => {
    it('calculates statistics for all queries', () => {
      const testQueries = [
        { ...mockQueries[0], pass1Status: 'passed', pass2Status: 'passed', compositeScore: 75 },
        { ...mockQueries[1], pass1Status: 'pending', pass2Status: 'pending' },
        { ...mockQueries[2], pass1Status: 'failed', pass2Status: undefined },
      ]

      setMockQueryByName({
        [mockApi.agentSessions.get]: 'skip',
        [mockApi.generatedQueries.getBySession]: testQueries,
        [mockApi.agentSessions.list]: [],
        [mockApi.agentSessions.getActive]: [],
      })

      const { result } = renderHook(() => useAgentSession())
      const stats = result.current.getSessionStats()

      expect(stats.total).toBe(3)
      expect(stats.pass1Pending).toBe(1)
      expect(stats.pass1Passed).toBe(1)
      expect(stats.pass1Failed).toBe(1)
      expect(stats.pass2Pending).toBe(1)
      expect(stats.pass2Passed).toBe(1)
      expect(stats.pass2Failed).toBe(0)
      expect(stats.avgCompositeScore).toBe(75)
    })

    it('calculates average composite score correctly', () => {
      const testQueries = [
        { ...mockQueries[0], compositeScore: 80 },
        { ...mockQueries[1], compositeScore: 70 },
        { ...mockQueries[2], compositeScore: 90 },
      ]

      setMockQueryByName({
        [mockApi.agentSessions.get]: 'skip',
        [mockApi.generatedQueries.getBySession]: testQueries,
        [mockApi.agentSessions.list]: [],
        [mockApi.agentSessions.getActive]: [],
      })

      const { result } = renderHook(() => useAgentSession())
      const stats = result.current.getSessionStats()

      expect(stats.avgCompositeScore).toBe(80)
    })

    it('handles queries without composite scores', () => {
      const testQueries = [
        { ...mockQueries[0], compositeScore: 80 },
        { ...mockQueries[1], compositeScore: undefined },
        { ...mockQueries[2], compositeScore: undefined },
      ]

      setMockQueryByName({
        [mockApi.agentSessions.get]: 'skip',
        [mockApi.generatedQueries.getBySession]: testQueries,
        [mockApi.agentSessions.list]: [],
        [mockApi.agentSessions.getActive]: [],
      })

      const { result } = renderHook(() => useAgentSession())
      const stats = result.current.getSessionStats()

      expect(stats.avgCompositeScore).toBe(80)
    })

    it('returns zero stats when no queries', () => {
      setMockQueryByName({
        [mockApi.agentSessions.get]: 'skip',
        [mockApi.generatedQueries.getBySession]: undefined,
        [mockApi.agentSessions.list]: [],
        [mockApi.agentSessions.getActive]: [],
      })

      const { result } = renderHook(() => useAgentSession())
      const stats = result.current.getSessionStats()

      expect(stats).toEqual({
        total: 0,
        pass1Pending: 0,
        pass1Passed: 0,
        pass1Failed: 0,
        pass2Pending: 0,
        pass2Passed: 0,
        pass2Failed: 0,
        avgCompositeScore: 0,
      })
    })
  })
})
