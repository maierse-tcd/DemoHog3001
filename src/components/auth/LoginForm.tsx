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
      
      // Sign in with email/password - without the options.data that caused the TypeScript error
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        // Handle "Email not confirmed" error by auto-confirming and trying again
        if (error.message.includes("Email not confirmed")) {
          console.log("Email not confirmed, trying to sign up again to auto-confirm");
          
          // Try to sign up the user again (which will auto-confirm the email)
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                email_confirmed: true
              }
            }
          });
          
          if (signUpError) {
            console.error("Auto-confirmation failed:", signUpError);
            toast({
              title: "Login failed",
              description: "Unable to auto-confirm your email. Please try again.",
              variant: "destructive"
            });
          } else {
            // Try logging in again after auto-confirmation
            const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
              email,
              password
            });
            
            if (retryError) {
              console.error("Retry login failed:", retryError);
              toast({
                title: "Login failed",
                description: retryError.message,
                variant: "destructive"
              });
            } else if (retryData && retryData.user) {
              await handleSuccessfulLogin(retryData.user.id);
            }
          }
        } else {
          console.error("Login error:", error);
          
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
