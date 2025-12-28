import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PostsTable, LinkedInPost } from '@/components/PostsTable'

// Mock data factory
const createMockPost = (overrides: Partial<LinkedInPost> = {}): LinkedInPost => ({
  post_url: 'https://linkedin.com/post/123',
  author_name: 'Test Author',
  author_profile_url: 'https://linkedin.com/in/test-author',
  posted_date: '2024-01-15',
  content: 'This is a test post content that demonstrates the LinkedIn post structure.',
  hashtags: ['#test', '#linkedin', '#content'],
  likes: 100,
  comments: 25,
  shares: 10,
  post_type: 'article',
  rank: 1,
  ...overrides,
})

const createMockMetadata = () => ({
  keywords: 'software engineer',
  total_results: 50,
  pages_fetched: 5,
})

describe('PostsTable', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders table with posts data correctly', () => {
    const posts = [createMockPost(), createMockPost({ author_name: 'Second Author', rank: 2 })]
    render(<PostsTable posts={posts} />)

    expect(screen.getByText('Search Results')).toBeInTheDocument()
    expect(screen.getByText(/Found 2 LinkedIn posts/)).toBeInTheDocument()
    expect(screen.getByText('Test Author')).toBeInTheDocument()
    expect(screen.getByText('Second Author')).toBeInTheDocument()
  })

  it('displays post content with truncation (150 chars)', () => {
    const longContent = 'A'.repeat(200)
    const posts = [createMockPost({ content: longContent })]
    render(<PostsTable posts={posts} />)

    // Should show truncated content (150 chars + "...")
    const truncatedContent = 'A'.repeat(150) + '...'
    expect(screen.getByText(truncatedContent)).toBeInTheDocument()
  })

  it('shows author name and profile link', () => {
    const posts = [createMockPost()]
    render(<PostsTable posts={posts} />)

    const authorLink = screen.getByRole('link', { name: 'Test Author' })
    expect(authorLink).toBeInTheDocument()
    expect(authorLink).toHaveAttribute('href', 'https://linkedin.com/in/test-author')
    expect(authorLink).toHaveAttribute('target', '_blank')
    expect(authorLink).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('displays hashtags (first 3)', () => {
    const posts = [createMockPost({ hashtags: ['#one', '#two', '#three', '#four', '#five'] })]
    render(<PostsTable posts={posts} />)

    // Should show first 3 hashtags joined with space
    expect(screen.getByText('#one #two #three')).toBeInTheDocument()
  })

  it('renders external link to post', () => {
    const posts = [createMockPost()]
    render(<PostsTable posts={posts} />)

    // Find the external link by looking for the container with the href
    const externalLinks = screen.getAllByRole('link')
    const postLink = externalLinks.find(link => link.getAttribute('href') === 'https://linkedin.com/post/123')

    expect(postLink).toBeInTheDocument()
    expect(postLink).toHaveAttribute('target', '_blank')
    expect(postLink).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('checkbox selection works (single selection)', async () => {
    const posts = [createMockPost(), createMockPost({ rank: 2 })]
    render(<PostsTable posts={posts} />)

    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes).toHaveLength(2)

    // Initially unchecked
    expect(checkboxes[0]).not.toBeChecked()
    expect(checkboxes[1]).not.toBeChecked()

    // Click first checkbox
    await user.click(checkboxes[0])
    expect(checkboxes[0]).toBeChecked()
    expect(checkboxes[1]).not.toBeChecked()

    // Shows selected count
    expect(screen.getByText('(1 selected)')).toBeInTheDocument()
  })

  it('select all / deselect all button works', async () => {
    const posts = [createMockPost(), createMockPost({ rank: 2 }), createMockPost({ rank: 3 })]
    render(<PostsTable posts={posts} />)

    const selectAllButton = screen.getByRole('button', { name: 'Select All' })
    expect(selectAllButton).toBeInTheDocument()

    // Click Select All
    await user.click(selectAllButton)

    const checkboxes = screen.getAllByRole('checkbox')
    checkboxes.forEach(checkbox => {
      expect(checkbox).toBeChecked()
    })

    // Button should now say Deselect All
    expect(screen.getByRole('button', { name: 'Deselect All' })).toBeInTheDocument()
    expect(screen.getByText('(3 selected)')).toBeInTheDocument()

    // Click Deselect All
    await user.click(screen.getByRole('button', { name: 'Deselect All' }))

    checkboxes.forEach(checkbox => {
      expect(checkbox).not.toBeChecked()
    })
    expect(screen.getByRole('button', { name: 'Select All' })).toBeInTheDocument()
  })

  it('shows empty state message when posts array is empty', () => {
    render(<PostsTable posts={[]} />)
    expect(screen.getByText('No posts found')).toBeInTheDocument()
    expect(screen.getByText(/Try adjusting your search criteria/)).toBeInTheDocument()
  })

  it('displays metadata (keywords, total_results, pages_fetched)', () => {
    const posts = [createMockPost()]
    const metadata = createMockMetadata()
    render(<PostsTable posts={posts} metadata={metadata} />)

    expect(screen.getByText(/Keywords: "software engineer"/)).toBeInTheDocument()
  })

  it('displays post type badge', () => {
    const posts = [createMockPost({ post_type: 'article' })]
    render(<PostsTable posts={posts} />)

    expect(screen.getByText('article')).toBeInTheDocument()
  })

  it('shows row numbers correctly', () => {
    const posts = [createMockPost(), createMockPost({ rank: 2 }), createMockPost({ rank: 3 })]
    render(<PostsTable posts={posts} />)

    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('does not show hashtags section when hashtags array is empty', () => {
    const posts = [createMockPost({ hashtags: [] })]
    render(<PostsTable posts={posts} />)

    // The hashtag section should not be rendered
    expect(screen.queryByText('#')).not.toBeInTheDocument()
  })

  it('has Export CSV button', () => {
    const posts = [createMockPost()]
    render(<PostsTable posts={posts} />)

    expect(screen.getByRole('button', { name: /Export CSV/i })).toBeInTheDocument()
  })
})
