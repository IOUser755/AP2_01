import React from 'react';
import clsx from 'clsx';

export interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  color?: 'primary' | 'white' | 'gray';
}

const sizeMap: Record<NonNullable<LoadingSpinnerProps['size']>, string> = {
  xs: 'h-3 w-3 border',
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-4',
  xl: 'h-16 w-16 border-4',
};

const colorMap: Record<NonNullable<LoadingSpinnerProps['color']>, string> = {
  primary: 'text-primary-600',
  white: 'text-white',
  gray: 'text-gray-400',
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className,
  color = 'primary',
}) => {
  return (
    <span
      className={clsx(
        'inline-flex items-center justify-center',
        className
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span
        className={clsx(
          'box-content animate-spin rounded-full border-current border-t-transparent',
          sizeMap[size],
          colorMap[color]
        )}
      />
      <span className="sr-only">Loading…</span>
    </span>
  );
};

export default LoadingSpinner;
