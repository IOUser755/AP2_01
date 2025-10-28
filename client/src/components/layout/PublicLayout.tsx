import React from 'react';
import { Link } from 'react-router-dom';
import { MoonIcon, SunIcon } from '@heroicons/react/24/outline';

import { Button } from '@components/common/Button';
import { useTheme } from '@hooks/useTheme';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  const { actualTheme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-600">
                <span className="text-sm font-bold text-white">A2</span>
              </div>
              <span className="text-xl font-bold text-gray-900">AgentPay Hub</span>
            </Link>

            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="p-2"
                title={`Switch to ${actualTheme === 'light' ? 'dark' : 'light'} mode`}
                aria-label={`Switch to ${actualTheme === 'light' ? 'dark' : 'light'} mode`}
              >
                {actualTheme === 'light' ? <MoonIcon className="h-5 w-5" /> : <SunIcon className="h-5 w-5" />}
              </Button>

              <Link to="/login">
                <Button variant="outline" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="primary" size="sm">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="py-8">
            <div className="flex flex-col items-center justify-between md:flex-row">
              <div className="mb-4 flex items-center space-x-2 md:mb-0">
                <div className="flex h-6 w-6 items-center justify-center rounded bg-gradient-to-br from-primary-500 to-primary-600">
                  <span className="text-xs font-bold text-white">A2</span>
                </div>
                <span className="font-semibold text-gray-900">AgentPay Hub</span>
              </div>

              <div className="flex space-x-6 text-sm text-gray-600">
                <Link to="/privacy" className="hover:text-gray-900">
                  Privacy Policy
                </Link>
                <Link to="/terms" className="hover:text-gray-900">
                  Terms of Service
                </Link>
                <Link to="/support" className="hover:text-gray-900">
                  Support
                </Link>
              </div>
            </div>

            <div className="mt-4 border-t border-gray-200 pt-4">
              <p className="text-center text-sm text-gray-500">© 2024 AgentPay Hub. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
