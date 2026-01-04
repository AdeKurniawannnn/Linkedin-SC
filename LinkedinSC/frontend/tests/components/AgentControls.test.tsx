/**
 * Test Suite for AgentControls Component
 *
 * Tests the pipeline control buttons including start, stop, pause, resume,
 * and generate more functionality with confirmation dialogs and state management.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AgentControls } from '@/components/agent/AgentControls'
import type { PipelineStage } from '@/stores/agentSessionStore'

describe('AgentControls', () => {
  // Mock handlers
  const mockOnPause = vi.fn()
  const mockOnResume = vi.fn()
  const mockOnStop = vi.fn()
  const mockOnGenerateMore = vi.fn()

  // Default props
  const defaultProps = {
    isRunning: false,
    isPaused: false,
    currentStage: 'idle' as PipelineStage,
    currentRound: 0,
    onPause: mockOnPause,
    onResume: mockOnResume,
    onStop: mockOnStop,
    onGenerateMore: mockOnGenerateMore,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render control buttons container', () => {
      const { container } = render(<AgentControls {...defaultProps} />)
      const controlsContainer = container.querySelector('.flex.items-center.gap-3')
      expect(controlsContainer).toBeTruthy()
    })

    it('should not render any buttons when pipeline is idle and round is 0', () => {
      render(<AgentControls {...defaultProps} />)

      expect(screen.queryByRole('button')).toBeNull()
    })

    it('should render round badge when currentRound > 0', () => {
      render(<AgentControls {...defaultProps} currentRound={3} />)

      expect(screen.getByText('Round 3')).toBeInTheDocument()
    })

    it('should not render round badge when currentRound is 0', () => {
      render(<AgentControls {...defaultProps} currentRound={0} />)

      expect(screen.queryByText(/Round/)).toBeNull()
    })

    it('should render pause button when running and not paused', () => {
      render(
        <AgentControls
          {...defaultProps}
          isRunning={true}
          isPaused={false}
          currentStage="generating"
          currentRound={1}
        />
      )

      expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument()
    })

    it('should render resume button when running and paused', () => {
      render(
        <AgentControls
          {...defaultProps}
          isRunning={true}
          isPaused={true}
          currentStage="generating"
          currentRound={1}
        />
      )

      expect(screen.getByRole('button', { name: /resume/i })).toBeInTheDocument()
    })

    it('should render stop button when running', () => {
      render(
        <AgentControls
          {...defaultProps}
          isRunning={true}
          currentStage="generating"
          currentRound={1}
        />
      )

      expect(screen.getByRole('button', { name: /stop/i })).toBeInTheDocument()
    })

    it('should render generate more button when complete', () => {
      render(
        <AgentControls
          {...defaultProps}
          isRunning={false}
          currentStage="idle"
          currentRound={1}
        />
      )

      expect(screen.getByRole('button', { name: /generate more/i })).toBeInTheDocument()
    })
  })

  describe('Pause Button', () => {
    it('should call onPause when pause button is clicked', () => {
      render(
        <AgentControls
          {...defaultProps}
          isRunning={true}
          isPaused={false}
          currentStage="generating"
          currentRound={1}
        />
      )

      const pauseButton = screen.getByRole('button', { name: /pause/i })
      fireEvent.click(pauseButton)

      expect(mockOnPause).toHaveBeenCalledTimes(1)
    })

    it('should not be shown when pipeline is complete', () => {
      render(
        <AgentControls
          {...defaultProps}
          isRunning={false}
          isPaused={false}
          currentStage="idle"
          currentRound={1}
        />
      )

      // When complete (idle + round > 0), pause button is not shown
      expect(screen.queryByRole('button', { name: /pause/i })).toBeNull()
    })

    it('should display pause icon', () => {
      render(
        <AgentControls
          {...defaultProps}
          isRunning={true}
          isPaused={false}
          currentStage="generating"
          currentRound={1}
        />
      )

      const pauseButton = screen.getByRole('button', { name: /pause/i })
      const icon = pauseButton.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })
  })

  describe('Resume Button', () => {
    it('should call onResume when resume button is clicked', () => {
      render(
        <AgentControls
          {...defaultProps}
          isRunning={true}
          isPaused={true}
          currentStage="pass1"
          currentRound={1}
        />
      )

      const resumeButton = screen.getByRole('button', { name: /resume/i })
      fireEvent.click(resumeButton)

      expect(mockOnResume).toHaveBeenCalledTimes(1)
    })

    it('should not be shown when stage is idle and complete', () => {
      render(
        <AgentControls
          {...defaultProps}
          isRunning={false}
          isPaused={false}
          currentStage="idle"
          currentRound={1}
        />
      )

      // When complete, resume button is not shown
      expect(screen.queryByRole('button', { name: /resume/i })).toBeNull()
    })

    it('should display play icon', () => {
      render(
        <AgentControls
          {...defaultProps}
          isRunning={true}
          isPaused={true}
          currentStage="pass1"
          currentRound={1}
        />
      )

      const resumeButton = screen.getByRole('button', { name: /resume/i })
      const icon = resumeButton.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })
  })

  describe('Stop Button', () => {
    it('should open confirmation dialog when stop button is clicked', async () => {
      render(
        <AgentControls
          {...defaultProps}
          isRunning={true}
          currentStage="generating"
          currentRound={1}
        />
      )

      const stopButton = screen.getByRole('button', { name: /stop/i })
      fireEvent.click(stopButton)

      await waitFor(() => {
        expect(screen.getByText('Stop Agent Pipeline?')).toBeInTheDocument()
      })
    })

    it('should display confirmation dialog description', async () => {
      render(
        <AgentControls
          {...defaultProps}
          isRunning={true}
          currentStage="generating"
          currentRound={1}
        />
      )

      const stopButton = screen.getByRole('button', { name: /stop/i })
      fireEvent.click(stopButton)

      await waitFor(() => {
        expect(
          screen.getByText(/This will stop the current round and cancel all pending operations/i)
        ).toBeInTheDocument()
      })
    })

    it('should call onStop when confirmation is clicked', async () => {
      render(
        <AgentControls
          {...defaultProps}
          isRunning={true}
          currentStage="generating"
          currentRound={1}
        />
      )

      // Click stop button to open dialog
      const stopButton = screen.getByRole('button', { name: /stop/i })
      fireEvent.click(stopButton)

      // Wait for dialog and click confirm
      await waitFor(() => {
        const confirmButton = screen.getByRole('button', { name: /stop pipeline/i })
        fireEvent.click(confirmButton)
      })

      expect(mockOnStop).toHaveBeenCalledTimes(1)
    })

    it('should not call onStop when cancel is clicked', async () => {
      render(
        <AgentControls
          {...defaultProps}
          isRunning={true}
          currentStage="generating"
          currentRound={1}
        />
      )

      // Click stop button to open dialog
      const stopButton = screen.getByRole('button', { name: /stop/i })
      fireEvent.click(stopButton)

      // Wait for dialog and click cancel
      await waitFor(() => {
        const cancelButton = screen.getByRole('button', { name: /cancel/i })
        fireEvent.click(cancelButton)
      })

      expect(mockOnStop).not.toHaveBeenCalled()
    })

    it('should close dialog after confirmation', async () => {
      render(
        <AgentControls
          {...defaultProps}
          isRunning={true}
          currentStage="generating"
          currentRound={1}
        />
      )

      // Click stop button to open dialog
      const stopButton = screen.getByRole('button', { name: /stop/i })
      fireEvent.click(stopButton)

      // Click confirm
      await waitFor(() => {
        const confirmButton = screen.getByRole('button', { name: /stop pipeline/i })
        fireEvent.click(confirmButton)
      })

      // Dialog should be closed
      await waitFor(() => {
        expect(screen.queryByText('Stop Agent Pipeline?')).not.toBeInTheDocument()
      })
    })

    it('should have destructive variant styling', () => {
      render(
        <AgentControls
          {...defaultProps}
          isRunning={true}
          currentStage="generating"
          currentRound={1}
        />
      )

      const stopButton = screen.getByRole('button', { name: /stop/i })
      expect(stopButton.className).toContain('destructive')
    })
  })

  describe('Generate More Button', () => {
    it('should call onGenerateMore when clicked', () => {
      render(
        <AgentControls
          {...defaultProps}
          isRunning={false}
          currentStage="idle"
          currentRound={1}
        />
      )

      const generateButton = screen.getByRole('button', { name: /generate more/i })
      fireEvent.click(generateButton)

      expect(mockOnGenerateMore).toHaveBeenCalledTimes(1)
    })

    it('should only show when pipeline is complete (idle + round > 0)', () => {
      const { rerender } = render(
        <AgentControls
          {...defaultProps}
          isRunning={false}
          currentStage="idle"
          currentRound={1}
        />
      )

      expect(screen.getByRole('button', { name: /generate more/i })).toBeInTheDocument()

      // Not shown when still running
      rerender(
        <AgentControls
          {...defaultProps}
          isRunning={true}
          currentStage="generating"
          currentRound={1}
        />
      )

      expect(screen.queryByRole('button', { name: /generate more/i })).toBeNull()
    })

    it('should display plus icon', () => {
      render(
        <AgentControls
          {...defaultProps}
          isRunning={false}
          currentStage="idle"
          currentRound={1}
        />
      )

      const generateButton = screen.getByRole('button', { name: /generate more/i })
      const icon = generateButton.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })

    it('should have default variant styling', () => {
      render(
        <AgentControls
          {...defaultProps}
          isRunning={false}
          currentStage="idle"
          currentRound={1}
        />
      )

      const generateButton = screen.getByRole('button', { name: /generate more/i })
      expect(generateButton.getAttribute('data-variant')).toBe('default')
    })
  })

  describe('Button States and Disabled States', () => {
    it('should not show pause/resume when stage is idle and complete', () => {
      render(
        <AgentControls
          {...defaultProps}
          isRunning={false}
          currentStage="idle"
          currentRound={1}
        />
      )

      // When complete, no pause/resume buttons
      expect(screen.queryByRole('button', { name: /pause/i })).toBeNull()
      expect(screen.queryByRole('button', { name: /resume/i })).toBeNull()
    })

    it('should not disable pause button during generating stage', () => {
      render(
        <AgentControls
          {...defaultProps}
          isRunning={true}
          isPaused={false}
          currentStage="generating"
          currentRound={1}
        />
      )

      const pauseButton = screen.getByRole('button', { name: /pause/i })
      expect(pauseButton).not.toBeDisabled()
    })

    it('should not disable pause button during pass1 stage', () => {
      render(
        <AgentControls
          {...defaultProps}
          isRunning={true}
          isPaused={false}
          currentStage="pass1"
          currentRound={1}
        />
      )

      const pauseButton = screen.getByRole('button', { name: /pause/i })
      expect(pauseButton).not.toBeDisabled()
    })

    it('should not disable pause button during pass2 stage', () => {
      render(
        <AgentControls
          {...defaultProps}
          isRunning={true}
          isPaused={false}
          currentStage="pass2"
          currentRound={1}
        />
      )

      const pauseButton = screen.getByRole('button', { name: /pause/i })
      expect(pauseButton).not.toBeDisabled()
    })

    it('should not disable pause button during executing stage', () => {
      render(
        <AgentControls
          {...defaultProps}
          isRunning={true}
          isPaused={false}
          currentStage="executing"
          currentRound={1}
        />
      )

      const pauseButton = screen.getByRole('button', { name: /pause/i })
      expect(pauseButton).not.toBeDisabled()
    })
  })

  describe('Progress Display', () => {
    it('should show current round number in badge', () => {
      render(<AgentControls {...defaultProps} currentRound={5} />)

      expect(screen.getByText('Round 5')).toBeInTheDocument()
    })

    it('should update round display when round changes', () => {
      const { rerender } = render(<AgentControls {...defaultProps} currentRound={1} />)

      expect(screen.getByText('Round 1')).toBeInTheDocument()

      rerender(<AgentControls {...defaultProps} currentRound={2} />)

      expect(screen.getByText('Round 2')).toBeInTheDocument()
      expect(screen.queryByText('Round 1')).toBeNull()
    })

    it('should have outline variant for round badge', () => {
      render(<AgentControls {...defaultProps} currentRound={1} />)

      const badge = screen.getByText('Round 1')
      expect(badge.getAttribute('data-slot')).toBe('badge')
    })
  })

  describe('State Transitions', () => {
    it('should toggle between pause and resume buttons', () => {
      const { rerender } = render(
        <AgentControls
          {...defaultProps}
          isRunning={true}
          isPaused={false}
          currentStage="generating"
          currentRound={1}
        />
      )

      expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /resume/i })).toBeNull()

      rerender(
        <AgentControls
          {...defaultProps}
          isRunning={true}
          isPaused={true}
          currentStage="generating"
          currentRound={1}
        />
      )

      expect(screen.queryByRole('button', { name: /pause/i })).toBeNull()
      expect(screen.getByRole('button', { name: /resume/i })).toBeInTheDocument()
    })

    it('should hide control buttons when pipeline completes', () => {
      const { rerender } = render(
        <AgentControls
          {...defaultProps}
          isRunning={true}
          currentStage="executing"
          currentRound={1}
        />
      )

      expect(screen.getByRole('button', { name: /stop/i })).toBeInTheDocument()

      rerender(
        <AgentControls
          {...defaultProps}
          isRunning={false}
          currentStage="idle"
          currentRound={1}
        />
      )

      expect(screen.queryByRole('button', { name: /stop/i })).toBeNull()
      expect(screen.queryByRole('button', { name: /pause/i })).toBeNull()
    })

    it('should show generate more button after completion', () => {
      const { rerender } = render(
        <AgentControls
          {...defaultProps}
          isRunning={true}
          currentStage="executing"
          currentRound={1}
        />
      )

      expect(screen.queryByRole('button', { name: /generate more/i })).toBeNull()

      rerender(
        <AgentControls
          {...defaultProps}
          isRunning={false}
          currentStage="idle"
          currentRound={1}
        />
      )

      expect(screen.getByRole('button', { name: /generate more/i })).toBeInTheDocument()
    })
  })

  describe('Multiple Interactions', () => {
    it('should handle multiple pause/resume cycles', () => {
      const { rerender } = render(
        <AgentControls
          {...defaultProps}
          isRunning={true}
          isPaused={false}
          currentStage="generating"
          currentRound={1}
        />
      )

      // Pause
      fireEvent.click(screen.getByRole('button', { name: /pause/i }))
      expect(mockOnPause).toHaveBeenCalledTimes(1)

      // Switch to paused state
      rerender(
        <AgentControls
          {...defaultProps}
          isRunning={true}
          isPaused={true}
          currentStage="generating"
          currentRound={1}
        />
      )

      // Resume
      fireEvent.click(screen.getByRole('button', { name: /resume/i }))
      expect(mockOnResume).toHaveBeenCalledTimes(1)

      // Switch back to running state
      rerender(
        <AgentControls
          {...defaultProps}
          isRunning={true}
          isPaused={false}
          currentStage="generating"
          currentRound={1}
        />
      )

      // Pause again
      fireEvent.click(screen.getByRole('button', { name: /pause/i }))
      expect(mockOnPause).toHaveBeenCalledTimes(2)
    })

    it('should handle stop dialog open/close multiple times', async () => {
      render(
        <AgentControls
          {...defaultProps}
          isRunning={true}
          currentStage="generating"
          currentRound={1}
        />
      )

      const stopButton = screen.getByRole('button', { name: /stop/i })

      // Open dialog
      fireEvent.click(stopButton)
      await waitFor(() => {
        expect(screen.getByText('Stop Agent Pipeline?')).toBeInTheDocument()
      })

      // Cancel
      fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
      await waitFor(() => {
        expect(screen.queryByText('Stop Agent Pipeline?')).not.toBeInTheDocument()
      })

      // Open again
      fireEvent.click(stopButton)
      await waitFor(() => {
        expect(screen.getByText('Stop Agent Pipeline?')).toBeInTheDocument()
      })

      // Confirm this time
      fireEvent.click(screen.getByRole('button', { name: /stop pipeline/i }))
      expect(mockOnStop).toHaveBeenCalledTimes(1)
    })

    it('should handle generate more multiple clicks', () => {
      render(
        <AgentControls
          {...defaultProps}
          isRunning={false}
          currentStage="idle"
          currentRound={1}
        />
      )

      const generateButton = screen.getByRole('button', { name: /generate more/i })

      fireEvent.click(generateButton)
      fireEvent.click(generateButton)
      fireEvent.click(generateButton)

      expect(mockOnGenerateMore).toHaveBeenCalledTimes(3)
    })
  })

  describe('Edge Cases', () => {
    it('should handle all pipeline stages correctly', () => {
      const stages: PipelineStage[] = ['generating', 'pass1', 'pass2', 'executing']

      stages.forEach((stage) => {
        const { unmount } = render(
          <AgentControls
            {...defaultProps}
            isRunning={true}
            currentStage={stage}
            currentRound={1}
          />
        )

        // All active stages should have pause button enabled
        const pauseButton = screen.getByRole('button', { name: /pause/i })
        expect(pauseButton).not.toBeDisabled()

        unmount()
      })

      // Test idle stage separately (shows Generate More instead)
      const { unmount: unmountIdle } = render(
        <AgentControls
          {...defaultProps}
          isRunning={false}
          currentStage="idle"
          currentRound={1}
        />
      )

      expect(screen.queryByRole('button', { name: /pause/i })).toBeNull()
      expect(screen.getByRole('button', { name: /generate more/i })).toBeInTheDocument()

      unmountIdle()
    })

    it('should handle round 0 correctly', () => {
      render(
        <AgentControls
          {...defaultProps}
          isRunning={false}
          currentStage="idle"
          currentRound={0}
        />
      )

      expect(screen.queryByText(/Round/)).toBeNull()
      expect(screen.queryByRole('button')).toBeNull()
    })

    it('should handle high round numbers', () => {
      render(<AgentControls {...defaultProps} currentRound={999} />)

      expect(screen.getByText('Round 999')).toBeInTheDocument()
    })

    it('should maintain button state during rapid prop changes', () => {
      const { rerender } = render(
        <AgentControls
          {...defaultProps}
          isRunning={true}
          currentStage="generating"
          currentRound={1}
        />
      )

      // Rapidly change stages
      const stages: PipelineStage[] = ['pass1', 'pass2', 'executing', 'generating']
      stages.forEach((stage) => {
        rerender(
          <AgentControls
            {...defaultProps}
            isRunning={true}
            currentStage={stage}
            currentRound={1}
          />
        )

        expect(screen.getByRole('button', { name: /stop/i })).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have accessible button labels', () => {
      render(
        <AgentControls
          {...defaultProps}
          isRunning={true}
          currentStage="generating"
          currentRound={1}
        />
      )

      expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /stop/i })).toBeInTheDocument()
    })

    it('should have accessible dialog elements', async () => {
      render(
        <AgentControls
          {...defaultProps}
          isRunning={true}
          currentStage="generating"
          currentRound={1}
        />
      )

      fireEvent.click(screen.getByRole('button', { name: /stop/i }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /stop pipeline/i })).toBeInTheDocument()
      })
    })

    it('should support keyboard navigation for buttons', () => {
      render(
        <AgentControls
          {...defaultProps}
          isRunning={true}
          currentStage="generating"
          currentRound={1}
        />
      )

      const pauseButton = screen.getByRole('button', { name: /pause/i })
      pauseButton.focus()

      expect(document.activeElement).toBe(pauseButton)
    })
  })
})
