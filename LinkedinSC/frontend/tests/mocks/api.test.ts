/**
 * Tests for API mock utilities
 */
import { describe, it, expect, beforeEach } from 'vitest'
import {
  mockSearchResponse,
  mockPostsResponse,
  mockJobsResponse,
  mockAllResponse,
  mockScrapeDetailResponse,
  mockLinkedInProfile,
  mockCompanyDetail,
  mockApiError,
  mockNetworkError,
  mockTimeoutError,
  createApiMocks,
  setupSuccessMocks,
  setupErrorMocks,
  resetApiMocks,
  clearApiMocks,
  createMockApiModule
} from './api'

describe('API Mock Utilities', () => {
  describe('Response Factories', () => {
    it('creates valid SearchResponse with defaults', () => {
      const response = mockSearchResponse()
      
      expect(response.profiles).toHaveLength(1)
      expect(response.profiles[0].profile_url).toBe('https://linkedin.com/in/test-user')
      expect(response.metadata.search_engine).toBe('google')
      expect(response.metadata.has_errors).toBe(false)
    })

    it('creates SearchResponse with overrides', () => {
      const response = mockSearchResponse({
        query: 'custom query',
        total_results: 10,
        metadata: {
          country: 'sg',
          language: 'id',
          pages_fetched: 3,
          search_engine: 'bing',
          has_errors: true
        }
      })
      
      expect(response.query).toBe('custom query')
      expect(response.total_results).toBe(10)
      expect(response.metadata.country).toBe('sg')
      expect(response.metadata.has_errors).toBe(true)
    })

    it('creates valid PostsSearchResponse', () => {
      const response = mockPostsResponse()
      
      expect(response.success).toBe(true)
      expect(response.posts).toHaveLength(1)
      expect(response.posts[0].author_name).toBe('Test Author')
      expect(response.posts[0].likes).toBe(100)
    })

    it('creates valid JobsSearchResponse', () => {
      const response = mockJobsResponse()
      
      expect(response.success).toBe(true)
      expect(response.jobs).toHaveLength(1)
      expect(response.jobs[0].job_title).toBe('Software Engineer')
      expect(response.jobs[0].company_name).toBe('Test Company')
    })

    it('creates valid AllSearchResponse', () => {
      const response = mockAllResponse()
      
      expect(response.success).toBe(true)
      expect(response.results).toHaveLength(1)
      expect(response.results[0].type).toBe('profile')
    })

    it('creates valid ScrapeDetailResponse', () => {
      const response = mockScrapeDetailResponse()
      
      expect(response.success).toBe(true)
      expect(response.companies).toHaveLength(1)
      expect(response.companies[0].name).toBe('Test Company')
      expect(response.metadata.failed).toBe(0)
    })
  })

  describe('Error Factories', () => {
    it('creates API error with status', () => {
      const error = mockApiError('Not Found', 404)
      
      expect(error.message).toBe('Not Found')
      expect(error.response?.status).toBe(404)
      expect(error.response?.data.detail).toBe('Not Found')
    })

    it('creates network error', () => {
      const error = mockNetworkError()
      
      expect(error.message).toBe('Network Error')
    })

    it('creates timeout error', () => {
      const error = mockTimeoutError()
      
      expect(error.message).toContain('timeout')
      expect(error.response).toBeUndefined()
    })
  })

  describe('Mock Setup Helpers', () => {
    let mocks: ReturnType<typeof createApiMocks>

    beforeEach(() => {
      mocks = createApiMocks()
    })

    it('creates all API mock functions', () => {
      expect(mocks.searchLinkedIn).toBeDefined()
      expect(mocks.searchLinkedInPosts).toBeDefined()
      expect(mocks.searchLinkedInJobs).toBeDefined()
      expect(mocks.searchLinkedInAll).toBeDefined()
      expect(mocks.scrapeCompanyDetails).toBeDefined()
      expect(mocks.testAPI).toBeDefined()
    })

    it('setupSuccessMocks configures resolved values', async () => {
      setupSuccessMocks(mocks)
      
      const searchResult = await mocks.searchLinkedIn()
      expect(searchResult.profiles).toHaveLength(1)

      const postsResult = await mocks.searchLinkedInPosts()
      expect(postsResult.posts).toHaveLength(1)

      const jobsResult = await mocks.searchLinkedInJobs()
      expect(jobsResult.jobs).toHaveLength(1)

      const allResult = await mocks.searchLinkedInAll()
      expect(allResult.results).toHaveLength(1)
    })

    it('setupErrorMocks configures rejected values', async () => {
      setupErrorMocks(mocks, 'Test Error', 503)
      
      await expect(mocks.searchLinkedIn()).rejects.toThrow('Test Error')
      await expect(mocks.searchLinkedInPosts()).rejects.toThrow('Test Error')
      await expect(mocks.searchLinkedInJobs()).rejects.toThrow('Test Error')
      await expect(mocks.searchLinkedInAll()).rejects.toThrow('Test Error')
    })

    it('resetApiMocks clears mock state', async () => {
      setupSuccessMocks(mocks)
      await mocks.searchLinkedIn()
      
      expect(mocks.searchLinkedIn).toHaveBeenCalledTimes(1)
      
      resetApiMocks(mocks)
      
      expect(mocks.searchLinkedIn).toHaveBeenCalledTimes(0)
    })

    it('clearApiMocks clears history but keeps implementation', async () => {
      setupSuccessMocks(mocks)
      await mocks.searchLinkedIn()
      
      clearApiMocks(mocks)
      
      expect(mocks.searchLinkedIn).toHaveBeenCalledTimes(0)
      // Implementation still works
      const result = await mocks.searchLinkedIn()
      expect(result.profiles).toHaveLength(1)
    })
  })

  describe('createMockApiModule', () => {
    it('creates module with all mocked functions', () => {
      const mockModule = createMockApiModule()
      
      expect(mockModule.searchLinkedIn).toBeDefined()
      expect(mockModule.searchLinkedInPosts).toBeDefined()
      expect(mockModule.searchLinkedInJobs).toBeDefined()
      expect(mockModule.searchLinkedInAll).toBeDefined()
      expect(mockModule.scrapeCompanyDetails).toBeDefined()
      expect(mockModule.__mocks).toBeDefined()
    })

    it('has working success mocks by default', async () => {
      const mockModule = createMockApiModule()
      
      const result = await mockModule.searchLinkedIn()
      expect(result.profiles).toHaveLength(1)
    })
  })
})
