"use client";

import { Component, type ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowCounterClockwise, Trash, Warning } from "@phosphor-icons/react";

/**
 * ErrorBoundary Component
 *
 * A React error boundary that catches JavaScript errors in child components
 * and displays a fallback UI with recovery options.
 *
 * Features:
 * - Catches render errors in child components
 * - Displays user-friendly error message
 * - Provides "Retry" button to attempt re-render
 * - Provides "Clear Data" button to reset sessionStorage and retry
 * - Logs errors to console for debugging
 */

interface ErrorBoundaryProps {
  /** Child components to render */
  children: ReactNode;
  /** Optional fallback component to render on error */
  fallback?: ReactNode;
  /** Optional callback when error is caught */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  /** Optional key to clear from sessionStorage on "Clear Data" */
  sessionStorageKey?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.setState({ errorInfo });
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleClearDataAndRetry = (): void => {
    // Clear the specified sessionStorage key or all query builder data
    const keyToClear = this.props.sessionStorageKey || "query-builder-session";
    try {
      sessionStorage.removeItem(keyToClear);
    } catch (e) {
      console.error("Failed to clear sessionStorage:", e);
    }

    // Reset error state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    // Force page reload to ensure clean state
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // If a custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                <Warning className="h-6 w-6 text-red-600 dark:text-red-400" weight="bold" />
              </div>
              <CardTitle className="text-xl text-red-800 dark:text-red-200">
                Something went wrong
              </CardTitle>
              <CardDescription>
                An unexpected error occurred. You can try again or clear your data to start fresh.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Error details (collapsible in production) */}
              {process.env.NODE_ENV === "development" && this.state.error && (
                <details className="text-sm">
                  <summary className="cursor-pointer text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
                    Show error details
                  </summary>
                  <pre className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-md text-xs overflow-auto max-h-40">
                    <code>
                      {this.state.error.toString()}
                      {this.state.errorInfo?.componentStack}
                    </code>
                  </pre>
                </details>
              )}

              {/* Action buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={this.handleRetry}
                  variant="default"
                  className="flex-1"
                >
                  <ArrowCounterClockwise className="mr-2 h-4 w-4" weight="bold" />
                  Try Again
                </Button>
                <Button
                  onClick={this.handleClearDataAndRetry}
                  variant="outline"
                  className="flex-1"
                >
                  <Trash className="mr-2 h-4 w-4" weight="bold" />
                  Clear Data
                </Button>
              </div>

              <p className="text-xs text-center text-gray-500">
                If the problem persists, try refreshing the page or contact support.
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook-friendly wrapper for functional components
 * Use this to wrap specific sections that might throw errors
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, "children">
) {
  return function WithErrorBoundaryWrapper(props: P) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
}
