import React from 'react';
import { Outlet } from 'react-router-dom';

import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MobileMenuProvider, useMobileMenu } from '@context/MobileMenuContext';

interface DashboardLayoutProps {
  children?: React.ReactNode;
}

const DashboardLayoutInner: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { isOpen, open, close } = useMobileMenu();

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-800">
      <Sidebar open={isOpen} onClose={close} />

      <div className="lg:pl-80">
        <Header onMenuClick={open} />

        <main className="py-12">
          <div className="mx-auto max-w-6xl px-6 sm:px-8 lg:px-12">
            <div className="space-y-12">{children ?? <Outlet />}</div>
          </div>
        </main>
      </div>
    </div>
  );
};

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => (
  <MobileMenuProvider>
    <DashboardLayoutInner>{children}</DashboardLayoutInner>
  </MobileMenuProvider>
);

export default DashboardLayout;
