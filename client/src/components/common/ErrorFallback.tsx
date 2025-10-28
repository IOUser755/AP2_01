import { FallbackProps } from 'react-error-boundary';
import { useTheme } from '../../hooks/useTheme.ts';

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const { theme } = useTheme();
  const backgroundClass = theme === 'dark' ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900';

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center px-6 ${backgroundClass}`}>
      <h1 className="text-3xl font-semibold text-red-500 mb-4">Something went wrong</h1>
      <pre className="max-w-xl whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 p-4 rounded">
        {error.message}
      </pre>
      <button
        type="button"
        onClick={resetErrorBoundary}
        className="mt-6 rounded bg-primary-600 px-4 py-2 text-white hover:bg-primary-700"
      >
        Try again
      </button>
    </div>
  );
}

export default ErrorFallback;
