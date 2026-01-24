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
  User,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useProfile } from '@/contexts/ProfileContext';

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

  const { activeProfile, profiles, setActiveProfile } = useProfile();

  const handleMobileOpen = () => {
    setIsMobileOpen(true);
  };

  const handleMobileClose = () => {
    setIsMobileOpen(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = () => {
    setActiveProfile(null);
    handleMobileClose();
  };

  const handleSwitchProfile = () => {
    setActiveProfile(null);
    handleMobileClose();
  };

  const NavContent = () => (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/10">
        <h1 className="text-2xl font-bold text-white">Wealth Tracker</h1>
        <Button
          variant="destructive"
          size="icon"
          onClick={() => {
            if (onToggle) onToggle();
            handleMobileClose();
          }}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          <X className="h-6 w-6" />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleMobileClose}
              className={cn(
                'flex items-center space-x-3 rounded-lg px-4 py-3 transition-all duration-200',
                isActive
                  ? 'bg-white/20 text-white shadow-md'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              )}
            >
              {item.icon}
              <span className="font-medium">{item.title}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Section */}
      <div className="p-6 border-t border-white/10 space-y-3">
        {/* Active Profile Display */}
        {activeProfile ? (
          <div className="bg-white/10 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-navy-900 text-white text-sm">
                    {getInitials(activeProfile.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-white font-medium text-sm">{activeProfile.name}</p>
                  <p className="text-white/60 text-xs">Profil Aktif</p>
                </div>
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex justify-between items-center bg-navy-800/30 rounded p-3">
              <div className="text-white/80 text-xs">
                <span className="block mb-1">👤</span>
                <span>Dibuat: {new Date(activeProfile.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className="text-white/70 hover:bg-white/10 text-red-400 hover:text-red-300"
                  title="Keluar Profil"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* No Active Profile State */
          <div className="bg-white/10 rounded-lg p-4 text-center space-y-3">
            <User className="h-10 w-10 text-white/60 mb-3 mx-auto" />
            <p className="text-white/80 text-sm">Belum ada profil aktif</p>
            <Button
              onClick={() => {
                if (onToggle) onToggle();
                handleMobileClose();
              }}
              className="w-full bg-white/20 hover:bg-white/30 text-navy-900"
            >
              Buat Profil Sekarang
            </Button>
          </div>
        )}

        {/* Toggle Sidebar Button (Desktop only - Mobile uses X in header) */}
        {profiles.length > 0 && (
          <Button
            variant="outline"
            onClick={() => {
              if (onToggle) onToggle();
            }}
            className="w-full justify-start text-white border-white/20 hover:bg-white/10 mt-3"
          >
            <Menu className="h-5 w-5 mr-3" />
            <span className="font-medium">Tutup Sidebar</span>
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu */}
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
          <SheetTitle className="sr-only">Navigasi Menu</SheetTitle>
          <NavContent />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col fixed left-0 top-0 z-40 h-screen w-64 transition-all duration-300 ease-in-out bg-navy-900',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <NavContent />
      </aside>

      {/* Desktop Sidebar Toggle Button */}
      {!isOpen && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onToggle?.()}
          className="hidden lg:flex fixed top-4 left-4 z-50 h-10 w-10 bg-navy-900 text-white hover:bg-navy-800"
        >
          <Menu className="h-6 w-6" />
        </Button>
      )}
    </>
  );
}
