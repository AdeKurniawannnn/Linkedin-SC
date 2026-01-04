/**
 * Tests for Convex mock utilities
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  mockUseQuery,
  mockUseMutation,
  mockUseConvexAuth,
  mockApi,
  setupConvexMocks,
  resetConvexMocks,
  setMockQueryReturn,
  setMockQueryLoading,
  setMockMutationSuccess,
  setMockMutationError,
  setMockAuthAuthenticated,
  setMockAuthUnauthenticated,
  setMockAuthLoading,
  wasQueryCalledWith,
  setMockQuerySequence,
  setMockQueryByName,
  spyOnMutationCalls,
} from './convexMocks'

describe('Convex Mock Utilities', () => {
  beforeEach(() => {
    resetConvexMocks()
  })

  describe('mockUseQuery', () => {
    it('returns undefined by default', () => {
      const result = mockUseQuery('test:query', {})
      expect(result).toBeUndefined()
    })

    it('respects skip option', () => {
      const result = mockUseQuery('test:query', {}, { skip: true })
      expect(result).toBeUndefined()
    })

    it('can be configured with setMockQueryReturn', () => {
      const testData = [{ id: '1', name: 'Test' }]
      setMockQueryReturn(testData)

      const result = mockUseQuery('test:query', {})
      expect(result).toBe(testData)
    })

    it('can be set to loading state', () => {
      setMockQueryLoading()
      const result = mockUseQuery('test:query', {})
      expect(result).toBeUndefined()
    })
  })

  describe('mockUseMutation', () => {
    it('returns a function by default', () => {
      const mutationFn = mockUseMutation()
      expect(typeof mutationFn).toBe('function')
    })

    it('can be configured to succeed', async () => {
      const testResult = { _id: 'new-id' }
      const mutationFn = setMockMutationSuccess(testResult)

      const result = await mutationFn({ data: 'test' })
      expect(result).toBe(testResult)
      expect(mutationFn).toHaveBeenCalledWith({ data: 'test' })
    })

    it('can be configured to fail', async () => {
      const testError = new Error('Test error')
      const mutationFn = setMockMutationError(testError)

      await expect(mutationFn({ data: 'test' })).rejects.toThrow('Test error')
    })
  })

  describe('mockUseConvexAuth', () => {
    it('returns unauthenticated state by default', () => {
      const auth = mockUseConvexAuth()
      expect(auth).toMatchObject({
        isLoading: false,
        isAuthenticated: false,
      })
    })

    it('can be set to authenticated', () => {
      setMockAuthAuthenticated('user-123')
      const auth = mockUseConvexAuth()

      expect(auth).toMatchObject({
        isLoading: false,
        isAuthenticated: true,
        userId: 'user-123',
      })
    })

    it('can be set to unauthenticated', () => {
      setMockAuthUnauthenticated()
      const auth = mockUseConvexAuth()

      expect(auth.isAuthenticated).toBe(false)
    })

    it('can be set to loading', () => {
      setMockAuthLoading()
      const auth = mockUseConvexAuth()

      expect(auth.isLoading).toBe(true)
    })
  })

  describe('mockApi', () => {
    it('has searchHistory endpoints', () => {
      expect(mockApi.searchHistory).toHaveProperty('list')
      expect(mockApi.searchHistory).toHaveProperty('add')
      expect(mockApi.searchHistory).toHaveProperty('remove')
      expect(mockApi.searchHistory).toHaveProperty('clearAll')
    })

    it('has savedSearches endpoints', () => {
      expect(mockApi.savedSearches).toHaveProperty('list')
      expect(mockApi.savedSearches).toHaveProperty('add')
      expect(mockApi.savedSearches).toHaveProperty('update')
      expect(mockApi.savedSearches).toHaveProperty('remove')
    })

    it('has customPresets endpoints', () => {
      expect(mockApi.customPresets).toHaveProperty('list')
      expect(mockApi.customPresets).toHaveProperty('add')
      expect(mockApi.customPresets).toHaveProperty('update')
      expect(mockApi.customPresets).toHaveProperty('remove')
    })

    it('has agentSessions endpoints', () => {
      expect(mockApi.agentSessions).toHaveProperty('get')
      expect(mockApi.agentSessions).toHaveProperty('list')
      expect(mockApi.agentSessions).toHaveProperty('create')
      expect(mockApi.agentSessions).toHaveProperty('update')
    })

    it('has generatedQueries endpoints', () => {
      expect(mockApi.generatedQueries).toHaveProperty('getBySession')
      expect(mockApi.generatedQueries).toHaveProperty('addBatch')
      expect(mockApi.generatedQueries).toHaveProperty('updatePass1')
      expect(mockApi.generatedQueries).toHaveProperty('updatePass2')
    })
  })

  describe('Helper Functions', () => {
    describe('wasQueryCalledWith', () => {
      it('detects when query was called', () => {
        mockUseQuery('test:query', { id: 1 })

        expect(wasQueryCalledWith('test:query', { id: 1 })).toBe(true)
        expect(wasQueryCalledWith('other:query', { id: 1 })).toBe(false)
      })

      it('works without args', () => {
        mockUseQuery('test:query')

        expect(wasQueryCalledWith('test:query')).toBe(true)
      })
    })

    describe('setMockQuerySequence', () => {
      it('returns values in sequence', () => {
        const sequence = [undefined, [], [{ id: '1' }]]
        setMockQuerySequence(sequence)

        expect(mockUseQuery('test')).toBeUndefined()
        expect(mockUseQuery('test')).toEqual([])
        expect(mockUseQuery('test')).toEqual([{ id: '1' }])
        // Last value repeats
        expect(mockUseQuery('test')).toEqual([{ id: '1' }])
      })
    })

    describe('setMockQueryByName', () => {
      it('returns different values based on query name', () => {
        setMockQueryByName({
          'searchHistory:list': [{ id: '1' }],
          'savedSearches:list': [{ id: '2' }],
        })

        expect(mockUseQuery('searchHistory:list')).toEqual([{ id: '1' }])
        expect(mockUseQuery('savedSearches:list')).toEqual([{ id: '2' }])
        expect(mockUseQuery('unknown:query')).toBeUndefined()
      })
    })

    describe('spyOnMutationCalls', () => {
      it('captures mutation arguments', async () => {
        const spy = spyOnMutationCalls()
        const mutationFn = mockUseMutation()

        await mutationFn({ data: 'test' })

        expect(spy).toHaveBeenCalledWith({ data: 'test' })
      })
    })
  })

  describe('resetConvexMocks', () => {
    it('clears all mock call history', () => {
      mockUseQuery('test:query', {})
      mockUseMutation()
      mockUseConvexAuth()

      expect(mockUseQuery).toHaveBeenCalled()
      expect(mockUseMutation).toHaveBeenCalled()
      expect(mockUseConvexAuth).toHaveBeenCalled()

      resetConvexMocks()

      expect(mockUseQuery).not.toHaveBeenCalled()
      expect(mockUseMutation).not.toHaveBeenCalled()
      expect(mockUseConvexAuth).not.toHaveBeenCalled()
    })
  })
})
