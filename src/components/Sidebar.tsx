'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  FileText,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { title: 'Dashboard', href: '/', icon: <LayoutDashboard className="h-5 w-5" /> },
  { title: 'Kas Masuk', href: '/kas-masuk', icon: <TrendingUp className="h-5 w-5" /> },
  { title: 'Kas Keluar', href: '/kas-keluar', icon: <TrendingDown className="h-5 w-5" /> },
  { title: 'Target Tabungan', href: '/target-tabungan', icon: <PiggyBank className="h-5 w-5" /> },
  { title: 'Laporan', href: '/laporan', icon: <FileText className="h-5 w-5" /> },
];

export default function Sidebar({ isOpen = true, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Handle mobile menu open
  const handleMobileOpen = () => {
    setIsMobileOpen(true);
  };

  // Handle mobile menu close
  const handleMobileClose = () => {
    setIsMobileOpen(false);
  };

  const NavContent = () => (
    <div className="flex h-full flex-col bg-navy-900 text-white">
      <div className="flex items-center justify-between p-6 border-b border-white/10">
        <h1 className="text-2xl font-bold text-white">Wealth Tracker</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            if (onToggle) onToggle();
            handleMobileClose();
          }}
          className="text-white hover:bg-white/10"
        >
          <X className="h-6 w-6" />
        </Button>
      </div>

      <nav className="flex-1 space-y-2 p-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleMobileClose}
              className={cn(
                'flex items-center space-x-3 rounded-lg px-4 py-3 transition-colors',
                isActive
                  ? 'bg-white/20 text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              )}
            >
              {item.icon}
              <span className="font-medium">{item.title}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <Button
          variant="outline" style="background-color: red;"
          className="w-full justify-start text-white border-white/20 hover:bg-white/10"
          onClick={() => {
            if (onToggle) onToggle();
            handleMobileClose();
          }}
        >
          <span className="mr-2"><center>Tutup</center></span>
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Trigger - Always visible on mobile */}
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden fixed top-4 left-4 z-50 h-10 w-10 bg-navy-900 text-white hover:bg-navy-800"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80 p-0 bg-navy-900 border-none">
          <NavContent />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col fixed left-0 top-0 z-40 h-screen w-64 transition-all duration-300',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <NavContent />
      </aside>

      {/* Desktop Sidebar Toggle Button - Visible when sidebar is hidden */}
      {!isOpen && (
        <Button
          variant="ghost"
          size="icon"
          className="hidden lg:flex fixed top-4 left-4 z-50 h-10 w-10 bg-navy-900 text-white hover:bg-navy-800"
          onClick={() => onToggle?.()}
        >
          <Menu className="h-6 w-6" />
        </Button>
      )}
    </>
  );
}
