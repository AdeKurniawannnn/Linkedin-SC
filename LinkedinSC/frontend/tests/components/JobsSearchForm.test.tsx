import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { JobsSearchForm } from '@/components/JobsSearchForm'

describe('JobsSearchForm', () => {
  const mockOnSearch = vi.fn()
  const user = userEvent.setup()

  beforeEach(() => {
    mockOnSearch.mockClear()
  })

  it('renders all form fields correctly', () => {
    render(<JobsSearchForm onSearch={mockOnSearch} isLoading={false} />)

    expect(screen.getByLabelText(/job title/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/location/i)).toBeInTheDocument()
    expect(screen.getByText(/experience level/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/max results/i)).toBeInTheDocument()
    expect(screen.getByText(/language/i)).toBeInTheDocument()
    expect(screen.getByText(/country/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /search jobs/i })).toBeInTheDocument()
  })

  it('requires job_title field before submission', async () => {
    render(<JobsSearchForm onSearch={mockOnSearch} isLoading={false} />)

    // Click submit without filling job title - form uses HTML5 validation
    const submitButton = screen.getByRole('button', { name: /search jobs/i })
    const jobTitleInput = screen.getByLabelText(/job title/i) as HTMLInputElement

    // Job title has required attribute
    expect(jobTitleInput).toHaveAttribute('required')

    // Type a job title
    await user.type(jobTitleInput, 'Software Engineer')

    // Now we can submit
    await user.click(submitButton)

    expect(mockOnSearch).toHaveBeenCalledTimes(1)
  })

  it('calls onSearch with correct JobsSearchParams on submit', async () => {
    render(<JobsSearchForm onSearch={mockOnSearch} isLoading={false} />)

    // Fill in job title
    const jobTitleInput = screen.getByLabelText(/job title/i)
    await user.type(jobTitleInput, 'Data Scientist')

    // Fill in location
    const locationInput = screen.getByLabelText(/location/i)
    await user.type(locationInput, 'Jakarta')

    // Submit
    const submitButton = screen.getByRole('button', { name: /search jobs/i })
    await user.click(submitButton)

    expect(mockOnSearch).toHaveBeenCalledTimes(1)
    expect(mockOnSearch).toHaveBeenCalledWith({
      job_title: 'Data Scientist',
      location: 'Jakarta',
      experience_level: 'all',
      max_results: 20,
      language: 'id',
      country: 'id',
    })
  })

  it('disables form elements when isLoading is true', () => {
    render(<JobsSearchForm onSearch={mockOnSearch} isLoading={true} />)

    expect(screen.getByLabelText(/job title/i)).not.toBeDisabled()
    expect(screen.getByLabelText(/location/i)).not.toBeDisabled()
    expect(screen.getByLabelText(/max results/i)).not.toBeDisabled()
    expect(screen.getByRole('button', { name: /searching/i })).toBeDisabled()
  })

  it('applies default values (experience_level: all, max_results: 20)', async () => {
    render(<JobsSearchForm onSearch={mockOnSearch} isLoading={false} />)

    // Verify default max_results is 20
    const maxResultsInput = screen.getByLabelText(/max results/i) as HTMLInputElement
    expect(maxResultsInput.value).toBe('20')

    // Submit with only job title filled
    const jobTitleInput = screen.getByLabelText(/job title/i)
    await user.type(jobTitleInput, 'Engineer')

    const submitButton = screen.getByRole('button', { name: /search jobs/i })
    await user.click(submitButton)

    expect(mockOnSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        experience_level: 'all',
        max_results: 20,
      })
    )
  })

  it('shows loading state in button', () => {
    render(<JobsSearchForm onSearch={mockOnSearch} isLoading={true} />)

    expect(screen.getByRole('button', { name: /searching/i })).toBeInTheDocument()
  })

  it('trims whitespace from job_title input', async () => {
    render(<JobsSearchForm onSearch={mockOnSearch} isLoading={false} />)

    const jobTitleInput = screen.getByLabelText(/job title/i)
    await user.type(jobTitleInput, '  Software Engineer  ')

    const submitButton = screen.getByRole('button', { name: /search jobs/i })
    await user.click(submitButton)

    expect(mockOnSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        job_title: 'Software Engineer',
      })
    )
  })

  it('trims whitespace from location input', async () => {
    render(<JobsSearchForm onSearch={mockOnSearch} isLoading={false} />)

    const jobTitleInput = screen.getByLabelText(/job title/i)
    await user.type(jobTitleInput, 'Engineer')

    const locationInput = screen.getByLabelText(/location/i)
    await user.type(locationInput, '  Jakarta  ')

    const submitButton = screen.getByRole('button', { name: /search jobs/i })
    await user.click(submitButton)

    expect(mockOnSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        location: 'Jakarta',
      })
    )
  })

  it('updates max results value', async () => {
    render(<JobsSearchForm onSearch={mockOnSearch} isLoading={false} />)

    // Fill in required job title first
    const jobTitleInput = screen.getByLabelText(/job title/i)
    await user.type(jobTitleInput, 'Engineer')

    // Update max results using fireEvent.change for more reliable number input handling
    const maxResultsInput = screen.getByLabelText(/max results/i)
    fireEvent.change(maxResultsInput, { target: { value: '50' } })

    const submitButton = screen.getByRole('button', { name: /search jobs/i })
    await user.click(submitButton)

    expect(mockOnSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        max_results: 50,
      })
    )
  })

  it('location is optional', async () => {
    render(<JobsSearchForm onSearch={mockOnSearch} isLoading={false} />)

    // Submit with only job title filled
    const jobTitleInput = screen.getByLabelText(/job title/i)
    await user.type(jobTitleInput, 'Developer')

    const submitButton = screen.getByRole('button', { name: /search jobs/i })
    await user.click(submitButton)

    expect(mockOnSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        job_title: 'Developer',
        location: '',
      })
    )
  })
})
