import React from 'react';
import clsx from 'clsx';

interface ProgressProps {
  value?: number;
  max?: number;
  className?: string;
}

export const Progress: React.FC<ProgressProps> = ({ value = 0, max = 100, className }) => {
  const clamped = Math.min(Math.max(value, 0), max);
  const percentage = (clamped / max) * 100;

  return (
    <div className={clsx('h-2 w-full overflow-hidden rounded-full bg-gray-200', className)} role="progressbar" aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={max}>
      <div className="h-full rounded-full bg-primary-500 transition-all duration-300" style={{ width: `${percentage}%` }} />
    </div>
  );
};

export default Progress;
