import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { JobsTable, LinkedInJob } from '@/components/JobsTable'

// Mock data factory
const createMockJob = (overrides: Partial<LinkedInJob> = {}): LinkedInJob => ({
  job_url: 'https://linkedin.com/jobs/123',
  job_title: 'Software Engineer',
  company_name: 'Test Company',
  location: 'Jakarta, Indonesia',
  description: 'We are looking for a talented software engineer to join our team.',
  rank: 1,
  ...overrides,
})

const createMockMetadata = () => ({
  job_title: 'Software Engineer',
  total_results: 100,
  pages_fetched: 10,
})

describe('JobsTable', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders table with jobs data correctly', () => {
    const jobs = [createMockJob(), createMockJob({ job_title: 'Data Scientist', rank: 2 })]
    render(<JobsTable jobs={jobs} />)

    expect(screen.getByText('Search Results')).toBeInTheDocument()
    expect(screen.getByText(/Found 2 job openings/)).toBeInTheDocument()
    expect(screen.getByText('Software Engineer')).toBeInTheDocument()
    expect(screen.getByText('Data Scientist')).toBeInTheDocument()
  })

  it('displays job title and company name', () => {
    const jobs = [createMockJob()]
    render(<JobsTable jobs={jobs} />)

    expect(screen.getByText('Software Engineer')).toBeInTheDocument()
    expect(screen.getByText('Test Company')).toBeInTheDocument()
  })

  it('shows job location', () => {
    const jobs = [createMockJob({ location: 'San Francisco, CA' })]
    render(<JobsTable jobs={jobs} />)

    expect(screen.getByText('San Francisco, CA')).toBeInTheDocument()
  })

  it('displays description with truncation (200 chars)', () => {
    const longDescription = 'A'.repeat(250)
    const jobs = [createMockJob({ description: longDescription })]
    render(<JobsTable jobs={jobs} />)

    // Should show truncated description (200 chars + "...")
    const truncatedDescription = 'A'.repeat(200) + '...'
    expect(screen.getByText(truncatedDescription)).toBeInTheDocument()
  })

  it('renders external link to job posting', () => {
    const jobs = [createMockJob()]
    render(<JobsTable jobs={jobs} />)

    const externalLinks = screen.getAllByRole('link')
    const jobLink = externalLinks.find(link => link.getAttribute('href') === 'https://linkedin.com/jobs/123')

    expect(jobLink).toBeInTheDocument()
    expect(jobLink).toHaveAttribute('target', '_blank')
    expect(jobLink).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('checkbox selection works (single selection)', async () => {
    const jobs = [createMockJob(), createMockJob({ rank: 2 })]
    render(<JobsTable jobs={jobs} />)

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
    const jobs = [createMockJob(), createMockJob({ rank: 2 }), createMockJob({ rank: 3 })]
    render(<JobsTable jobs={jobs} />)

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

  it('shows empty state message when jobs array is empty', () => {
    render(<JobsTable jobs={[]} />)
    expect(screen.getByText('No jobs found')).toBeInTheDocument()
    expect(screen.getByText(/Try adjusting your search criteria/)).toBeInTheDocument()
  })

  it('displays metadata (job_title, total_results, pages_fetched)', () => {
    const jobs = [createMockJob()]
    const metadata = createMockMetadata()
    render(<JobsTable jobs={jobs} metadata={metadata} />)

    expect(screen.getByText(/Searching for: "Software Engineer"/)).toBeInTheDocument()
  })

  it('shows row numbers correctly', () => {
    const jobs = [createMockJob(), createMockJob({ rank: 2 }), createMockJob({ rank: 3 })]
    render(<JobsTable jobs={jobs} />)

    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('has Export CSV button', () => {
    const jobs = [createMockJob()]
    render(<JobsTable jobs={jobs} />)

    expect(screen.getByRole('button', { name: /Export CSV/i })).toBeInTheDocument()
  })

  it('displays short descriptions without truncation', () => {
    const shortDescription = 'A short description'
    const jobs = [createMockJob({ description: shortDescription })]
    render(<JobsTable jobs={jobs} />)

    expect(screen.getByText(shortDescription)).toBeInTheDocument()
  })
})
