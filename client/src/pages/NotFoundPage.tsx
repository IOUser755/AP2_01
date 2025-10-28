import { Link } from 'react-router-dom';

function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4 text-center">
      <div className="rounded-full bg-primary-100 px-4 py-1 text-sm font-medium text-primary-700">404</div>
      <h1 className="text-3xl font-semibold text-gray-900">Page not found</h1>
      <p className="max-w-md text-sm text-gray-500">
        The page you are looking for doesn&apos;t exist or has been moved. Check the URL or return to your
        dashboard.
      </p>
      <Link to="/dashboard" className="btn-primary">
        Back to dashboard
      </Link>
    </div>
  );
}

export default NotFoundPage;
