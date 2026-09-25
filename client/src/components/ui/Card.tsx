import { clsx } from 'clsx';
import { HTMLAttributes } from 'react';

export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx("bg-white rounded-xl border border-gray-200/75 shadow-sm overflow-hidden", className)} {...props}>
      {children}
    </div>
  );
}
