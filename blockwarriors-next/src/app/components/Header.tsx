import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Gamepad2, ArrowRight } from 'lucide-react';

export function Header() {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0 mb-8">
      <div className="flex items-center gap-3">
        <Gamepad2 className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          Princeton BlockWarriors
        </h1>
      </div>
      <Button variant="outline" asChild className="w-full sm:w-auto">
        <Link
          href="/dashboard"
          className="flex items-center justify-center gap-2"
        >
          View Tournament <ArrowRight className="w-4 h-4" />
        </Link>
      </Button>
    </div>
  );
}
