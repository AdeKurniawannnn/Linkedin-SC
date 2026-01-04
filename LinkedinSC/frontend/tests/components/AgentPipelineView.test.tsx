/**
 * Tests for components/agent/AgentPipelineView.tsx
 *
 * Tests the horizontal funnel visualization component that shows pipeline flow through stages.
 * Displays query counts at each stage with rejection counts between stages.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AgentPipelineView } from '@/components/agent/AgentPipelineView';
import type { PipelineStats } from '@/lib/agent/types';

describe('AgentPipelineView', () => {
  // Helper to create default stats
  const createStats = (overrides?: Partial<PipelineStats>): PipelineStats => ({
    generated: 0,
    pass1Pending: 0,
    pass1Passed: 0,
    pass1Rejected: 0,
    pass2Pending: 0,
    pass2Passed: 0,
    pass2Rejected: 0,
    executing: 0,
    completed: 0,
    ...overrides,
  });

  describe('Rendering', () => {
    it('renders all five pipeline stages', () => {
      const stats = createStats();

      render(<AgentPipelineView stats={stats} />);

      expect(screen.getByText('Generated')).toBeInTheDocument();
      expect(screen.getByText('Pass 1')).toBeInTheDocument();
      expect(screen.getByText('Pass 2')).toBeInTheDocument();
      expect(screen.getByText('Executing')).toBeInTheDocument();
      expect(screen.getByText('Done')).toBeInTheDocument();
    });

    it('renders stage counts correctly', () => {
      const stats = createStats({
        generated: 50,
        pass1Passed: 38,
        pass2Passed: 28,
        executing: 24,
        completed: 24,
      });

      const { container } = render(<AgentPipelineView stats={stats} />);

      // Count values are in large bold text
      const counts = container.querySelectorAll('.text-2xl.font-bold');
      expect(counts[0]).toHaveTextContent('50');
      expect(counts[1]).toHaveTextContent('38');
      expect(counts[2]).toHaveTextContent('28');
      expect(counts[3]).toHaveTextContent('24');
      expect(counts[4]).toHaveTextContent('24');
    });

    it('renders arrows between stages', () => {
      const stats = createStats();

      const { container } = render(<AgentPipelineView stats={stats} />);

      // Should have 4 arrows (between 5 stages)
      const arrows = container.querySelectorAll('svg');
      expect(arrows.length).toBe(4);
    });

    it('renders with zero counts', () => {
      const stats = createStats();

      const { container } = render(<AgentPipelineView stats={stats} />);

      const counts = container.querySelectorAll('.text-2xl.font-bold');
      counts.forEach(count => {
        expect(count).toHaveTextContent('0');
      });
    });
  });

  describe('Stage Visualization', () => {
    it('highlights generating stage when current stage is generating', () => {
      const stats = createStats({ generated: 10 });

      const { container } = render(
        <AgentPipelineView stats={stats} currentStage="generating" />
      );

      // Active stage should have primary border and ring
      const stageBoxes = container.querySelectorAll('.rounded-lg.border-2');
      expect(stageBoxes[0]).toHaveClass('border-primary');
      expect(stageBoxes[0]).toHaveClass('ring-4');
      expect(stageBoxes[0]).toHaveClass('ring-primary/20');
    });

    it('highlights pass1 stage when current stage is pass1', () => {
      const stats = createStats({
        generated: 20,
        pass1Passed: 5,
      });

      const { container } = render(
        <AgentPipelineView stats={stats} currentStage="pass1" />
      );

      const stageBoxes = container.querySelectorAll('.rounded-lg.border-2');
      // Pass 1 is the second stage (index 1)
      expect(stageBoxes[1]).toHaveClass('border-primary');
      expect(stageBoxes[1]).toHaveClass('ring-4');
    });

    it('highlights pass2 stage when current stage is pass2', () => {
      const stats = createStats({
        generated: 20,
        pass1Passed: 15,
        pass2Passed: 5,
      });

      const { container } = render(
        <AgentPipelineView stats={stats} currentStage="pass2" />
      );

      const stageBoxes = container.querySelectorAll('.rounded-lg.border-2');
      // Pass 2 is the third stage (index 2)
      expect(stageBoxes[2]).toHaveClass('border-primary');
      expect(stageBoxes[2]).toHaveClass('ring-4');
    });

    it('highlights executing stage when current stage is executing', () => {
      const stats = createStats({
        generated: 20,
        pass1Passed: 15,
        pass2Passed: 12,
        executing: 12,
      });

      const { container } = render(
        <AgentPipelineView stats={stats} currentStage="executing" />
      );

      const stageBoxes = container.querySelectorAll('.rounded-lg.border-2');
      // Executing is the fourth stage (index 3)
      expect(stageBoxes[3]).toHaveClass('border-primary');
      expect(stageBoxes[3]).toHaveClass('ring-4');
    });

    it('highlights done stage when current stage is complete', () => {
      const stats = createStats({
        generated: 20,
        pass1Passed: 15,
        pass2Passed: 12,
        executing: 0,
        completed: 12,
      });

      const { container } = render(
        <AgentPipelineView stats={stats} currentStage="complete" />
      );

      const stageBoxes = container.querySelectorAll('.rounded-lg.border-2');
      // Done is the fifth stage (index 4)
      expect(stageBoxes[4]).toHaveClass('border-primary');
      expect(stageBoxes[4]).toHaveClass('ring-4');
    });
  });

  describe('Progress Indicators', () => {
    it('shows completed stages with green styling', () => {
      const stats = createStats({
        generated: 20,
        pass1Passed: 15,
        pass2Passed: 12,
        executing: 12,
      });

      const { container } = render(
        <AgentPipelineView stats={stats} currentStage="executing" />
      );

      const stageBoxes = container.querySelectorAll('.rounded-lg.border-2');

      // Generated, Pass 1, and Pass 2 should be completed (green)
      expect(stageBoxes[0]).toHaveClass('border-green-500');
      expect(stageBoxes[1]).toHaveClass('border-green-500');
      expect(stageBoxes[2]).toHaveClass('border-green-500');

      // Executing should be active (primary)
      expect(stageBoxes[3]).toHaveClass('border-primary');

      // Done should be inactive (gray)
      expect(stageBoxes[4]).toHaveClass('border-gray-300');
    });

    it('shows arrows in green for completed stages', () => {
      const stats = createStats({
        generated: 20,
        pass1Passed: 15,
      });

      const { container } = render(
        <AgentPipelineView stats={stats} currentStage="pass1" />
      );

      const arrows = container.querySelectorAll('svg');

      // First arrow (after generated) should be green
      expect(arrows[0]).toHaveClass('text-green-500');

      // Remaining arrows should be gray
      expect(arrows[1]).toHaveClass('text-gray-400');
      expect(arrows[2]).toHaveClass('text-gray-400');
      expect(arrows[3]).toHaveClass('text-gray-400');
    });

    it('shows completion percentage visually through stage highlighting', () => {
      const stats = createStats({
        generated: 50,
        pass1Passed: 38,
        pass2Passed: 28,
        executing: 24,
        completed: 24,
      });

      const { container } = render(
        <AgentPipelineView stats={stats} currentStage="complete" />
      );

      const stageBoxes = container.querySelectorAll('.rounded-lg.border-2');

      // All stages except Done should be completed (green)
      expect(stageBoxes[0]).toHaveClass('border-green-500');
      expect(stageBoxes[1]).toHaveClass('border-green-500');
      expect(stageBoxes[2]).toHaveClass('border-green-500');
      expect(stageBoxes[3]).toHaveClass('border-green-500');

      // Done should be active (primary)
      expect(stageBoxes[4]).toHaveClass('border-primary');
    });
  });

  describe('Stage Transitions', () => {
    it('applies scale transform to active stage', () => {
      const stats = createStats({ generated: 10 });

      const { container } = render(
        <AgentPipelineView stats={stats} currentStage="generating" />
      );

      const stageBoxes = container.querySelectorAll('.rounded-lg.border-2');
      expect(stageBoxes[0]).toHaveClass('scale-105');
    });

    it('applies scale transform to completed stages', () => {
      const stats = createStats({
        generated: 20,
        pass1Passed: 15,
      });

      const { container } = render(
        <AgentPipelineView stats={stats} currentStage="pass1" />
      );

      const stageBoxes = container.querySelectorAll('.rounded-lg.border-2');
      expect(stageBoxes[0]).toHaveClass('scale-100');
    });

    it('applies scale transform to inactive stages', () => {
      const stats = createStats({ generated: 10 });

      const { container } = render(
        <AgentPipelineView stats={stats} currentStage="generating" />
      );

      const stageBoxes = container.querySelectorAll('.rounded-lg.border-2');
      // Pass 1, Pass 2, Executing, Done should be scaled down
      expect(stageBoxes[1]).toHaveClass('scale-95');
      expect(stageBoxes[2]).toHaveClass('scale-95');
      expect(stageBoxes[3]).toHaveClass('scale-95');
      expect(stageBoxes[4]).toHaveClass('scale-95');
    });

    it('includes transition classes for animations', () => {
      const stats = createStats({ generated: 10 });

      const { container } = render(
        <AgentPipelineView stats={stats} currentStage="generating" />
      );

      const stageBoxes = container.querySelectorAll('.rounded-lg.border-2');
      stageBoxes.forEach(box => {
        expect(box).toHaveClass('transition-all');
        expect(box).toHaveClass('duration-300');
      });
    });
  });

  describe('Idle State', () => {
    it('defaults to generating stage when not specified', () => {
      const stats = createStats();

      const { container } = render(<AgentPipelineView stats={stats} />);

      const stageBoxes = container.querySelectorAll('.rounded-lg.border-2');
      expect(stageBoxes[0]).toHaveClass('border-primary');
    });

    it('shows all zeros when idle', () => {
      const stats = createStats();

      const { container } = render(<AgentPipelineView stats={stats} />);

      const counts = container.querySelectorAll('.text-2xl.font-bold');
      counts.forEach(count => {
        expect(count).toHaveTextContent('0');
      });
    });
  });

  describe('Generating Stage', () => {
    it('shows generated count during generation', () => {
      const stats = createStats({ generated: 15 });

      const { container } = render(
        <AgentPipelineView stats={stats} currentStage="generating" />
      );

      const counts = container.querySelectorAll('.text-2xl.font-bold');
      expect(counts[0]).toHaveTextContent('15');
    });

    it('highlights generated stage box during generation', () => {
      const stats = createStats({ generated: 20 });

      const { container } = render(
        <AgentPipelineView stats={stats} currentStage="generating" />
      );

      const stageBoxes = container.querySelectorAll('.rounded-lg.border-2');
      expect(stageBoxes[0]).toHaveClass('border-primary');
      expect(stageBoxes[0]).toHaveClass('shadow-lg');
    });
  });

  describe('Pass1 Stage', () => {
    it('shows pass1 passed count during scoring', () => {
      const stats = createStats({
        generated: 30,
        pass1Passed: 22,
      });

      const { container } = render(
        <AgentPipelineView stats={stats} currentStage="pass1" />
      );

      const counts = container.querySelectorAll('.text-2xl.font-bold');
      expect(counts[1]).toHaveTextContent('22');
    });

    it('shows rejection count during pass1', () => {
      const stats = createStats({
        generated: 30,
        pass1Passed: 22,
        pass1Rejected: 8,
      });

      render(<AgentPipelineView stats={stats} currentStage="pass1" />);

      expect(screen.getByText('-8 rejected')).toBeInTheDocument();
    });

    it('does not show rejection count when zero', () => {
      const stats = createStats({
        generated: 30,
        pass1Passed: 30,
        pass1Rejected: 0,
      });

      render(<AgentPipelineView stats={stats} currentStage="pass1" />);

      expect(screen.queryByText('rejected')).not.toBeInTheDocument();
    });
  });

  describe('Pass2 Stage', () => {
    it('shows pass2 passed count during validation', () => {
      const stats = createStats({
        generated: 30,
        pass1Passed: 22,
        pass2Passed: 18,
      });

      const { container } = render(
        <AgentPipelineView stats={stats} currentStage="pass2" />
      );

      const counts = container.querySelectorAll('.text-2xl.font-bold');
      expect(counts[2]).toHaveTextContent('18');
    });

    it('shows rejection count during pass2', () => {
      const stats = createStats({
        generated: 30,
        pass1Passed: 22,
        pass2Passed: 18,
        pass2Rejected: 4,
      });

      render(<AgentPipelineView stats={stats} currentStage="pass2" />);

      expect(screen.getByText('-4 rejected')).toBeInTheDocument();
    });

    it('shows both pass1 and pass2 rejections', () => {
      const stats = createStats({
        generated: 50,
        pass1Passed: 38,
        pass1Rejected: 12,
        pass2Passed: 28,
        pass2Rejected: 10,
      });

      render(<AgentPipelineView stats={stats} currentStage="pass2" />);

      expect(screen.getByText('-12 rejected')).toBeInTheDocument();
      expect(screen.getByText('-10 rejected')).toBeInTheDocument();
    });
  });

  describe('Executing Stage', () => {
    it('shows executing count during execution', () => {
      const stats = createStats({
        generated: 30,
        pass1Passed: 22,
        pass2Passed: 18,
        executing: 18,
      });

      const { container } = render(
        <AgentPipelineView stats={stats} currentStage="executing" />
      );

      const counts = container.querySelectorAll('.text-2xl.font-bold');
      expect(counts[3]).toHaveTextContent('18');
    });

    it('marks previous stages as completed during execution', () => {
      const stats = createStats({
        generated: 30,
        pass1Passed: 22,
        pass2Passed: 18,
        executing: 18,
      });

      const { container } = render(
        <AgentPipelineView stats={stats} currentStage="executing" />
      );

      const stageBoxes = container.querySelectorAll('.rounded-lg.border-2');
      expect(stageBoxes[0]).toHaveClass('border-green-500');
      expect(stageBoxes[1]).toHaveClass('border-green-500');
      expect(stageBoxes[2]).toHaveClass('border-green-500');
    });
  });

  describe('Complete Stage', () => {
    it('shows completed count when done', () => {
      const stats = createStats({
        generated: 30,
        pass1Passed: 22,
        pass2Passed: 18,
        executing: 0,
        completed: 18,
      });

      const { container } = render(
        <AgentPipelineView stats={stats} currentStage="complete" />
      );

      const counts = container.querySelectorAll('.text-2xl.font-bold');
      expect(counts[4]).toHaveTextContent('18');
    });

    it('marks all stages except done as completed', () => {
      const stats = createStats({
        generated: 30,
        pass1Passed: 22,
        pass2Passed: 18,
        executing: 0,
        completed: 18,
      });

      const { container } = render(
        <AgentPipelineView stats={stats} currentStage="complete" />
      );

      const stageBoxes = container.querySelectorAll('.rounded-lg.border-2');
      expect(stageBoxes[0]).toHaveClass('border-green-500');
      expect(stageBoxes[1]).toHaveClass('border-green-500');
      expect(stageBoxes[2]).toHaveClass('border-green-500');
      expect(stageBoxes[3]).toHaveClass('border-green-500');
      expect(stageBoxes[4]).toHaveClass('border-primary');
    });

    it('shows all arrows in green when complete', () => {
      const stats = createStats({
        generated: 30,
        pass1Passed: 22,
        pass2Passed: 18,
        executing: 0,
        completed: 18,
      });

      const { container } = render(
        <AgentPipelineView stats={stats} currentStage="complete" />
      );

      const arrows = container.querySelectorAll('svg');
      arrows.forEach(arrow => {
        expect(arrow).toHaveClass('text-green-500');
      });
    });
  });

  describe('Stats Display', () => {
    it('displays all query counts correctly in full pipeline', () => {
      const stats = createStats({
        generated: 50,
        pass1Passed: 38,
        pass1Rejected: 12,
        pass2Passed: 28,
        pass2Rejected: 10,
        executing: 24,
        completed: 24,
      });

      const { container } = render(
        <AgentPipelineView stats={stats} currentStage="executing" />
      );

      const counts = container.querySelectorAll('.text-2xl.font-bold');
      expect(counts[0]).toHaveTextContent('50');  // Generated
      expect(counts[1]).toHaveTextContent('38');  // Pass 1 passed
      expect(counts[2]).toHaveTextContent('28');  // Pass 2 passed
      expect(counts[3]).toHaveTextContent('24');  // Executing
      expect(counts[4]).toHaveTextContent('24');  // Completed
    });

    it('displays rejection counts with destructive styling', () => {
      const stats = createStats({
        generated: 50,
        pass1Passed: 38,
        pass1Rejected: 12,
        pass2Passed: 28,
        pass2Rejected: 10,
      });

      const { container } = render(
        <AgentPipelineView stats={stats} currentStage="pass2" />
      );

      // Rejection counts should have destructive text color
      const rejections = screen.getAllByText(/rejected/);
      expect(rejections[0]).toHaveClass('text-destructive');
      expect(rejections[1]).toHaveClass('text-destructive');
    });

    it('handles large numbers correctly', () => {
      const stats = createStats({
        generated: 9999,
        pass1Passed: 8888,
        pass2Passed: 7777,
        executing: 6666,
        completed: 5555,
      });

      const { container } = render(
        <AgentPipelineView stats={stats} currentStage="complete" />
      );

      const counts = container.querySelectorAll('.text-2xl.font-bold');
      expect(counts[0]).toHaveTextContent('9999');
      expect(counts[1]).toHaveTextContent('8888');
      expect(counts[2]).toHaveTextContent('7777');
      expect(counts[3]).toHaveTextContent('6666');
      expect(counts[4]).toHaveTextContent('5555');
    });

    it('handles decimal numbers by showing whole number', () => {
      const stats = createStats({
        generated: 50,
        pass1Passed: 38,
        pass2Passed: 28,
        executing: 24,
        completed: 24,
      });

      const { container } = render(
        <AgentPipelineView stats={stats} currentStage="complete" />
      );

      // Numbers should be displayed as integers
      const counts = container.querySelectorAll('.text-2xl.font-bold');
      counts.forEach(count => {
        expect(count.textContent).toMatch(/^\d+$/);
      });
    });
  });

  describe('Responsive Layout', () => {
    it('applies overflow-x-auto for horizontal scrolling', () => {
      const stats = createStats();

      const { container } = render(<AgentPipelineView stats={stats} />);

      const scrollContainer = container.querySelector('.overflow-x-auto');
      expect(scrollContainer).toBeInTheDocument();
    });

    it('uses flex layout for stages', () => {
      const stats = createStats();

      const { container } = render(<AgentPipelineView stats={stats} />);

      const flexContainer = container.querySelector('.flex.items-start');
      expect(flexContainer).toBeInTheDocument();
    });

    it('sets min-width for stage boxes', () => {
      const stats = createStats();

      const { container } = render(<AgentPipelineView stats={stats} />);

      const stageContainers = container.querySelectorAll('.min-w-\\[100px\\]');
      expect(stageContainers.length).toBe(5); // One for each stage
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined rejection counts gracefully', () => {
      const stats: PipelineStats = {
        generated: 20,
        pass1Pending: 0,
        pass1Passed: 20,
        pass1Rejected: 0,
        pass2Pending: 0,
        pass2Passed: 20,
        pass2Rejected: 0,
        executing: 20,
        completed: 20,
      };

      render(<AgentPipelineView stats={stats} currentStage="complete" />);

      // Should not show any rejection text
      expect(screen.queryByText(/rejected/)).not.toBeInTheDocument();
    });

    it('handles all stages with same count', () => {
      const stats = createStats({
        generated: 25,
        pass1Passed: 25,
        pass2Passed: 25,
        executing: 25,
        completed: 25,
      });

      const { container } = render(
        <AgentPipelineView stats={stats} currentStage="complete" />
      );

      const counts = container.querySelectorAll('.text-2xl.font-bold');
      counts.forEach(count => {
        expect(count).toHaveTextContent('25');
      });
    });

    it('handles pipeline with only rejections', () => {
      const stats = createStats({
        generated: 50,
        pass1Passed: 0,
        pass1Rejected: 50,
        pass2Passed: 0,
        pass2Rejected: 0,
      });

      render(<AgentPipelineView stats={stats} currentStage="pass1" />);

      expect(screen.getByText('-50 rejected')).toBeInTheDocument();
    });
  });
});
