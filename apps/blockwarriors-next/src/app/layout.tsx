import './globals.css';
import type { Metadata } from 'next';
import { ConvexClientProvider } from './ConvexClientProvider';

export const metadata: Metadata = {
  title: 'BlockWarriors | AI Minecraft Tournament',
  description:
    'Build intelligent bots that battle in real-time Minecraft arenas. The ultimate AI programming competition hosted at Princeton University.',
  keywords: [
    'AI',
    'Minecraft',
    'tournament',
    'programming',
    'competition',
    'Princeton',
    'bots',
  ],
  authors: [{ name: 'BlockWarriors Team' }],
  openGraph: {
    title: 'BlockWarriors | AI Minecraft Tournament',
    description:
      'Build intelligent bots that battle in real-time Minecraft arenas.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BlockWarriors | AI Minecraft Tournament',
    description:
      'Build intelligent bots that battle in real-time Minecraft arenas.',
  },
  icons: {
    icon: [{ url: '/favicon.ico' }],
    apple: [{ url: '/apple-touch-icon.png' }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
