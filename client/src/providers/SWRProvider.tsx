'use client';
import { SWRConfig } from 'swr';
import { ReactNode } from 'react';
import { request, ApiError } from '@/lib/api';
import toast from 'react-hot-toast';

export function SWRProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher: (url: string) => request<{data: any}>(url).then(res => res.data),
        onError: (err: any) => {
          if (err instanceof ApiError) {
            // Only show toast for 500 errors by default, 4xx should be handled by components
            if (err.status >= 500) {
              toast.error('An unexpected error occurred. Please try again.');
            }
          }
        },
        revalidateOnFocus: false,
        shouldRetryOnError: (err) => {
          if (err instanceof ApiError && (err.status === 401 || err.status === 403 || err.status === 404)) {
            return false;
          }
          return true;
        }
      }}
    >
      {children}
    </SWRConfig>
  );
}
