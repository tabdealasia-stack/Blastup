'use client';
import { createContext, useContext, useEffect, ReactNode } from 'react';
import useSWR from 'swr';
import { useRouter, usePathname } from 'next/navigation';
import { User } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  
  const { data: user, error, isLoading, mutate } = useSWR<User | null>('/api/auth/me', {
    shouldRetryOnError: false,
  });

  const loading = isLoading && user === undefined;

  useEffect(() => {
    if (loading) return;
    
    const isSuperadminRoute = pathname?.startsWith('/tabdeal');
    const isClientRoute = pathname?.startsWith('/dashboard');

    if (error || user === null) {
      if (isSuperadminRoute || isClientRoute) {
        router.push(`/login?from=${pathname}`);
      }
      return;
    }

    if (user) {
      if (isSuperadminRoute && user.role !== 'superadmin') {
        router.push('/dashboard');
      } else if (isClientRoute && user.role === 'superadmin') {
        router.push('/tabdeal');
      }
    }
  }, [user, error, loading, pathname, router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      mutate(null, false);
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ user: user || null, loading, logout: handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
