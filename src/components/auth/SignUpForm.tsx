
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
  const { updateSettings, updateSelectedPlan } = useProfileSettings();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Validate all fields
      if (!email || !password || password.length < 6) {
        toast({
          title: "Invalid credentials",
          description: "Please enter a valid email and password (min 6 characters)",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      if (!name) {
        toast({
          title: "Name required",
          description: "Please enter your name",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      if (!selectedPlanId) {
        toast({
          title: "Plan selection required",
          description: "Please select a subscription plan",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      // Sign up with Supabase - Store selectedPlanId and isKidsAccount in user_metadata
      // Important: Set emailRedirectTo to the current URL to avoid redirection issues
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            selectedPlanId,
            isKidsAccount
          },
          emailRedirectTo: window.location.origin,
        }
      });
      
      if (error) throw error;

      if (data && data.user) {
        // Update profile settings context
        updateSettings({
          name,
          email,
          notifications: { email: true },
          language: 'English',
          selectedPlanId,
          isKidsAccount
        });
        
        updateSelectedPlan(selectedPlanId);
        
        // Create a profile in the database for this user
        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: data.user.id,
              name,
              email,
            });
            
          if (profileError) {
            console.error("Error creating profile:", profileError);
          }
        } catch (profileErr) {
          console.error("Error creating profile:", profileErr);
        }
        
        // Track signup event in PostHog
        if (window.posthog) {
          window.posthog.identify(data.user.id, {
            email: email,
            name: name,
            plan: selectedPlanId,
            isKidsAccount: isKidsAccount
          });
          window.posthog.capture('user_signup_complete');
        }
        
        // Since we've just signed up, let's immediately sign in without email verification
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (signInError) {
          console.error("Auto-login error:", signInError);
          
          // If there's an email verification error, try to continue anyway
          toast({
            title: "Sign up successful!",
            description: "Welcome to Hogflix! Enjoy your hedgehog adventures.",
          });
          
          // Short delay before redirect for toast to be visible
          setTimeout(() => {
            navigate('/');
          }, 500);
        } else if (signInData && signInData.session) {
          toast({
            title: "Sign up successful!",
            description: "Welcome to Hogflix! Enjoy your hedgehog adventures.",
          });
          
          // Short delay before redirect for toast to be visible
          setTimeout(() => {
            navigate('/');
          }, 500);
        }
      }
    } catch (error: any) {
      // Track failed signup in PostHog
      if (window.posthog) {
        window.posthog.capture('user_signup_failed', {
          error: error.message || "Unknown error"
        });
      }
      
      toast({
        title: "Sign up failed",
        description: error.message || "An error occurred during sign up",
        variant: "destructive"
      });
      console.error("Sign up error:", error);
    } finally {
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
          placeholder="Enter your email"
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
