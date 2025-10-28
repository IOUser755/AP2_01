import React, { forwardRef, useId, type InputHTMLAttributes } from 'react';
import clsx from 'clsx';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      fullWidth = true,
      className,
      id,
      required,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const descriptionId = helperText || error ? `${inputId}-description` : undefined;
    const hasError = Boolean(error);

    return (
      <div className={clsx('space-y-1', fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700"
          >
            {label}
            {required && <span className="ml-1 text-error-500" aria-hidden="true">*</span>}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            aria-invalid={hasError || undefined}
            aria-describedby={descriptionId}
            className={clsx(
              'block w-full rounded-lg border border-gray-300 bg-white shadow-sm transition focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50',
              'placeholder:text-gray-400 disabled:cursor-not-allowed disabled:bg-gray-100',
              leftIcon && 'pl-10',
              (rightIcon || hasError) && 'pr-10',
              hasError && 'border-error-300 focus:border-error-500 focus:ring-error-500/60',
              className
            )}
            required={required}
            {...props}
          />

          {(rightIcon || hasError) && (
            <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
              {hasError ? (
                <ExclamationCircleIcon className="h-5 w-5 text-error-500" aria-hidden="true" />
              ) : (
                rightIcon
              )}
            </span>
          )}
        </div>

        {(helperText || error) && (
          <p
            id={descriptionId}
            className={clsx('text-sm', hasError ? 'text-error-600' : 'text-gray-500')}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
