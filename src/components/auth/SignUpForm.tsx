
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useToast } from '../../hooks/use-toast';
import { supabase } from '../../integrations/supabase/client';
import { useProfileSettings } from '../../contexts/ProfileSettingsContext';

interface SignUpFormProps {
  selectedPlanId: string | null;
  setSelectedPlanId: (planId: string) => void;
}

export const SignUpForm = ({ selectedPlanId, setSelectedPlanId }: SignUpFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isKidsAccount, setIsKidsAccount] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { updateSettings } = useProfileSettings();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Basic validation only to ensure fields are filled
      if (!email || !password || !name || !selectedPlanId) {
        toast({
          title: "Missing information",
          description: "Please fill out all fields and select a plan",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      // First try to sign in with the credentials (simplest approach)
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      // If sign in succeeds, we're done
      if (signInData?.user) {
        console.log("User already exists, signed in successfully");
        await updateUserAndSettings(signInData.user.id);
        return;
      }
      
      // If failed to sign in, create a new user
      console.log("Creating new user account");
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, selectedPlanId, isKidsAccount }
        }
      });
      
      if (error) throw error;
      
      if (data?.user) {
        await updateUserAndSettings(data.user.id);
      }
    } catch (error: any) {
      console.error("Sign up error:", error);
      
      toast({
        title: "Sign up failed",
        description: error.message || "An error occurred during sign up",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const updateUserAndSettings = async (userId: string) => {
    try {
      // Store user ID in localStorage for PostHog tracking
      localStorage.setItem('hogflix_user_id', userId);
      
      // Create or update profile record - fixed by not providing id directly
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          email,
          name,
          updated_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        }, { onConflict: 'email' });
        
      if (profileError) {
        console.error("Error saving profile:", profileError);
      }
      
      // Update profile settings in context
      updateSettings({
        name,
        email,
        notifications: { email: true },
        language: 'English',
        selectedPlanId,
        isKidsAccount
      });
      
      // Identify user in PostHog with email as the ID
      if (window.posthog) {
        window.posthog.identify(email, {
          name: name,
          plan: selectedPlanId,
          isKidsAccount: isKidsAccount
        });
        window.posthog.capture('user_signup_complete');
      }
      
      toast({
        title: "Sign up successful!",
        description: "Welcome to Hogflix!",
      });
      
      // Redirect to home page
      navigate('/');
    } catch (error) {
      console.error("Error updating user settings:", error);
    }
  };

  return (
    <form onSubmit={handleSignUp} className="space-y-4">
      <div>
        <label className="block text-sm mb-1">Full Name</label>
        <Input 
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-black/40 border-netflix-gray/40 text-white"
          placeholder="Enter your name"
        />
      </div>
      <div>
        <label className="block text-sm mb-1">Email</label>
        <Input 
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-black/40 border-netflix-gray/40 text-white"
          placeholder="Enter any email (can use dummy emails)"
        />
      </div>
      <div>
        <label className="block text-sm mb-1">Password</label>
        <Input 
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="bg-black/40 border-netflix-gray/40 text-white"
          placeholder="Create a password (min 6 characters)"
        />
      </div>
      <div className="flex items-center space-x-2 pt-2">
        <input
          type="checkbox"
          id="kidsAccount"
          checked={isKidsAccount}
          onChange={(e) => setIsKidsAccount(e.target.checked)}
          className="rounded border-netflix-gray/40 bg-black/40"
        />
        <label htmlFor="kidsAccount" className="cursor-pointer">
          This is a kids account
        </label>
      </div>
      
      <div className="pt-4">
        <Button
          type="submit"
          className="w-full bg-netflix-red hover:bg-netflix-red/80 text-white"
          disabled={isLoading || !selectedPlanId}
        >
          {isLoading ? 'Creating account...' : 'Complete Sign Up'}
        </Button>
      </div>
    </form>
  );
};
