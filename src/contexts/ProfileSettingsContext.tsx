
import React, { createContext, useState, useContext, useEffect } from 'react';

export interface ProfileSettings {
  name: string;
  email: string;
  selectedPlanId: string;
  language: string;
  notifications: {
    email: boolean;
  };
  playbackSettings: {
    autoplayNext: boolean;
    autoplayPreviews: boolean;
  };
}

const defaultSettings: ProfileSettings = {
  name: 'Max Hedgehog',
  email: 'max@hogflix.com',
  selectedPlanId: 'premium',
  language: 'English',
  notifications: {
    email: true,
  },
  playbackSettings: {
    autoplayNext: true,
    autoplayPreviews: true,
  }
};

interface ProfileSettingsContextType {
  settings: ProfileSettings;
  updateSettings: (newSettings: Partial<ProfileSettings>) => void;
  updateSelectedPlan: (planId: string) => void;
}

const ProfileSettingsContext = createContext<ProfileSettingsContextType | undefined>(undefined);

export const ProfileSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<ProfileSettings>(() => {
    const savedSettings = localStorage.getItem('profileSettings');
    return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem('profileSettings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (newSettings: Partial<ProfileSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const updateSelectedPlan = (planId: string) => {
    setSettings(prev => ({ ...prev, selectedPlanId: planId }));
  };

  return (
    <ProfileSettingsContext.Provider value={{ settings, updateSettings, updateSelectedPlan }}>
      {children}
    </ProfileSettingsContext.Provider>
  );
};

export const useProfileSettings = () => {
  const context = useContext(ProfileSettingsContext);
  if (!context) {
    throw new Error('useProfileSettings must be used within a ProfileSettingsProvider');
  }
  return context;
};
