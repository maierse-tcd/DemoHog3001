
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { SubscriptionPlan, Plan } from '../components/SubscriptionPlan';
import { useToast } from '../hooks/use-toast';

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
  const [currentStep, setCurrentStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const handlePlanSelect = (planId: string) => {
    setSelectedPlanId(planId);
  };
  
  const handleContinue = () => {
    if (currentStep === 1) {
      // Validate email & password
      if (!email || !password || password.length < 6) {
        toast({
          title: "Invalid credentials",
          description: "Please enter a valid email and password (min 6 characters)",
          variant: "destructive"
        });
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // Validate name
      if (!name) {
        toast({
          title: "Name required",
          description: "Please enter your name",
          variant: "destructive"
        });
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      // Validate plan selection
      if (!selectedPlanId) {
        toast({
          title: "Plan selection required",
          description: "Please select a subscription plan",
          variant: "destructive"
        });
        return;
      }
      
      // Sign up complete - log event and navigate
      console.log('Analytics Event: Sign Up Complete', { 
        email, 
        name,
        plan: selectedPlanId 
      });
      
      toast({
        title: "Sign up successful!",
        description: "Welcome to Hogflix! Enjoy your hedgehog adventures.",
      });
      
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-netflix-black flex flex-col">
      {/* Navbar with just logo */}
      <div className="py-6 px-8 border-b border-netflix-gray/20">
        <h1 className="text-netflix-red text-3xl font-bold tracking-tighter">HOGFLIX</h1>
      </div>
      
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-3xl w-full bg-netflix-darkgray rounded-lg p-8 shadow-lg">
          {currentStep === 1 && (
            <>
              <h2 className="text-2xl font-bold mb-6">Create your account</h2>
              <div className="space-y-4 mb-6">
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
                    placeholder="Create a password"
                  />
                </div>
              </div>
            </>
          )}
          
          {currentStep === 2 && (
            <>
              <h2 className="text-2xl font-bold mb-6">Tell us about yourself</h2>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm mb-1">Name</label>
                  <Input 
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-black/40 border-netflix-gray/40 text-white"
                    placeholder="Enter your name"
                  />
                </div>
              </div>
            </>
          )}
          
          {currentStep === 3 && (
            <>
              <h2 className="text-2xl font-bold mb-6">Choose your plan</h2>
              <p className="text-netflix-gray mb-6">Select the subscription plan that works for you.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {subscriptionPlans.map(plan => (
                  <SubscriptionPlan
                    key={plan.id}
                    plan={plan}
                    selectedPlanId={selectedPlanId}
                    onSelect={handlePlanSelect}
                  />
                ))}
              </div>
            </>
          )}
          
          <div className="flex justify-between items-center">
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="border-netflix-gray/40 text-white hover:bg-netflix-darkgray"
              >
                Back
              </Button>
            )}
            <div className="flex-1"></div>
            <Button
              variant="default"
              onClick={handleContinue}
              className="bg-netflix-red hover:bg-netflix-red/80 text-white"
            >
              {currentStep === 3 ? 'Complete Sign Up' : 'Continue'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
