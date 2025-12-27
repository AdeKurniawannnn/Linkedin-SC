import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AllResultsTable, LinkedInAllResult } from '@/components/AllResultsTable'

// Mock data factory
const createMockResult = (overrides: Partial<LinkedInAllResult> = {}): LinkedInAllResult => ({
  url: 'https://linkedin.com/in/test-user',
  title: 'Test Result Title',
  description: 'This is a description of the test result.',
  type: 'profile',
  rank: 1,
  ...overrides,
})

const createMockMetadata = () => ({
  keywords: 'software engineer indonesia',
  total_results: 75,
  pages_fetched: 8,
})

describe('AllResultsTable', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders table with mixed results data correctly', () => {
    const results = [
      createMockResult({ type: 'profile', title: 'John Doe' }),
      createMockResult({ type: 'company', title: 'Acme Corp', rank: 2 }),
      createMockResult({ type: 'post', title: 'Tech Post', rank: 3 }),
    ]
    render(<AllResultsTable results={results} />)

    expect(screen.getByText('Search Results')).toBeInTheDocument()
    expect(screen.getByText(/Found 3 LinkedIn results/)).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Acme Corp')).toBeInTheDocument()
    expect(screen.getByText('Tech Post')).toBeInTheDocument()
  })

  it('displays result type badge with correct color (profile: blue)', () => {
    const results = [createMockResult({ type: 'profile' })]
    render(<AllResultsTable results={results} />)

    const badge = screen.getByText('PROFILE')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-blue-100', 'text-blue-800')
  })

  it('displays result type badge with correct color (company: green)', () => {
    const results = [createMockResult({ type: 'company' })]
    render(<AllResultsTable results={results} />)

    const badge = screen.getByText('COMPANY')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-green-100', 'text-green-800')
  })

  it('displays result type badge with correct color (post: purple)', () => {
    const results = [createMockResult({ type: 'post' })]
    render(<AllResultsTable results={results} />)

    const badge = screen.getByText('POST')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-purple-100', 'text-purple-800')
  })

  it('displays result type badge with correct color (job: orange)', () => {
    const results = [createMockResult({ type: 'job' })]
    render(<AllResultsTable results={results} />)

    const badge = screen.getByText('JOB')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-orange-100', 'text-orange-800')
  })

  it('displays result type badge with correct color (other: gray)', () => {
    const results = [createMockResult({ type: 'other' })]
    render(<AllResultsTable results={results} />)

    const badge = screen.getByText('OTHER')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-gray-100', 'text-gray-800')
  })

  it('shows title and description', () => {
    const results = [createMockResult({
      title: 'Senior Developer',
      description: 'Experienced developer with 10 years of experience.',
    })]
    render(<AllResultsTable results={results} />)

    expect(screen.getByText('Senior Developer')).toBeInTheDocument()
    expect(screen.getByText('Experienced developer with 10 years of experience.')).toBeInTheDocument()
  })

  it('renders external link to result', () => {
    const results = [createMockResult({ url: 'https://linkedin.com/company/test-company' })]
    render(<AllResultsTable results={results} />)

    const externalLinks = screen.getAllByRole('link')
    const resultLink = externalLinks.find(link => link.getAttribute('href') === 'https://linkedin.com/company/test-company')

    expect(resultLink).toBeInTheDocument()
    expect(resultLink).toHaveAttribute('target', '_blank')
    expect(resultLink).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('checkbox selection works (single selection)', async () => {
    const results = [createMockResult(), createMockResult({ rank: 2 })]
    render(<AllResultsTable results={results} />)

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
    const results = [
      createMockResult(),
      createMockResult({ rank: 2 }),
      createMockResult({ rank: 3 }),
    ]
    render(<AllResultsTable results={results} />)

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

  it('shows empty state message when results array is empty', () => {
    render(<AllResultsTable results={[]} />)
    expect(screen.getByText('No results found')).toBeInTheDocument()
    expect(screen.getByText(/Try adjusting your search criteria/)).toBeInTheDocument()
  })

  it('displays metadata (keywords, total_results, pages_fetched)', () => {
    const results = [createMockResult()]
    const metadata = createMockMetadata()
    render(<AllResultsTable results={results} metadata={metadata} />)

    expect(screen.getByText(/Keywords: "software engineer indonesia"/)).toBeInTheDocument()
  })

  it('shows row numbers correctly', () => {
    const results = [
      createMockResult(),
      createMockResult({ rank: 2 }),
      createMockResult({ rank: 3 }),
    ]
    render(<AllResultsTable results={results} />)

    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('has Export CSV button', () => {
    const results = [createMockResult()]
    render(<AllResultsTable results={results} />)

    expect(screen.getByRole('button', { name: /Export CSV/i })).toBeInTheDocument()
  })

  it('truncates long descriptions (200 chars)', () => {
    const longDescription = 'B'.repeat(250)
    const results = [createMockResult({ description: longDescription })]
    render(<AllResultsTable results={results} />)

    // Should show truncated description (200 chars + "...")
    const truncatedDescription = 'B'.repeat(200) + '...'
    expect(screen.getByText(truncatedDescription)).toBeInTheDocument()
  })

  it('displays all badge types correctly in mixed results', () => {
    const results = [
      createMockResult({ type: 'profile', rank: 1 }),
      createMockResult({ type: 'company', rank: 2 }),
      createMockResult({ type: 'post', rank: 3 }),
      createMockResult({ type: 'job', rank: 4 }),
      createMockResult({ type: 'other', rank: 5 }),
    ]
    render(<AllResultsTable results={results} />)

    expect(screen.getByText('PROFILE')).toBeInTheDocument()
    expect(screen.getByText('COMPANY')).toBeInTheDocument()
    expect(screen.getByText('POST')).toBeInTheDocument()
    expect(screen.getByText('JOB')).toBeInTheDocument()
    expect(screen.getByText('OTHER')).toBeInTheDocument()
  })
})
