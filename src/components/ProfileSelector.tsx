'use client';

import React, { useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useProfile } from '@/contexts/ProfileContext';
import { Plus, Edit, Trash2, Lock, AlertTriangle, Smartphone } from 'lucide-react';

export default function ProfileSelector() {
  const {
    profiles,
    activeProfile,
    switchProfile,
    createProfile,
    updateProfile,
    deleteProfile,
  } = useProfile();

  const [ipAddress, setIpAddress] = useState<string>('');
  const [userAgent, setUserAgent] = useState<string>('');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isPinDialogOpen, setIsPinDialogOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [profileToSwitch, setProfileToSwitch] = useState<any>(null);

  const [newProfileName, setNewProfileName] = useState('');
  const [newProfilePin, setNewProfilePin] = useState('1234');
  const [editProfileName, setEditProfileName] = useState('');
  const [editProfilePin, setEditProfilePin] = useState('');
  const [switchPin, setSwitchPin] = useState('');

  // Get IP address and user agent on component mount
  useEffect(() => {
    const getDeviceInfo = async () => {
      try {
        const ipResponse = await fetch('/api/get-ip');
        const ipData = await ipResponse.json();
        setIpAddress(ipData.ipAddress);
        setUserAgent(navigator.userAgent);
      } catch (error) {
        console.error('Error getting device info:', error);
        // Fallback values
        setIpAddress('127.0.0.1');
        setUserAgent(navigator.userAgent);
      }
    };

    getDeviceInfo();
  }, []);

  const handleSwitchProfile = async (profileId: string, pin?: string) => {
    const result = await switchProfile(profileId, pin, ipAddress, userAgent);
    if (!result.success) {
      if (result.error === 'DEVICE_MISMATCH' || result.error?.includes('IP atau Device berbeda')) {
        alert('❌ IP atau Device berbeda dari yang terdaftar di profil ini.\n\nSilakan buat profil baru untuk melanjutkan.');
        // Open create profile dialog
        setIsCreateOpen(true);
      } else {
        alert(result.error);
      }
    }
    return result;
  };

  const handleProfileClick = (profile: any) => {
    // If already active, no need to switch
    if (activeProfile && profile.id === activeProfile.id) return;

    // If switching to a different profile, require PIN
    setProfileToSwitch(profile);
    setSwitchPin('');
    setIsPinDialogOpen(true);
  };

  const handleConfirmSwitch = async () => {
    if (!switchPin || switchPin.length !== 4) {
      alert('PIN harus 4 digit');
      return;
    }

    const result = await handleSwitchProfile(profileToSwitch.id, switchPin);
    if (result.success) {
      setIsPinDialogOpen(false);
      setProfileToSwitch(null);
      setSwitchPin('');
    }
  };

  const handleCreateProfile = async () => {
    if (!newProfileName.trim()) {
      alert('Nama profil wajib diisi');
      return;
    }

    const result = await createProfile(newProfileName, newProfilePin, undefined, ipAddress, userAgent);
    if (result.success) {
      setNewProfileName('');
      setNewProfilePin('1234');
      setIsCreateOpen(false);
    } else {
      alert(result.error);
    }
  };

  const handleEditProfile = async () => {
    if (!selectedProfile) return;

    const result = await updateProfile(selectedProfile.id, {
      name: editProfileName,
      pin: editProfilePin,
    });

    if (result.success) {
      setEditProfileName('');
      setEditProfilePin('');
      setSelectedProfile(null);
      setIsEditOpen(false);
    } else {
      alert(result.error);
    }
  };

  const handleDeleteProfile = async () => {
    if (!selectedProfile) return;

    const result = await deleteProfile(selectedProfile.id);
    if (result.success) {
      setSelectedProfile(null);
      setIsDeleteOpen(false);
    } else {
      alert(result.error);
    }
  };

  const openEditDialog = (profile: any) => {
    setSelectedProfile(profile);
    setEditProfileName(profile.name);
    setEditProfilePin(profile.pin);
    setIsEditOpen(true);
  };

  const openDeleteDialog = (profile: any) => {
    setSelectedProfile(profile);
    setIsDeleteOpen(true);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2 bg-white border-gray-200 hover:bg-gray-50">
            {activeProfile ? (
              <>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={activeProfile.image || ''} />
                  <AvatarFallback className="bg-navy-900 text-white">
                    {getInitials(activeProfile.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium hidden sm:inline">{activeProfile.name}</span>
              </>
            ) : (
              <span className="text-sm">Pilih Profil</span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Ganti Profil</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {profiles.length === 0 && (
            <div className="px-2 py-4 text-center text-sm text-gray-500">
              Belum ada profil
            </div>
          )}
          {profiles.map((profile) => (
            <div key={profile.id}>
              <DropdownMenuItem
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => handleProfileClick(profile)}
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src={profile.image || ''} />
                  <AvatarFallback className="bg-navy-900 text-white text-xs">
                    {getInitials(profile.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="flex-1">{profile.name}</span>
                {activeProfile && profile.id === activeProfile.id && (
                  <span className="h-2 w-2 bg-green-500 rounded-full" />
                )}
              </DropdownMenuItem>
              {activeProfile && profile.id === activeProfile.id && profiles.length > 1 && (
                <DropdownMenuItem
                  className="flex items-center gap-2 cursor-pointer text-gray-500 hover:text-gray-900"
                  onClick={() => openEditDialog(profile)}
                >
                  <Edit className="h-4 w-4" />
                  <span>Edit</span>
                </DropdownMenuItem>
              )}
            </div>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="flex items-center gap-2 cursor-pointer text-navy-900 font-medium"
            onClick={() => setIsCreateOpen(true)}
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Profil</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Create Profile Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buat Profil Baru</DialogTitle>
            <DialogDescription>
              Profil akan dikaitkan dengan IP dan device Anda saat ini untuk keamanan tambahan.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Security Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <Smartphone className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-blue-900">Keamanan Profil</p>
                  <p className="text-sm text-blue-700">
                    IP dan device Anda akan dicatat. Jika IP atau device berbeda, Anda tidak bisa login ke profil ini.
                    Silakan buat profil baru jika login dari device yang berbeda.
                  </p>
                </div>
              </div>
            </div>

            {/* Device Info Display */}
            {ipAddress && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">IP & Device yang akan dicatat:</p>
                <p className="text-sm font-medium text-gray-700 truncate">
                  IP: {ipAddress}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  Device: {userAgent.substring(0, 60)}...
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="profile-name">Nama Profil</Label>
              <Input
                id="profile-name"
                placeholder="Contoh: Profil Pribadi"
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-pin">PIN Keamanan</Label>
              <Input
                id="profile-pin"
                type="password"
                placeholder="4 digit PIN"
                value={newProfilePin}
                onChange={(e) => setNewProfilePin(e.target.value)}
                maxLength={4}
              />
              <p className="text-xs text-gray-500">
                Gunakan PIN yang mudah diingat untuk keamanan profil Anda
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleCreateProfile} className="bg-navy-900 hover:bg-navy-700">
              Buat Profil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profil</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-profile-name">Nama Profil</Label>
              <Input
                id="edit-profile-name"
                placeholder="Nama profil"
                value={editProfileName}
                onChange={(e) => setEditProfileName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-profile-pin">PIN Baru (opsional)</Label>
              <Input
                id="edit-profile-pin"
                type="password"
                placeholder="Biarkan kosong jika tidak ingin mengubah"
                value={editProfilePin}
                onChange={(e) => setEditProfilePin(e.target.value)}
                maxLength={4}
              />
            </div>
            {selectedProfile && profiles.length > 1 && (
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => {
                  setIsEditOpen(false);
                  openDeleteDialog(selectedProfile);
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Hapus Profil
              </Button>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleEditProfile}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Profile Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Profil</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500">
            Apakah Anda yakin ingin menghapus profil "{selectedProfile?.name}"? Semua data
            terkait profil ini akan dihapus permanen.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDeleteProfile}>
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PIN Verification Dialog */}
      <Dialog open={isPinDialogOpen} onOpenChange={setIsPinDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Masukkan PIN Profil</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-600">
              Masukkan PIN untuk profil "<span className="font-semibold">{profileToSwitch?.name}</span>" untuk melanjutkan.
            </p>
            <div className="space-y-2">
              <Label htmlFor="switch-pin">PIN</Label>
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-gray-500" />
                <Input
                  id="switch-pin"
                  type="password"
                  placeholder="4 digit PIN"
                  value={switchPin}
                  onChange={(e) => setSwitchPin(e.target.value)}
                  maxLength={4}
                  className="text-center text-2xl tracking-widest"
                  autoFocus
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPinDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleConfirmSwitch}>
              Konfirmasi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
