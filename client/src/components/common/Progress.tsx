import React from 'react';
import clsx from 'clsx';

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  indicatorClassName?: string;
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  className,
  indicatorClassName,
}) => {
  const clampedValue = Number.isFinite(value) ? Math.min(Math.max(value, 0), max) : 0;
  const percentage = max > 0 ? (clampedValue / max) * 100 : 0;

  return (
    <div
      className={clsx(
        'relative h-2 w-full overflow-hidden rounded-full bg-gray-200',
        className
      )}
      role="progressbar"
      aria-valuenow={Math.round(percentage)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={clsx('h-full rounded-full bg-primary-500 transition-all', indicatorClassName)}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};

export default Progress;
