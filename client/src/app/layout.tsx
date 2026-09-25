import type { Metadata } from 'next';
import '@/styles/globals.css';
import { SWRProvider } from '@/providers/SWRProvider';
import { AuthProvider } from '@/providers/AuthProvider';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'TABDEAL BLASTUP | WhatsApp Transactional Notifications & Business Automation Platform',
  description: 'Professional B2B WhatsApp transactional notification and automation platform for developers and businesses. Self-hosted reliable API.',
  openGraph: {
    title: 'TABDEAL BLASTUP | WhatsApp Transactional Notifications',
    description: 'Professional B2B WhatsApp transactional notification and automation platform.',
    type: 'website',
  },
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased text-gray-900 bg-white">
        <SWRProvider>
          <AuthProvider>
            {children}
            <Toaster position="top-right" />
          </AuthProvider>
        </SWRProvider>
      </body>
    </html>
  );
}
