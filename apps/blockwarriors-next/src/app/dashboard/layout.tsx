import { DashboardSidebar } from './(components)/DashboardSidebar';
import { getUser } from '@/auth/server';
import { getUserProfile } from '@/server/db/users';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authUser = await getUser();

  if (!authUser) {
    redirect('/login');
  }

  // Get current pathname to check if we're on a setup route
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '';
  const isSetupRoute = pathname.startsWith('/dashboard/setup');

  // Only check setup completion if not on a setup route
  if (!isSetupRoute) {
    const userProfile = await getUserProfile(authUser.id);

    // Check if profile is complete (all required fields are filled)
    const profileComplete = Boolean(
      userProfile?.first_name &&
        userProfile?.last_name &&
        userProfile?.institution &&
        userProfile?.geographic_location
    );

    // Check if user has a team (either as a member or leader)
    const teamComplete = Boolean(userProfile?.team?.id);

    // Redirect to setup if not complete
    if (!profileComplete || !teamComplete) {
      redirect('/dashboard/setup');
    }
  }

  return (
    <div className="min-h-screen bg-[url('/blockwarriors-ai-background.webp')] bg-cover bg-center">
      <div className="min-h-screen bg-black/70 backdrop-blur-sm text-white">
        <div className="flex">
          <aside className="w-64 bg-black/50 backdrop-blur-md border-r border-primary/10">
            <div className="sticky top-0">
              <DashboardSidebar />
            </div>
          </aside>
          <main className="flex-1 p-8">
            <div className="max-w-5xl mx-auto">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
