
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useToast } from '../../hooks/use-toast';
import { supabase } from '../../integrations/supabase/client';
import { safeCapture, safeReloadFeatureFlags } from '../../utils/posthog';

interface LoginFormProps {
  fetchUserProfile: (userId: string) => Promise<void>;
}

export const LoginForm = ({ fetchUserProfile }: LoginFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Basic validation
      if (!email || !password) {
        toast({
          title: "Missing credentials",
          description: "Please enter both email and password",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      console.log("Attempting to login with:", email);
      
      // Try to sign in with email/password
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.log("Login failed, creating account instead");
        
        // Sign up new user - simplified with no email confirmation
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name: email.split('@')[0] }
          }
        });
        
        if (signUpError) {
          console.error("Failed to create account:", signUpError);
          throw signUpError;
        }
        
        if (signUpData?.user) {
          console.log("Created new user account:", signUpData.user.id);
          
          // Create profile for new user
          try {
            await supabase
              .from('profiles')
              .upsert({
                id: signUpData.user.id,
                email,
                name: email.split('@')[0],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });
              
            // Since we've just created the account, let's sign in now
            await handleSuccessfulLogin(signUpData.user.id, email);
          } catch (profileError) {
            console.warn("Could not create profile, but continuing:", profileError);
            // Still proceed with login
            await handleSuccessfulLogin(signUpData.user.id, email);
          }
        }
      } else if (data && data.user) {
        console.log("Login successful:", data.user.id);
        await handleSuccessfulLogin(data.user.id, email);
      }
    } catch (error: any) {
      console.error("Login failed:", error);
      
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSuccessfulLogin = async (userId: string, userEmail: string) => {
    console.log('Login success, user ID:', userId);
    
    // PostHog identification is centralized in PostHogProvider
    safeCapture('user_login_success');
    
    // Fetch user profile data
    await fetchUserProfile(userId);
    
    // After successful login, explicitly reload feature flags
    // with a slight delay to ensure identification is complete
    setTimeout(async () => {
      console.log('Reloading feature flags after login...');
      try {
        await safeReloadFeatureFlags();
        console.log('Feature flags reloaded successfully');
        
        // Dispatch a custom event to notify components that feature flags have been updated
        window.dispatchEvent(new CustomEvent('posthog-feature-flags-updated'));
      } catch (err) {
        console.error('Error reloading feature flags:', err);
      }
    }, 1500);
    
    toast({
      title: "Login successful",
      description: `Welcome back!`,
    });
    
    // Redirect to home page
    navigate('/');
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4 mb-6">
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
          placeholder="Enter your password"
        />
      </div>
      
      <Button
        type="submit"
        className="w-full bg-netflix-red hover:bg-netflix-red/80 text-white"
        disabled={isLoading}
      >
        {isLoading ? 'Signing In...' : 'Sign In'}
      </Button>
    </form>
  );
};
