import { createAuthClient } from 'better-auth/react';
import { convexClient } from '@convex-dev/better-auth/client/plugins';

// baseURL should be your site URL (where the Next.js app runs)
// The Convex plugin will handle communication with Convex
const siteUrl =
  typeof window !== 'undefined'
    ? window.location.origin
    : process.env.SITE_URL || 'http://localhost:3000';

export const authClient = createAuthClient({
  baseURL: siteUrl,
  plugins: [
    convexClient({
      // The Convex plugin needs the Convex site URL
      convexSiteUrl:
        process.env.NEXT_PUBLIC_CONVEX_SITE_URL ||
        process.env.NEXT_PUBLIC_CONVEX_URL?.replace('.cloud', '.site'),
    }),
  ],
});
