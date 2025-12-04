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

  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '';
  const isSetupRoute = pathname.startsWith('/dashboard/setup');

  if (!isSetupRoute) {
    const userProfile = await getUserProfile(authUser.id);

    const profileComplete = Boolean(
      userProfile?.first_name &&
        userProfile?.last_name &&
        userProfile?.institution &&
        userProfile?.geographic_location
    );

    const teamComplete = Boolean(userProfile?.team?.id);

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
