import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function RegistrationBanner() {
  return (
    <div className="bg-primary/20 backdrop-blur-sm py-2">
      <div className="container mx-auto px-4 flex items-center justify-center gap-4">
        <p className="text-sm font-medium text-white">
          Registration is now open for the BlockWarriors AI Challenge!
        </p>
        <Button variant="outline" size="sm" asChild>
          <Link href="/register">Register Here</Link>
        </Button>
      </div>
    </div>
  );
}
