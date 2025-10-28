import React from 'react';
import { Link } from 'react-router-dom';
import { ExclamationTriangleIcon, HomeIcon } from '@heroicons/react/24/outline';

import { Button } from '@components/common/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto h-16 w-16 bg-error-100 rounded-full flex items-center justify-center mb-6">
          <ExclamationTriangleIcon className="h-8 w-8 text-error-600" />
        </div>

        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Page not found</h2>
        <p className="text-gray-600 mb-8">
          Sorry, we couldn't find the page you're looking for. The page might have been moved, deleted, or you entered the
          wrong URL.
        </p>

        <div className="space-y-4">
          <Link to="/dashboard">
            <Button fullWidth>
              <HomeIcon className="h-4 w-4 mr-2" />
              Go to Dashboard
            </Button>
          </Link>

          <button
            type="button"
            onClick={() => window.history.back()}
            className="w-full text-primary-600 hover:text-primary-500 font-medium"
          >
            Go back to previous page
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
