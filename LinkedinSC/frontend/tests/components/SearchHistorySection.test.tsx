import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SearchHistorySection } from '@/components/search-history/SearchHistorySection'

// Mock child components
vi.mock('@/components/search-history/SearchHistoryTabs', () => ({
  SearchHistoryTabs: () => <div data-testid="search-history-tabs">Tabs Content</div>,
}))

vi.mock('@/components/search-history/StoragePopover', () => ({
  StoragePopover: () => <div data-testid="storage-popover">Storage</div>,
}))

// Mock the useConvexSearchHistory hook
const mockUseConvexSearchHistory = vi.fn()
vi.mock('@/hooks', () => ({
  useConvexSearchHistory: () => mockUseConvexSearchHistory(),
}))

// Mock Phosphor icons
vi.mock('@phosphor-icons/react', () => ({
  ClockCounterClockwise: ({ className, weight }: { className?: string; weight?: string }) => (
    <span className={className} data-weight={weight}>ClockIcon</span>
  ),
  CaretDown: ({ className, weight }: { className?: string; weight?: string }) => (
    <span className={className} data-weight={weight}>CaretIcon</span>
  ),
}))

describe('SearchHistorySection', () => {
  const user = userEvent.setup()

  const mockEntries = [
    {
      _id: 'entry1' as any,
      query: {
        baseQuery: 'Software Engineer',
        composedQuery: 'Software Engineer in New York',
        activePresetIds: [],
        activeLocationIds: [],
        country: 'us',
        language: 'en',
        maxResults: 50,
      },
      results: [],
      metadata: {
        country: 'us',
        language: 'en',
        pages_fetched: 1,
        time_taken_seconds: 2.5,
        max_results: 50,
      },
      totalResults: 10,
      timestamp: Date.now(),
      compressed: false,
      starred: false,
      sizeBytes: 1024,
    },
    {
      _id: 'entry2' as any,
      query: {
        baseQuery: 'Product Manager',
        composedQuery: 'Product Manager in San Francisco',
        activePresetIds: [],
        activeLocationIds: [],
        country: 'us',
        language: 'en',
        maxResults: 50,
      },
      results: [],
      metadata: {
        country: 'us',
        language: 'en',
        pages_fetched: 2,
        time_taken_seconds: 3.2,
        max_results: 50,
      },
      totalResults: 15,
      timestamp: Date.now() - 3600000,
      compressed: false,
      starred: true,
      sizeBytes: 2048,
    },
  ]

  beforeEach(() => {
    // Reset mocks
    mockUseConvexSearchHistory.mockReturnValue({
      entries: mockEntries,
      isLoading: false,
    })
  })

  describe('Rendering', () => {
    it('renders section title and content when mounted and loaded', async () => {
      render(<SearchHistorySection />)

      // Wait for mount
      await waitFor(() => {
        expect(screen.getByText(/history/i)).toBeInTheDocument()
      })

      expect(screen.getByTestId('search-history-tabs')).toBeInTheDocument()
      expect(screen.getByTestId('storage-popover')).toBeInTheDocument()
    })

    it('renders history icon', async () => {
      render(<SearchHistorySection />)

      await waitFor(() => {
        expect(screen.getByText('ClockIcon')).toBeInTheDocument()
      })
    })

    it('renders caret icon for collapsible', async () => {
      render(<SearchHistorySection />)

      await waitFor(() => {
        expect(screen.getByText('CaretIcon')).toBeInTheDocument()
      })
    })

    it('displays entry count badge when entries exist', async () => {
      render(<SearchHistorySection />)

      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument()
      })
    })

    it('does not display badge when no entries', async () => {
      mockUseConvexSearchHistory.mockReturnValue({
        entries: [],
        isLoading: false,
      })

      render(<SearchHistorySection />)

      await waitFor(() => {
        expect(screen.getByText(/history/i)).toBeInTheDocument()
      })

      expect(screen.queryByText('0')).not.toBeInTheDocument()
    })
  })

  describe('Collapsible behavior', () => {
    it('is open by default when autoCollapse is false', async () => {
      render(<SearchHistorySection autoCollapse={false} />)

      await waitFor(() => {
        const tabs = screen.getByTestId('search-history-tabs')
        expect(tabs).toBeInTheDocument()
      })
    })

    it('is closed by default when autoCollapse is true', async () => {
      render(<SearchHistorySection autoCollapse={true} />)

      await waitFor(() => {
        expect(screen.getByText(/history/i)).toBeInTheDocument()
      })

      const trigger = screen.getByRole('button', { name: /history/i })
      expect(trigger).toHaveAttribute('aria-expanded', 'false')
    })

    it('toggles open/closed on trigger click', async () => {
      render(<SearchHistorySection />)

      await waitFor(() => {
        expect(screen.getByText(/history/i)).toBeInTheDocument()
      })

      const trigger = screen.getByRole('button', { name: /history/i })

      // Should be open initially
      expect(trigger).toHaveAttribute('aria-expanded', 'true')

      await user.click(trigger)

      // Should be closed after click
      expect(trigger).toHaveAttribute('aria-expanded', 'false')

      // Click again to open
      await user.click(trigger)

      // Should be open again
      expect(trigger).toHaveAttribute('aria-expanded', 'true')
    })

    it('rotates caret icon when collapsed', async () => {
      render(<SearchHistorySection />)

      await waitFor(() => {
        expect(screen.getByText(/history/i)).toBeInTheDocument()
      })

      const trigger = screen.getByRole('button', { name: /history/i })
      const caret = screen.getByText('CaretIcon')

      // Should not be rotated when open
      expect(caret.className).not.toContain('rotate-180')

      await user.click(trigger)

      // Should be rotated when closed
      expect(caret.className).toContain('rotate-180')
    })
  })

  describe('autoCollapse prop', () => {
    it('auto-collapses when autoCollapse changes from false to true', async () => {
      const { rerender } = render(<SearchHistorySection autoCollapse={false} />)

      await waitFor(() => {
        expect(screen.getByText(/history/i)).toBeInTheDocument()
      })

      const trigger = screen.getByRole('button', { name: /history/i })
      expect(trigger).toHaveAttribute('aria-expanded', 'true')

      rerender(<SearchHistorySection autoCollapse={true} />)

      expect(trigger).toHaveAttribute('aria-expanded', 'false')
    })

    it('starts collapsed when autoCollapse is initially true', async () => {
      render(<SearchHistorySection autoCollapse={true} />)

      await waitFor(() => {
        expect(screen.getByText(/history/i)).toBeInTheDocument()
      })

      const trigger = screen.getByRole('button', { name: /history/i })
      expect(trigger).toHaveAttribute('aria-expanded', 'false')
    })

    it('respects user interaction even after autoCollapse triggers', async () => {
      const { rerender } = render(<SearchHistorySection autoCollapse={false} />)

      await waitFor(() => {
        expect(screen.getByText(/history/i)).toBeInTheDocument()
      })

      const trigger = screen.getByRole('button', { name: /history/i })
      expect(trigger).toHaveAttribute('aria-expanded', 'true')

      // Auto-collapse
      rerender(<SearchHistorySection autoCollapse={true} />)

      expect(trigger).toHaveAttribute('aria-expanded', 'false')

      // User manually opens
      await user.click(trigger)

      expect(trigger).toHaveAttribute('aria-expanded', 'true')
    })
  })

  describe('Loading state', () => {
    it('renders null when loading', () => {
      mockUseConvexSearchHistory.mockReturnValue({
        entries: [],
        isLoading: true,
      })

      const { container } = render(<SearchHistorySection />)

      expect(container.firstChild).toBeNull()
    })

    it('renders content after loading completes', async () => {
      mockUseConvexSearchHistory.mockReturnValue({
        entries: mockEntries,
        isLoading: true,
      })

      const { rerender } = render(<SearchHistorySection />)

      expect(screen.queryByText(/history/i)).not.toBeInTheDocument()

      // Finish loading
      mockUseConvexSearchHistory.mockReturnValue({
        entries: mockEntries,
        isLoading: false,
      })

      rerender(<SearchHistorySection />)

      await waitFor(() => {
        expect(screen.getByText(/history/i)).toBeInTheDocument()
      })
    })

    it('handles transition from loading to empty state', async () => {
      mockUseConvexSearchHistory.mockReturnValue({
        entries: [],
        isLoading: true,
      })

      const { rerender } = render(<SearchHistorySection />)

      mockUseConvexSearchHistory.mockReturnValue({
        entries: [],
        isLoading: false,
      })

      rerender(<SearchHistorySection />)

      await waitFor(() => {
        expect(screen.getByText(/history/i)).toBeInTheDocument()
        expect(screen.queryByText(/0/)).not.toBeInTheDocument()
      })
    })
  })

  describe('Hydration safety', () => {
    it('prevents hydration mismatch by checking mount state', async () => {
      const { container } = render(<SearchHistorySection />)

      // Component uses mount effect to prevent hydration issues
      // After mount, should render content
      await waitFor(() => {
        expect(screen.getByText(/history/i)).toBeInTheDocument()
      })
    })

    it('renders content after mount effect', async () => {
      render(<SearchHistorySection />)

      await waitFor(() => {
        expect(screen.getByText(/history/i)).toBeInTheDocument()
      })
    })
  })

  describe('Component integration', () => {
    it('renders SearchHistoryTabs child component', async () => {
      render(<SearchHistorySection />)

      await waitFor(() => {
        expect(screen.getByTestId('search-history-tabs')).toBeInTheDocument()
      })
    })

    it('renders StoragePopover child component', async () => {
      render(<SearchHistorySection />)

      await waitFor(() => {
        expect(screen.getByTestId('storage-popover')).toBeInTheDocument()
      })
    })

    it('places storage popover next to header', async () => {
      render(<SearchHistorySection />)

      await waitFor(() => {
        const header = screen.getByRole('button', { name: /history/i })
        const popover = screen.getByTestId('storage-popover')
        expect(header).toBeInTheDocument()
        expect(popover).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('has accessible button role for trigger', async () => {
      render(<SearchHistorySection />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /history/i })).toBeInTheDocument()
      })
    })

    it('trigger button is keyboard accessible', async () => {
      render(<SearchHistorySection />)

      const trigger = await screen.findByRole('button', { name: /history/i })

      trigger.focus()
      expect(trigger).toHaveFocus()

      // Use user event for more realistic keyboard interaction
      await user.keyboard('{Enter}')

      expect(trigger).toHaveAttribute('aria-expanded', 'false')
    })

    it('has proper button variant styling', async () => {
      render(<SearchHistorySection />)

      const trigger = await screen.findByRole('button', { name: /history/i })
      expect(trigger).toHaveAttribute('data-variant', 'ghost')
    })
  })

  describe('Empty state', () => {
    it('renders without badge when no entries', async () => {
      mockUseConvexSearchHistory.mockReturnValue({
        entries: [],
        isLoading: false,
      })

      render(<SearchHistorySection />)

      await waitFor(() => {
        expect(screen.getByText(/history/i)).toBeInTheDocument()
      })

      expect(screen.queryByText('0')).not.toBeInTheDocument()
    })

    it('still renders tabs component when no entries', async () => {
      mockUseConvexSearchHistory.mockReturnValue({
        entries: [],
        isLoading: false,
      })

      render(<SearchHistorySection />)

      await waitFor(() => {
        expect(screen.getByTestId('search-history-tabs')).toBeInTheDocument()
      })
    })
  })

  describe('Multiple entries', () => {
    it('displays correct count for multiple entries', async () => {
      const manyEntries = Array.from({ length: 15 }, (_, i) => ({
        ...mockEntries[0],
        _id: `entry${i}` as any,
      }))

      mockUseConvexSearchHistory.mockReturnValue({
        entries: manyEntries,
        isLoading: false,
      })

      render(<SearchHistorySection />)

      await waitFor(() => {
        expect(screen.getByText('15')).toBeInTheDocument()
      })
    })

    it('displays count for single entry', async () => {
      mockUseConvexSearchHistory.mockReturnValue({
        entries: [mockEntries[0]],
        isLoading: false,
      })

      render(<SearchHistorySection />)

      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument()
      })
    })
  })

  describe('Styling', () => {
    it('applies correct text color classes to trigger', async () => {
      render(<SearchHistorySection />)

      const trigger = await screen.findByRole('button', { name: /history/i })
      expect(trigger.className).toContain('text-muted-foreground')
      expect(trigger.className).toContain('hover:text-foreground')
    })

    it('applies gap spacing to trigger content', async () => {
      render(<SearchHistorySection />)

      const trigger = await screen.findByRole('button', { name: /history/i })
      expect(trigger.className).toContain('gap-2')
    })

    it('applies transition to caret icon', async () => {
      render(<SearchHistorySection />)

      const caret = await screen.findByText('CaretIcon')
      expect(caret.className).toContain('transition-transform')
      expect(caret.className).toContain('duration-200')
    })

    it('applies padding to collapsible content', async () => {
      render(<SearchHistorySection />)

      await waitFor(() => {
        const content = screen.getByTestId('search-history-tabs').parentElement
        expect(content?.className).toContain('pt-3')
      })
    })
  })
})
