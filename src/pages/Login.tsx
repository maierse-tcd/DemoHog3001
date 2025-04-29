
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { useToast } from '../hooks/use-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!email || !password) {
      toast({
        title: "Missing credentials",
        description: "Please enter both email and password",
        variant: "destructive"
      });
      return;
    }
    
    // In a real app, you'd verify these credentials against your backend
    console.log('Analytics Event: Login Attempt', { email });
    
    // Simulate successful login
    toast({
      title: "Login successful",
      description: "Welcome back to Hogflix!",
    });
    
    console.log('Analytics Event: Login Success', { email });
    
    navigate('/');
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
            >
              Sign In
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
