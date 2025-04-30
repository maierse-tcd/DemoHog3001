
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
      
      console.log("Starting signup process");
      
      // First check if user exists by trying to log in
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (signInData?.user) {
        // User already exists and credentials are correct
        console.log("User already exists, logged in successfully");
        updateUserProfile(signInData.user.id);
        return;
      }
      
      // User doesn't exist or wrong password, create new account
      console.log("Creating new user account");
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { 
            name,
            selectedPlanId, 
            isKidsAccount 
          }
        }
      });
      
      if (error) throw error;
      
      if (data?.user) {
        console.log("User created successfully:", data.user.id);
        updateUserProfile(data.user.id);
      }
    } catch (error: any) {
      console.error("Sign up error:", error);
      toast({
        title: "Sign up failed",
        description: error.message || "An error occurred during sign up",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };
  
  const updateUserProfile = async (userId: string) => {
    try {
      // Save the user preferences in context
      updateSettings({
        name,
        email,
        notifications: { email: true },
        language: 'English',
        selectedPlanId: selectedPlanId || 'premium',
        isKidsAccount
      });
      
      // Try to create a profile entry (but don't fail if it doesn't work)
      try {
        // Check if profile already exists first
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', email)
          .maybeSingle();
          
        if (!existingProfile) {
          // Only create if it doesn't exist
          await supabase
            .from('profiles')
            .upsert({
              email,
              name,
              updated_at: new Date().toISOString(),
              created_at: new Date().toISOString()
            }, { onConflict: 'email' });
        }
      } catch (profileError) {
        console.warn("Could not create profile, but continuing:", profileError);
        // Non-fatal error, continue with signup
      }
      
      // Identify user in PostHog
      if (window.posthog) {
        window.posthog.identify(email, {
          name,
          plan: selectedPlanId,
          isKidsAccount
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
      setIsLoading(false);
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
          placeholder="Enter any email (for demo purposes)"
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
