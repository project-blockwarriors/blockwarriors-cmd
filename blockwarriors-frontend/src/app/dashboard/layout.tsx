import { DashboardSidebar } from "../components/DashboardSidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[url('https://images.unsplash.com/photo-1607988795691-3d0147b43231?auto=format&fit=crop&q=80')] bg-cover bg-center">
      <div className="min-h-screen bg-black/70 backdrop-blur-sm text-white">
        <div className="flex">
          <aside className="w-64 bg-black/40 backdrop-blur-md">
            <div className="sticky top-0">
              <DashboardSidebar />
            </div>
          </aside>
          <main className="flex-1 p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}