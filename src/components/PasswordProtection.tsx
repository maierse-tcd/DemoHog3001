
import React, { useState, useEffect } from 'react';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { useProfileSettings } from '../contexts/ProfileSettingsContext';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Input } from './ui/input';
import { useToast } from '../hooks/use-toast';
import { X, Eye, EyeOff, Lock } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';

export const PasswordProtection: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { siteAccessPassword } = useProfileSettings();
  const isPasswordProtected = useFeatureFlagEnabled('access_password');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPassword, setCurrentPassword] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch the access password from the database
  useEffect(() => {
    const fetchAccessPassword = async () => {
      setIsLoading(true);
      
      try {
        if (!isPasswordProtected) {
          setIsUnlocked(true);
          setIsModalOpen(false);
          setIsLoading(false);
          return;
        }

        // Check if already unlocked from localStorage (temporary session)
        const unlocked = localStorage.getItem('hogflix_unlocked');
        if (unlocked === 'true') {
          setIsUnlocked(true);
          setIsLoading(false);
          return;
        }

        // Get password from ProfileSettings context
        if (siteAccessPassword) {
          setCurrentPassword(siteAccessPassword);
          // Only show modal if there is an actual password set
          setIsModalOpen(siteAccessPassword.trim() !== '');
        } else {
          // If no site password is set, allow access
          setIsUnlocked(true);
        }
      } catch (error) {
        console.error("Error fetching access password:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAccessPassword();
  }, [isPasswordProtected, siteAccessPassword]);

  // Verify the input password against the current password
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // If no password is set or feature flag is off, always allow access
    if (!isPasswordProtected || !currentPassword || currentPassword.trim() === '') {
      setIsUnlocked(true);
      setIsModalOpen(false);
      return;
    }
    
    // Check if password matches
    if (passwordInput === currentPassword) {
      setIsUnlocked(true);
      setIsModalOpen(false);
      localStorage.setItem('hogflix_unlocked', 'true');
      toast({
        title: "Access granted",
        description: "Welcome to Hogflix!",
      });
    } else {
      toast({
        title: "Incorrect password",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  // Lock the site (clear local storage and show modal again)
  const handleLockSite = () => {
    localStorage.removeItem('hogflix_unlocked');
    setIsUnlocked(false);
    setIsModalOpen(true);
    setPasswordInput('');
    toast({
      title: "Site locked",
      description: "Password protection has been reactivated."
    });
  };

  // If still loading or not password protected or already unlocked, show the content
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-netflix-black">
        <div className="text-netflix-red text-xl">Loading...</div>
      </div>
    );
  }
  
  if (!isPasswordProtected || isUnlocked || !currentPassword || currentPassword.trim() === '') {
    return (
      <>
        {children}
        
        {/* Show lock button if site is password protected and unlocked */}
        {isPasswordProtected && currentPassword && currentPassword.trim() !== '' && (
          <Button
            variant="outline"
            size="sm"
            className="fixed bottom-4 right-4 z-50 bg-black bg-opacity-70 text-white hover:bg-black"
            onClick={handleLockSite}
          >
            <Lock className="mr-1" size={16} />
            Lock Site
          </Button>
        )}
      </>
    );
  }

  // Otherwise show the password modal with blurred background
  return (
    <>
      {/* Blur the background content */}
      <div className="filter blur-md pointer-events-none">
        {children}
      </div>
      
      {/* Password modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock size={20} /> Hogflix Password Protection
            </DialogTitle>
            <DialogDescription>
              This content is password protected. Please enter the access password to continue.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handlePasswordSubmit} className="space-y-4 pt-4">
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Enter access password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="pr-10"
                autoFocus
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            
            <div className="flex justify-end">
              <Button type="submit">
                Access Site
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
