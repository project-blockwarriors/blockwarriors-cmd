'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import toast from 'react-hot-toast';

export function SignOutButton({ variant = 'ghost', className = '' }: { variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'; className?: string }) {
  const [isPending, startTransition] = useTransition();

  const handleSignOut = () => {
    startTransition(async () => {
      try {
        await authClient.signOut();
        toast.success('Signed out successfully');
        // Use window.location.href for a full page reload to ensure cookies are cleared
        // This ensures the middleware runs with the cleared session
        window.location.href = '/';
      } catch (error) {
        console.error('Sign out error:', error);
        toast.error('Failed to sign out');
      }
    });
  };

  return (
    <Button
      variant={variant}
      onClick={handleSignOut}
      disabled={isPending}
      className={className}
    >
      <LogOut className="h-4 w-4 mr-2" />
      {isPending ? 'Signing out...' : 'Sign Out'}
    </Button>
  );
}

