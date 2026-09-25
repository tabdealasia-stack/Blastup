import { clsx } from 'clsx';

export function Badge({ children, variant = 'gray' }: { children: React.ReactNode, variant?: 'gray' | 'green' | 'red' | 'yellow' | 'blue' }) {
  return (
    <span className={clsx(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
      {
        'bg-gray-100 text-gray-800': variant === 'gray',
        'bg-green-100 text-green-800': variant === 'green',
        'bg-red-100 text-red-800': variant === 'red',
        'bg-yellow-100 text-yellow-800': variant === 'yellow',
        'bg-blue-100 text-blue-800': variant === 'blue',
      }
    )}>
      {children}
    </span>
  );
}
