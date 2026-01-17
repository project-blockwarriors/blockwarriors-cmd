'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '@/lib/convex';

interface TeamJoinWatcherProps {
  userId: string;
}

export function TeamJoinWatcher({ userId }: TeamJoinWatcherProps) {
  const router = useRouter();
  const profile = useQuery(api.userProfiles.getUserProfile, { userId });
  const didRedirect = useRef(false);

  useEffect(() => {
    if (didRedirect.current) return;
    if (profile?.team) {
      didRedirect.current = true;
      router.push('/dashboard/team');
    }
  }, [profile, router]);

  return null;
}
