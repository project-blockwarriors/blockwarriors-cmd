'use client';

import Link from 'next/link';
import { Gamepad2 } from 'lucide-react';
import { DocsSidebar } from './DocsSidebar';

export function DocsLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1A1A1A] to-[#0D0D0D] text-gray-100">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-[#222] bg-[#1A1A1A]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">
          <Link href="/" className="flex items-center gap-2 group">
            <Gamepad2 className="w-6 h-6 text-princeton-orange" />
            <span className="font-bold text-white">
              Block<span className="text-princeton-orange">Warriors</span>
            </span>
            <span className="text-gray-500 text-sm ml-1">/ docs</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Home
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto flex min-h-[calc(100vh-57px)]">
        {/* Sidebar */}
        <aside className="hidden md:block w-60 shrink-0 border-r border-[#222] py-6 px-4 sticky top-[57px] h-[calc(100vh-57px)] overflow-y-auto">
          <DocsSidebar />
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 py-8 px-6 md:px-12 max-w-4xl">
          {children}
        </main>
      </div>
    </div>
  );
}
