import type { FallbackProps } from 'react-error-boundary';

import { useTheme } from '@hooks/useTheme';

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const { theme } = useTheme();
  const backgroundClass =
    theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900';

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center px-6 ${backgroundClass}`}>
      <h1 className="text-3xl font-semibold text-error-600 mb-4">Something went wrong</h1>
      <pre className="max-w-xl whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 p-4 rounded">
        {error.message}
      </pre>
      <button
        type="button"
        onClick={resetErrorBoundary}
        className="mt-6 btn-primary"
      >
        Try again
      </button>
    </div>
  );
}

export default ErrorFallback;
