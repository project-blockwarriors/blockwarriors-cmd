import type { Metadata } from 'next';

export const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || 'https://blockwarriors.ai';

/**
 * OG image routes - all served as webp via /api/og/[route]-og
 */
export const ogImageRoutes = {
  home: '/api/og/home-og',
  login: '/api/og/login-og',
  dashboard: '/api/og/dashboard-og',
  competition: '/api/og/competition-og',
  leaderboard: '/api/og/leaderboard-og',
  matches: '/api/og/matches-og',
} as const;

export type OGImageRoute = keyof typeof ogImageRoutes;

/**
 * Base metadata shared across all pages
 */
export const baseMetadata: Metadata = {
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
};

export type PageMetadataConfig = {
  /** Page title (will use template from base) */
  title: string;
  /** Page description */
  description: string;
  /** Relative page URL path (e.g., '/login', '/dashboard') */
  path?: string;
  /** OG image route key from ogImageRoutes */
  ogImage?: OGImageRoute;
  /** Custom OG image URL (overrides ogImage route) */
  customOgImageUrl?: string;
  /** Additional keywords for this page */
  keywords?: string[];
  /** Twitter creator handle (defaults to @blockwarriors) */
  twitterCreator?: string;
};

/**
 * Generate complete metadata for a page with dynamic OG image support.
 * OG images are served via /api/og/[route]-og as webp without cache-busting hashes.
 *
 * @example
 * // In your page.tsx:
 * import { createPageMetadata } from '@/lib/metadata';
 *
 * export const metadata = createPageMetadata({
 *   title: 'Sign In',
 *   description: 'Sign in to BlockWarriors',
 *   path: '/login',
 *   ogImage: 'login', // Uses /api/og/login-og
 * });
 */
export function createPageMetadata(config: PageMetadataConfig): Metadata {
  const {
    title,
    description,
    path = '',
    ogImage,
    customOgImageUrl,
    keywords = [],
    twitterCreator = '@blockwarriors',
  } = config;

  const fullUrl = path ? `${BASE_URL}${path}` : BASE_URL;
  const fullTitle = title.includes('BlockWarriors')
    ? title
    : `${title} | BlockWarriors`;

  // Determine image URL
  const imageUrl =
    customOgImageUrl ?? (ogImage ? ogImageRoutes[ogImage] : null);

  const ogImageConfig = imageUrl
    ? [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          type: 'image/webp',
          alt: fullTitle,
        },
      ]
    : undefined;

  return {
    title,
    description,
    keywords: [...(baseMetadata.keywords as string[]), ...keywords],
    openGraph: {
      title: fullTitle,
      description,
      url: fullUrl,
      siteName: 'BlockWarriors',
      type: 'website',
      locale: 'en_US',
      ...(ogImageConfig && { images: ogImageConfig }),
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      creator: twitterCreator,
      ...(ogImageConfig && { images: ogImageConfig }),
    },
    alternates: {
      canonical: fullUrl,
    },
  };
}

/**
 * Root page metadata with dynamic OG image.
 * This is used by the root layout.
 */
export const rootMetadata: Metadata = {
  ...baseMetadata,
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
        url: ogImageRoutes.home,
        width: 1200,
        height: 630,
        type: 'image/webp',
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
        url: ogImageRoutes.home,
        width: 1200,
        height: 630,
        alt: 'BlockWarriors - AI Minecraft Tournament',
      },
    ],
  },
};
