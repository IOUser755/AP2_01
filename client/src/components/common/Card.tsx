import React from 'react';
import clsx from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  border?: boolean;
  hoverable?: boolean;
  as?: keyof JSX.IntrinsicElements;
}

const cardPadding: Record<NonNullable<CardProps['padding']>, string> = {
  none: '',
  sm: 'p-5',
  md: 'p-7',
  lg: 'p-9',
};

const cardShadow: Record<NonNullable<CardProps['shadow']>, string> = {
  none: '',
  sm: 'shadow-brand-ring',
  md: 'shadow-brand-soft',
  lg: 'shadow-medium',
};

export const Card: React.FC<CardProps> = ({
  children,
  className,
  padding = 'md',
  shadow = 'sm',
  border = true,
  hoverable = false,
  as: Component = 'div',
}) => {
  return (
    <Component
      className={clsx(
        'relative rounded-2xl bg-white/95 backdrop-blur transition-all duration-200',
        cardPadding[padding],
        cardShadow[shadow],
        border && 'border border-neutral-200/70',
        hoverable && 'hover:shadow-medium',
        className
      )}
    >
      {children}
    </Component>
  );
};

interface CardSectionProps {
  children: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardSectionProps> = ({ children, className }) => (
  <div className={clsx('mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200/60 pb-4', className)}>{children}</div>
);

export const CardTitle: React.FC<CardSectionProps> = ({ children, className }) => (
  <h3 className={clsx('text-lg font-semibold text-neutral-800', className)}>{children}</h3>
);

export const CardBody: React.FC<CardSectionProps> = ({ children, className }) => (
  <div className={clsx('space-y-5 text-neutral-600', className)}>{children}</div>
);

export const CardFooter: React.FC<CardSectionProps> = ({ children, className }) => (
  <div className={clsx('pt-6', className)}>{children}</div>
);

export default Card;
