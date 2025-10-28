import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Link, useLocation } from 'react-router-dom';
import {
  ChartBarIcon,
  Cog8ToothIcon,
  CurrencyDollarIcon,
  HomeIcon,
  PuzzlePieceIcon,
  RocketLaunchIcon,
  ShoppingBagIcon,
  UserGroupIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

import { Badge } from '@components/common/Badge';
import { useAuth } from '@hooks/useAuth';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  badge?: string;
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Agents', href: '/agents', icon: RocketLaunchIcon, badge: 'New' },
  { name: 'Transactions', href: '/transactions', icon: CurrencyDollarIcon },
  { name: 'Marketplace', href: '/marketplace', icon: ShoppingBagIcon },
  { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
  { name: 'Integrations', href: '/integrations', icon: PuzzlePieceIcon },
  { name: 'Team', href: '/team', icon: UserGroupIcon },
  { name: 'Settings', href: '/settings', icon: Cog8ToothIcon },
];

const SidebarContent: React.FC = () => {
  const location = useLocation();
  const { tenant } = useAuth();

  const items = navigation.map(item => ({
    ...item,
    current: location.pathname === item.href || location.pathname.startsWith(`${item.href}/`),
  }));

  return (
    <div className="flex grow flex-col gap-y-8 overflow-y-auto border-r border-neutral-200/70 bg-white/90 px-8 pb-10 pt-8 backdrop-blur">
      <div className="flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-brand-soft">
            <span className="text-sm font-bold tracking-[0.18em]">A2</span>
          </div>
          <div>
            <span className="block text-sm font-semibold uppercase tracking-[0.32em] text-neutral-400">AgentPay</span>
            <span className="block text-lg font-semibold text-neutral-800">Intelligence Hub</span>
          </div>
        </Link>
        <span className="hidden text-xs font-semibold uppercase tracking-[0.32em] text-neutral-300 lg:block">MENU</span>
      </div>

      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-8">
          <li>
            <ul role="list" className="-mx-2 space-y-2">
              <li className="px-2">
                <span className="section-label">Navigation</span>
              </li>
              {items.map(item => (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={clsx(
                      item.current
                        ? 'bg-brand-50/70 text-brand-700 shadow-brand-ring'
                        : 'text-neutral-600 hover:bg-neutral-100/80 hover:text-brand-700',
                      'group flex items-center gap-x-3 rounded-xl px-3 py-3 text-sm font-semibold leading-6 transition'
                    )}
                  >
                    <item.icon
                      className={clsx(
                        item.current ? 'text-brand-700' : 'text-neutral-400 group-hover:text-brand-600',
                        'h-5 w-5 flex-shrink-0'
                      )}
                      aria-hidden="true"
                    />
                    <span className="flex-1">{item.name}</span>
                    {item.badge && (
                      <Badge variant="primary" size="sm">
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </li>

          <li className="mt-auto">
            <div className="surface-subtle">
              <div className="flex items-center space-x-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                  <span className="text-base font-semibold">
                    {tenant?.name ? tenant.name.charAt(0).toUpperCase() : 'A'}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-neutral-700">{tenant?.name ?? 'AgentPay Hub'}</p>
                  <p className="truncate text-xs font-semibold uppercase tracking-[0.28em] text-neutral-400">{tenant?.plan ?? 'Free Plan'}</p>
                </div>
              </div>
            </div>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => (
  <>
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50 lg:hidden" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="transition-opacity ease-linear duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity ease-linear duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-900/80" />
        </Transition.Child>

        <div className="fixed inset-0 flex">
          <Transition.Child
            as={Fragment}
            enter="transition ease-in-out duration-300 transform"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="transition ease-in-out duration-300 transform"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
              <Transition.Child
                as={Fragment}
                enter="ease-in-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in-out duration-300"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                  <button type="button" className="-m-2.5 p-2.5" onClick={onClose}>
                    <span className="sr-only">Close sidebar</span>
                    <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                  </button>
                </div>
              </Transition.Child>
              <SidebarContent />
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>

    <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-80 lg:flex-col">
      <SidebarContent />
    </div>
  </>
);

export default Sidebar;
