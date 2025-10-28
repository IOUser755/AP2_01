import React from 'react';
import clsx from 'clsx';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'gray';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  removable?: boolean;
  onRemove?: () => void;
}

const badgeVariants: Record<NonNullable<BadgeProps['variant']>, string> = {
  primary: 'bg-primary-100 text-primary-800 ring-primary-600/20',
  secondary: 'bg-blue-100 text-blue-800 ring-blue-600/20',
  success: 'bg-success-100 text-success-800 ring-success-600/20',
  warning: 'bg-warning-100 text-warning-800 ring-warning-600/20',
  error: 'bg-error-100 text-error-800 ring-error-600/20',
  gray: 'bg-gray-100 text-gray-800 ring-gray-600/20',
};

const badgeSizes: Record<NonNullable<BadgeProps['size']>, string> = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-2.5 py-1.5 text-sm',
  lg: 'px-3 py-2 text-base',
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'gray',
  size = 'sm',
  className,
  removable = false,
  onRemove,
}) => {
  const handleRemove = () => {
    if (removable && onRemove) {
      onRemove();
    }
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full font-medium ring-1 ring-inset',
        badgeVariants[variant],
        badgeSizes[size],
        className
      )}
    >
      <span>{children}</span>
      {removable && onRemove && (
        <button
          type="button"
          onClick={handleRemove}
          className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full text-current transition hover:bg-black/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
        >
          <span className="sr-only">Remove</span>
          <svg className="h-3 w-3" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path
              d="M4 4l6 6m0-6l-6 6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
    </span>
  );
};

export default Badge;
