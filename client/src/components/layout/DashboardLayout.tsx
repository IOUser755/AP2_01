import { Fragment, type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, Transition } from '@headlessui/react';
import { BarChart3, ChevronDown, LayoutDashboard, LogOut, Settings, SquareGanttChart, Wallet } from 'lucide-react';

import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '@hooks/useAuth';

const navigation = [
  { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { name: 'Agents', to: '/agents', icon: SquareGanttChart },
  { name: 'Transactions', to: '/transactions', icon: Wallet },
  { name: 'Marketplace', to: '/marketplace', icon: SquareGanttChart },
  { name: 'Analytics', to: '/analytics', icon: BarChart3 },
  { name: 'Integrations', to: '/integrations', icon: Settings },
];

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, tenant, logout } = useAuth();

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="hidden w-72 border-r border-gray-200 bg-white px-6 py-8 lg:flex lg:flex-col lg:gap-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">AgentPay Hub</h2>
          <p className="mt-1 text-sm text-gray-500">{tenant?.name ?? 'Multi-tenant workspace'}</p>
        </div>
        <nav className="flex-1 space-y-1">
          {navigation.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-ring ${
                    isActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </NavLink>
            );
          })}
        </nav>
        <div className="space-y-3">
          <ThemeToggle />
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 focus-ring"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-4 shadow-sm lg:px-8">
          <div className="lg:hidden">
            <ThemeToggle />
          </div>
          <div className="flex flex-1 items-center justify-end gap-4">
            <Menu as="div" className="relative inline-block text-left">
              <Menu.Button className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-soft hover:bg-gray-50 focus-ring">
                <span>{user ? `${user.firstName} ${user.lastName}` : 'User'}</span>
                <ChevronDown className="h-4 w-4" />
              </Menu.Button>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 z-20 mt-2 w-56 origin-top-right rounded-lg bg-white p-2 shadow-medium ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <Menu.Item>
                    {({ active }) => (
                      <NavLink
                        to="/settings"
                        className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
                          active ? 'bg-gray-100 text-gray-900' : 'text-gray-600'
                        }`}
                      >
                        <Settings className="h-4 w-4" />
                        Settings
                      </NavLink>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        type="button"
                        onClick={logout}
                        className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
                          active ? 'bg-gray-100 text-error-600' : 'text-gray-600'
                        }`}
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    )}
                  </Menu.Item>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 lg:px-8">
          <div className="mx-auto max-w-6xl space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
