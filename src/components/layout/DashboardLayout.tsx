'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import ProfileSelector from '@/components/ProfileSelector';
import { useProfile } from '@/contexts/ProfileContext';
import LoadingScreen from '@/components/LoadingScreen';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isLoading } = useProfile();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex flex-1">
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className={`flex-1 min-h-screen flex flex-col transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-0'}`}>
          {/* Header */}
          <header className="sticky top-0 z-20 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 lg:pl-0 pl-12">
            <div className="container mx-auto px-4 py-4 flex items-center justify-between">
              <h1 className="text-2xl font-bold text-navy-900 lg:hidden">
                Wealth Tracker
              </h1>
              <div className="hidden lg:block" />
              <ProfileSelector />
            </div>
          </header>

          {/* Main Content */}
          <div className="flex-1 container mx-auto px-4 py-6 lg:px-8">
            {children}
          </div>

          {/* Footer */}
          <footer className="bg-navy-900 text-white py-6 mt-auto">
            <div className="container mx-auto px-4 text-center">
              <p className="text-sm text-gray-300">
                Creator: Tyger Earth | Ahtjong Labs
              </p>
              <p className="text-xs text-gray-400 mt-1">
                © {new Date().getFullYear()} Whealth Tracker. All rights reserved.
              </p>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
