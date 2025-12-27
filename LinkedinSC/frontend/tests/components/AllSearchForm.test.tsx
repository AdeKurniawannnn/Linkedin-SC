import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AllSearchForm } from '@/components/AllSearchForm'

describe('AllSearchForm', () => {
  const mockOnSearch = vi.fn()
  const user = userEvent.setup()

  beforeEach(() => {
    mockOnSearch.mockClear()
  })

  it('renders all form fields correctly', () => {
    render(<AllSearchForm onSearch={mockOnSearch} isLoading={false} />)

    expect(screen.getByLabelText(/keywords/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/location/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/max results/i)).toBeInTheDocument()
    expect(screen.getByText(/language/i)).toBeInTheDocument()
    expect(screen.getByText(/country/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /search all content/i })).toBeInTheDocument()
  })

  it('requires keywords field before submission', async () => {
    render(<AllSearchForm onSearch={mockOnSearch} isLoading={false} />)

    // keywords has required attribute
    const keywordsInput = screen.getByLabelText(/keywords/i) as HTMLInputElement
    expect(keywordsInput).toHaveAttribute('required')

    // Type keywords
    await user.type(keywordsInput, 'Software Engineer')

    // Submit
    const submitButton = screen.getByRole('button', { name: /search all content/i })
    await user.click(submitButton)

    expect(mockOnSearch).toHaveBeenCalledTimes(1)
  })

  it('calls onSearch with correct AllSearchParams on submit', async () => {
    render(<AllSearchForm onSearch={mockOnSearch} isLoading={false} />)

    // Fill in keywords
    const keywordsInput = screen.getByLabelText(/keywords/i)
    await user.type(keywordsInput, 'Startup Indonesia')

    // Fill in location
    const locationInput = screen.getByLabelText(/location/i)
    await user.type(locationInput, 'Jakarta')

    // Submit
    const submitButton = screen.getByRole('button', { name: /search all content/i })
    await user.click(submitButton)

    expect(mockOnSearch).toHaveBeenCalledTimes(1)
    expect(mockOnSearch).toHaveBeenCalledWith({
      keywords: 'Startup Indonesia',
      location: 'Jakarta',
      max_results: 20,
      language: 'id',
      country: 'id',
    })
  })

  it('disables form elements when isLoading is true', () => {
    render(<AllSearchForm onSearch={mockOnSearch} isLoading={true} />)

    // Inputs are not explicitly disabled in this component, but button is
    expect(screen.getByRole('button', { name: /searching/i })).toBeDisabled()
  })

  it('applies default values (max_results: 20)', async () => {
    render(<AllSearchForm onSearch={mockOnSearch} isLoading={false} />)

    // Verify default max_results is 20
    const maxResultsInput = screen.getByLabelText(/max results/i) as HTMLInputElement
    expect(maxResultsInput.value).toBe('20')

    // Submit with only keywords filled
    const keywordsInput = screen.getByLabelText(/keywords/i)
    await user.type(keywordsInput, 'test')

    const submitButton = screen.getByRole('button', { name: /search all content/i })
    await user.click(submitButton)

    expect(mockOnSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        max_results: 20,
      })
    )
  })

  it('location is optional', async () => {
    render(<AllSearchForm onSearch={mockOnSearch} isLoading={false} />)

    // Submit with only keywords filled
    const keywordsInput = screen.getByLabelText(/keywords/i)
    await user.type(keywordsInput, 'Tech Company')

    const submitButton = screen.getByRole('button', { name: /search all content/i })
    await user.click(submitButton)

    expect(mockOnSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        keywords: 'Tech Company',
        location: '',
      })
    )
  })

  it('shows loading state in button', () => {
    render(<AllSearchForm onSearch={mockOnSearch} isLoading={true} />)

    expect(screen.getByRole('button', { name: /searching/i })).toBeInTheDocument()
  })

  it('trims whitespace from keywords input', async () => {
    render(<AllSearchForm onSearch={mockOnSearch} isLoading={false} />)

    const keywordsInput = screen.getByLabelText(/keywords/i)
    await user.type(keywordsInput, '  Software Engineer  ')

    const submitButton = screen.getByRole('button', { name: /search all content/i })
    await user.click(submitButton)

    expect(mockOnSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        keywords: 'Software Engineer',
      })
    )
  })

  it('trims whitespace from location input', async () => {
    render(<AllSearchForm onSearch={mockOnSearch} isLoading={false} />)

    const keywordsInput = screen.getByLabelText(/keywords/i)
    await user.type(keywordsInput, 'Developer')

    const locationInput = screen.getByLabelText(/location/i)
    await user.type(locationInput, '  Jakarta  ')

    const submitButton = screen.getByRole('button', { name: /search all content/i })
    await user.click(submitButton)

    expect(mockOnSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        location: 'Jakarta',
      })
    )
  })

  it('updates max results value', async () => {
    render(<AllSearchForm onSearch={mockOnSearch} isLoading={false} />)

    // Fill in required keywords first
    const keywordsInput = screen.getByLabelText(/keywords/i)
    await user.type(keywordsInput, 'Engineer')

    // Update max results using fireEvent.change for more reliable number input handling
    const maxResultsInput = screen.getByLabelText(/max results/i)
    fireEvent.change(maxResultsInput, { target: { value: '50' } })

    const submitButton = screen.getByRole('button', { name: /search all content/i })
    await user.click(submitButton)

    expect(mockOnSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        max_results: 50,
      })
    )
  })

  it('applies Indonesian defaults (country: id, language: id)', async () => {
    render(<AllSearchForm onSearch={mockOnSearch} isLoading={false} />)

    // Submit with only keywords filled
    const keywordsInput = screen.getByLabelText(/keywords/i)
    await user.type(keywordsInput, 'test')

    const submitButton = screen.getByRole('button', { name: /search all content/i })
    await user.click(submitButton)

    expect(mockOnSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        country: 'id',
        language: 'id',
      })
    )
  })
})
