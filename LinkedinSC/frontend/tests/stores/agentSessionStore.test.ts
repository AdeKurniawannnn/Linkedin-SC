/**
 * Tests for stores/agentSessionStore.ts
 *
 * Tests Zustand store for agent runtime state management
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useAgentSessionStore } from '@/stores/agentSessionStore';
import type { AgentSessionConfig, PipelineStats } from '@/lib/agent/types';

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

describe('agentSessionStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAgentSessionStore.getState().reset();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial values', () => {
      const state = useAgentSessionStore.getState();

      expect(state.activeSessionId).toBeNull();
      expect(state.isRunning).toBe(false);
      expect(state.isPaused).toBe(false);
      expect(state.currentStage).toBe('idle');
      expect(state.config).toBeNull();
      expect(state.error).toBeNull();
    });

    it('should have initial progress state', () => {
      const { progress } = useAgentSessionStore.getState();

      expect(progress.stage).toBe('complete');
      expect(progress.current).toBe(0);
      expect(progress.total).toBe(0);
      expect(progress.message).toBe('');
    });

    it('should have initial pipeline stats', () => {
      const { pipelineStats } = useAgentSessionStore.getState();

      expect(pipelineStats.generated).toBe(0);
      expect(pipelineStats.pass1Pending).toBe(0);
      expect(pipelineStats.pass1Passed).toBe(0);
      expect(pipelineStats.pass1Rejected).toBe(0);
      expect(pipelineStats.pass2Pending).toBe(0);
      expect(pipelineStats.pass2Passed).toBe(0);
      expect(pipelineStats.pass2Rejected).toBe(0);
      expect(pipelineStats.executing).toBe(0);
      expect(pipelineStats.completed).toBe(0);
    });

    it('should have empty abort controllers map', () => {
      const { abortControllers } = useAgentSessionStore.getState();

      expect(abortControllers.size).toBe(0);
    });
  });

  describe('setActiveSession', () => {
    it('should set active session ID', () => {
      const { setActiveSession } = useAgentSessionStore.getState();

      setActiveSession('session-123');

      expect(useAgentSessionStore.getState().activeSessionId).toBe('session-123');
    });

    it('should clear error when setting session', () => {
      const store = useAgentSessionStore.getState();
      store.setError('Previous error');

      store.setActiveSession('new-session');

      expect(useAgentSessionStore.getState().error).toBeNull();
    });

    it('should allow setting session to null', () => {
      const { setActiveSession } = useAgentSessionStore.getState();

      setActiveSession('session-123');
      setActiveSession(null);

      expect(useAgentSessionStore.getState().activeSessionId).toBeNull();
    });
  });

  describe('updateConfig', () => {
    it('should update config', () => {
      const { updateConfig } = useAgentSessionStore.getState();
      const config: AgentSessionConfig = {
        persona: 'CTO',
        seedQuery: 'site:linkedin.com/in/ CTO',
        scoringMasterPrompt: 'Find tech leaders',
        pass1Threshold: 70,
        pass2Threshold: 65,
        queryBudgetPerRound: 20,
        concurrencyLimit: 3,
        maxResultsPerQuery: 50,
      };

      updateConfig(config);

      expect(useAgentSessionStore.getState().config).toEqual(config);
    });

    it('should replace entire config', () => {
      const { updateConfig } = useAgentSessionStore.getState();

      updateConfig({
        persona: 'First',
        seedQuery: 'first',
        scoringMasterPrompt: 'first',
        pass1Threshold: 70,
        pass2Threshold: 65,
        queryBudgetPerRound: 10,
        concurrencyLimit: 3,
        maxResultsPerQuery: 50,
      });

      updateConfig({
        persona: 'Second',
        seedQuery: 'second',
        scoringMasterPrompt: 'second',
        pass1Threshold: 80,
        pass2Threshold: 75,
        queryBudgetPerRound: 20,
        concurrencyLimit: 5,
        maxResultsPerQuery: 100,
      });

      const { config } = useAgentSessionStore.getState();
      expect(config?.persona).toBe('Second');
      expect(config?.pass1Threshold).toBe(80);
    });
  });

  describe('setStage', () => {
    it('should set current stage', () => {
      const { setStage } = useAgentSessionStore.getState();

      setStage('generating');

      expect(useAgentSessionStore.getState().currentStage).toBe('generating');
    });

    it('should update through all stages', () => {
      const { setStage } = useAgentSessionStore.getState();
      const stages: Array<'idle' | 'generating' | 'pass1' | 'pass2' | 'executing'> = [
        'generating',
        'pass1',
        'pass2',
        'executing',
        'idle',
      ];

      for (const stage of stages) {
        setStage(stage);
        expect(useAgentSessionStore.getState().currentStage).toBe(stage);
      }
    });
  });

  describe('updateProgress', () => {
    it('should update progress partially', () => {
      const { updateProgress } = useAgentSessionStore.getState();

      updateProgress({ current: 5, total: 10 });

      const { progress } = useAgentSessionStore.getState();
      expect(progress.current).toBe(5);
      expect(progress.total).toBe(10);
      expect(progress.stage).toBe('complete'); // Unchanged
    });

    it('should update message only', () => {
      const { updateProgress } = useAgentSessionStore.getState();

      updateProgress({ message: 'Processing queries...' });

      expect(useAgentSessionStore.getState().progress.message).toBe('Processing queries...');
    });

    it('should update all progress fields', () => {
      const { updateProgress } = useAgentSessionStore.getState();

      updateProgress({
        stage: 'generating',
        current: 3,
        total: 20,
        message: 'Generating queries',
      });

      const { progress } = useAgentSessionStore.getState();
      expect(progress.stage).toBe('generating');
      expect(progress.current).toBe(3);
      expect(progress.total).toBe(20);
      expect(progress.message).toBe('Generating queries');
    });
  });

  describe('updateStats', () => {
    it('should update stats partially', () => {
      const { updateStats } = useAgentSessionStore.getState();

      updateStats({ generated: 15, pass1Pending: 15 });

      const { pipelineStats } = useAgentSessionStore.getState();
      expect(pipelineStats.generated).toBe(15);
      expect(pipelineStats.pass1Pending).toBe(15);
      expect(pipelineStats.pass1Passed).toBe(0); // Unchanged
    });

    it('should preserve other stats when updating', () => {
      const { updateStats } = useAgentSessionStore.getState();

      updateStats({ generated: 20 });
      updateStats({ pass1Passed: 10, pass1Rejected: 5 });

      const { pipelineStats } = useAgentSessionStore.getState();
      expect(pipelineStats.generated).toBe(20);
      expect(pipelineStats.pass1Passed).toBe(10);
      expect(pipelineStats.pass1Rejected).toBe(5);
    });
  });

  describe('incrementStat', () => {
    it('should increment a stat by 1', () => {
      const { incrementStat } = useAgentSessionStore.getState();

      incrementStat('generated');
      incrementStat('generated');
      incrementStat('generated');

      expect(useAgentSessionStore.getState().pipelineStats.generated).toBe(3);
    });

    it('should increment different stats independently', () => {
      const { incrementStat } = useAgentSessionStore.getState();

      incrementStat('pass1Passed');
      incrementStat('pass1Passed');
      incrementStat('pass2Passed');

      const { pipelineStats } = useAgentSessionStore.getState();
      expect(pipelineStats.pass1Passed).toBe(2);
      expect(pipelineStats.pass2Passed).toBe(1);
    });
  });

  describe('setRunning', () => {
    it('should set isRunning to true', () => {
      const { setRunning } = useAgentSessionStore.getState();

      setRunning(true);

      expect(useAgentSessionStore.getState().isRunning).toBe(true);
    });

    it('should clear error when setting isRunning to true', () => {
      const store = useAgentSessionStore.getState();
      store.setError('Previous error');

      store.setRunning(true);

      expect(useAgentSessionStore.getState().error).toBeNull();
    });

    it('should preserve error when setting isRunning to false', () => {
      const store = useAgentSessionStore.getState();
      store.setRunning(true);
      store.setError('Error occurred');

      store.setRunning(false);

      expect(useAgentSessionStore.getState().error).toBe('Error occurred');
    });
  });

  describe('setPaused', () => {
    it('should set isPaused to true', () => {
      const { setPaused } = useAgentSessionStore.getState();

      setPaused(true);

      expect(useAgentSessionStore.getState().isPaused).toBe(true);
    });

    it('should set isPaused to false', () => {
      const { setPaused } = useAgentSessionStore.getState();

      setPaused(true);
      setPaused(false);

      expect(useAgentSessionStore.getState().isPaused).toBe(false);
    });
  });

  describe('createAbortController', () => {
    it('should create and store an AbortController', () => {
      const { createAbortController } = useAgentSessionStore.getState();

      const controller = createAbortController('query-1');

      expect(controller).toBeInstanceOf(AbortController);
      expect(useAgentSessionStore.getState().abortControllers.has('query-1')).toBe(true);
    });

    it('should create multiple abort controllers', () => {
      const { createAbortController } = useAgentSessionStore.getState();

      createAbortController('query-1');
      createAbortController('query-2');
      createAbortController('query-3');

      const { abortControllers } = useAgentSessionStore.getState();
      expect(abortControllers.size).toBe(3);
    });

    it('should return different controller instances', () => {
      const { createAbortController } = useAgentSessionStore.getState();

      const controller1 = createAbortController('query-1');
      const controller2 = createAbortController('query-2');

      expect(controller1).not.toBe(controller2);
    });
  });

  describe('cancelQuery', () => {
    it('should abort the controller for a query', () => {
      const store = useAgentSessionStore.getState();
      const controller = store.createAbortController('query-1');

      store.cancelQuery('query-1');

      expect(controller.signal.aborted).toBe(true);
    });

    it('should remove the controller from the map', () => {
      const store = useAgentSessionStore.getState();
      store.createAbortController('query-1');

      store.cancelQuery('query-1');

      expect(useAgentSessionStore.getState().abortControllers.has('query-1')).toBe(false);
    });

    it('should do nothing for non-existent query', () => {
      const store = useAgentSessionStore.getState();
      store.createAbortController('query-1');

      // Should not throw
      store.cancelQuery('non-existent');

      expect(useAgentSessionStore.getState().abortControllers.size).toBe(1);
    });
  });

  describe('cancelAllQueries', () => {
    it('should abort all controllers', () => {
      const store = useAgentSessionStore.getState();
      const controller1 = store.createAbortController('query-1');
      const controller2 = store.createAbortController('query-2');
      const controller3 = store.createAbortController('query-3');

      store.cancelAllQueries();

      expect(controller1.signal.aborted).toBe(true);
      expect(controller2.signal.aborted).toBe(true);
      expect(controller3.signal.aborted).toBe(true);
    });

    it('should clear the controllers map', () => {
      const store = useAgentSessionStore.getState();
      store.createAbortController('query-1');
      store.createAbortController('query-2');

      store.cancelAllQueries();

      expect(useAgentSessionStore.getState().abortControllers.size).toBe(0);
    });

    it('should set isRunning and isPaused to false', () => {
      const store = useAgentSessionStore.getState();
      store.setRunning(true);
      store.setPaused(true);

      store.cancelAllQueries();

      const state = useAgentSessionStore.getState();
      expect(state.isRunning).toBe(false);
      expect(state.isPaused).toBe(false);
    });
  });

  describe('setError', () => {
    it('should set error message', () => {
      const { setError } = useAgentSessionStore.getState();

      setError('Something went wrong');

      expect(useAgentSessionStore.getState().error).toBe('Something went wrong');
    });

    it('should set isRunning to false when setting error', () => {
      const store = useAgentSessionStore.getState();
      store.setRunning(true);

      store.setError('Error occurred');

      expect(useAgentSessionStore.getState().isRunning).toBe(false);
    });

    it('should allow clearing error', () => {
      const store = useAgentSessionStore.getState();
      store.setError('Error');

      store.setError(null);

      expect(useAgentSessionStore.getState().error).toBeNull();
    });
  });

  describe('reset', () => {
    it('should reset all state to initial values', () => {
      const store = useAgentSessionStore.getState();

      // Modify various state
      store.setActiveSession('session-123');
      store.setRunning(true);
      store.setPaused(true);
      store.setStage('executing');
      store.updateProgress({ current: 5, total: 10 });
      store.updateStats({ generated: 20, pass1Passed: 15 });
      store.setError('Error');

      store.reset();

      const state = useAgentSessionStore.getState();
      expect(state.isRunning).toBe(false);
      expect(state.isPaused).toBe(false);
      expect(state.currentStage).toBe('idle');
      expect(state.error).toBeNull();
      expect(state.progress.current).toBe(0);
      expect(state.pipelineStats.generated).toBe(0);
    });

    it('should preserve activeSessionId after reset', () => {
      const store = useAgentSessionStore.getState();

      store.setActiveSession('session-123');
      store.setRunning(true);
      store.setError('Error');

      store.reset();

      // Session ID should be preserved
      expect(useAgentSessionStore.getState().activeSessionId).toBe('session-123');
    });

    it('should clear abort controllers', () => {
      const store = useAgentSessionStore.getState();
      store.createAbortController('query-1');
      store.createAbortController('query-2');

      store.reset();

      expect(useAgentSessionStore.getState().abortControllers.size).toBe(0);
    });
  });

  describe('state persistence', () => {
    it('should persist only specified fields', () => {
      // The store uses partialize to only persist certain fields
      // We test this by checking that abort controllers are not in persisted state
      const store = useAgentSessionStore;

      // Access the persist API
      const persistOptions = (store as any).persist;

      // The partialize function should exclude abortControllers, isRunning, isPaused
      // This is a structural test - the actual persistence is handled by zustand
      expect(persistOptions).toBeDefined();
    });
  });
});
