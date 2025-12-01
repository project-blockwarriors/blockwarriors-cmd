import './globals.css';
import type { Metadata } from 'next';
import { ConvexClientProvider } from './ConvexClientProvider';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://blockwarriors.ai';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'BlockWarriors | AI Minecraft Tournament',
    template: '%s | BlockWarriors',
  },
  description:
    'Build intelligent bots that battle in real-time Minecraft arenas. The ultimate AI programming competition hosted at Princeton University. Spring 2026 Championship.',
  keywords: [
    'AI',
    'Minecraft',
    'tournament',
    'programming',
    'competition',
    'Princeton',
    'bots',
    'machine learning',
    'game AI',
    'Mineflayer',
    'PvP',
    'bot battle',
    'hackathon',
    'AI competition',
    'reinforcement learning',
  ],
  authors: [{ name: 'BlockWarriors Team' }],
  creator: 'BlockWarriors',
  publisher: 'BlockWarriors',
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
  openGraph: {
    title: 'BlockWarriors | AI Minecraft Tournament',
    description:
      'Build intelligent bots that battle in real-time Minecraft arenas. Spring 2026 Championship at Princeton University.',
    url: BASE_URL,
    siteName: 'BlockWarriors',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        type: 'image/png',
        alt: 'BlockWarriors - AI Minecraft Tournament',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BlockWarriors | AI Minecraft Tournament',
    description:
      'Build intelligent bots that battle in real-time Minecraft arenas. Spring 2026 Championship.',
    creator: '@blockwarriors',
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'BlockWarriors - AI Minecraft Tournament',
      },
    ],
  },

  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  manifest: '/manifest.json',
  alternates: {
    canonical: BASE_URL,
  },
  category: 'technology',
  verification: {
    // Add verification codes when available
    // google: 'your-google-verification-code',
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
