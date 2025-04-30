
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
      
      console.log("Attempting to login with:", email);
      
      // Try to sign in with email/password
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        // If login fails, try to create account
        if (error.message.includes('Invalid login credentials')) {
          console.log("Account not found, creating it automatically");
          
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
            console.log("Auto-created user:", signUpResult.data.user.id);
            
            // Create basic profile entry - Here we provide the id from auth
            try {
              if (signUpResult.data.user.id) {
                await supabase
                  .from('profiles')
                  .upsert({
                    id: signUpResult.data.user.id, // Include the user ID here
                    email,
                    name: email.split('@')[0],
                    updated_at: new Date().toISOString(),
                    created_at: new Date().toISOString()
                  });
              }
            } catch (profileError) {
              console.warn("Could not create profile, but continuing:", profileError);
            }
            
            await handleSuccessfulLogin(signUpResult.data.user.id);
            return;
          }
        } else {
          throw error;
        }
      } else if (data && data.user) {
        console.log("Login successful:", data.user.id);
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
    
    // Fetch user profile data
    await fetchUserProfile(userId);
    
    // Track login event in PostHog with email as identifier
    if (window.posthog && email) {
      window.posthog.identify(email);
      window.posthog.capture('user_login_success');
      
      window.posthog.people.set({
        email: email,
        $name: email.split('@')[0],
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
