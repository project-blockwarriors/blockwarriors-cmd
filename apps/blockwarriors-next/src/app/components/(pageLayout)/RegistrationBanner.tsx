'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useQuery } from 'convex/react';
import { api } from '@/lib/convex';

/**
 * Banner component that fetches banner settings from Convex
 * and conditionally renders the banner.
 * The banner will automatically update when settings change in the database.
 */
export function RegistrationBanner() {
  const bannerSettings = useQuery(api.settings.getBannerSettings);

  // Show nothing while loading or if banner is disabled/not found
  if (bannerSettings === undefined || bannerSettings === null) {
    return null;
  }

  const { text_content, button_text, button_link } = bannerSettings;

  if (!text_content) {
    return null;
  }

  return (
    <div className="bg-primary/20 backdrop-blur-sm py-2">
      <div className="container mx-auto flex items-center justify-center gap-4">
        <p className="text-sm font-medium text-white">
          {text_content}
        </p>
        {button_text && (
        <Button variant="outline" size="sm" asChild>
            <Link href={button_link || '/'}>{button_text}</Link>
        </Button>
        )}
      </div>
    </div>
  );
}
