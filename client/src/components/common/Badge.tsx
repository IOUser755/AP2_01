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
  primary: 'bg-brand-100 text-brand-700',
  secondary: 'bg-brand-50 text-brand-600',
  success: 'bg-success-100 text-success-700',
  warning: 'bg-warning-100 text-warning-700',
  error: 'bg-error-100 text-error-700',
  gray: 'bg-neutral-100 text-neutral-600',
};

const badgeSizes: Record<NonNullable<BadgeProps['size']>, string> = {
  sm: 'px-3 py-1 text-[10px]',
  md: 'px-3.5 py-1.5 text-xs',
  lg: 'px-4 py-2 text-sm',
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
        'inline-flex items-center gap-1 rounded-full font-semibold uppercase tracking-[0.28em]',
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
