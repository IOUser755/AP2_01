import { Link } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme.ts';

function NotFoundPage() {
  const { theme } = useTheme();
  const background = theme === 'dark' ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900';

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center px-6 ${background}`}>
      <p className="text-sm uppercase tracking-widest text-primary-400">Error 404</p>
      <h1 className="mt-3 text-4xl font-bold">Page not found</h1>
      <p className="mt-4 max-w-md text-center text-slate-500 dark:text-slate-300">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <Link
        to="/dashboard"
        className="mt-6 rounded bg-primary-600 px-4 py-2 text-white transition hover:bg-primary-700"
      >
        Back to dashboard
      </Link>
    </div>
  );
}

export default NotFoundPage;
