'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function SetupCheck({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Skip check for setup pages and non-dashboard pages
    if (pathname.startsWith('/dashboard/setup') || !pathname.startsWith('/dashboard')) {
      return;
    }

    // Check setup status from local storage
    const setupStatus = localStorage.getItem('setupStatus');
    if (!setupStatus) {
      router.push('/dashboard/setup');
      return;
    }

    try {
      const status = JSON.parse(setupStatus);
      if (!status.profileComplete || !status.teamComplete) {
        router.push('/dashboard/setup');
      }
    } catch (error) {
      console.error('Failed to parse setup status:', error);
      router.push('/dashboard/setup');
    }
  }, [pathname, router]);

  return <>{children}</>;
}
