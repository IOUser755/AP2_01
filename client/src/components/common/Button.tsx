import React, { forwardRef, type ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

import { LoadingSpinner } from './LoadingSpinner';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const buttonVariants: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-primary-600 text-white shadow-sm hover:bg-primary-700 focus-visible:outline-primary-600',
  secondary: 'bg-gray-600 text-white shadow-sm hover:bg-gray-700 focus-visible:outline-gray-600',
  outline:
    'border border-gray-300 bg-white text-gray-700 shadow-sm hover:bg-gray-50 focus-visible:outline-primary-600',
  danger: 'bg-error-600 text-white shadow-sm hover:bg-error-700 focus-visible:outline-error-600',
  ghost: 'text-gray-700 hover:bg-gray-100 focus-visible:outline-gray-500',
};

const buttonSizes: Record<NonNullable<ButtonProps['size']>, string> = {
  xs: 'px-2.5 py-1.5 text-xs',
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-4 py-2 text-base',
  xl: 'px-6 py-3 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      loading = false,
      loadingText = 'Loading…',
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      type = 'button',
      className,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        type={type}
        className={clsx(
          'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-150',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:ring-0',
          'disabled:cursor-not-allowed disabled:opacity-60',
          buttonVariants[variant],
          buttonSizes[size],
          fullWidth && 'w-full',
          className
        )}
        disabled={isDisabled}
        aria-disabled={isDisabled || undefined}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? (
          <>
            <LoadingSpinner size="sm" color={variant === 'outline' || variant === 'ghost' ? 'primary' : 'white'} />
            <span className="sr-only">{loadingText}</span>
            <span aria-hidden="true">{loadingText}</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="flex items-center" aria-hidden="true">{leftIcon}</span>}
            <span>{children}</span>
            {rightIcon && <span className="flex items-center" aria-hidden="true">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
