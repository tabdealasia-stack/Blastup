import { ReactNode } from 'react';
import { clsx } from 'clsx';

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={clsx("bg-white shadow rounded-lg border border-gray-200", className)}>
      {children}
    </div>
  );
}
