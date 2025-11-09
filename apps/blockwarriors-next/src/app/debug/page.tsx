'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import GoogleSignInButton from '@/components/common/GoogleSignInButton';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import { signOutAction } from '@/server/actions/users';
import { authClient } from '@/lib/auth-client';
import { Loader2 } from 'lucide-react';

export default function DebugPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  // Use better-auth's useSession hook for real-time updates
  const { data: session, isPending: isLoading } = authClient.useSession();

  const handleLogout = () => {
    startTransition(async () => {
      try {
        await signOutAction();
        toast.success('Logged out successfully');
        router.push('/');
      } catch (error) {
        console.error('Logout error:', error);
        toast.error('Failed to logout');
      }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[url('/blockwarriors-ai-background.webp')] bg-cover bg-center">
        <div className="min-h-screen bg-black/60 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-white" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[url('/blockwarriors-ai-background.webp')] bg-cover bg-center">
      <div className="min-h-screen bg-black/60">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto bg-gray-900 rounded-lg p-6 shadow-lg">
            <h1 className="text-2xl font-bold text-center mb-6 text-white">
              Debug Page
            </h1>

            <div className="space-y-6">
              <div className="p-4 bg-gray-800 rounded-md">
                <h2 className="font-semibold mb-2 text-white">
                  Authentication Status
                </h2>
                <p className="text-sm mb-4 text-gray-300">
                  Currently: {session ? 'Logged In' : 'Not Logged In'}
                </p>

                {session?.user ? (
                  <div className="space-y-4">
                    <div className="text-sm text-gray-300">
                      <p>
                        <strong>User ID:</strong> {session.user.id}
                      </p>
                      <p>
                        <strong>Email:</strong> {session.user.email}
                      </p>
                      {session.user.emailVerified && (
                        <p>
                          <strong>Email Verified:</strong> Yes
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={handleLogout}
                      className="w-full"
                      disabled={isPending}
                    >
                      {isPending ? 'Signing Out...' : 'Sign Out'}
                    </Button>
                  </div>
                ) : (
                  <GoogleSignInButton />
                )}
              </div>

              <div className="p-4 bg-gray-800 rounded-md">
                <h2 className="font-semibold mb-2 text-white">
                  Debug Information
                </h2>
                <p className="text-sm text-gray-300">
                  Time: {new Date().toLocaleString()}
                </p>
                <p className="text-sm text-gray-300">
                  Auth Provider: {session?.user?.email ? 'Google' : 'None'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
