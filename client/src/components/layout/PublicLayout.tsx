import type { ReactNode } from 'react';

import { ThemeToggle } from '@components/layout/ThemeToggle';

interface PublicLayoutProps {
  children: ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100">
      <div className="absolute top-6 right-8">
        <ThemeToggle />
      </div>
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <div className="max-w-3xl text-center mb-10">
          <h1 className="text-3xl font-semibold text-gray-900 md:text-4xl">
            AgentPay Hub
          </h1>
          <p className="mt-4 text-gray-600">
            Build, deploy, and monitor multi-tenant AI payment agents with enterprise-grade security
            and analytics.
          </p>
        </div>
        <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-medium">
          {children}
        </div>
      </div>
    </div>
  );
}

export default PublicLayout;
