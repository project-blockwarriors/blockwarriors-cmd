import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function RegistrationBanner({ bannerTextContent, bannerButtonContent }) {
  return (
    <div className="bg-primary/20 backdrop-blur-sm py-2">
      <div className="container mx-auto flex items-center justify-center gap-4">
        <p className="text-sm font-medium text-white">
          {bannerTextContent}
        </p>
        <Button variant="outline" size="sm" asChild>
          <Link href="/">{bannerButtonContent}</Link>
        </Button>
      </div>
    </div>
  );
}
