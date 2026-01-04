import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryPresets } from '@/components/query-builder/QueryPresets'
import { useQueryBuilderStore } from '@/stores/queryBuilderStore'
import { useConvexCustomPresets } from '@/hooks'
import { QUERY_PRESETS, PRESET_CATEGORIES } from '@/config/queryPresets'

// Mock dependencies
vi.mock('@/stores/queryBuilderStore')
vi.mock('@/hooks', () => ({
  useConvexCustomPresets: vi.fn(),
}))

// Mock child components to isolate QueryPresets tests
vi.mock('@/components/query-builder/QuickPicks', () => ({
  QuickPicks: () => <div data-testid="quick-picks">QuickPicks</div>,
}))

vi.mock('@/components/query-builder/LocationSelector', () => ({
  LocationSelector: () => <div data-testid="location-selector">LocationSelector</div>,
}))

vi.mock('@/components/query-builder/CustomPresetDialog', () => ({
  CustomPresetDialog: ({ mode }: { mode: 'create' | 'edit' }) => (
    <div data-testid={`custom-preset-dialog-${mode}`}>CustomPresetDialog-{mode}</div>
  ),
}))

describe('QueryPresets', () => {
  // Mock store functions
  const mockTogglePreset = vi.fn()
  const mockClearPresets = vi.fn()
  const mockDeleteCustomPreset = vi.fn()

  // Mock store state
  const mockStoreState = {
    activePresetIds: [] as string[],
    togglePreset: mockTogglePreset,
    clearPresets: mockClearPresets,
  }

  // Mock custom presets hook
  const mockCustomPresets = {
    presets: [],
    deletePreset: mockDeleteCustomPreset,
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Setup default mocks
    vi.mocked(useQueryBuilderStore).mockImplementation((selector) => {
      return selector(mockStoreState as any)
    })

    vi.mocked(useConvexCustomPresets).mockReturnValue(mockCustomPresets as any)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders card with title and description', () => {
      render(<QueryPresets />)

      expect(screen.getByText('Query Presets')).toBeInTheDocument()
      expect(screen.getByText('Toggle presets to build your search query')).toBeInTheDocument()
    })

    it('renders search input', () => {
      render(<QueryPresets />)

      const searchInput = screen.getByPlaceholderText('Search presets...')
      expect(searchInput).toBeInTheDocument()
      expect(searchInput).toHaveAttribute('type', 'text')
    })

    it('renders accordion with category sections', () => {
      render(<QueryPresets />)

      // Check for category labels (excluding location which has its own selector)
      expect(screen.getByText('Content Type')).toBeInTheDocument()
      expect(screen.getByText('Seniority Level')).toBeInTheDocument()
      expect(screen.getByText('Function/Role')).toBeInTheDocument()
      expect(screen.getByText('Industry')).toBeInTheDocument()
      expect(screen.getByText('Exclusions')).toBeInTheDocument()
      expect(screen.getByText('My Presets')).toBeInTheDocument()
    })

    it('does not render Clear All button when no presets are active', () => {
      render(<QueryPresets />)

      expect(screen.queryByText(/Clear All/)).not.toBeInTheDocument()
    })

    it('renders Clear All button when presets are active', () => {
      mockStoreState.activePresetIds = ['type_profile', 'seniority_cxo']

      render(<QueryPresets />)

      expect(screen.getByText('Clear All (2)')).toBeInTheDocument()
    })
  })

  describe('Accordion Expand/Collapse', () => {
    it('expands first 2 categories by default (content_type, seniority)', () => {
      render(<QueryPresets />)

      // Content Type category should be expanded - check if presets are visible
      expect(screen.getByText('Profiles')).toBeInTheDocument()

      // Seniority category should be expanded
      expect(screen.getByText('C-Level')).toBeInTheDocument()
    })

    it('collapses category when trigger is clicked', async () => {
      const user = userEvent.setup()
      render(<QueryPresets />)

      // Find Content Type trigger and click it
      const contentTypeTrigger = screen.getByText('Content Type').closest('button')
      expect(contentTypeTrigger).toBeInTheDocument()

      // Content should be visible initially
      expect(screen.getByText('Profiles')).toBeInTheDocument()

      // Click to collapse
      await user.click(contentTypeTrigger!)

      // Content should be hidden
      await waitFor(() => {
        expect(screen.queryByText('Profiles')).not.toBeInTheDocument()
      })
    })

    it('expands category when trigger is clicked while collapsed', async () => {
      const user = userEvent.setup()
      render(<QueryPresets />)

      // Function category should be collapsed by default
      const functionTrigger = screen.getByText('Function/Role').closest('button')
      expect(functionTrigger).toBeInTheDocument()

      // Content should not be visible
      expect(screen.queryByText('Engineering')).not.toBeInTheDocument()

      // Click to expand
      await user.click(functionTrigger!)

      // Content should become visible
      await waitFor(() => {
        expect(screen.getByText('Engineering')).toBeInTheDocument()
      })
    })

    it('allows multiple categories to be expanded simultaneously', async () => {
      const user = userEvent.setup()
      render(<QueryPresets />)

      // Expand Function category
      const functionTrigger = screen.getByText('Function/Role').closest('button')
      await user.click(functionTrigger!)

      // Expand Industry category
      const industryTrigger = screen.getByText('Industry').closest('button')
      await user.click(industryTrigger!)

      // Both should be visible along with default expanded categories
      await waitFor(() => {
        expect(screen.getByText('Engineering')).toBeInTheDocument()
        expect(screen.getByText('Technology')).toBeInTheDocument()
        expect(screen.getByText('Profiles')).toBeInTheDocument()
        expect(screen.getByText('C-Level')).toBeInTheDocument()
      })
    })
  })

  describe('Category Display', () => {
    it('displays all preset categories except location', () => {
      render(<QueryPresets />)

      const categories = Object.keys(PRESET_CATEGORIES).filter(cat => cat !== 'location')

      categories.forEach(category => {
        const config = PRESET_CATEGORIES[category as keyof typeof PRESET_CATEGORIES]
        expect(screen.getByText(config.label)).toBeInTheDocument()
      })
    })

    it('displays category description in expanded accordion', async () => {
      const user = userEvent.setup()
      render(<QueryPresets />)

      // Content Type is expanded by default
      expect(screen.getByText('LinkedIn content types to search')).toBeInTheDocument()

      // Expand Function category
      const functionTrigger = screen.getByText('Function/Role').closest('button')
      await user.click(functionTrigger!)

      await waitFor(() => {
        expect(screen.getByText('Common job functions')).toBeInTheDocument()
      })
    })

    it('shows active preset count badge on category header', () => {
      mockStoreState.activePresetIds = ['type_profile', 'seniority_cxo', 'seniority_vp']

      render(<QueryPresets />)

      // Content Type should show badge with count 1
      const contentTypeSection = screen.getByText('Content Type').closest('button')
      expect(within(contentTypeSection!).getByText('1')).toBeInTheDocument()

      // Seniority should show badge with count 2
      const senioritySection = screen.getByText('Seniority Level').closest('button')
      expect(within(senioritySection!).getByText('2')).toBeInTheDocument()
    })

    it('does not show badge when no presets are active in category', () => {
      mockStoreState.activePresetIds = []

      render(<QueryPresets />)

      const contentTypeSection = screen.getByText('Content Type').closest('button')
      const badges = within(contentTypeSection!).queryAllByText(/^[0-9]+$/)
      expect(badges.length).toBe(0)
    })
  })

  describe('Preset Items', () => {
    it('displays preset labels in category', () => {
      render(<QueryPresets />)

      // Content Type presets (default expanded)
      expect(screen.getByText('Profiles')).toBeInTheDocument()
      expect(screen.getByText('Companies')).toBeInTheDocument()
      expect(screen.getByText('Posts')).toBeInTheDocument()
      expect(screen.getByText('Jobs')).toBeInTheDocument()
    })

    it('displays preset description as tooltip title', () => {
      render(<QueryPresets />)

      const profilePreset = screen.getByText('Profiles')
      expect(profilePreset).toHaveAttribute('title', 'LinkedIn user profiles')
    })

    it('renders all presets for expanded category', async () => {
      const user = userEvent.setup()
      render(<QueryPresets />)

      // Expand Seniority category (already expanded by default)
      const seniorityPresets = QUERY_PRESETS.filter(p => p.category === 'seniority')

      seniorityPresets.forEach(preset => {
        expect(screen.getByText(preset.label)).toBeInTheDocument()
      })
    })
  })

  describe('Checkbox Selection', () => {
    it('toggles preset when clicked', async () => {
      const user = userEvent.setup()
      render(<QueryPresets />)

      const profilePreset = screen.getByText('Profiles')
      await user.click(profilePreset)

      expect(mockTogglePreset).toHaveBeenCalledWith('type_profile')
    })

    it('shows active state for selected preset', () => {
      mockStoreState.activePresetIds = ['type_profile']

      render(<QueryPresets />)

      const profilePreset = screen.getByText('Profiles')
      // Active presets have data-state="on" in ToggleGroupItem
      const toggleItem = profilePreset.closest('[data-state]')
      expect(toggleItem).toHaveAttribute('data-state', 'on')
    })

    it('shows inactive state for unselected preset', () => {
      mockStoreState.activePresetIds = []

      render(<QueryPresets />)

      const profilePreset = screen.getByText('Profiles')
      const toggleItem = profilePreset.closest('[data-state]')
      expect(toggleItem).toHaveAttribute('data-state', 'off')
    })

    it('deselects active preset when clicked again', async () => {
      const user = userEvent.setup()
      mockStoreState.activePresetIds = ['type_profile']

      render(<QueryPresets />)

      const profilePreset = screen.getByText('Profiles')
      await user.click(profilePreset)

      expect(mockTogglePreset).toHaveBeenCalledWith('type_profile')
    })
  })

  describe('Multiple Selection', () => {
    it('allows multiple presets to be selected in multi-select category', async () => {
      const user = userEvent.setup()
      render(<QueryPresets />)

      // Select multiple seniority presets
      const cxoPreset = screen.getByText('C-Level')
      const vpPreset = screen.getByText('VP/Director')

      await user.click(cxoPreset)
      await user.click(vpPreset)

      expect(mockTogglePreset).toHaveBeenCalledWith('seniority_cxo')
      expect(mockTogglePreset).toHaveBeenCalledWith('seniority_vp')
    })

    it('allows presets from different categories to be selected', async () => {
      const user = userEvent.setup()
      render(<QueryPresets />)

      const profilePreset = screen.getByText('Profiles')
      const cxoPreset = screen.getByText('C-Level')

      await user.click(profilePreset)
      await user.click(cxoPreset)

      expect(mockTogglePreset).toHaveBeenCalledWith('type_profile')
      expect(mockTogglePreset).toHaveBeenCalledWith('seniority_cxo')
    })

    it('displays all active presets correctly', () => {
      mockStoreState.activePresetIds = ['type_profile', 'seniority_cxo', 'seniority_vp']

      render(<QueryPresets />)

      const profilePreset = screen.getByText('Profiles')
      const cxoPreset = screen.getByText('C-Level')
      const vpPreset = screen.getByText('VP/Director')

      expect(profilePreset.closest('[data-state]')).toHaveAttribute('data-state', 'on')
      expect(cxoPreset.closest('[data-state]')).toHaveAttribute('data-state', 'on')
      expect(vpPreset.closest('[data-state]')).toHaveAttribute('data-state', 'on')
    })
  })

  describe('Active Presets', () => {
    it('updates Clear All button count when presets are active', () => {
      mockStoreState.activePresetIds = ['type_profile', 'seniority_cxo', 'function_engineering']

      render(<QueryPresets />)

      expect(screen.getByText('Clear All (3)')).toBeInTheDocument()
    })

    it('calls clearPresets when Clear All button is clicked', async () => {
      const user = userEvent.setup()
      mockStoreState.activePresetIds = ['type_profile', 'seniority_cxo']

      render(<QueryPresets />)

      const clearButton = screen.getByText('Clear All (2)')
      await user.click(clearButton)

      expect(mockClearPresets).toHaveBeenCalledTimes(1)
    })

    it('shows active state across multiple categories', () => {
      mockStoreState.activePresetIds = [
        'type_profile',
        'seniority_cxo',
        'function_engineering',
        'industry_tech'
      ]

      render(<QueryPresets />)

      // Check badges on category headers
      const contentTypeHeader = screen.getByText('Content Type').closest('button')
      expect(within(contentTypeHeader!).getByText('1')).toBeInTheDocument()

      const seniorityHeader = screen.getByText('Seniority Level').closest('button')
      expect(within(seniorityHeader!).getByText('1')).toBeInTheDocument()
    })
  })

  describe('Custom Presets', () => {
    it('displays My Presets section', () => {
      render(<QueryPresets />)

      expect(screen.getByText('My Presets')).toBeInTheDocument()
    })

    it('shows custom preset count badge', () => {
      mockCustomPresets.presets = [
        {
          _id: 'custom1' as any,
          category: 'custom',
          label: 'Custom 1',
          description: 'Test custom preset',
          queryFragment: 'custom query'
        },
        {
          _id: 'custom2' as any,
          category: 'custom',
          label: 'Custom 2',
          description: 'Test custom preset 2',
          queryFragment: 'custom query 2'
        }
      ]

      render(<QueryPresets />)

      const myPresetsHeader = screen.getByText('My Presets').closest('button')
      expect(within(myPresetsHeader!).getByText('2')).toBeInTheDocument()
    })

    it('displays custom presets in list', async () => {
      const user = userEvent.setup()
      mockCustomPresets.presets = [
        {
          _id: 'custom1' as any,
          category: 'custom',
          label: 'Senior Python Dev',
          description: 'Senior Python developers',
          queryFragment: '("Python" AND "Senior")'
        }
      ]

      render(<QueryPresets />)

      // Expand My Presets
      const myPresetsHeader = screen.getByText('My Presets').closest('button')
      await user.click(myPresetsHeader!)

      await waitFor(() => {
        expect(screen.getByText('Senior Python Dev')).toBeInTheDocument()
      })
    })

    it('shows empty state when no custom presets exist', async () => {
      const user = userEvent.setup()
      mockCustomPresets.presets = []

      render(<QueryPresets />)

      // Expand My Presets
      const myPresetsHeader = screen.getByText('My Presets').closest('button')
      await user.click(myPresetsHeader!)

      await waitFor(() => {
        expect(screen.getByText('No custom presets yet')).toBeInTheDocument()
      })
    })

    it('displays create custom preset dialog trigger', async () => {
      const user = userEvent.setup()
      render(<QueryPresets />)

      // Expand My Presets
      const myPresetsHeader = screen.getByText('My Presets').closest('button')
      await user.click(myPresetsHeader!)

      await waitFor(() => {
        expect(screen.getByTestId('custom-preset-dialog-create')).toBeInTheDocument()
      })
    })

    it('toggles custom preset when clicked', async () => {
      const user = userEvent.setup()
      mockCustomPresets.presets = [
        {
          _id: 'custom1' as any,
          category: 'custom',
          label: 'Senior Python Dev',
          description: 'Senior Python developers',
          queryFragment: '("Python" AND "Senior")'
        }
      ]

      render(<QueryPresets />)

      // Expand My Presets
      const myPresetsHeader = screen.getByText('My Presets').closest('button')
      await user.click(myPresetsHeader!)

      await waitFor(async () => {
        const customPreset = screen.getByText('Senior Python Dev')
        await user.click(customPreset)

        expect(mockTogglePreset).toHaveBeenCalledWith('custom1')
      })
    })

    it('shows active state for selected custom preset', async () => {
      const user = userEvent.setup()
      mockStoreState.activePresetIds = ['custom1']
      mockCustomPresets.presets = [
        {
          _id: 'custom1' as any,
          category: 'custom',
          label: 'Senior Python Dev',
          description: 'Senior Python developers',
          queryFragment: '("Python" AND "Senior")'
        }
      ]

      render(<QueryPresets />)

      // Expand My Presets
      const myPresetsHeader = screen.getByText('My Presets').closest('button')
      await user.click(myPresetsHeader!)

      await waitFor(() => {
        const customPreset = screen.getByText('Senior Python Dev')
        // Active custom presets use default button variant
        expect(customPreset).toBeInTheDocument()
      })
    })
  })

  describe('Edit Custom Preset', () => {
    it('displays edit button for custom preset', async () => {
      const user = userEvent.setup()
      mockCustomPresets.presets = [
        {
          _id: 'custom1' as any,
          category: 'custom',
          label: 'Senior Python Dev',
          description: 'Senior Python developers',
          queryFragment: '("Python" AND "Senior")'
        }
      ]

      render(<QueryPresets />)

      // Expand My Presets
      const myPresetsHeader = screen.getByText('My Presets').closest('button')
      await user.click(myPresetsHeader!)

      await waitFor(() => {
        expect(screen.getByTestId('custom-preset-dialog-edit')).toBeInTheDocument()
      })
    })
  })

  describe('Delete Custom Preset', () => {
    it('displays delete button for custom preset', async () => {
      const user = userEvent.setup()
      mockCustomPresets.presets = [
        {
          _id: 'custom1' as any,
          category: 'custom',
          label: 'Senior Python Dev',
          description: 'Senior Python developers',
          queryFragment: '("Python" AND "Senior")'
        }
      ]

      render(<QueryPresets />)

      // Expand My Presets
      const myPresetsHeader = screen.getByText('My Presets').closest('button')
      await user.click(myPresetsHeader!)

      await waitFor(() => {
        const deleteButton = screen.getByTitle('Delete preset')
        expect(deleteButton).toBeInTheDocument()
      })
    })

    it('calls deletePreset when delete button is clicked', async () => {
      const user = userEvent.setup()
      mockCustomPresets.presets = [
        {
          _id: 'custom1' as any,
          category: 'custom',
          label: 'Senior Python Dev',
          description: 'Senior Python developers',
          queryFragment: '("Python" AND "Senior")'
        }
      ]

      render(<QueryPresets />)

      // Expand My Presets
      const myPresetsHeader = screen.getByText('My Presets').closest('button')
      await user.click(myPresetsHeader!)

      await waitFor(async () => {
        const deleteButton = screen.getByTitle('Delete preset')
        await user.click(deleteButton)

        expect(mockDeleteCustomPreset).toHaveBeenCalledWith('custom1')
      })
    })
  })

  describe('Search/Filter', () => {
    it('filters presets by label', async () => {
      const user = userEvent.setup()
      render(<QueryPresets />)

      const searchInput = screen.getByPlaceholderText('Search presets...')
      await user.type(searchInput, 'Profile')

      // Should show Profiles preset
      expect(screen.getByText('Profiles')).toBeInTheDocument()

      // Should not show unrelated presets
      expect(screen.queryByText('Companies')).not.toBeInTheDocument()
    })

    it('filters presets by description', async () => {
      const user = userEvent.setup()
      render(<QueryPresets />)

      const searchInput = screen.getByPlaceholderText('Search presets...')
      await user.type(searchInput, 'CEO')

      // C-Level preset has "CEO" in description
      expect(screen.getByText('C-Level')).toBeInTheDocument()
    })

    it('is case-insensitive when filtering', async () => {
      const user = userEvent.setup()
      render(<QueryPresets />)

      const searchInput = screen.getByPlaceholderText('Search presets...')
      await user.type(searchInput, 'profile')

      expect(screen.getByText('Profiles')).toBeInTheDocument()
    })

    it('hides categories with no matching presets', async () => {
      const user = userEvent.setup()
      render(<QueryPresets />)

      const searchInput = screen.getByPlaceholderText('Search presets...')
      await user.type(searchInput, 'CEO')

      // Should show Seniority category (has C-Level with CEO)
      expect(screen.getByText('Seniority Level')).toBeInTheDocument()

      // Should not show Content Type category
      expect(screen.queryByText('Content Type')).not.toBeInTheDocument()
    })

    it('shows "No presets found" when search has no results', async () => {
      const user = userEvent.setup()
      render(<QueryPresets />)

      const searchInput = screen.getByPlaceholderText('Search presets...')
      await user.type(searchInput, 'nonexistentpreset')

      expect(screen.getByText('No presets found')).toBeInTheDocument()
      expect(screen.getByText('Try a different search term')).toBeInTheDocument()
    })

    it('hides QuickPicks when searching', async () => {
      const user = userEvent.setup()
      render(<QueryPresets />)

      // QuickPicks should be visible initially
      expect(screen.getByTestId('quick-picks')).toBeInTheDocument()

      const searchInput = screen.getByPlaceholderText('Search presets...')
      await user.type(searchInput, 'CEO')

      // QuickPicks should be hidden when searching
      expect(screen.queryByTestId('quick-picks')).not.toBeInTheDocument()
    })

    it('hides LocationSelector when searching', async () => {
      const user = userEvent.setup()
      render(<QueryPresets />)

      // LocationSelector should be visible initially
      expect(screen.getByTestId('location-selector')).toBeInTheDocument()

      const searchInput = screen.getByPlaceholderText('Search presets...')
      await user.type(searchInput, 'CEO')

      // LocationSelector should be hidden when searching
      expect(screen.queryByTestId('location-selector')).not.toBeInTheDocument()
    })

    it('shows all presets when search is cleared', async () => {
      const user = userEvent.setup()
      render(<QueryPresets />)

      const searchInput = screen.getByPlaceholderText('Search presets...')

      // Type search
      await user.type(searchInput, 'CEO')
      expect(screen.queryByText('Profiles')).not.toBeInTheDocument()

      // Clear search
      await user.clear(searchInput)

      // All categories should be visible again
      expect(screen.getByText('Content Type')).toBeInTheDocument()
      expect(screen.getByText('Profiles')).toBeInTheDocument()
    })
  })

  describe('Integration with Store', () => {
    it('reads active preset IDs from store', () => {
      mockStoreState.activePresetIds = ['type_profile', 'seniority_cxo']

      render(<QueryPresets />)

      // Verify the selector was called
      expect(useQueryBuilderStore).toHaveBeenCalled()

      // Verify active presets are displayed correctly
      expect(screen.getByText('Clear All (2)')).toBeInTheDocument()
    })

    it('calls togglePreset store action when preset is clicked', async () => {
      const user = userEvent.setup()
      render(<QueryPresets />)

      const profilePreset = screen.getByText('Profiles')
      await user.click(profilePreset)

      expect(mockTogglePreset).toHaveBeenCalledWith('type_profile')
      expect(mockTogglePreset).toHaveBeenCalledTimes(1)
    })

    it('calls clearPresets store action when Clear All is clicked', async () => {
      const user = userEvent.setup()
      mockStoreState.activePresetIds = ['type_profile']

      render(<QueryPresets />)

      const clearButton = screen.getByText('Clear All (1)')
      await user.click(clearButton)

      expect(mockClearPresets).toHaveBeenCalledTimes(1)
    })
  })

  describe('Integration with Custom Presets Hook', () => {
    it('reads custom presets from hook', () => {
      mockCustomPresets.presets = [
        {
          _id: 'custom1' as any,
          category: 'custom',
          label: 'Test Preset',
          description: 'Test',
          queryFragment: 'test'
        }
      ]

      render(<QueryPresets />)

      expect(useConvexCustomPresets).toHaveBeenCalled()
    })

    it('calls deletePreset from hook when delete is clicked', async () => {
      const user = userEvent.setup()
      mockCustomPresets.presets = [
        {
          _id: 'custom1' as any,
          category: 'custom',
          label: 'Test Preset',
          description: 'Test',
          queryFragment: 'test'
        }
      ]

      render(<QueryPresets />)

      // Expand My Presets
      const myPresetsHeader = screen.getByText('My Presets').closest('button')
      await user.click(myPresetsHeader!)

      await waitFor(async () => {
        const deleteButton = screen.getByTitle('Delete preset')
        await user.click(deleteButton)

        expect(mockDeleteCustomPreset).toHaveBeenCalledWith('custom1')
      })
    })
  })

  describe('Empty States', () => {
    it('shows empty state in My Presets when no custom presets exist', async () => {
      const user = userEvent.setup()
      mockCustomPresets.presets = []

      render(<QueryPresets />)

      const myPresetsHeader = screen.getByText('My Presets').closest('button')
      await user.click(myPresetsHeader!)

      await waitFor(() => {
        expect(screen.getByText('No custom presets yet')).toBeInTheDocument()
      })
    })

    it('shows no results message when search has no matches', async () => {
      const user = userEvent.setup()
      render(<QueryPresets />)

      const searchInput = screen.getByPlaceholderText('Search presets...')
      await user.type(searchInput, 'zzzznonexistent')

      expect(screen.getByText('No presets found')).toBeInTheDocument()
      expect(screen.getByText('Try a different search term')).toBeInTheDocument()
    })

    it('does not show My Presets badge when no custom presets exist', () => {
      mockCustomPresets.presets = []

      render(<QueryPresets />)

      const myPresetsHeader = screen.getByText('My Presets').closest('button')
      expect(within(myPresetsHeader!).queryByText(/[0-9]+/)).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has accessible search input', () => {
      render(<QueryPresets />)

      const searchInput = screen.getByPlaceholderText('Search presets...')
      expect(searchInput).toHaveAttribute('type', 'text')
      expect(searchInput).toBeInTheDocument()
    })

    it('provides title tooltips for presets', () => {
      render(<QueryPresets />)

      const profilePreset = screen.getByText('Profiles')
      expect(profilePreset).toHaveAttribute('title', 'LinkedIn user profiles')
    })

    it('has accessible accordion triggers', () => {
      render(<QueryPresets />)

      const contentTypeTrigger = screen.getByText('Content Type').closest('button')
      expect(contentTypeTrigger).toHaveAttribute('type', 'button')
    })

    it('provides title for delete button', async () => {
      const user = userEvent.setup()
      mockCustomPresets.presets = [
        {
          _id: 'custom1' as any,
          category: 'custom',
          label: 'Test',
          description: 'Test',
          queryFragment: 'test'
        }
      ]

      render(<QueryPresets />)

      const myPresetsHeader = screen.getByText('My Presets').closest('button')
      await user.click(myPresetsHeader!)

      await waitFor(() => {
        const deleteButton = screen.getByTitle('Delete preset')
        expect(deleteButton).toBeInTheDocument()
      })
    })
  })
})
