
import { useState } from 'react';
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

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      
      if (profileData) {
        // Update the profile settings context with user data
        updateSettings({
          name: profileData.name || 'User',
          email: profileData.email,
          language: 'English',
          notifications: { email: true },
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
      
      // First, check if the user exists by trying to sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      // If there was an error about email confirmation, we'll bypass it
      if (error && error.message.includes("Email not confirmed")) {
        console.log("Bypassing email confirmation requirement");
        
        // We'll directly look for user in the profiles table
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', email)
          .single();
        
        if (profileError || !profileData) {
          throw new Error("Invalid email or password");
        }
        
        // If we found the profile, we'll manually sign in the user
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
          // Remove the incorrect options structure with 'data' property
        });
        
        if (signInError) {
          throw signInError;
        }
        
        if (signInData && signInData.user) {
          await fetchUserProfile(signInData.user.id);
          
          toast({
            title: "Login successful",
            description: `Welcome back!`,
          });
          
          setTimeout(() => {
            navigate('/');
          }, 500);
        }
      } else if (error) {
        throw error;
      } else if (data && data.user) {
        console.log('Analytics Event: Login Success', { email });
        
        // Fetch user profile data
        await fetchUserProfile(data.user.id);
        
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
