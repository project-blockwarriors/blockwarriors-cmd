import { Header } from './Header';
import { RegistrationBanner } from './RegistrationBanner';

export interface PageLayoutProps {
  startTournament: boolean;
  children: React.ReactNode;
}

export function PageLayout({
  startTournament,
  children,
}: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1A1A1A] to-[#0D0D0D] relative overflow-hidden">
      <RegistrationBanner />
      <div className="min-h-screen text-gray-100">
        <div className="container mx-auto py-12 space-y-32 max-w-[100vw] px-4 sm:px-6 md:px-8 relative">
          <Header startTournament={startTournament} />
          {children}
        </div>
      </div>
    </div>
  );
}
