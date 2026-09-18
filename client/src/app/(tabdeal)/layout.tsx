import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import TabdealShell from './TabdealShell';

export const metadata: Metadata = {
  title: {
    template: '%s — TABDEAL',
    default: 'TABDEAL Management',
  },
};

async function verifySuperadmin(): Promise<boolean> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('wa_token')?.value;
    if (!token) return false;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const res = await fetch(`${apiUrl}/api/auth/me`, {
      headers: { Cookie: `wa_token=${token}` },
      cache: 'no-store',
    });
    
    if (!res.ok) return false;
    
    const json = await res.json();
    return json.data?.user?.role === 'superadmin';
  } catch {
    return false;
  }
}

export default async function TabdealLayout({ children }: { children: React.ReactNode }) {
  const isSuperadmin = await verifySuperadmin();

  if (!isSuperadmin) {
    redirect('/dashboard');
  }

  return (
    <TabdealShell>
      {children}
    </TabdealShell>
  );
}
