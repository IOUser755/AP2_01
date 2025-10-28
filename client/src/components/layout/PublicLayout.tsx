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
    <div className="min-h-screen bg-neutral-50 text-neutral-800">
      <header className="border-b border-neutral-200/70 bg-white/95 shadow-brand-ring backdrop-blur">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-6 sm:px-8 lg:px-12">
          <Link to="/" className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-brand-soft">
              <span className="text-sm font-bold tracking-[0.18em]">A2</span>
            </div>
            <div>
              <span className="block text-xs font-semibold uppercase tracking-[0.32em] text-neutral-400">AgentPay</span>
              <span className="block text-lg font-semibold text-neutral-800">Intelligence Hub</span>
            </div>
          </Link>

          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="xs"
              onClick={toggleTheme}
              className="!p-2 rounded-full text-neutral-500 transition hover:bg-neutral-100"
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
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-neutral-200/70 bg-white/95">
        <div className="mx-auto max-w-6xl px-6 py-12 sm:px-8 lg:px-12">
          <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-brand-soft">
                <span className="text-xs font-bold tracking-[0.18em]">A2</span>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-neutral-400">AgentPay</p>
                <p className="text-sm font-semibold text-neutral-700">Modern finance enablement</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-xs font-semibold uppercase tracking-[0.28em] text-neutral-400">
              <Link to="/privacy" className="transition hover:text-brand-600">
                Privacy Policy
              </Link>
              <Link to="/terms" className="transition hover:text-brand-600">
                Terms of Service
              </Link>
              <Link to="/support" className="transition hover:text-brand-600">
                Support
              </Link>
            </div>
          </div>

          <div className="section-divider" />

          <p className="text-center text-xs font-semibold uppercase tracking-[0.28em] text-neutral-400">
            © 2024 AgentPay Hub. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
