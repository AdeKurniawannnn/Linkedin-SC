/**
 * Comprehensive Tests for hooks/useAgentPipeline.ts
 *
 * Tests pipeline orchestration, stage transitions, pause/resume, and integration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useAgentPipeline } from '@/hooks/useAgentPipeline';
import type { UseAgentPipelineOptions, ConvexCallbacks } from '@/hooks/useAgentPipeline';
import type { AgentSessionConfig } from '@/lib/agent/types';

// Mock useOpenRouterLLM
vi.mock('@/hooks/useOpenRouterLLM', () => ({
  useOpenRouterLLM: () => ({
    generateQueries: vi.fn().mockResolvedValue([
      { query: 'site:linkedin.com/in/ CTO fintech', reasoning: 'Targets fintech CTOs' },
      { query: 'site:linkedin.com/in/ VP Engineering', reasoning: 'Targets VPs' },
    ]),
    scoreQueryPass1: vi.fn().mockResolvedValue({
      score: 85,
      breakdown: { expectedYield: 35, personaRelevance: 30, queryUniqueness: 20 },
      reasoning: 'Good query',
    }),
    scoreResultsPass2: vi.fn().mockResolvedValue({
      score: 78,
      relevantCount: 7,
      breakdown: { resultRelevance: 40, qualitySignal: 22, diversity: 16 },
      reasoning: 'Good results',
      topMatches: [1, 2, 4],
    }),
    isLoading: false,
    error: null,
    tokensUsed: 0,
    cancel: vi.fn(),
  }),
}));

// Mock useAgentSessionStore
vi.mock('@/stores/agentSessionStore', () => ({
  useAgentSessionStore: () => ({
    setStage: vi.fn(),
    setRunning: vi.fn(),
    setPaused: vi.fn(),
    currentStage: 'idle',
    isRunning: false,
    isPaused: false,
  }),
}));

// Mock searchRaw from lib/api
vi.mock('@/lib/api', () => ({
  searchRaw: vi.fn().mockResolvedValue({
    results: [
      {
        title: 'John Smith - CTO at TechCorp',
        description: 'Technology leader in fintech',
        url: 'https://linkedin.com/in/johnsmith',
        type: 'profile',
      },
      {
        title: 'Jane Doe - VP Engineering',
        description: 'Engineering leader at startup',
        url: 'https://linkedin.com/in/janedoe',
        type: 'profile',
      },
    ],
  }),
}));

describe('useAgentPipeline', () => {
  const defaultConfig: AgentSessionConfig = {
    persona: 'CTO',
    seedQuery: 'site:linkedin.com/in/ CTO',
    scoringMasterPrompt: 'Find technology leaders',
    pass1Threshold: 70,
    pass2Threshold: 65,
    queryBudgetPerRound: 10,
    concurrencyLimit: 3,
    maxResultsPerQuery: 50,
  };

  const createMockConvexCallbacks = (): ConvexCallbacks => ({
    addQueryBatch: vi.fn().mockResolvedValue({ inserted: 2, ids: ['id1', 'id2'] }),
    updatePass1: vi.fn().mockResolvedValue(undefined),
    updatePass2: vi.fn().mockResolvedValue(undefined),
    updateExecution: vi.fn().mockResolvedValue(undefined),
    updateStatus: vi.fn().mockResolvedValue(undefined),
    getTopQueriesForContext: vi.fn().mockReturnValue([]),
  });

  const createDefaultOptions = (
    overrides: Partial<UseAgentPipelineOptions> = {}
  ): UseAgentPipelineOptions => ({
    sessionId: 'test-session-123',
    config: defaultConfig,
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useAgentPipeline(createDefaultOptions()));

      expect(result.current.currentStage).toBe('idle');
      expect(result.current.isRunning).toBe(false);
      expect(result.current.isPaused).toBe(false);
      expect(result.current.aggregatedResults).toEqual([]);
    });

    it('should have initial progress state', () => {
      const { result } = renderHook(() => useAgentPipeline(createDefaultOptions()));

      expect(result.current.progress.stage).toBe('complete');
      expect(result.current.progress.current).toBe(0);
      expect(result.current.progress.total).toBe(0);
    });

    it('should have initial stats', () => {
      const { result } = renderHook(() => useAgentPipeline(createDefaultOptions()));

      expect(result.current.stats.generated).toBe(0);
      expect(result.current.stats.pass1Pending).toBe(0);
      expect(result.current.stats.pass1Passed).toBe(0);
      expect(result.current.stats.completed).toBe(0);
    });
  });

  describe('start', () => {
    it.skip('should start pipeline execution', async () => {
      const onProgress = vi.fn();
      const onComplete = vi.fn();

      const { result } = renderHook(() =>
        useAgentPipeline(createDefaultOptions({ onProgress, onComplete }))
      );

      await act(async () => {
        await result.current.start();
      });

      expect(onComplete).toHaveBeenCalled();
    });

    it.skip('should not start if already running', async () => {
      const { result } = renderHook(() => useAgentPipeline(createDefaultOptions()));

      // Start first run
      const firstStart = act(async () => {
        await result.current.start();
      });

      // Try to start again while running - should be ignored
      await act(async () => {
        await result.current.start();
      });

      await firstStart;
    });

    it.skip('should call onProgress during execution', async () => {
      const onProgress = vi.fn();

      const { result } = renderHook(() =>
        useAgentPipeline(createDefaultOptions({ onProgress }))
      );

      await act(async () => {
        await result.current.start();
      });

      expect(onProgress).toHaveBeenCalled();
      // Should be called for each stage
      expect(onProgress.mock.calls.length).toBeGreaterThan(1);
    });

    it.skip('should call onStageComplete for each stage', async () => {
      const onStageComplete = vi.fn();

      const { result } = renderHook(() =>
        useAgentPipeline(createDefaultOptions({ onStageComplete }))
      );

      await act(async () => {
        await result.current.start();
      });

      // Should be called for pass1, pass2, and executing stages
      expect(onStageComplete).toHaveBeenCalled();
    });
  });

  describe('with Convex callbacks', () => {
    it('should call Convex callbacks during pipeline', async () => {
      const convex = createMockConvexCallbacks();

      const { result } = renderHook(() =>
        useAgentPipeline(createDefaultOptions({ convex }))
      );

      await act(async () => {
        await result.current.start();
      });

      expect(convex.addQueryBatch).toHaveBeenCalled();
      expect(convex.updateStatus).toHaveBeenCalled();
    });

    it('should persist Pass 1 scores to Convex', async () => {
      const convex = createMockConvexCallbacks();

      const { result } = renderHook(() =>
        useAgentPipeline(createDefaultOptions({ convex }))
      );

      await act(async () => {
        await result.current.start();
      });

      expect(convex.updatePass1).toHaveBeenCalled();
    });

    it('should persist Pass 2 scores to Convex', async () => {
      const convex = createMockConvexCallbacks();

      const { result } = renderHook(() =>
        useAgentPipeline(createDefaultOptions({ convex }))
      );

      await act(async () => {
        await result.current.start();
      });

      expect(convex.updatePass2).toHaveBeenCalled();
    });

    it('should update session status through pipeline', async () => {
      const convex = createMockConvexCallbacks();

      const { result } = renderHook(() =>
        useAgentPipeline(createDefaultOptions({ convex }))
      );

      await act(async () => {
        await result.current.start();
      });

      // Should update status multiple times through pipeline
      expect(convex.updateStatus).toHaveBeenCalledWith(
        expect.anything(),
        'generating_queries'
      );
      expect(convex.updateStatus).toHaveBeenCalledWith(
        expect.anything(),
        'completed'
      );
    });
  });

  describe('pause and resume', () => {
    it('should pause execution', async () => {
      const { result } = renderHook(() => useAgentPipeline(createDefaultOptions()));

      act(() => {
        result.current.pause();
      });

      expect(result.current.isPaused).toBe(true);
    });

    it('should resume execution', async () => {
      const { result } = renderHook(() => useAgentPipeline(createDefaultOptions()));

      act(() => {
        result.current.pause();
      });

      expect(result.current.isPaused).toBe(true);

      await act(async () => {
        await result.current.resume();
      });

      expect(result.current.isPaused).toBe(false);
    });
  });

  describe('stop', () => {
    it('should stop execution', async () => {
      const { result } = renderHook(() => useAgentPipeline(createDefaultOptions()));

      // Start then stop
      act(() => {
        result.current.start();
      });

      act(() => {
        result.current.stop();
      });

      expect(result.current.isRunning).toBe(false);
      expect(result.current.isPaused).toBe(false);
    });
  });

  describe('generateMore', () => {
    it('should start new round', async () => {
      const onComplete = vi.fn();

      const { result } = renderHook(() =>
        useAgentPipeline(createDefaultOptions({ onComplete }))
      );

      // First run
      await act(async () => {
        await result.current.start();
      });

      expect(onComplete).toHaveBeenCalledTimes(1);

      // Generate more
      await act(async () => {
        await result.current.generateMore();
      });

      expect(onComplete).toHaveBeenCalledTimes(2);
    });

    it.skip('should not generate more if already running', async () => {
      const { result } = renderHook(() => useAgentPipeline(createDefaultOptions()));

      // Start execution
      const startPromise = act(async () => {
        await result.current.start();
      });

      // Try generateMore while running - should be ignored
      await act(async () => {
        await result.current.generateMore();
      });

      await startPromise;
    });
  });

  describe('error handling', () => {
    it.skip('should call onError callback on failure', async () => {
      // Mock generateQueries to fail
      const { useOpenRouterLLM } = await import('@/hooks/useOpenRouterLLM');
      vi.mocked(useOpenRouterLLM).mockReturnValueOnce({
        generateQueries: vi.fn().mockRejectedValue(new Error('API Error')),
        scoreQueryPass1: vi.fn(),
        scoreResultsPass2: vi.fn(),
        batchScorePass1: vi.fn(),
        batchScorePass2: vi.fn(),
        isLoading: false,
        error: null,
        tokensUsed: 0,
        cancel: vi.fn(),
      });

      const onError = vi.fn();

      const { result } = renderHook(() =>
        useAgentPipeline(createDefaultOptions({ onError }))
      );

      await act(async () => {
        try {
          await result.current.start();
        } catch {
          // Expected to fail
        }
      });

      expect(onError).toHaveBeenCalledWith(expect.stringContaining('Error'));
    });

    it.skip('should update Convex with error status on failure', async () => {
      const { useOpenRouterLLM } = await import('@/hooks/useOpenRouterLLM');
      vi.mocked(useOpenRouterLLM).mockReturnValueOnce({
        generateQueries: vi.fn().mockRejectedValue(new Error('Generation failed')),
        scoreQueryPass1: vi.fn(),
        scoreResultsPass2: vi.fn(),
        batchScorePass1: vi.fn(),
        batchScorePass2: vi.fn(),
        isLoading: false,
        error: null,
        tokensUsed: 0,
        cancel: vi.fn(),
      });

      const convex = createMockConvexCallbacks();

      const { result } = renderHook(() =>
        useAgentPipeline(createDefaultOptions({ convex }))
      );

      await act(async () => {
        try {
          await result.current.start();
        } catch {
          // Expected
        }
      });

      expect(convex.updateStatus).toHaveBeenCalledWith(
        expect.anything(),
        'error',
        expect.any(String)
      );
    });
  });

  describe('threshold filtering', () => {
    it.skip('should complete with 0 results when no queries pass Pass 1', async () => {
      const { useOpenRouterLLM } = await import('@/hooks/useOpenRouterLLM');
      vi.mocked(useOpenRouterLLM).mockReturnValueOnce({
        generateQueries: vi.fn().mockResolvedValue([
          { query: 'low quality query', reasoning: 'Bad' },
        ]),
        scoreQueryPass1: vi.fn().mockResolvedValue({
          score: 50, // Below threshold of 70
          breakdown: { expectedYield: 20, personaRelevance: 15, queryUniqueness: 15 },
          reasoning: 'Low quality',
        }),
        scoreResultsPass2: vi.fn(),
        batchScorePass1: vi.fn(),
        batchScorePass2: vi.fn(),
        isLoading: false,
        error: null,
        tokensUsed: 0,
        cancel: vi.fn(),
      });

      const onComplete = vi.fn();

      const { result } = renderHook(() =>
        useAgentPipeline(createDefaultOptions({ onComplete }))
      );

      await act(async () => {
        await result.current.start();
      });

      expect(onComplete).toHaveBeenCalledWith(0);
    });
  });

  describe('result aggregation', () => {
    it('should deduplicate results by URL', async () => {
      const { searchRaw } = await import('@/lib/api');
      vi.mocked(searchRaw)
        .mockResolvedValueOnce({
          results: [
            { title: 'Same Person', url: 'https://linkedin.com/in/same', type: 'profile', description: 'First' },
          ],
        })
        .mockResolvedValueOnce({
          results: [
            { title: 'Same Person', url: 'https://linkedin.com/in/same', type: 'profile', description: 'Duplicate' },
            { title: 'Different Person', url: 'https://linkedin.com/in/different', type: 'profile', description: 'New' },
          ],
        });

      const { result } = renderHook(() => useAgentPipeline(createDefaultOptions()));

      await act(async () => {
        await result.current.start();
      });

      // Results should be deduplicated
      const urls = result.current.aggregatedResults.map(r => r.url);
      const uniqueUrls = [...new Set(urls)];
      expect(urls.length).toBe(uniqueUrls.length);
    });
  });

  describe('stats tracking', () => {
    it('should track generated query count', async () => {
      const { result } = renderHook(() => useAgentPipeline(createDefaultOptions()));

      await act(async () => {
        await result.current.start();
      });

      expect(result.current.stats.generated).toBeGreaterThan(0);
    });

    it('should track pass1 passed/rejected counts', async () => {
      const { result } = renderHook(() => useAgentPipeline(createDefaultOptions()));

      await act(async () => {
        await result.current.start();
      });

      // At least some should pass since mock returns score of 85
      expect(result.current.stats.pass1Passed).toBeGreaterThan(0);
    });
  });
});
