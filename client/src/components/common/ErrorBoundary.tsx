import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

import { Button } from './Button';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 text-center shadow-lg">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-error-100">
              <ExclamationTriangleIcon className="h-6 w-6 text-error-600" aria-hidden="true" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Something went wrong</h2>
            <p className="mt-2 text-sm text-gray-600">
              An unexpected error occurred. Please try again or reload the page.
            </p>

            {import.meta.env.DEV && this.state.error && (
              <details className="mt-4 overflow-hidden rounded bg-gray-100 p-3 text-left text-xs text-gray-700">
                <summary className="cursor-pointer text-sm font-medium text-gray-700">Error details</summary>
                <pre className="mt-2 whitespace-pre-wrap text-xs text-gray-600">
                  {this.state.error.toString()}
                  {'\n'}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="mt-6 flex gap-3">
              <Button variant="outline" fullWidth onClick={() => window.location.reload()}>
                Reload Page
              </Button>
              <Button fullWidth onClick={this.handleReset}>
                Try Again
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
