
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useToast } from '../../hooks/use-toast';
import { supabase } from '../../integrations/supabase/client';
import { safeCapture, safeReloadFeatureFlags } from '../../utils/posthog';
import { validateEmail, sanitizeInput, rateLimitCheck, auditLog } from '../../utils/inputValidation';
import { identifyUserWithSubscription, setUserType } from '../../utils/posthog/simple';
import type { SubscriptionMetadata } from '../../utils/posthog/simple';

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
      let adminOverride = undefined;
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('admin_override')
          .eq('id', user.id)
          .maybeSingle();
        
        if (profile?.admin_override) {
          adminOverride = { limit: 1000, windowMs: 60 * 1000 };
        }
      }
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
    console.log(`[${new Date().toISOString()}] Login success, user ID: ${userId}`);
    
    try {
      // CRITICAL: Explicitly identify user in PostHog BEFORE navigation
      console.log(`[${new Date().toISOString()}] PostHog: Identifying returning user on login: ${userEmail}`);
      
      // Fetch profile data first to ensure accurate identification
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('is_kids, subscription_status, subscription_plan_id, name, language')
        .eq('id', userId)
        .maybeSingle();
      
      if (profileError) {
        console.warn(`[${new Date().toISOString()}] Profile fetch error:`, profileError);
      }
      
      if (profileData) {
        console.log(`[${new Date().toISOString()}] PostHog: Profile fetched for ${userEmail}:`, {
          is_kids: profileData.is_kids,
          subscription_status: profileData.subscription_status
        });
        
        // Identify with full profile data
        const subscriptionMetadata: SubscriptionMetadata | undefined = profileData.subscription_plan_id 
          ? { planId: profileData.subscription_plan_id }
          : undefined;
        
        identifyUserWithSubscription(
          userEmail,
          {
            name: profileData.name || userEmail.split('@')[0],
            is_kids_account: profileData.is_kids || false,
            language: profileData.language || 'English',
            email: userEmail,
            supabase_id: userId,
            returning_user: true, // Mark as returning
            last_login: new Date().toISOString()
          },
          profileData.subscription_status === 'active' ? 'active' : 
          profileData.subscription_status === 'cancelled' ? 'cancelled' : 'none',
          subscriptionMetadata
        );
        
        // Set user type group
        console.log(`[${new Date().toISOString()}] PostHog: Setting user type - isKid: ${profileData.is_kids || false}`);
        setUserType(profileData.is_kids || false);
        
        console.log(`[${new Date().toISOString()}] PostHog: User identification complete for ${userEmail}`);
      }
      
      // Capture login event with returning user flag
      safeCapture('user_login_success', {
        returning_user: true,
        login_timestamp: new Date().toISOString()
      });
      
      // Fetch user profile data for app state
      await fetchUserProfile(userId);
      
      // Reload feature flags with reduced timeout
      setTimeout(async () => {
        console.log(`[${new Date().toISOString()}] Reloading feature flags after login...`);
        try {
          await safeReloadFeatureFlags();
          console.log(`[${new Date().toISOString()}] Feature flags reloaded successfully`);
          
          // Dispatch a custom event to notify components that feature flags have been updated
          window.dispatchEvent(new CustomEvent('posthog-feature-flags-updated'));
        } catch (err) {
          console.error(`[${new Date().toISOString()}] Error reloading feature flags:`, err);
        }
      }, 500); // Reduced from 1500ms to 500ms
      
      toast({
        title: "Login successful",
        description: `Welcome back!`,
      });
      
      // Navigate AFTER PostHog identification completes
      console.log(`[${new Date().toISOString()}] Navigating to homepage...`);
      navigate('/');
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error in handleSuccessfulLogin:`, error);
      
      // Still navigate even if PostHog fails
      toast({
        title: "Login successful",
        description: `Welcome back!`,
      });
      navigate('/');
    }
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
