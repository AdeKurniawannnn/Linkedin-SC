import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PostsSearchForm } from '@/components/PostsSearchForm'

describe('PostsSearchForm', () => {
  const mockOnSearch = vi.fn()
  const user = userEvent.setup()

  beforeEach(() => {
    mockOnSearch.mockClear()
  })

  it('renders all form fields correctly', () => {
    render(<PostsSearchForm onSearch={mockOnSearch} isLoading={false} />)

    expect(screen.getByLabelText(/keywords/i)).toBeInTheDocument()
    expect(screen.getByText(/author type/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/max results/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/location/i)).toBeInTheDocument()
    expect(screen.getByText(/language/i)).toBeInTheDocument()
    expect(screen.getByText(/country/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /search posts/i })).toBeInTheDocument()
  })

  it('renders all author type radio options', () => {
    render(<PostsSearchForm onSearch={mockOnSearch} isLoading={false} />)

    expect(screen.getByLabelText(/all/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/companies/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/people/i)).toBeInTheDocument()
  })

  it('requires keywords field before submission', async () => {
    render(<PostsSearchForm onSearch={mockOnSearch} isLoading={false} />)

    const submitButton = screen.getByRole('button', { name: /search posts/i })

    // Button should be disabled when keywords is empty
    expect(submitButton).toBeDisabled()

    // Type keywords
    const keywordsInput = screen.getByLabelText(/keywords/i)
    await user.type(keywordsInput, 'artificial intelligence')

    // Button should now be enabled
    expect(submitButton).not.toBeDisabled()
  })

  it('calls onSearch with correct PostsSearchParams on submit', async () => {
    render(<PostsSearchForm onSearch={mockOnSearch} isLoading={false} />)

    // Fill in keywords
    const keywordsInput = screen.getByLabelText(/keywords/i)
    await user.type(keywordsInput, 'machine learning')

    // Fill in location
    const locationInput = screen.getByLabelText(/location/i)
    await user.type(locationInput, 'Jakarta')

    // Change author type to companies
    const companiesRadio = screen.getByLabelText(/companies/i)
    await user.click(companiesRadio)

    // Submit
    const submitButton = screen.getByRole('button', { name: /search posts/i })
    await user.click(submitButton)

    expect(mockOnSearch).toHaveBeenCalledTimes(1)
    expect(mockOnSearch).toHaveBeenCalledWith({
      keywords: 'machine learning',
      author_type: 'companies',
      max_results: 20,
      location: 'Jakarta',
      language: 'id',
      country: 'id',
    })
  })

  it('disables form elements when isLoading is true', () => {
    render(<PostsSearchForm onSearch={mockOnSearch} isLoading={true} />)

    expect(screen.getByLabelText(/keywords/i)).toBeDisabled()
    expect(screen.getByLabelText(/max results/i)).toBeDisabled()
    expect(screen.getByLabelText(/location/i)).toBeDisabled()
    expect(screen.getByLabelText(/all/i)).toBeDisabled()
    expect(screen.getByRole('button', { name: /searching/i })).toBeDisabled()
  })

  it('applies default values (author_type: all, max_results: 20)', async () => {
    render(<PostsSearchForm onSearch={mockOnSearch} isLoading={false} />)

    // Verify default author_type is 'all'
    const allRadio = screen.getByLabelText(/all/i) as HTMLInputElement
    expect(allRadio.checked).toBe(true)

    // Verify default max_results is 20
    const maxResultsInput = screen.getByLabelText(/max results/i) as HTMLInputElement
    expect(maxResultsInput.value).toBe('20')

    // Submit with only keywords filled
    const keywordsInput = screen.getByLabelText(/keywords/i)
    await user.type(keywordsInput, 'test')

    const submitButton = screen.getByRole('button', { name: /search posts/i })
    await user.click(submitButton)

    expect(mockOnSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        author_type: 'all',
        max_results: 20,
      })
    )
  })

  it('trims whitespace from keywords input', async () => {
    render(<PostsSearchForm onSearch={mockOnSearch} isLoading={false} />)

    const keywordsInput = screen.getByLabelText(/keywords/i)
    await user.type(keywordsInput, '  artificial intelligence  ')

    const submitButton = screen.getByRole('button', { name: /search posts/i })
    await user.click(submitButton)

    expect(mockOnSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        keywords: 'artificial intelligence',
      })
    )
  })

  it('does not submit with only whitespace in keywords', async () => {
    render(<PostsSearchForm onSearch={mockOnSearch} isLoading={false} />)

    const keywordsInput = screen.getByLabelText(/keywords/i)
    await user.type(keywordsInput, '   ')

    const submitButton = screen.getByRole('button', { name: /search posts/i })
    // Button should still be disabled with only whitespace
    expect(submitButton).toBeDisabled()
  })

  it('shows loading state in button', () => {
    render(<PostsSearchForm onSearch={mockOnSearch} isLoading={true} />)

    expect(screen.getByRole('button', { name: /searching/i })).toBeInTheDocument()
  })

  it('clears form when clear button is clicked', async () => {
    render(<PostsSearchForm onSearch={mockOnSearch} isLoading={false} />)

    // Fill in keywords
    const keywordsInput = screen.getByLabelText(/keywords/i) as HTMLInputElement
    await user.type(keywordsInput, 'test keywords')

    // Click clear button
    const clearButton = screen.getByRole('button', { name: /clear/i })
    await user.click(clearButton)

    // Verify form is cleared
    expect(keywordsInput.value).toBe('')
  })
})
