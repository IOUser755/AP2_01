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
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

const cardShadow: Record<NonNullable<CardProps['shadow']>, string> = {
  none: '',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
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
        'relative rounded-lg bg-white transition-shadow duration-200',
        cardPadding[padding],
        cardShadow[shadow],
        border && 'border border-gray-200',
        hoverable && 'hover:shadow-lg',
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
  <div className={clsx('flex flex-wrap items-center justify-between gap-2 pb-4', className)}>{children}</div>
);

export const CardTitle: React.FC<CardSectionProps> = ({ children, className }) => (
  <h3 className={clsx('text-lg font-semibold text-gray-900', className)}>{children}</h3>
);

export const CardBody: React.FC<CardSectionProps> = ({ children, className }) => (
  <div className={clsx('space-y-4', className)}>{children}</div>
);

export const CardContent = CardBody;

export const CardFooter: React.FC<CardSectionProps> = ({ children, className }) => (
  <div className={clsx('pt-4', className)}>{children}</div>
);

export default Card;
