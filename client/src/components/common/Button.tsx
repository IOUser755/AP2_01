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
  primary:
    'bg-brand-600 text-white shadow-brand-soft hover:bg-brand-700 focus-visible:outline-brand-500 focus-visible:ring-brand-200',
  secondary:
    'bg-white/90 text-neutral-700 shadow-brand-ring hover:bg-white focus-visible:outline-brand-500 focus-visible:ring-brand-200',
  outline:
    'border border-neutral-300/80 bg-transparent text-neutral-600 hover:border-brand-400 hover:text-brand-600 focus-visible:outline-brand-500 focus-visible:ring-brand-200',
  danger:
    'bg-error-500 text-white hover:bg-error-600 focus-visible:outline-error-500 focus-visible:ring-error-200',
  ghost:
    'text-neutral-600 hover:bg-neutral-100 focus-visible:outline-brand-500 focus-visible:ring-brand-200',
};

const buttonSizes: Record<NonNullable<ButtonProps['size']>, string> = {
  xs: 'px-3 py-1.5 text-[11px]',
  sm: 'px-4 py-2 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3 text-sm',
  xl: 'px-7 py-3.5 text-base',
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
          'inline-flex items-center justify-center gap-2 rounded-full font-semibold uppercase tracking-[0.2em] transition-all duration-150',
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
