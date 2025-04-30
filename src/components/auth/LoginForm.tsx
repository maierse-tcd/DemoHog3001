
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useToast } from '../../hooks/use-toast';
import { supabase } from '../../integrations/supabase/client';

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
      
      // Sign in with email/password
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error("Login error:", error);
        
        // If the error is about email verification, we'll try to auto-verify and login again
        if (error.message.includes("Email not confirmed")) {
          // Try to verify the email automatically
          const { error: verifyError } = await supabase.auth.admin.updateUserById(
            email, // Using email as a temporary ID here
            { email_confirm: true }
          );
          
          if (!verifyError) {
            // Try logging in again if verification succeeded
            const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
              email,
              password
            });
            
            if (retryError) {
              toast({
                title: "Login failed",
                description: "Unable to verify email automatically. Please sign up again.",
                variant: "destructive"
              });
            } else if (retryData && retryData.user) {
              await handleSuccessfulLogin(retryData.user.id);
            }
          } else {
            toast({
              title: "Login failed",
              description: "Unable to verify email automatically. Please sign up again.",
              variant: "destructive"
            });
          }
        } else {
          toast({
            title: "Login failed",
            description: error.message || "Invalid email or password",
            variant: "destructive"
          });
        }
        
        // Track failed login in PostHog
        if (window.posthog) {
          window.posthog.capture('user_login_failed', {
            error: error.message
          });
        }
      } else if (data && data.user) {
        await handleSuccessfulLogin(data.user.id);
      }
    } catch (error: any) {
      console.log('Analytics Event: Login Failed', { email });
      
      // Track failed login in PostHog
      if (window.posthog) {
        window.posthog.capture('user_login_failed', {
          error: error.message || "Unknown error"
        });
      }
      
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSuccessfulLogin = async (userId: string) => {
    console.log('Analytics Event: Login Success', { email });
    
    // Fetch user profile data
    await fetchUserProfile(userId);
    
    // Track login event in PostHog - identify the user
    if (window.posthog) {
      window.posthog.identify(userId, {
        email: email
      });
      window.posthog.capture('user_login_success');
    }
    
    toast({
      title: "Login successful",
      description: `Welcome back!`,
    });
    
    setTimeout(() => {
      navigate('/');
    }, 500);
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
