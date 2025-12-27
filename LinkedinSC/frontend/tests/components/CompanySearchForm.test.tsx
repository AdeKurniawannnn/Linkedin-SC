import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CompanySearchForm } from '@/components/CompanySearchForm'

describe('CompanySearchForm', () => {
  const mockOnSearch = vi.fn()
  const user = userEvent.setup()

  beforeEach(() => {
    mockOnSearch.mockClear()
  })

  it('renders all form fields correctly', () => {
    render(<CompanySearchForm onSearch={mockOnSearch} isLoading={false} />)

    expect(screen.getByLabelText(/industry/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/location/i)).toBeInTheDocument()
    expect(screen.getByText(/country/i)).toBeInTheDocument()
    expect(screen.getByText(/language/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/max pages/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /search companies/i })).toBeInTheDocument()
  })

  it('requires both industry AND location before submission', async () => {
    render(<CompanySearchForm onSearch={mockOnSearch} isLoading={false} />)

    const submitButton = screen.getByRole('button', { name: /search companies/i })

    // Button should be disabled when both are empty
    expect(submitButton).toBeDisabled()

    // Type only industry
    const industryInput = screen.getByLabelText(/industry/i)
    await user.type(industryInput, 'Fintech')

    // Button should still be disabled (location is empty)
    expect(submitButton).toBeDisabled()

    // Type location
    const locationInput = screen.getByLabelText(/location/i)
    await user.type(locationInput, 'Jakarta')

    // Button should now be enabled
    expect(submitButton).not.toBeDisabled()
  })

  it('transforms industry to role param as "${industry} linkedin.com/company"', async () => {
    render(<CompanySearchForm onSearch={mockOnSearch} isLoading={false} />)

    // Fill in industry
    const industryInput = screen.getByLabelText(/industry/i)
    await user.type(industryInput, 'Tambak Udang')

    // Fill in location
    const locationInput = screen.getByLabelText(/location/i)
    await user.type(locationInput, 'Surabaya')

    // Submit
    const submitButton = screen.getByRole('button', { name: /search companies/i })
    await user.click(submitButton)

    expect(mockOnSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        role: 'Tambak Udang linkedin.com/company',
      })
    )
  })

  it('calls onSearch with correct params on submit', async () => {
    render(<CompanySearchForm onSearch={mockOnSearch} isLoading={false} />)

    // Fill in industry
    const industryInput = screen.getByLabelText(/industry/i)
    await user.type(industryInput, 'E-commerce')

    // Fill in location
    const locationInput = screen.getByLabelText(/location/i)
    await user.type(locationInput, 'Jakarta')

    // Submit
    const submitButton = screen.getByRole('button', { name: /search companies/i })
    await user.click(submitButton)

    expect(mockOnSearch).toHaveBeenCalledTimes(1)
    expect(mockOnSearch).toHaveBeenCalledWith({
      role: 'E-commerce linkedin.com/company',
      location: 'Jakarta',
      country: 'id',
      language: 'id',
      max_pages: 2,
    })
  })

  it('disables form elements when isLoading is true', () => {
    render(<CompanySearchForm onSearch={mockOnSearch} isLoading={true} />)

    expect(screen.getByLabelText(/industry/i)).toBeDisabled()
    expect(screen.getByLabelText(/location/i)).toBeDisabled()
    expect(screen.getByLabelText(/max pages/i)).toBeDisabled()
    expect(screen.getByRole('button', { name: /searching/i })).toBeDisabled()
  })

  it('applies Indonesian defaults (country: id, language: id)', async () => {
    render(<CompanySearchForm onSearch={mockOnSearch} isLoading={false} />)

    // Fill in required fields
    const industryInput = screen.getByLabelText(/industry/i)
    await user.type(industryInput, 'Tech')

    const locationInput = screen.getByLabelText(/location/i)
    await user.type(locationInput, 'Jakarta')

    // Submit
    const submitButton = screen.getByRole('button', { name: /search companies/i })
    await user.click(submitButton)

    expect(mockOnSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        country: 'id',
        language: 'id',
      })
    )
  })

  it('shows loading state in button', () => {
    render(<CompanySearchForm onSearch={mockOnSearch} isLoading={true} />)

    expect(screen.getByRole('button', { name: /searching/i })).toBeInTheDocument()
  })

  it('trims whitespace from industry input', async () => {
    render(<CompanySearchForm onSearch={mockOnSearch} isLoading={false} />)

    const industryInput = screen.getByLabelText(/industry/i)
    await user.type(industryInput, '  Fintech  ')

    const locationInput = screen.getByLabelText(/location/i)
    await user.type(locationInput, 'Jakarta')

    const submitButton = screen.getByRole('button', { name: /search companies/i })
    await user.click(submitButton)

    expect(mockOnSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        role: 'Fintech linkedin.com/company',
      })
    )
  })

  it('trims whitespace from location input', async () => {
    render(<CompanySearchForm onSearch={mockOnSearch} isLoading={false} />)

    const industryInput = screen.getByLabelText(/industry/i)
    await user.type(industryInput, 'Fintech')

    const locationInput = screen.getByLabelText(/location/i)
    await user.type(locationInput, '  Jakarta  ')

    const submitButton = screen.getByRole('button', { name: /search companies/i })
    await user.click(submitButton)

    expect(mockOnSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        location: 'Jakarta',
      })
    )
  })

  it('displays estimated results based on max pages', () => {
    render(<CompanySearchForm onSearch={mockOnSearch} isLoading={false} />)

    // Default is 2 pages = 20 results
    expect(screen.getByText(/approximately 20 results/i)).toBeInTheDocument()
  })

  it('updates max pages value', async () => {
    render(<CompanySearchForm onSearch={mockOnSearch} isLoading={false} />)

    const maxPagesInput = screen.getByLabelText(/max pages/i)
    await user.clear(maxPagesInput)
    await user.type(maxPagesInput, '5')

    const industryInput = screen.getByLabelText(/industry/i)
    await user.type(industryInput, 'Tech')

    const locationInput = screen.getByLabelText(/location/i)
    await user.type(locationInput, 'Jakarta')

    const submitButton = screen.getByRole('button', { name: /search companies/i })
    await user.click(submitButton)

    expect(mockOnSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        max_pages: 5,
      })
    )
  })
})
