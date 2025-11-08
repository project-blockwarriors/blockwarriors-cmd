import { createAuth } from '@packages/backend/auth';
import { getToken as getTokenNextjs } from '@convex-dev/better-auth/nextjs';

export const getToken = () => {
  // getTokenNextjs reads cookies from Next.js context automatically
  // In API routes, cookies() from next/headers should be called first
  // to make them available in the context
  return getTokenNextjs(createAuth);
};
