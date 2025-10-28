import React, { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { Link } from 'react-router-dom';
import {
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  BellIcon,
  Cog6ToothIcon,
  MoonIcon,
  SunIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

import { Badge } from '@components/common/Badge';
import { Button } from '@components/common/Button';
import { useAuth } from '@hooks/useAuth';
import { useTheme } from '@hooks/useTheme';
import { useWebSocket } from '@hooks/useWebSocket';

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const { actualTheme, toggleTheme } = useTheme();
  const { connected } = useWebSocket();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="sticky top-0 z-40 flex h-20 shrink-0 items-center gap-x-6 border-b border-neutral-200/70 bg-white/95 px-6 shadow-brand-ring backdrop-blur-sm sm:gap-x-8 sm:px-8 lg:px-12">
      <button
        type="button"
        className="-m-2.5 rounded-full p-2.5 text-neutral-600 transition hover:bg-neutral-100 lg:hidden"
        onClick={onMenuClick}
      >
        <span className="sr-only">Open sidebar</span>
        <Bars3Icon className="h-6 w-6" aria-hidden="true" />
      </button>
      <div className="h-6 w-px bg-neutral-200 lg:hidden" aria-hidden="true" />

      <div className="flex flex-1 items-center justify-between gap-x-6 self-stretch">
        <div className="flex flex-col justify-center">
          <p className="page-meta">{user?.firstName ? 'Dashboard Overview' : 'AgentPay Hub'}</p>
          <h1 className="mt-2 text-3xl font-semibold text-neutral-900">
            {user?.firstName ? `Welcome back, ${user.firstName}` : 'Empower your agent operations'}
          </h1>
        </div>

        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <div className="flex items-center gap-3 rounded-full border border-neutral-200/70 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-neutral-500">
            <span
              className={clsx('h-2.5 w-2.5 rounded-full', connected ? 'bg-success-500' : 'bg-error-500')}
              aria-hidden="true"
            />
            <span>{connected ? 'Connected' : 'Offline'}</span>
          </div>

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

          <button
            type="button"
            className="relative rounded-full bg-white/80 p-2 text-neutral-400 transition hover:bg-white hover:text-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
            aria-label="View notifications"
          >
            <BellIcon className="h-5 w-5" aria-hidden="true" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-error-500">
              <span className="text-[10px] font-semibold text-white">3</span>
            </span>
          </button>

          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-neutral-200" aria-hidden="true" />

          <Menu as="div" className="relative">
            <Menu.Button className="-m-1.5 flex items-center p-1.5">
              <span className="sr-only">Open user menu</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100">
                <span className="text-sm font-semibold text-brand-700">
                  {user?.firstName?.charAt(0)}
                  {user?.lastName?.charAt(0)}
                </span>
              </div>
              <span className="hidden lg:flex lg:items-center">
                <span className="ml-4 text-sm font-semibold leading-6 text-neutral-700" aria-hidden="true">
                  {user?.firstName} {user?.lastName}
                </span>
              </span>
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
              <Menu.Items className="absolute right-0 z-10 mt-2.5 w-60 origin-top-right rounded-2xl border border-neutral-200/70 bg-white/95 py-4 shadow-brand-soft backdrop-blur focus:outline-none">
                <div className="px-5 pb-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-neutral-400">Account</p>
                  <p className="mt-3 text-sm font-medium text-neutral-900">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="truncate text-sm text-neutral-500">{user?.email}</p>
                  {user?.role && (
                    <div className="mt-2">
                      <Badge variant="primary" size="sm">
                        {user.role}
                      </Badge>
                    </div>
                  )}
                </div>
                <div className="border-t border-neutral-200/70">
                  <Menu.Item>
                    {({ active }) => (
                      <Link
                        to="/profile"
                        className={clsx(
                          active ? 'bg-brand-50/70 text-brand-700' : 'text-neutral-600',
                          'flex items-center px-5 py-2 text-sm transition-colors'
                        )}
                      >
                        <UserCircleIcon className="mr-3 h-5 w-5" aria-hidden="true" />
                        Your Profile
                      </Link>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <Link
                        to="/settings"
                        className={clsx(
                          active ? 'bg-brand-50/70 text-brand-700' : 'text-neutral-600',
                          'flex items-center px-5 py-2 text-sm transition-colors'
                        )}
                      >
                        <Cog6ToothIcon className="mr-3 h-5 w-5" aria-hidden="true" />
                        Settings
                      </Link>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        type="button"
                        onClick={handleLogout}
                        className={clsx(
                          active ? 'bg-brand-50/70 text-brand-700' : 'text-neutral-600',
                          'flex w-full items-center px-5 py-2 text-sm transition-colors'
                        )}
                      >
                        <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5" aria-hidden="true" />
                        Sign out
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
    </div>
  );
};

export default Header;
