import React, { useState, useEffect } from 'react';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { useProfileSettings } from '../contexts/ProfileSettingsContext';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Input } from './ui/input';
import { useToast } from '../hooks/use-toast';
import { X, Eye, EyeOff, Lock } from 'lucide-react';

export const PasswordProtection: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings } = useProfileSettings();
  const isPasswordProtected = useFeatureFlagEnabled('access_password');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  // Check if already unlocked from localStorage
  useEffect(() => {
    const unlocked = localStorage.getItem('hogflix_unlocked');
    if (unlocked === 'true') {
      setIsUnlocked(true);
    } else if (isPasswordProtected && settings.accessPassword) {
      setIsModalOpen(true);
    }
  }, [isPasswordProtected, settings.accessPassword]);

  // If password protection is disabled, ensure content is accessible
  useEffect(() => {
    if (!isPasswordProtected) {
      setIsUnlocked(true);
      setIsModalOpen(false);
    }
  }, [isPasswordProtected]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // If no password is set or feature flag is off, allow access
    if (!isPasswordProtected || !settings.accessPassword) {
      setIsUnlocked(true);
      setIsModalOpen(false);
      return;
    }
    
    // Check if password matches
    if (passwordInput === settings.accessPassword) {
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

  // If not password protected or already unlocked, show the content
  if (!isPasswordProtected || isUnlocked) {
    return (
      <>
        {children}
        
        {/* Show lock button if site is password protected and unlocked */}
        {isPasswordProtected && settings.accessPassword && (
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
