import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ConvexClientProvider } from './ConvexClientProvider';
import { ConvexExample } from '@/components/convex/ConvexExample';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Princeton BlockWarriors',
  description: 'AI Bot Tournament',
  icons: {
    icon: [{ url: '/favicon.ico' }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark overflow-x-hidden" suppressHydrationWarning>
      <body
        className={`${inter.className} overflow-x-hidden`}
        suppressHydrationWarning
      >
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
