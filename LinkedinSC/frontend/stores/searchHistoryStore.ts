/**
 * Search History Store
 *
 * Automatically captures every search with full query parameters and results.
 * Persisted to localStorage with automatic storage management.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { toast } from 'sonner';
import { useQueryBuilderStore } from './queryBuilderStore';
import type { UnifiedResult, RawSearchResponse } from '@/lib/api';
import { calculateEntrySize, formatBytes } from '@/lib/utils/storageUtils';

// Query parameters captured from queryBuilderStore
export interface SearchHistoryQuery {
  baseQuery: string;
  activePresetIds: string[];
  activeLocationIds: string[];
  country: string;
  language: string;
  maxResults: number;
  composedQuery: string;
}

// A single history entry
export interface SearchHistoryEntry {
  id: string;
  timestamp: string;
  query: SearchHistoryQuery;
  results: UnifiedResult[];
  metadata: RawSearchResponse['metadata'];
  totalResults: number;
  sizeBytes: number;
  compressed?: boolean;
}

// Store state
interface SearchHistoryState {
  entries: SearchHistoryEntry[];
  totalSizeBytes: number;
  maxSizeBytes: number;
}

// Store actions
interface SearchHistoryActions {
  // Core operations
  addEntry: (query: SearchHistoryQuery, response: RawSearchResponse) => void;
  deleteEntry: (id: string) => void;
  clearHistory: () => void;

  // Query operations
  getEntryById: (id: string) => SearchHistoryEntry | undefined;
  getRecentEntries: (limit?: number) => SearchHistoryEntry[];
  searchHistory: (searchTerm: string) => SearchHistoryEntry[];

  // Storage management
  getStorageInfo: () => { used: number; max: number; percentage: number };
  pruneOldEntries: () => number;

  // Export
  exportToCSV: (entryIds?: string[]) => string;
  downloadCSV: (entryIds?: string[]) => void;

  // Re-run capability
  loadQueryToBuilder: (id: string) => void;
}

type SearchHistoryStore = SearchHistoryState & SearchHistoryActions;

// Constants
const MAX_STORAGE_BYTES = 4 * 1024 * 1024; // 4MB
const PRUNE_THRESHOLD = 0.95; // 95%
const WARNING_THRESHOLD = 0.80; // 80%
const TARGET_AFTER_PRUNE = 0.70; // 70%

// Generate unique ID
function generateId(): string {
  return `history_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Escape CSV field
function escapeCSV(value: string | number | undefined): string {
  if (value === undefined || value === null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export const useSearchHistoryStore = create<SearchHistoryStore>()(
  persist(
    (set, get) => ({
      entries: [],
      totalSizeBytes: 0,
      maxSizeBytes: MAX_STORAGE_BYTES,

      addEntry: (query, response) => {
        const newEntry: SearchHistoryEntry = {
          id: generateId(),
          timestamp: new Date().toISOString(),
          query,
          results: response.results,
          metadata: response.metadata,
          totalResults: response.total_results,
          sizeBytes: 0,
        };

        // Calculate size
        newEntry.sizeBytes = calculateEntrySize(newEntry);

        set((state) => {
          let entries = [...state.entries, newEntry];
          let totalSize = state.totalSizeBytes + newEntry.sizeBytes;

          // Check if we need to prune
          if (totalSize > state.maxSizeBytes * PRUNE_THRESHOLD) {
            // Show warning toast first time we hit the threshold
            if (state.totalSizeBytes <= state.maxSizeBytes * WARNING_THRESHOLD) {
              toast.warning('Search history storage is getting full', {
                description: 'Older entries will be compressed or removed automatically.',
              });
            }

            // Prune until we're under target
            const targetSize = state.maxSizeBytes * TARGET_AFTER_PRUNE;
            let compressionCount = 0;
            let deletionCount = 0;

            while (totalSize > targetSize && entries.length > 1) {
              const oldestIndex = 0;
              const oldest = entries[oldestIndex];

              // First try compression (remove results but keep metadata)
              if (!oldest.compressed && oldest.results.length > 0) {
                const compressedEntry: SearchHistoryEntry = {
                  ...oldest,
                  results: [],
                  compressed: true,
                  sizeBytes: 0,
                };
                compressedEntry.sizeBytes = calculateEntrySize(compressedEntry);

                totalSize -= oldest.sizeBytes - compressedEntry.sizeBytes;
                entries[oldestIndex] = compressedEntry;
                compressionCount++;
              } else {
                // Already compressed, delete it
                totalSize -= oldest.sizeBytes;
                entries = entries.slice(1);
                deletionCount++;
              }
            }

            // Notify user about what happened
            if (compressionCount > 0 || deletionCount > 0) {
              const messages: string[] = [];
              if (compressionCount > 0) {
                messages.push(`${compressionCount} entries compressed`);
              }
              if (deletionCount > 0) {
                messages.push(`${deletionCount} entries removed`);
              }
              toast.info('History storage cleaned up', {
                description: messages.join(', '),
              });
            }
          }

          return { entries, totalSizeBytes: totalSize };
        });
      },

      deleteEntry: (id) => {
        set((state) => {
          const entry = state.entries.find((e) => e.id === id);
          if (!entry) return state;

          return {
            entries: state.entries.filter((e) => e.id !== id),
            totalSizeBytes: state.totalSizeBytes - entry.sizeBytes,
          };
        });
      },

      clearHistory: () => {
        set({ entries: [], totalSizeBytes: 0 });
        toast.success('Search history cleared');
      },

      getEntryById: (id) => {
        return get().entries.find((entry) => entry.id === id);
      },

      getRecentEntries: (limit = 50) => {
        return [...get().entries]
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, limit);
      },

      searchHistory: (searchTerm) => {
        const term = searchTerm.toLowerCase();
        return get().entries.filter(
          (entry) =>
            entry.query.composedQuery.toLowerCase().includes(term) ||
            entry.query.baseQuery.toLowerCase().includes(term)
        );
      },

      getStorageInfo: () => {
        const state = get();
        return {
          used: state.totalSizeBytes,
          max: state.maxSizeBytes,
          percentage: Math.round((state.totalSizeBytes / state.maxSizeBytes) * 100),
        };
      },

      pruneOldEntries: () => {
        const state = get();
        const targetSize = state.maxSizeBytes * TARGET_AFTER_PRUNE;
        let totalSize = state.totalSizeBytes;
        let entries = [...state.entries];
        let removedCount = 0;

        // Sort by timestamp (oldest first)
        entries.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        while (totalSize > targetSize && entries.length > 0) {
          const oldest = entries[0];
          totalSize -= oldest.sizeBytes;
          entries = entries.slice(1);
          removedCount++;
        }

        if (removedCount > 0) {
          set({ entries, totalSizeBytes: totalSize });
          toast.info(`Removed ${removedCount} old history entries`);
        }

        return removedCount;
      },

      exportToCSV: (entryIds) => {
        const entries = entryIds
          ? get().entries.filter((e) => entryIds.includes(e.id))
          : get().entries;

        const headers = [
          'Search Date',
          'Query',
          'Country',
          'Language',
          'Max Results',
          'Total Results',
          'Time (seconds)',
          'Pages Fetched',
          'Result #',
          'Type',
          'Title',
          'URL',
          'Description',
          'Author',
          'Company',
          'Followers',
          'Location',
        ];

        const rows: string[] = [headers.join(',')];

        entries.forEach((entry) => {
          const baseFields = [
            entry.timestamp,
            entry.query.composedQuery,
            entry.query.country,
            entry.query.language,
            entry.query.maxResults,
            entry.totalResults,
            entry.metadata.time_taken_seconds.toFixed(2),
            entry.metadata.pages_fetched,
          ];

          if (entry.compressed || entry.results.length === 0) {
            // Single row for compressed entries
            rows.push(
              [...baseFields, '-', '-', '[Results compressed]', '-', '-', '-', '-', '-', '-']
                .map(escapeCSV)
                .join(',')
            );
          } else {
            // Row per result
            entry.results.forEach((result, index) => {
              rows.push(
                [
                  ...baseFields,
                  index + 1,
                  result.type,
                  result.title,
                  result.url,
                  result.description.replace(/\n/g, ' '),
                  result.author_name || '',
                  result.company_name || '',
                  result.followers || '',
                  result.location || '',
                ]
                  .map(escapeCSV)
                  .join(',')
              );
            });
          }
        });

        return rows.join('\n');
      },

      downloadCSV: (entryIds) => {
        const csv = get().exportToCSV(entryIds);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `linkedin-search-history-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('History exported to CSV');
      },

      loadQueryToBuilder: (id) => {
        const entry = get().entries.find((e) => e.id === id);
        if (!entry) {
          toast.error('History entry not found');
          return;
        }

        useQueryBuilderStore.setState({
          baseQuery: entry.query.baseQuery,
          activePresetIds: entry.query.activePresetIds,
          activeLocationIds: entry.query.activeLocationIds,
          country: entry.query.country,
          language: entry.query.language,
          maxResults: entry.query.maxResults,
        });

        toast.success('Query loaded', {
          description: 'Click Search to re-run this query',
        });
      },
    }),
    {
      name: 'linkedin-search-history',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        entries: state.entries,
        totalSizeBytes: state.totalSizeBytes,
      }),
      // Recalculate size on hydration in case of format changes
      onRehydrateStorage: () => (state) => {
        if (state) {
          let totalSize = 0;
          state.entries.forEach((entry) => {
            if (!entry.sizeBytes) {
              entry.sizeBytes = calculateEntrySize(entry);
            }
            totalSize += entry.sizeBytes;
          });
          state.totalSizeBytes = totalSize;
        }
      },
    }
  )
);

// Export types
export type { SearchHistoryState, SearchHistoryActions, SearchHistoryStore };
