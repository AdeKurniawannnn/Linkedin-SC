import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SiteFilter } from '@/components/query-builder/SiteFilter'
import { useQueryBuilderStore } from '@/stores/queryBuilderStore'

describe('SiteFilter', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    // Reset store to initial state before each test
    useQueryBuilderStore.setState({
      siteFilter: 'all',
    })
  })

  it('renders all filter options', () => {
    render(<SiteFilter />)

    expect(screen.getByRole('button', { name: /semua/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /profil/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /postingan/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /lowongan/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /perusahaan/i })).toBeInTheDocument()
  })

  it('shows title and description', () => {
    render(<SiteFilter />)

    expect(screen.getByText(/filter tipe linkedin/i)).toBeInTheDocument()
    expect(screen.getByText(/pilih tipe konten linkedin/i)).toBeInTheDocument()
  })

  it('shows description for selected filter', () => {
    render(<SiteFilter />)

    // Default is 'all', should show its description
    expect(screen.getByText(/semua hasil linkedin/i)).toBeInTheDocument()
  })

  it('updates store when filter is clicked', async () => {
    render(<SiteFilter />)

    // Click on Profile filter
    const profileButton = screen.getByRole('button', { name: /profil/i })
    await user.click(profileButton)

    // Check store is updated
    expect(useQueryBuilderStore.getState().siteFilter).toBe('profile')
  })

  it('shows correct description when filter changes', async () => {
    render(<SiteFilter />)

    // Click on Profile filter
    const profileButton = screen.getByRole('button', { name: /profil/i })
    await user.click(profileButton)

    // Should show profile description
    expect(screen.getByText(/profil pengguna linkedin/i)).toBeInTheDocument()
  })

  it('cycles through all filter options correctly', async () => {
    render(<SiteFilter />)

    // Click each filter and verify store state
    const filters = [
      { button: /profil/i, value: 'profile' },
      { button: /postingan/i, value: 'posts' },
      { button: /lowongan/i, value: 'jobs' },
      { button: /perusahaan/i, value: 'company' },
      { button: /semua/i, value: 'all' },
    ]

    for (const filter of filters) {
      const button = screen.getByRole('button', { name: filter.button })
      await user.click(button)
      expect(useQueryBuilderStore.getState().siteFilter).toBe(filter.value)
    }
  })

  it('reflects initial store state', () => {
    // Set initial state to 'jobs'
    useQueryBuilderStore.setState({ siteFilter: 'jobs' })

    render(<SiteFilter />)

    // Should show jobs description
    expect(screen.getByText(/lowongan pekerjaan linkedin/i)).toBeInTheDocument()
  })
})
