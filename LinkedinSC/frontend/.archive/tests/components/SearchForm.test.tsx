import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SearchForm } from '@/components/SearchForm'

describe('SearchForm', () => {
  const mockOnSearch = vi.fn()
  const user = userEvent.setup()

  beforeEach(() => {
    mockOnSearch.mockClear()
  })

  it('renders all form fields', () => {
    render(<SearchForm onSearch={mockOnSearch} isLoading={false} />)

    expect(screen.getByLabelText(/job role/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/location/i)).toBeInTheDocument()
    expect(screen.getByText(/country/i)).toBeInTheDocument()
    expect(screen.getByText(/language/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/max pages/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /search profiles/i })).toBeInTheDocument()
  })

  it('requires role field to submit', async () => {
    render(<SearchForm onSearch={mockOnSearch} isLoading={false} />)

    const submitButton = screen.getByRole('button', { name: /search profiles/i })

    // Button should be disabled when role is empty
    expect(submitButton).toBeDisabled()

    // Type a role
    const roleInput = screen.getByLabelText(/job role/i)
    await user.type(roleInput, 'Software Engineer')

    // Button should now be enabled
    expect(submitButton).not.toBeDisabled()
  })

  it('calls onSearch with correct params when submitted', async () => {
    render(<SearchForm onSearch={mockOnSearch} isLoading={false} />)

    // Fill in the form
    const roleInput = screen.getByLabelText(/job role/i)
    await user.type(roleInput, 'Data Scientist')

    const locationInput = screen.getByLabelText(/location/i)
    await user.type(locationInput, 'Jakarta')

    // Submit
    const submitButton = screen.getByRole('button', { name: /search profiles/i })
    await user.click(submitButton)

    expect(mockOnSearch).toHaveBeenCalledTimes(1)
    expect(mockOnSearch).toHaveBeenCalledWith({
      role: 'Data Scientist',
      location: 'Jakarta',
      country: 'us',  // default
      language: 'en', // default
      max_pages: 5,   // default
    })
  })

  it('trims whitespace from inputs', async () => {
    render(<SearchForm onSearch={mockOnSearch} isLoading={false} />)

    const roleInput = screen.getByLabelText(/job role/i)
    await user.type(roleInput, '  Software Engineer  ')

    const submitButton = screen.getByRole('button', { name: /search profiles/i })
    await user.click(submitButton)

    expect(mockOnSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        role: 'Software Engineer',
      })
    )
  })

  it('disables form fields when loading', () => {
    render(<SearchForm onSearch={mockOnSearch} isLoading={true} />)

    expect(screen.getByLabelText(/job role/i)).toBeDisabled()
    expect(screen.getByLabelText(/location/i)).toBeDisabled()
    expect(screen.getByLabelText(/max pages/i)).toBeDisabled()
    expect(screen.getByRole('button', { name: /searching/i })).toBeDisabled()
  })

  it('shows loading state in button', () => {
    render(<SearchForm onSearch={mockOnSearch} isLoading={true} />)

    expect(screen.getByRole('button', { name: /searching/i })).toBeInTheDocument()
  })

  it('updates max pages value', async () => {
    render(<SearchForm onSearch={mockOnSearch} isLoading={false} />)

    const maxPagesInput = screen.getByLabelText(/max pages/i)
    await user.clear(maxPagesInput)
    await user.type(maxPagesInput, '10')

    const roleInput = screen.getByLabelText(/job role/i)
    await user.type(roleInput, 'Engineer')

    const submitButton = screen.getByRole('button', { name: /search profiles/i })
    await user.click(submitButton)

    expect(mockOnSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        max_pages: 10,
      })
    )
  })

  it('displays estimated results based on max pages', () => {
    render(<SearchForm onSearch={mockOnSearch} isLoading={false} />)

    // Default is 5 pages = 50 results
    expect(screen.getByText(/approximately 50 results/i)).toBeInTheDocument()
  })

  it('does not submit with only whitespace in role', async () => {
    render(<SearchForm onSearch={mockOnSearch} isLoading={false} />)

    const roleInput = screen.getByLabelText(/job role/i)
    await user.type(roleInput, '   ')

    const submitButton = screen.getByRole('button', { name: /search profiles/i })
    // Button should still be disabled with only whitespace
    expect(submitButton).toBeDisabled()
  })
})
