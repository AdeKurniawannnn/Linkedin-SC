/**
 * API Mock Utilities for Testing
 *
 * Provides reusable mock factories for all search API functions.
 * Works with Vitest mocking system.
 */
import { vi } from 'vitest'
import type {
  SearchResponse,
  LinkedInProfile,
  PostsSearchResponse,
  JobsSearchResponse,
  AllSearchResponse,
  ScrapeDetailResponse,
  CompanyDetail
} from '@/lib/api'

// ============================================
// MOCK DATA FACTORIES
// ============================================

/**
 * Creates a mock LinkedIn profile with sensible defaults
 */
export const mockLinkedInProfile = (overrides?: Partial<LinkedInProfile>): LinkedInProfile => ({
  profile_url: 'https://linkedin.com/in/test-user',
  title: 'Software Engineer at Test Company',
  description: 'Experienced developer with expertise in TypeScript and React.',
  rank: 1,
  best_position: 1,
  avg_position: 1.5,
  frequency: 3,
  pages_seen: [1, 2, 3],
  industry: null,
  followers: null,
  company_size: null,
  founded_year: null,
  company_type: null,
  headquarters: null,
  location: null,
  ...overrides
})

/**
 * Creates a mock SearchResponse (profile search)
 */
export const mockSearchResponse = (overrides?: Partial<SearchResponse>): SearchResponse => ({
  query: 'site:linkedin.com/in software engineer jakarta',
  total_results: 1,
  profiles: [mockLinkedInProfile()],
  metadata: {
    country: 'id',
    language: 'en',
    pages_fetched: 5,
    search_engine: 'google',
    has_errors: false
  },
  ...overrides
})

/**
 * Creates a mock PostsSearchResponse
 */
export const mockPostsResponse = (overrides?: Partial<PostsSearchResponse>): PostsSearchResponse => ({
  success: true,
  query: 'site:linkedin.com/posts test keywords',
  total_results: 1,
  posts: [
    {
      post_url: 'https://linkedin.com/posts/test-user_test-post-123',
      author_name: 'Test Author',
      author_profile_url: 'https://linkedin.com/in/test-author',
      posted_date: '2024-01-15',
      content: 'This is a test post content for testing purposes. #test #linkedin',
      hashtags: ['#test', '#linkedin'],
      likes: 100,
      comments: 25,
      shares: 10,
      post_type: 'article',
      rank: 1
    }
  ],
  metadata: {
    keywords: 'test keywords',
    author_type: 'all',
    country: 'id',
    language: 'en',
    pages_fetched: 1,
    time_taken_seconds: 2.5
  },
  ...overrides
})

/**
 * Creates a mock JobsSearchResponse
 */
export const mockJobsResponse = (overrides?: Partial<JobsSearchResponse>): JobsSearchResponse => ({
  success: true,
  query: 'site:linkedin.com/jobs software engineer jakarta',
  total_results: 1,
  jobs: [
    {
      job_url: 'https://linkedin.com/jobs/view/123456789',
      job_title: 'Software Engineer',
      company_name: 'Test Company',
      location: 'Jakarta, Indonesia',
      description: 'We are looking for a skilled software engineer with experience in modern web technologies.',
      rank: 1
    }
  ],
  metadata: {
    job_title: 'software engineer',
    experience_level: 'mid',
    country: 'id',
    language: 'en',
    pages_fetched: 1,
    time_taken_seconds: 2.0
  },
  ...overrides
})

/**
 * Creates a mock AllSearchResponse (mixed content)
 */
export const mockAllResponse = (overrides?: Partial<AllSearchResponse>): AllSearchResponse => ({
  success: true,
  query: 'site:linkedin.com test keywords',
  total_results: 1,
  results: [
    {
      url: 'https://linkedin.com/in/test-user',
      title: 'Test User - Software Engineer',
      description: 'Experienced developer with expertise in TypeScript.',
      type: 'profile' as const,
      rank: 1
    }
  ],
  metadata: {
    keywords: 'test keywords',
    country: 'id',
    language: 'en',
    pages_fetched: 1,
    time_taken_seconds: 1.5
  },
  ...overrides
})

/**
 * Creates a mock CompanyDetail
 */
export const mockCompanyDetail = (overrides?: Partial<CompanyDetail>): CompanyDetail => ({
  url: 'https://linkedin.com/company/test-company',
  name: 'Test Company',
  tagline: 'Building the future of technology',
  industry: 'Technology',
  location: 'Jakarta, Indonesia',
  followers: '10,000+',
  employee_count_range: '51-200 employees',
  full_description: 'Test Company is a leading technology company...',
  specialties: ['Software Development', 'Cloud Computing', 'AI/ML'],
  about: 'We are building innovative solutions for modern businesses.',
  website: 'https://testcompany.com',
  phone: '+62 21 1234567',
  founded: 2020,
  employee_growth: '+15% in last year',
  top_employee_schools: ['University of Indonesia', 'ITB'],
  recent_hires: [
    { name: 'Jane Doe', position: 'Senior Engineer' }
  ],
  related_companies: [
    { name: 'Similar Tech Co', industry: 'Technology', followers: '5,000+' }
  ],
  alumni_working_here: [
    { name: 'John Smith', position: 'Tech Lead' }
  ],
  scraped_at: new Date().toISOString(),
  ...overrides
})

/**
 * Creates a mock ScrapeDetailResponse
 */
export const mockScrapeDetailResponse = (overrides?: Partial<ScrapeDetailResponse>): ScrapeDetailResponse => ({
  success: true,
  total_scraped: 1,
  companies: [mockCompanyDetail()],
  metadata: {
    total_urls: 1,
    successful: 1,
    failed: 0,
    time_taken_seconds: 3.5
  },
  ...overrides
})

// ============================================
// ERROR MOCKS
// ============================================

export interface ApiError extends Error {
  response?: {
    data: { detail: string }
    status: number
  }
}

/**
 * Creates a mock API error (simulates axios error structure)
 */
export const mockApiError = (message: string, status = 500): ApiError => {
  const error = new Error(message) as ApiError
  error.response = {
    data: { detail: message },
    status
  }
  return error
}

/**
 * Creates a network error (no response)
 */
export const mockNetworkError = (message = 'Network Error'): Error => {
  return new Error(message)
}

/**
 * Creates a timeout error
 */
export const mockTimeoutError = (): ApiError => {
  const error = new Error('timeout of 180000ms exceeded') as ApiError
  error.response = undefined
  return error
}

// ============================================
// MOCK SETUP HELPERS
// ============================================

export interface ApiMocks {
  searchLinkedIn: ReturnType<typeof vi.fn>
  searchLinkedInPosts: ReturnType<typeof vi.fn>
  searchLinkedInJobs: ReturnType<typeof vi.fn>
  searchLinkedInAll: ReturnType<typeof vi.fn>
  scrapeCompanyDetails: ReturnType<typeof vi.fn>
  testAPI: ReturnType<typeof vi.fn>
}

/**
 * Creates a set of mock functions for all API methods
 */
export const createApiMocks = (): ApiMocks => ({
  searchLinkedIn: vi.fn(),
  searchLinkedInPosts: vi.fn(),
  searchLinkedInJobs: vi.fn(),
  searchLinkedInAll: vi.fn(),
  scrapeCompanyDetails: vi.fn(),
  testAPI: vi.fn()
})

/**
 * Sets up all mocks to return successful responses
 */
export const setupSuccessMocks = (mocks: ApiMocks): void => {
  mocks.searchLinkedIn.mockResolvedValue(mockSearchResponse())
  mocks.searchLinkedInPosts.mockResolvedValue(mockPostsResponse())
  mocks.searchLinkedInJobs.mockResolvedValue(mockJobsResponse())
  mocks.searchLinkedInAll.mockResolvedValue(mockAllResponse())
  mocks.scrapeCompanyDetails.mockResolvedValue(mockScrapeDetailResponse())
  mocks.testAPI.mockResolvedValue({ status: 'healthy', message: 'API is running' })
}

/**
 * Sets up all mocks to reject with an error
 */
export const setupErrorMocks = (mocks: ApiMocks, message = 'API Error', status = 500): void => {
  const error = mockApiError(message, status)
  mocks.searchLinkedIn.mockRejectedValue(error)
  mocks.searchLinkedInPosts.mockRejectedValue(error)
  mocks.searchLinkedInJobs.mockRejectedValue(error)
  mocks.searchLinkedInAll.mockRejectedValue(error)
  mocks.scrapeCompanyDetails.mockRejectedValue(error)
  mocks.testAPI.mockRejectedValue(error)
}

/**
 * Resets all mock functions
 */
export const resetApiMocks = (mocks: ApiMocks): void => {
  Object.values(mocks).forEach(mock => mock.mockReset())
}

/**
 * Clears all mock function call history (keeps implementation)
 */
export const clearApiMocks = (mocks: ApiMocks): void => {
  Object.values(mocks).forEach(mock => mock.mockClear())
}

// ============================================
// MOCK MODULE FACTORY
// ============================================

/**
 * Creates a mock module replacement for @/lib/api
 * Usage with vi.mock():
 *
 * vi.mock('@/lib/api', () => createMockApiModule())
 */
export const createMockApiModule = () => {
  const mocks = createApiMocks()
  setupSuccessMocks(mocks)

  return {
    searchLinkedIn: mocks.searchLinkedIn,
    searchLinkedInPosts: mocks.searchLinkedInPosts,
    searchLinkedInJobs: mocks.searchLinkedInJobs,
    searchLinkedInAll: mocks.searchLinkedInAll,
    scrapeCompanyDetails: mocks.scrapeCompanyDetails,
    testAPI: mocks.testAPI,
    // Export mocks for test access
    __mocks: mocks
  }
}
