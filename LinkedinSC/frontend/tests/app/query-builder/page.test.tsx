import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import QueryBuilderPage from '@/app/query-builder/page'
import * as api from '@/lib/api'
import { useQueryBuilderStore } from '@/stores/queryBuilderStore'

// Mock the API module
vi.mock('@/lib/api', () => ({
  searchLinkedIn: vi.fn(),
  searchLinkedInPosts: vi.fn(),
  searchLinkedInJobs: vi.fn(),
  searchLinkedInAll: vi.fn(),
}))

// Mock the Zustand store
vi.mock('@/stores/queryBuilderStore', () => ({
  useQueryBuilderStore: vi.fn(),
}))

// Mock child components to simplify testing
vi.mock('@/components/SearchForm', () => ({
  SearchForm: ({ onSearch, isLoading }: any) => (
    <div data-testid="search-form">
      <button
        data-testid="search-form-submit"
        onClick={() => onSearch({
          role: 'Software Engineer',
          location: 'Jakarta',
          country: 'id',
          language: 'id',
          max_pages: 5,
        })}
        disabled={isLoading}
      >
        {isLoading ? 'Searching...' : 'Search Profiles'}
      </button>
    </div>
  ),
}))

vi.mock('@/components/CompanySearchForm', () => ({
  CompanySearchForm: ({ onSearch, isLoading }: any) => (
    <div data-testid="company-search-form">
      <button
        data-testid="company-search-submit"
        onClick={() => onSearch({
          role: 'Fintech linkedin.com/company',
          location: 'Jakarta',
          country: 'id',
          language: 'id',
          max_pages: 2,
        })}
        disabled={isLoading}
      >
        {isLoading ? 'Searching...' : 'Search Companies'}
      </button>
    </div>
  ),
}))

vi.mock('@/components/PostsSearchForm', () => ({
  PostsSearchForm: ({ onSearch, isLoading }: any) => (
    <div data-testid="posts-search-form">
      <button
        data-testid="posts-search-submit"
        onClick={() => onSearch({
          keywords: 'artificial intelligence',
          author_type: 'all',
          max_results: 20,
          location: 'Jakarta',
          language: 'id',
          country: 'id',
        })}
        disabled={isLoading}
      >
        {isLoading ? 'Searching...' : 'Search Posts'}
      </button>
    </div>
  ),
}))

vi.mock('@/components/JobsSearchForm', () => ({
  JobsSearchForm: ({ onSearch, isLoading }: any) => (
    <div data-testid="jobs-search-form">
      <button
        data-testid="jobs-search-submit"
        onClick={() => onSearch({
          job_title: 'Data Analyst',
          location: 'Jakarta',
          experience_level: 'mid-senior',
          max_results: 20,
          language: 'id',
          country: 'id',
        })}
        disabled={isLoading}
      >
        {isLoading ? 'Searching...' : 'Search Jobs'}
      </button>
    </div>
  ),
}))

vi.mock('@/components/AllSearchForm', () => ({
  AllSearchForm: ({ onSearch, isLoading }: any) => (
    <div data-testid="all-search-form">
      <button
        data-testid="all-search-submit"
        onClick={() => onSearch({
          keywords: 'startup indonesia',
          location: 'Jakarta',
          max_results: 20,
          language: 'id',
          country: 'id',
        })}
        disabled={isLoading}
      >
        {isLoading ? 'Searching...' : 'Search All'}
      </button>
    </div>
  ),
}))

vi.mock('@/components/ResultsTable', () => ({
  ResultsTable: ({ profiles, metadata, dataType }: any) => (
    <div data-testid="results-table">
      <span data-testid="results-count">{profiles.length}</span>
      <span data-testid="data-type">{dataType}</span>
    </div>
  ),
}))

vi.mock('@/components/PostsTable', () => ({
  PostsTable: ({ posts, metadata }: any) => (
    <div data-testid="posts-table">
      <span data-testid="posts-count">{posts.length}</span>
    </div>
  ),
}))

vi.mock('@/components/JobsTable', () => ({
  JobsTable: ({ jobs, metadata }: any) => (
    <div data-testid="jobs-table">
      <span data-testid="jobs-count">{jobs.length}</span>
    </div>
  ),
}))

vi.mock('@/components/AllResultsTable', () => ({
  AllResultsTable: ({ results, metadata }: any) => (
    <div data-testid="all-results-table">
      <span data-testid="all-results-count">{results.length}</span>
    </div>
  ),
}))

vi.mock('@/components/ProgressBar', () => ({
  ProgressBar: ({ isLoading }: any) => (
    isLoading ? <div data-testid="progress-bar">Loading...</div> : null
  ),
}))

vi.mock('@/components/query-builder/SiteFilter', () => ({
  SiteFilter: () => <div data-testid="site-filter">Site Filter</div>,
}))

// Mock UI components
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h3>{children}</h3>,
  CardContent: ({ children, className }: any) => <div className={className}>{children}</div>,
}))

describe('QueryBuilderPage', () => {
  const user = userEvent.setup()
  const mockUseQueryBuilderStore = useQueryBuilderStore as unknown as ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    // Default to 'profile' siteFilter
    mockUseQueryBuilderStore.mockImplementation((selector: any) => {
      const state = { siteFilter: 'profile' }
      return selector(state)
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Conditional Rendering', () => {
    it('renders SearchForm when siteFilter is profile', () => {
      mockUseQueryBuilderStore.mockImplementation((selector: any) => {
        const state = { siteFilter: 'profile' }
        return selector(state)
      })

      render(<QueryBuilderPage />)

      expect(screen.getByTestId('search-form')).toBeInTheDocument()
      expect(screen.queryByTestId('company-search-form')).not.toBeInTheDocument()
      expect(screen.queryByTestId('posts-search-form')).not.toBeInTheDocument()
      expect(screen.queryByTestId('jobs-search-form')).not.toBeInTheDocument()
      expect(screen.queryByTestId('all-search-form')).not.toBeInTheDocument()
    })

    it('renders CompanySearchForm when siteFilter is company', () => {
      mockUseQueryBuilderStore.mockImplementation((selector: any) => {
        const state = { siteFilter: 'company' }
        return selector(state)
      })

      render(<QueryBuilderPage />)

      expect(screen.getByTestId('company-search-form')).toBeInTheDocument()
      expect(screen.queryByTestId('search-form')).not.toBeInTheDocument()
      expect(screen.queryByTestId('posts-search-form')).not.toBeInTheDocument()
      expect(screen.queryByTestId('jobs-search-form')).not.toBeInTheDocument()
      expect(screen.queryByTestId('all-search-form')).not.toBeInTheDocument()
    })

    it('renders PostsSearchForm when siteFilter is posts', () => {
      mockUseQueryBuilderStore.mockImplementation((selector: any) => {
        const state = { siteFilter: 'posts' }
        return selector(state)
      })

      render(<QueryBuilderPage />)

      expect(screen.getByTestId('posts-search-form')).toBeInTheDocument()
      expect(screen.queryByTestId('search-form')).not.toBeInTheDocument()
      expect(screen.queryByTestId('company-search-form')).not.toBeInTheDocument()
      expect(screen.queryByTestId('jobs-search-form')).not.toBeInTheDocument()
      expect(screen.queryByTestId('all-search-form')).not.toBeInTheDocument()
    })

    it('renders JobsSearchForm when siteFilter is jobs', () => {
      mockUseQueryBuilderStore.mockImplementation((selector: any) => {
        const state = { siteFilter: 'jobs' }
        return selector(state)
      })

      render(<QueryBuilderPage />)

      expect(screen.getByTestId('jobs-search-form')).toBeInTheDocument()
      expect(screen.queryByTestId('search-form')).not.toBeInTheDocument()
      expect(screen.queryByTestId('company-search-form')).not.toBeInTheDocument()
      expect(screen.queryByTestId('posts-search-form')).not.toBeInTheDocument()
      expect(screen.queryByTestId('all-search-form')).not.toBeInTheDocument()
    })

    it('renders AllSearchForm when siteFilter is all', () => {
      mockUseQueryBuilderStore.mockImplementation((selector: any) => {
        const state = { siteFilter: 'all' }
        return selector(state)
      })

      render(<QueryBuilderPage />)

      expect(screen.getByTestId('all-search-form')).toBeInTheDocument()
      expect(screen.queryByTestId('search-form')).not.toBeInTheDocument()
      expect(screen.queryByTestId('company-search-form')).not.toBeInTheDocument()
      expect(screen.queryByTestId('posts-search-form')).not.toBeInTheDocument()
      expect(screen.queryByTestId('jobs-search-form')).not.toBeInTheDocument()
    })
  })

  describe('handleSearch (Profile/Company)', () => {
    const mockSearchResponse = {
      query: 'Software Engineer Jakarta',
      total_results: 50,
      profiles: [
        {
          profile_url: 'https://linkedin.com/in/john-doe',
          title: 'John Doe - Software Engineer',
          description: 'Experienced developer',
          rank: 1,
          best_position: 1,
          avg_position: 1,
          frequency: 1,
          pages_seen: [1],
          industry: null,
          followers: null,
          company_size: null,
          founded_year: null,
          company_type: null,
          headquarters: null,
          location: 'Jakarta',
        },
      ],
      metadata: {
        country: 'id',
        language: 'id',
        pages_fetched: 5,
        search_engine: 'google',
        has_errors: false,
      },
    }

    it('calls searchLinkedIn API with correct params', async () => {
      mockUseQueryBuilderStore.mockImplementation((selector: any) => {
        const state = { siteFilter: 'profile' }
        return selector(state)
      })

      const searchLinkedInMock = vi.mocked(api.searchLinkedIn)
      searchLinkedInMock.mockResolvedValueOnce(mockSearchResponse)

      render(<QueryBuilderPage />)

      const submitButton = screen.getByTestId('search-form-submit')
      await user.click(submitButton)

      expect(searchLinkedInMock).toHaveBeenCalledTimes(1)
      expect(searchLinkedInMock).toHaveBeenCalledWith({
        role: 'Software Engineer',
        location: 'Jakarta',
        country: 'id',
        language: 'id',
        max_pages: 5,
      })
    })

    it('updates results state on success', async () => {
      mockUseQueryBuilderStore.mockImplementation((selector: any) => {
        const state = { siteFilter: 'profile' }
        return selector(state)
      })

      const searchLinkedInMock = vi.mocked(api.searchLinkedIn)
      searchLinkedInMock.mockResolvedValueOnce(mockSearchResponse)

      render(<QueryBuilderPage />)

      const submitButton = screen.getByTestId('search-form-submit')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByTestId('results-table')).toBeInTheDocument()
        expect(screen.getByTestId('results-count')).toHaveTextContent('1')
      })
    })

    it('sets error state on API failure', async () => {
      mockUseQueryBuilderStore.mockImplementation((selector: any) => {
        const state = { siteFilter: 'profile' }
        return selector(state)
      })

      const searchLinkedInMock = vi.mocked(api.searchLinkedIn)
      searchLinkedInMock.mockRejectedValueOnce({
        response: { data: { detail: 'API rate limit exceeded' } },
      })

      render(<QueryBuilderPage />)

      const submitButton = screen.getByTestId('search-form-submit')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/API rate limit exceeded/i)).toBeInTheDocument()
      })
    })

    it('displays generic error when no API detail available', async () => {
      mockUseQueryBuilderStore.mockImplementation((selector: any) => {
        const state = { siteFilter: 'profile' }
        return selector(state)
      })

      const searchLinkedInMock = vi.mocked(api.searchLinkedIn)
      searchLinkedInMock.mockRejectedValueOnce(new Error('Network error'))

      render(<QueryBuilderPage />)

      const submitButton = screen.getByTestId('search-form-submit')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/Failed to search. Please try again./i)).toBeInTheDocument()
      })
    })

    it('toggles isLoading during request', async () => {
      mockUseQueryBuilderStore.mockImplementation((selector: any) => {
        const state = { siteFilter: 'profile' }
        return selector(state)
      })

      let resolvePromise: (value: any) => void
      const searchLinkedInMock = vi.mocked(api.searchLinkedIn)
      searchLinkedInMock.mockReturnValueOnce(
        new Promise((resolve) => {
          resolvePromise = resolve
        })
      )

      render(<QueryBuilderPage />)

      const submitButton = screen.getByTestId('search-form-submit')
      await user.click(submitButton)

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByTestId('progress-bar')).toBeInTheDocument()
      })

      // Resolve the promise
      resolvePromise!(mockSearchResponse)

      // Should hide loading state
      await waitFor(() => {
        expect(screen.queryByTestId('progress-bar')).not.toBeInTheDocument()
      })
    })

    it('clears previous results before new search', async () => {
      mockUseQueryBuilderStore.mockImplementation((selector: any) => {
        const state = { siteFilter: 'profile' }
        return selector(state)
      })

      const searchLinkedInMock = vi.mocked(api.searchLinkedIn)
      searchLinkedInMock.mockResolvedValueOnce(mockSearchResponse)

      render(<QueryBuilderPage />)

      // First search
      const submitButton = screen.getByTestId('search-form-submit')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByTestId('results-table')).toBeInTheDocument()
      })

      // Second search - should clear results first
      let resolveSecond: (value: any) => void
      searchLinkedInMock.mockReturnValueOnce(
        new Promise((resolve) => {
          resolveSecond = resolve
        })
      )

      await user.click(submitButton)

      // Results should be cleared during loading
      await waitFor(() => {
        expect(screen.queryByTestId('results-table')).not.toBeInTheDocument()
      })

      // Resolve second search
      resolveSecond!({
        ...mockSearchResponse,
        profiles: [...mockSearchResponse.profiles, ...mockSearchResponse.profiles],
      })

      await waitFor(() => {
        expect(screen.getByTestId('results-table')).toBeInTheDocument()
        expect(screen.getByTestId('results-count')).toHaveTextContent('2')
      })
    })
  })

  describe('handlePostsSearch', () => {
    const mockPostsResponse = {
      success: true,
      query: 'artificial intelligence',
      total_results: 25,
      posts: [
        {
          post_url: 'https://linkedin.com/posts/123',
          author_name: 'Jane Doe',
          author_profile_url: 'https://linkedin.com/in/jane-doe',
          posted_date: '2024-01-15',
          content: 'AI is transforming the industry',
          hashtags: ['#AI', '#ML'],
          likes: 150,
          comments: 20,
          shares: 5,
          post_type: 'article',
          rank: 1,
        },
      ],
      metadata: {
        keywords: 'artificial intelligence',
        author_type: 'all',
        country: 'id',
        language: 'id',
        pages_fetched: 3,
        time_taken_seconds: 5.2,
      },
    }

    it('calls searchLinkedInPosts API with correct params', async () => {
      mockUseQueryBuilderStore.mockImplementation((selector: any) => {
        const state = { siteFilter: 'posts' }
        return selector(state)
      })

      const searchPostsMock = vi.mocked(api.searchLinkedInPosts)
      searchPostsMock.mockResolvedValueOnce(mockPostsResponse)

      render(<QueryBuilderPage />)

      const submitButton = screen.getByTestId('posts-search-submit')
      await user.click(submitButton)

      expect(searchPostsMock).toHaveBeenCalledTimes(1)
      expect(searchPostsMock).toHaveBeenCalledWith({
        keywords: 'artificial intelligence',
        author_type: 'all',
        max_results: 20,
        location: 'Jakarta',
        language: 'id',
        country: 'id',
      })
    })

    it('updates postsResults and postsMetadata on success', async () => {
      mockUseQueryBuilderStore.mockImplementation((selector: any) => {
        const state = { siteFilter: 'posts' }
        return selector(state)
      })

      const searchPostsMock = vi.mocked(api.searchLinkedInPosts)
      searchPostsMock.mockResolvedValueOnce(mockPostsResponse)

      render(<QueryBuilderPage />)

      const submitButton = screen.getByTestId('posts-search-submit')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByTestId('posts-table')).toBeInTheDocument()
        expect(screen.getByTestId('posts-count')).toHaveTextContent('1')
      })
    })

    it('sets error state on API failure', async () => {
      mockUseQueryBuilderStore.mockImplementation((selector: any) => {
        const state = { siteFilter: 'posts' }
        return selector(state)
      })

      const searchPostsMock = vi.mocked(api.searchLinkedInPosts)
      searchPostsMock.mockRejectedValueOnce({
        response: { data: { detail: 'Posts search failed' } },
      })

      render(<QueryBuilderPage />)

      const submitButton = screen.getByTestId('posts-search-submit')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/Posts search failed/i)).toBeInTheDocument()
      })
    })
  })

  describe('handleJobsSearch', () => {
    const mockJobsResponse = {
      success: true,
      query: 'Data Analyst Jakarta',
      total_results: 30,
      jobs: [
        {
          job_url: 'https://linkedin.com/jobs/123',
          job_title: 'Senior Data Analyst',
          company_name: 'Tech Corp',
          location: 'Jakarta, Indonesia',
          description: 'Looking for experienced data analyst',
          rank: 1,
        },
      ],
      metadata: {
        job_title: 'Data Analyst',
        experience_level: 'mid-senior',
        country: 'id',
        language: 'id',
        pages_fetched: 2,
        time_taken_seconds: 3.5,
      },
    }

    it('calls searchLinkedInJobs API with correct params', async () => {
      mockUseQueryBuilderStore.mockImplementation((selector: any) => {
        const state = { siteFilter: 'jobs' }
        return selector(state)
      })

      const searchJobsMock = vi.mocked(api.searchLinkedInJobs)
      searchJobsMock.mockResolvedValueOnce(mockJobsResponse)

      render(<QueryBuilderPage />)

      const submitButton = screen.getByTestId('jobs-search-submit')
      await user.click(submitButton)

      expect(searchJobsMock).toHaveBeenCalledTimes(1)
      expect(searchJobsMock).toHaveBeenCalledWith({
        job_title: 'Data Analyst',
        location: 'Jakarta',
        experience_level: 'mid-senior',
        max_results: 20,
        language: 'id',
        country: 'id',
      })
    })

    it('updates jobsResults and jobsMetadata on success', async () => {
      mockUseQueryBuilderStore.mockImplementation((selector: any) => {
        const state = { siteFilter: 'jobs' }
        return selector(state)
      })

      const searchJobsMock = vi.mocked(api.searchLinkedInJobs)
      searchJobsMock.mockResolvedValueOnce(mockJobsResponse)

      render(<QueryBuilderPage />)

      const submitButton = screen.getByTestId('jobs-search-submit')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByTestId('jobs-table')).toBeInTheDocument()
        expect(screen.getByTestId('jobs-count')).toHaveTextContent('1')
      })
    })

    it('sets error state on API failure', async () => {
      mockUseQueryBuilderStore.mockImplementation((selector: any) => {
        const state = { siteFilter: 'jobs' }
        return selector(state)
      })

      const searchJobsMock = vi.mocked(api.searchLinkedInJobs)
      searchJobsMock.mockRejectedValueOnce({
        response: { data: { detail: 'Jobs search unavailable' } },
      })

      render(<QueryBuilderPage />)

      const submitButton = screen.getByTestId('jobs-search-submit')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/Jobs search unavailable/i)).toBeInTheDocument()
      })
    })
  })

  describe('handleAllSearch', () => {
    const mockAllResponse = {
      success: true,
      query: 'startup indonesia',
      total_results: 40,
      results: [
        {
          url: 'https://linkedin.com/in/founder',
          title: 'Startup Founder',
          description: 'Building the next unicorn',
          type: 'profile' as const,
          rank: 1,
        },
        {
          url: 'https://linkedin.com/company/startup-id',
          title: 'Startup Indonesia',
          description: 'Tech company in Jakarta',
          type: 'company' as const,
          rank: 2,
        },
      ],
      metadata: {
        keywords: 'startup indonesia',
        country: 'id',
        language: 'id',
        pages_fetched: 4,
        time_taken_seconds: 6.1,
      },
    }

    it('calls searchLinkedInAll API with correct params', async () => {
      mockUseQueryBuilderStore.mockImplementation((selector: any) => {
        const state = { siteFilter: 'all' }
        return selector(state)
      })

      const searchAllMock = vi.mocked(api.searchLinkedInAll)
      searchAllMock.mockResolvedValueOnce(mockAllResponse)

      render(<QueryBuilderPage />)

      const submitButton = screen.getByTestId('all-search-submit')
      await user.click(submitButton)

      expect(searchAllMock).toHaveBeenCalledTimes(1)
      expect(searchAllMock).toHaveBeenCalledWith({
        keywords: 'startup indonesia',
        location: 'Jakarta',
        max_results: 20,
        language: 'id',
        country: 'id',
      })
    })

    it('updates allResults and allMetadata on success', async () => {
      mockUseQueryBuilderStore.mockImplementation((selector: any) => {
        const state = { siteFilter: 'all' }
        return selector(state)
      })

      const searchAllMock = vi.mocked(api.searchLinkedInAll)
      searchAllMock.mockResolvedValueOnce(mockAllResponse)

      render(<QueryBuilderPage />)

      const submitButton = screen.getByTestId('all-search-submit')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByTestId('all-results-table')).toBeInTheDocument()
        expect(screen.getByTestId('all-results-count')).toHaveTextContent('2')
      })
    })

    it('sets error state on API failure', async () => {
      mockUseQueryBuilderStore.mockImplementation((selector: any) => {
        const state = { siteFilter: 'all' }
        return selector(state)
      })

      const searchAllMock = vi.mocked(api.searchLinkedInAll)
      searchAllMock.mockRejectedValueOnce({
        response: { data: { detail: 'Search service temporarily down' } },
      })

      render(<QueryBuilderPage />)

      const submitButton = screen.getByTestId('all-search-submit')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/Search service temporarily down/i)).toBeInTheDocument()
      })
    })
  })

  describe('Error Display', () => {
    it('displays error message in red card when error state is set', async () => {
      mockUseQueryBuilderStore.mockImplementation((selector: any) => {
        const state = { siteFilter: 'profile' }
        return selector(state)
      })

      const searchLinkedInMock = vi.mocked(api.searchLinkedIn)
      searchLinkedInMock.mockRejectedValueOnce({
        response: { data: { detail: 'Rate limit exceeded' } },
      })

      render(<QueryBuilderPage />)

      const submitButton = screen.getByTestId('search-form-submit')
      await user.click(submitButton)

      await waitFor(() => {
        const errorText = screen.getByText(/Rate limit exceeded/i)
        expect(errorText).toBeInTheDocument()
        // Find the error card container with red styling
        const errorCard = errorText.closest('.bg-red-50')
        expect(errorCard).toBeInTheDocument()
        expect(errorCard).toHaveClass('border-red-200', 'text-red-800')
      })
    })

    it('shows API error detail when available', async () => {
      mockUseQueryBuilderStore.mockImplementation((selector: any) => {
        const state = { siteFilter: 'profile' }
        return selector(state)
      })

      const searchLinkedInMock = vi.mocked(api.searchLinkedIn)
      searchLinkedInMock.mockRejectedValueOnce({
        response: { data: { detail: 'Invalid API key provided' } },
      })

      render(<QueryBuilderPage />)

      const submitButton = screen.getByTestId('search-form-submit')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/Invalid API key provided/i)).toBeInTheDocument()
        expect(screen.getByText(/Error/i)).toBeInTheDocument()
      })
    })

    it('clears error when new search starts', async () => {
      mockUseQueryBuilderStore.mockImplementation((selector: any) => {
        const state = { siteFilter: 'profile' }
        return selector(state)
      })

      const searchLinkedInMock = vi.mocked(api.searchLinkedIn)
      // First call fails
      searchLinkedInMock.mockRejectedValueOnce({
        response: { data: { detail: 'First error' } },
      })

      render(<QueryBuilderPage />)

      const submitButton = screen.getByTestId('search-form-submit')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/First error/i)).toBeInTheDocument()
      })

      // Second call - error should be cleared during loading
      let resolveSecond: (value: any) => void
      searchLinkedInMock.mockReturnValueOnce(
        new Promise((resolve) => {
          resolveSecond = resolve
        })
      )

      await user.click(submitButton)

      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByText(/First error/i)).not.toBeInTheDocument()
      })

      // Cleanup
      resolveSecond!({
        query: 'test',
        total_results: 0,
        profiles: [],
        metadata: {
          country: 'id',
          language: 'id',
          pages_fetched: 1,
          search_engine: 'google',
          has_errors: false,
        },
      })
    })
  })

  describe('Page Header and Layout', () => {
    it('renders page header with title', () => {
      mockUseQueryBuilderStore.mockImplementation((selector: any) => {
        const state = { siteFilter: 'profile' }
        return selector(state)
      })

      render(<QueryBuilderPage />)

      expect(screen.getByText(/LinkedIn Query Builder/i)).toBeInTheDocument()
    })

    it('renders site filter component', () => {
      mockUseQueryBuilderStore.mockImplementation((selector: any) => {
        const state = { siteFilter: 'profile' }
        return selector(state)
      })

      render(<QueryBuilderPage />)

      expect(screen.getByTestId('site-filter')).toBeInTheDocument()
    })

    it('renders footer', () => {
      mockUseQueryBuilderStore.mockImplementation((selector: any) => {
        const state = { siteFilter: 'profile' }
        return selector(state)
      })

      render(<QueryBuilderPage />)

      expect(screen.getByText(/Powered by Bright Data API/i)).toBeInTheDocument()
    })
  })
})
