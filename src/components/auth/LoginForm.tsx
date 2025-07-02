
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useToast } from '../../hooks/use-toast';
import { supabase } from '../../integrations/supabase/client';
import { safeCapture, safeReloadFeatureFlags } from '../../utils/posthog';
import { validateEmail, sanitizeInput, rateLimitCheck, auditLog } from '../../utils/inputValidation';

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
      // Rate limiting check - max 5 login attempts per 15 minutes
      // Admins can override with higher limits for automation
      const adminOverride = { limit: 1000, windowMs: 60 * 1000 }; // 1000 per minute for admin automation
      if (!rateLimitCheck('login', 5, 15 * 60 * 1000, adminOverride)) {
        toast({
          title: "Too many attempts",
          description: "Please wait before trying to login again.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
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
      
      // Enhanced email validation
      if (!validateEmail(email)) {
        toast({
          title: "Invalid email",
          description: "Please enter a valid email address",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      // Sanitize email input
      const sanitizedEmail = sanitizeInput(email).toLowerCase();
      
      console.log("Attempting to login with:", sanitizedEmail);
      
      // Try to sign in with email/password
      const { data, error } = await supabase.auth.signInWithPassword({
        email: sanitizedEmail,
        password
      });
      
      if (error) {
        console.error("Login failed:", error);
        throw error;
      }
      
      if (data && data.user) {
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
