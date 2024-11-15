import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Gamepad2, ArrowRight } from 'lucide-react';

export function Header() {
  return (
    <div className="flex justify-between items-center mb-8">
      <div className="flex items-center gap-3">
        <Gamepad2 className="w-10 h-10 text-white" />
        <h1 className="text-3xl font-bold text-white">Princeton BlockWarriors</h1>
      </div>
      <Button variant="outline" asChild>
        <Link href="/dashboard" className="flex items-center gap-2">
          View Tournament <ArrowRight className="w-4 h-4" />
        </Link>
      </Button>
    </div>
  );
}