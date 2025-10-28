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
    <div className="min-h-screen bg-gray-50">
      <Sidebar open={isOpen} onClose={close} />

      <div className="lg:pl-72">
        <Header onMenuClick={open} />

        <main className="py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children ?? <Outlet />}
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
