import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function RegistrationBanner() {
  return (
    <div className="bg-primary/20 backdrop-blur-sm py-2">
      <div className="container mx-auto flex items-center justify-center gap-4">
        <p className="text-sm font-medium text-white">
          Get ready for the BlockWarriors AI Challenge! Stay tuned for updates
          on registration.
        </p>
        <Button variant="outline" size="sm" asChild>
          <Link href="/">Stay Updated</Link>
        </Button>
      </div>
    </div>
  );
}
