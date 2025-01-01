import { DashboardSidebar } from '../components/DashboardSidebar';
import SetupCheck from '../components/SetupCheck';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SetupCheck>
      <div className="min-h-screen bg-[url('/blockwarriors-ai-background.webp')] bg-cover bg-center">
        <div className="min-h-screen bg-black/70 backdrop-blur-sm text-white">
          <div className="flex">
            <aside className="w-64 bg-black/40 backdrop-blur-md">
              <div className="sticky top-0">
                <DashboardSidebar />
              </div>
            </aside>
            <main className="flex-1 p-8">{children}</main>
          </div>
        </div>
      </div>
    </SetupCheck>
  );
}
