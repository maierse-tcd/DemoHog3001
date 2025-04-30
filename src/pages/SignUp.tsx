
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { SubscriptionPlan, Plan } from '../components/SubscriptionPlan';
import { useToast } from '../hooks/use-toast';
import { useProfileSettings } from '../contexts/ProfileSettingsContext';
import { supabase } from '../integrations/supabase/client';

const subscriptionPlans: Plan[] = [
  {
    id: 'free',
    name: 'Free Plan',
    description: 'Enjoy a limited selection of movies and shows for free.',
    price: '$0.00',
    features: [
      'Access to free content',
      'Watch on one device',
      'SD quality',
      'Ad-supported'
    ]
  },
  {
    id: 'premium',
    name: 'Premium Plan',
    description: 'Access to all movies and shows, including premium content.',
    price: '$12.99/month',
    features: [
      'Full content library',
      'Watch on two devices',
      'HD quality',
      'Ad-free experience',
      'Download for offline viewing'
    ],
    recommended: true
  },
  {
    id: 'maximal',
    name: 'Max-imal Plan',
    description: 'Get everything in Premium plus exclusive content and features.',
    price: '$19.99/month',
    features: [
      'Full content library',
      'Watch on up to four devices',
      '4K Ultra HD quality',
      'Ad-free experience',
      'Download for offline viewing',
      'Exclusive early access content',
      'Member-only events'
    ]
  }
];

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isKidsAccount, setIsKidsAccount] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { updateSettings, updateSelectedPlan } = useProfileSettings();
  
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
  
  const handlePlanSelect = (planId: string) => {
    setSelectedPlanId(planId);
  };
  
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Validate all fields
      if (!email || !password || password.length < 6) {
        toast({
          title: "Invalid credentials",
          description: "Please enter a valid email and password (min 6 characters)",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      if (!name) {
        toast({
          title: "Name required",
          description: "Please enter your name",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      if (!selectedPlanId) {
        toast({
          title: "Plan selection required",
          description: "Please select a subscription plan",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      // Sign up with Supabase
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            selectedPlanId,
            isKidsAccount
          },
          emailRedirectTo: window.location.origin
        }
      });
      
      if (error) throw error;

      if (data && data.user) {
        // Update profile settings context
        updateSettings({
          name,
          email,
          notifications: { email: true },
          language: 'English',
          selectedPlanId,
        });
        
        updateSelectedPlan(selectedPlanId);
        
        // Create a profile in the database for this user
        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: data.user.id,
              name,
              email,
              selected_plan_id: selectedPlanId,
              is_kids_account: isKidsAccount
            });
            
          if (profileError) {
            console.error("Error creating profile:", profileError);
          }
        } catch (profileErr) {
          console.error("Error creating profile:", profileErr);
        }
        
        // Track signup event in PostHog
        if (window.posthog) {
          window.posthog.identify(data.user.id, {
            email: email,
            name: name,
            plan: selectedPlanId,
            isKidsAccount: isKidsAccount
          });
          window.posthog.capture('user_signup_complete');
        }
        
        if (data.session) {
          // User was automatically logged in (email confirmation disabled in Supabase)
          toast({
            title: "Sign up successful!",
            description: "Welcome to Hogflix! Enjoy your hedgehog adventures.",
          });
          
          navigate('/');
        } else {
          // Need to confirm email first
          toast({
            title: "Account created!",
            description: "Please check your email to confirm your account before logging in.",
          });
          
          // Still redirect to homepage
          setTimeout(() => {
            navigate('/login');
          }, 1500);
        }
      }
    } catch (error: any) {
      // Track failed signup in PostHog
      if (window.posthog) {
        window.posthog.capture('user_signup_failed', {
          error: error.message || "Unknown error"
        });
      }
      
      toast({
        title: "Sign up failed",
        description: error.message || "An error occurred during sign up",
        variant: "destructive"
      });
      console.error("Sign up error:", error);
    } finally {
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
        <div className="max-w-4xl w-full bg-netflix-darkgray rounded-lg p-8 shadow-lg">
          <h2 className="text-2xl font-bold mb-6">Create your account</h2>
          
          <form onSubmit={handleSignUp} className="space-y-8">
            {/* Personal Information Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-xl font-medium">Personal Information</h3>
                <div>
                  <label className="block text-sm mb-1">Full Name</label>
                  <Input 
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-black/40 border-netflix-gray/40 text-white"
                    placeholder="Enter your name"
                  />
                </div>
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
                    placeholder="Create a password (min 6 characters)"
                  />
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <input
                    type="checkbox"
                    id="kidsAccount"
                    checked={isKidsAccount}
                    onChange={(e) => setIsKidsAccount(e.target.checked)}
                    className="rounded border-netflix-gray/40 bg-black/40"
                  />
                  <label htmlFor="kidsAccount" className="cursor-pointer">
                    This is a kids account
                  </label>
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-medium mb-4">Choose your plan</h3>
                <p className="text-netflix-gray mb-4">Select the subscription plan that works for you.</p>
                <div className="space-y-4">
                  {subscriptionPlans.map(plan => (
                    <SubscriptionPlan
                      key={plan.id}
                      plan={plan}
                      selectedPlanId={selectedPlanId}
                      onSelect={handlePlanSelect}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-netflix-gray/20">
              <p className="text-netflix-gray text-sm">
                Already have an account? <Link to="/login" className="text-white hover:underline">Sign in</Link>
              </p>
              <Button
                type="submit"
                className="bg-netflix-red hover:bg-netflix-red/80 text-white"
                disabled={isLoading}
              >
                {isLoading ? 'Creating account...' : 'Complete Sign Up'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
