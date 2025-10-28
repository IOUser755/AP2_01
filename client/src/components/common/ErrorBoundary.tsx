import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import type { ReactNode } from 'react';

import ErrorFallback from './ErrorFallback';

interface ErrorBoundaryProps {
  children: ReactNode;
}

export function ErrorBoundary({ children }: ErrorBoundaryProps) {
  return (
    <ReactErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, info) => {
        // eslint-disable-next-line no-console
        console.error('Unhandled application error', error, info);
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
}

export default ErrorBoundary;
