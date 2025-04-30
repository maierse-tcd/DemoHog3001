
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
      
      // Try to sign in with email/password
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error("Login error:", error);
        
        // If login fails with invalid credentials, try to create the account
        if (error.message.includes('Invalid login credentials')) {
          console.log("Account not found, trying to create it");
          
          // Create account without email verification
          const signUpResult = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { name: email.split('@')[0] }
            }
          });
          
          if (signUpResult.error) {
            throw signUpResult.error;
          }
          
          if (signUpResult.data?.user) {
            // Store user ID for PostHog tracking
            localStorage.setItem('hogflix_user_id', signUpResult.data.user.id);
            
            // Create basic profile
            await supabase.from('profiles').upsert({
              id: signUpResult.data.user.id,
              email: email,
              name: email.split('@')[0]
            });
            
            await handleSuccessfulLogin(signUpResult.data.user.id);
            return;
          }
        } else {
          throw error;
        }
      } else if (data && data.user) {
        await handleSuccessfulLogin(data.user.id);
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
  
  const handleSuccessfulLogin = async (userId: string) => {
    console.log('Login success, user ID:', userId);
    
    // Store user ID in localStorage for persistent identification
    localStorage.setItem('hogflix_user_id', userId);
    
    // Fetch user profile data
    await fetchUserProfile(userId);
    
    // Get user email for PostHog tracking
    const { data } = await supabase.auth.getUser();
    const userEmail = data?.user?.email;
    
    // Track login event in PostHog with email as identifier
    if (window.posthog && userEmail) {
      // Use email as the primary identifier for PostHog
      window.posthog.identify(userEmail);
      window.posthog.capture('user_login_success');
      
      window.posthog.people.set({
        email: userEmail,
        $name: userEmail.split('@')[0],
        last_login: new Date().toISOString()
      });
    }
    
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
