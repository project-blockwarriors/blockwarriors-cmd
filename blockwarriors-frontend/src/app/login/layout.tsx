import { Button } from '@/components/ui/button';
import { DashboardSidebar } from '../components/DashboardSidebar';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Header } from '../components/Header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[url('/blockwarriors-ai-background.webp')] bg-cover bg-center">
      <div className="min-h-screen bg-black/70 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          <Header />

          <div className="max-w-2xl mx-auto mt-12">
            <Button variant="ghost" className="mb-6" asChild>
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>

            <div className="bg-white/10 rounded-lg p-8 backdrop-blur-sm">
              <h1 className="text-3xl font-bold text-white mb-6">
                Login
              </h1>
                {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
