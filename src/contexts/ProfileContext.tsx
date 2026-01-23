'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Profile {
  id: string;
  name: string;
  pin: string;
  image: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ProfileContextType {
  profiles: Profile[];
  activeProfile: Profile | null;
  isLoading: boolean;
  setActiveProfile: (profile: Profile | null) => void;
  refreshProfiles: () => Promise<void>;
  switchProfile: (profileId: string, pin?: string, ipAddress?: string, userAgent?: string) => Promise<{ success: boolean; error?: string }>;
  createProfile: (name: string, pin?: string, image?: string, ipAddress?: string, userAgent?: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (id: string, data: Partial<Profile>) => Promise<{ success: boolean; error?: string }>;
  deleteProfile: (id: string) => Promise<{ success: boolean; error?: string }>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfiles = async () => {
    try {
      const response = await fetch('/api/profiles');
      if (response.ok) {
        const data = await response.json();
        setProfiles(data);
        // Do NOT auto-set activeProfile - user must login with PIN every session
        setActiveProfile(null);
      }
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const refreshProfiles = async () => {
    setIsLoading(true);
    await fetchProfiles();
  };

  const switchProfile = async (profileId: string, pin?: string, ipAddress?: string, userAgent?: string) => {
    try {
      const response = await fetch('/api/profiles/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId, pin, ipAddress, userAgent }),
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        // Set activeProfile from API response
        setActiveProfile(updatedProfile);
        // Update profiles list to reflect the change
        setProfiles((prevProfiles) =>
          prevProfiles.map((p) =>
            p.id === profileId ? { ...p, isActive: true } : { ...p, isActive: false }
          )
        );
        return { success: true };
      } else {
        const data = await response.json();
        return { success: false, error: data.error || data.message || 'Failed to switch profile' };
      }
    } catch (error) {
      console.error('Error switching profile:', error);
      return { success: false, error: 'Failed to switch profile' };
    }
  };

  const createProfile = async (name: string, pin?: string, image?: string, ipAddress?: string, userAgent?: string) => {
    try {
      const response = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, pin, image, ipAddress, userAgent }),
      });

      if (response.ok) {
        const newProfile = await response.json();
        // Add new profile to list and set all others as inactive
        setProfiles((prevProfiles) =>
          prevProfiles.map((p) => ({ ...p, isActive: false })).concat(newProfile)
        );
        // Auto-login to newly created profile
        setActiveProfile(newProfile);
        return { success: true };
      } else {
        const data = await response.json();
        return { success: false, error: data.error || 'Failed to create profile' };
      }
    } catch (error) {
      console.error('Error creating profile:', error);
      return { success: false, error: 'Failed to create profile' };
    }
  };

  const updateProfile = async (id: string, data: Partial<Profile>) => {
    try {
      const response = await fetch(`/api/profiles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          currentProfileId: activeProfile?.id,
        }),
      });

      if (response.ok) {
        await refreshProfiles();
        return { success: true };
      } else if (response.status === 403) {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'You can only edit your own profile' };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Failed to update profile' };
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      return { success: false, error: 'Failed to update profile' };
    }
  };

  const deleteProfile = async (id: string) => {
    try {
      const response = await fetch(`/api/profiles/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentProfileId: activeProfile?.id,
        }),
      });

      if (response.ok) {
        await refreshProfiles();
        return { success: true };
      } else if (response.status === 403) {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'You can only delete your own profile' };
      } else {
        const data = await response.json();
        return { success: false, error: data.error || 'Failed to delete profile' };
      }
    } catch (error) {
      console.error('Error deleting profile:', error);
      return { success: false, error: 'Failed to delete profile' };
    }
  };

  return (
    <ProfileContext.Provider
      value={{
        profiles,
        activeProfile,
        isLoading,
        setActiveProfile,
        refreshProfiles,
        switchProfile,
        createProfile,
        updateProfile,
        deleteProfile,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};
