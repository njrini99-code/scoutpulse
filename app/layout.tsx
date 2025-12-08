import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/lib/theme-context';
import { ErrorProvider } from '@/components/providers/ErrorProvider';
import { AnimationProvider } from '@/components/providers/AnimationProvider';
import { PWAProvider } from '@/components/pwa/PWAProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'ScoutPulse - Modern Baseball Recruiting',
    template: '%s | ScoutPulse',
  },
  description: 'A revolution in athlete discovery and recruiting. Connect players and coaches with modern, hyper-personalized tools.',
  keywords: ['baseball', 'recruiting', 'athletes', 'coaches', 'college baseball', 'player discovery', 'showcase', 'JUCO', 'high school baseball'],
  authors: [{ name: 'ScoutPulse' }],
  creator: 'ScoutPulse',
  publisher: 'ScoutPulse',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://scoutpulse.app'),
  
  // Open Graph
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'ScoutPulse',
    title: 'ScoutPulse - Modern Baseball Recruiting',
    description: 'A revolution in athlete discovery and recruiting. Connect players and coaches with modern, hyper-personalized tools.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ScoutPulse - Modern Baseball Recruiting Platform',
      },
    ],
  },
  
  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'ScoutPulse - Modern Baseball Recruiting',
    description: 'A revolution in athlete discovery and recruiting. Connect players and coaches with modern, hyper-personalized tools.',
    images: ['/og-image.png'],
    creator: '@scoutpulse',
  },
  
  // Icons
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  
  // Manifest
  manifest: '/manifest.json',
  
  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <ErrorProvider>
            <AnimationProvider>
              <PWAProvider>
                {children}
              </PWAProvider>
            </AnimationProvider>
          </ErrorProvider>
          <Toaster 
            position="top-right"
            toastOptions={{
              classNames: {
                toast: 'bg-white dark:bg-slate-800 border-emerald-200 dark:border-slate-700 text-slate-800 dark:text-white',
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}

