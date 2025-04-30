import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { useToast } from '../hooks/use-toast';
import { useProfileSettings } from '../contexts/ProfileSettingsContext';
import { supabase } from '../integrations/supabase/client';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { updateSettings } = useProfileSettings();

  // Check for existing session on component mount
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        // User is already logged in, redirect to homepage
        navigate('/');
      }
    };
    
    checkSession();
  }, [navigate]);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      
      if (profileData) {
        // Get user metadata from auth to supplement profile data
        const { data: { user } } = await supabase.auth.getUser();
        const userMetadata = user?.user_metadata || {};
        
        // Update the profile settings context with user data
        updateSettings({
          name: profileData.name || 'User',
          email: profileData.email,
          language: 'English',
          notifications: { email: true },
          // Use metadata for fields not in the profile table
          selectedPlanId: userMetadata.selectedPlanId || 'premium',
          isKidsAccount: userMetadata.isKidsAccount || false
        });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

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
      
      // Sign in with email/password - use persistSession: true to ensure persistent login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error("Login error:", error);
        
        toast({
          title: "Login failed",
          description: error.message || "Invalid email or password",
          variant: "destructive"
        });
        
        // Track failed login in PostHog
        if (window.posthog) {
          window.posthog.capture('user_login_failed', {
            error: error.message
          });
        }
      } else if (data && data.user) {
        console.log('Analytics Event: Login Success', { email });
        
        // Fetch user profile data
        await fetchUserProfile(data.user.id);
        
        // Track login event in PostHog - identify the user
        if (window.posthog) {
          window.posthog.identify(data.user.id, {
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

  return (
    <div className="min-h-screen bg-netflix-black flex flex-col">
      {/* Navbar with just logo */}
      <div className="py-6 px-8 border-b border-netflix-gray/20">
        <Link to="/">
          <h1 className="text-netflix-red text-3xl font-bold tracking-tighter">HOGFLIX</h1>
        </Link>
      </div>
      
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-netflix-darkgray rounded-lg p-8 shadow-lg">
          <h2 className="text-2xl font-bold mb-6">Sign In</h2>
          
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
          
          <div className="text-center">
            <p className="text-netflix-gray">
              New to Hogflix? <Link to="/signup" className="text-white hover:underline">Sign up now</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
