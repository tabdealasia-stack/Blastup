import { clsx } from 'clsx';
import { HTMLAttributes } from 'react';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'green' | 'yellow' | 'red' | 'blue' | 'gray';
}

export function Badge({ className, variant = 'neutral', children, ...props }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide",
        {
          'bg-emerald-100 text-emerald-800 border border-emerald-200': variant === 'success' || variant === 'green',
          'bg-amber-100 text-amber-800 border border-amber-200': variant === 'warning' || variant === 'yellow',
          'bg-rose-100 text-rose-800 border border-rose-200': variant === 'danger' || variant === 'red',
          'bg-blue-100 text-blue-800 border border-blue-200': variant === 'info' || variant === 'blue',
          'bg-gray-100 text-gray-700 border border-gray-200': variant === 'neutral' || variant === 'gray',
        },
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
