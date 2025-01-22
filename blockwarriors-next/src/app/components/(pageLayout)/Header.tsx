import { Button } from '@/components/ui/button';
import { Gamepad2 } from 'lucide-react';
import Link from 'next/link';

export function Header({ startTournament }: { startTournament: boolean }) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0 mb-8">
      <div className="flex items-center gap-3">
        <Gamepad2 className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
        <Link href="/" className="text-2xl sm:text-3xl font-bold text-white">
          Princeton BlockWarriors
        </Link>
      </div>
      <div className="flex gap-4">
        <Button variant="outline" asChild>
          <Link
            href="/competition"
            className="flex items-center gap-2"
          >
            Competition Details
          </Link>
        </Button>
        {startTournament && (
          <Button variant="outline" asChild>
            <Link
              href="/dashboard"
              className="flex items-center gap-2"
            >
              View Tournament
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
