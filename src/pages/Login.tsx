
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { useToast } from '../hooks/use-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if user is already logged in
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('hogflixIsLoggedIn') === 'true';
    if (isLoggedIn) {
      navigate('/');
    }
  }, [navigate]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
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
    
    // Check if user exists in localStorage
    const userData = localStorage.getItem('hogflixUser');
    
    if (userData) {
      const user = JSON.parse(userData);
      
      // Simple login check - in a real app, you'd check password hashes
      if (user.email === email) {
        // Login successful
        localStorage.setItem('hogflixIsLoggedIn', 'true');
        
        console.log('Analytics Event: Login Success', { email });
        
        toast({
          title: "Login successful",
          description: `Welcome back, ${user.name}!`,
        });
        
        setTimeout(() => {
          navigate('/');
        }, 500);
      } else {
        // Login failed
        console.log('Analytics Event: Login Failed', { email });
        
        toast({
          title: "Login failed",
          description: "Invalid email or password",
          variant: "destructive"
        });
        setIsLoading(false);
      }
    } else {
      // No user found
      toast({
        title: "Account not found",
        description: "No account exists with this email",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-netflix-black flex flex-col">
      {/* Navbar with just logo */}
      <div className="py-6 px-8 border-b border-netflix-gray/20">
        <h1 className="text-netflix-red text-3xl font-bold tracking-tighter">HOGFLIX</h1>
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
