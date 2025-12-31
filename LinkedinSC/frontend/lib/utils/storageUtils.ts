/**
 * Storage utility functions for managing localStorage size and formatting
 */

/**
 * Calculate the byte size of a JSON-serializable object
 */
export function calculateEntrySize(entry: unknown): number {
  return new Blob([JSON.stringify(entry)]).size;
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Get storage usage percentage
 */
export function getStorageUsagePercentage(used: number, max: number): number {
  if (max === 0) return 0;
  return Math.round((used / max) * 100);
}

/**
 * Get storage status color based on usage percentage
 */
export function getStorageStatusColor(percentage: number): 'green' | 'yellow' | 'red' {
  if (percentage < 50) return 'green';
  if (percentage < 80) return 'yellow';
  return 'red';
}
