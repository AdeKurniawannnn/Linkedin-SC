/**
 * Example component demonstrating useOpenRouterLLM in a complete agent pipeline
 *
 * This shows how to:
 * 1. Generate queries with LLM
 * 2. Score queries (Pass 1)
 * 3. Execute searches
 * 4. Score results (Pass 2)
 * 5. Calculate composite scores
 * 6. Iterate with learning
 */

'use client';

import { useState } from 'react';
import { useOpenRouterLLM } from '../useOpenRouterLLM';
import { searchRaw } from '@/lib/api';
import { calculateCompositeScore } from '@/lib/agent/scoring';
import type { QueryContext } from '@/lib/agent/types';

interface PipelineState {
  stage: 'idle' | 'generating' | 'pass1' | 'executing' | 'pass2' | 'complete';
  queries: Array<{
    query: string;
    reasoning: string;
    pass1Score?: number;
    pass2Score?: number;
    compositeScore?: number;
    resultsCount?: number;
  }>;
  topQueries: QueryContext[];
  currentRound: number;
}

export function AgentPipelineExample() {
  const llm = useOpenRouterLLM();

  const [persona, setPersona] = useState('Senior Engineering Leaders in Fintech');
  const [seedQuery, setSeedQuery] = useState('site:linkedin.com/in/ "CTO" fintech');
  const [pass1Threshold, setPass1Threshold] = useState(60);
  const [pass2Threshold, setPass2Threshold] = useState(50);

  const [state, setState] = useState<PipelineState>({
    stage: 'idle',
    queries: [],
    topQueries: [],
    currentRound: 0,
  });

  const runPipeline = async () => {
    try {
      const round = state.currentRound + 1;

      // Stage 1: Generate Queries
      setState(prev => ({ ...prev, stage: 'generating' }));

      const generatedQueries = await llm.generateQueries(
        persona,
        seedQuery,
        state.topQueries.length > 0 ? state.topQueries : undefined,
        10 // Budget
      );

      setState(prev => ({
        ...prev,
        queries: generatedQueries.map(q => ({
          query: q.query,
          reasoning: q.reasoning,
        })),
      }));

      // Stage 2: Pass 1 Scoring
      setState(prev => ({ ...prev, stage: 'pass1' }));

      const pass1Results = await llm.batchScorePass1(
        generatedQueries.map(q => q.query),
        persona,
        'Find qualified leads for B2B SaaS sales',
        3 // Concurrency
      );

      // Update with Pass 1 scores
      const queriesWithPass1 = generatedQueries.map(q => ({
        query: q.query,
        reasoning: q.reasoning,
        pass1Score: pass1Results.get(q.query)?.score,
      }));

      setState(prev => ({ ...prev, queries: queriesWithPass1 }));

      // Filter by Pass 1 threshold
      const pass1Filtered = queriesWithPass1.filter(
        q => (q.pass1Score || 0) >= pass1Threshold
      );

      if (pass1Filtered.length === 0) {
        alert('No queries passed Pass 1 threshold. Try lowering the threshold.');
        setState(prev => ({ ...prev, stage: 'complete' }));
        return;
      }

      // Stage 3: Execute Searches
      setState(prev => ({ ...prev, stage: 'executing' }));

      const executionResults = await Promise.all(
        pass1Filtered.map(async q => {
          try {
            const results = await searchRaw({
              query: q.query,
              country: 'us',
              language: 'en',
              max_results: 10,
            });

            return {
              query: q.query,
              results: results.results,
              resultsCount: results.total_results,
            };
          } catch (err) {
            console.error(`Failed to execute query: ${q.query}`, err);
            return {
              query: q.query,
              results: [],
              resultsCount: 0,
            };
          }
        })
      );

      // Stage 4: Pass 2 Scoring
      setState(prev => ({ ...prev, stage: 'pass2' }));

      const pass2Results = await llm.batchScorePass2(
        executionResults.filter(e => e.results.length > 0),
        persona,
        3 // Concurrency
      );

      // Calculate composite scores
      const finalQueries = queriesWithPass1.map(q => {
        const p1Score = q.pass1Score || 0;
        const p2Score = pass2Results.get(q.query)?.score || 0;
        const execution = executionResults.find(e => e.query === q.query);

        return {
          ...q,
          pass2Score: p2Score,
          compositeScore: calculateCompositeScore(p1Score, p2Score),
          resultsCount: execution?.resultsCount || 0,
        };
      });

      // Select top queries for next round
      const topQueries = finalQueries
        .filter(q => (q.pass2Score || 0) >= pass2Threshold)
        .sort((a, b) => (b.compositeScore || 0) - (a.compositeScore || 0))
        .slice(0, 5)
        .map(q => ({
          query: q.query,
          compositeScore: q.compositeScore,
          pass1Score: q.pass1Score,
          pass2Score: q.pass2Score,
        }));

      setState({
        stage: 'complete',
        queries: finalQueries,
        topQueries,
        currentRound: round,
      });
    } catch (err) {
      console.error('Pipeline error:', err);
      alert(`Pipeline failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setState(prev => ({ ...prev, stage: 'idle' }));
    }
  };

  const resetPipeline = () => {
    setState({
      stage: 'idle',
      queries: [],
      topQueries: [],
      currentRound: 0,
    });
  };

  const isRunning = state.stage !== 'idle' && state.stage !== 'complete';

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Agentic Query Builder - Pipeline Demo</h1>

      {/* Configuration */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Configuration</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">Persona</label>
            <input
              type="text"
              value={persona}
              onChange={e => setPersona(e.target.value)}
              disabled={isRunning}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Seed Query</label>
            <input
              type="text"
              value={seedQuery}
              onChange={e => setSeedQuery(e.target.value)}
              disabled={isRunning}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Pass 1 Threshold ({pass1Threshold})
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={pass1Threshold}
              onChange={e => setPass1Threshold(Number(e.target.value))}
              disabled={isRunning}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Pass 2 Threshold ({pass2Threshold})
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={pass2Threshold}
              onChange={e => setPass2Threshold(Number(e.target.value))}
              disabled={isRunning}
              className="w-full"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={runPipeline}
            disabled={isRunning || !persona || !seedQuery}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {state.currentRound === 0 ? 'Start Pipeline' : `Run Round ${state.currentRound + 1}`}
          </button>

          {isRunning && (
            <button
              onClick={llm.cancel}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Cancel
            </button>
          )}

          {state.currentRound > 0 && !isRunning && (
            <button
              onClick={resetPipeline}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Status */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Status</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Round</div>
            <div className="text-2xl font-bold">{state.currentRound}</div>
          </div>

          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Stage</div>
            <div className="text-2xl font-bold capitalize">{state.stage}</div>
          </div>

          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Tokens Used</div>
            <div className="text-2xl font-bold">{llm.tokensUsed.toLocaleString()}</div>
          </div>

          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Queries</div>
            <div className="text-2xl font-bold">{state.queries.length}</div>
          </div>
        </div>

        {llm.error && (
          <div className="mt-4 p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-md">
            <strong>Error:</strong> {llm.error}
          </div>
        )}
      </div>

      {/* Top Queries from Previous Round */}
      {state.topQueries.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            Top Queries (Learning Context for Next Round)
          </h2>

          <div className="space-y-3">
            {state.topQueries.map((q, idx) => (
              <div key={idx} className="p-3 bg-green-50 dark:bg-green-900 rounded-md">
                <div className="font-mono text-sm mb-2">{q.query}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 space-x-4">
                  <span>Composite: {q.compositeScore?.toFixed(1)}</span>
                  <span>Pass 1: {q.pass1Score?.toFixed(1)}</span>
                  <span>Pass 2: {q.pass2Score?.toFixed(1)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {state.queries.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Query Results</h2>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Query
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Pass 1
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Pass 2
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Composite
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Results
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {state.queries
                  .sort((a, b) => (b.compositeScore || 0) - (a.compositeScore || 0))
                  .map((q, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-2 text-sm font-mono">{q.query}</td>
                      <td className="px-3 py-2 text-sm">
                        {q.pass1Score ? (
                          <span
                            className={
                              q.pass1Score >= pass1Threshold
                                ? 'text-green-600 dark:text-green-400 font-semibold'
                                : 'text-red-600 dark:text-red-400'
                            }
                          >
                            {q.pass1Score.toFixed(1)}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-3 py-2 text-sm">
                        {q.pass2Score ? (
                          <span
                            className={
                              q.pass2Score >= pass2Threshold
                                ? 'text-green-600 dark:text-green-400 font-semibold'
                                : 'text-red-600 dark:text-red-400'
                            }
                          >
                            {q.pass2Score.toFixed(1)}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-3 py-2 text-sm font-semibold">
                        {q.compositeScore ? q.compositeScore.toFixed(1) : '-'}
                      </td>
                      <td className="px-3 py-2 text-sm">{q.resultsCount || '-'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
