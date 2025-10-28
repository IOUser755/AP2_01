import clsx from 'clsx';

const sizeMap = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-4',
};

export interface LoadingSpinnerProps {
  size?: keyof typeof sizeMap;
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  return (
    <div
      className={clsx(
        'inline-block animate-spin rounded-full border-primary-500 border-t-transparent',
        sizeMap[size],
        className
      )}
      role="status"
      aria-label="Loading"
    />
  );
}

export default LoadingSpinner;
