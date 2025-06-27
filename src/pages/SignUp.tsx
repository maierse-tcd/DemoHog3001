import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthLayout } from '../components/auth/AuthLayout';
import { SignUpForm } from '../components/auth/SignUpForm';
import { PlanSelector } from '../components/auth/PlanSelector';
import { supabase } from '../integrations/supabase/client';
import { useToast } from '../hooks/use-toast';

const SignUp = () => {
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  
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
    console.log(`SignUp: Plan selected: ${planId}`);
    setSelectedPlanId(planId);
  };

  return (
    <div className="min-h-screen bg-netflix-black flex flex-col">
      {/* Navbar with clickable logo */}
      <div className="py-6 px-8 border-b border-netflix-gray/20">
        <Link to="/">
          <h1 className="text-netflix-red text-3xl font-bold tracking-tighter cursor-pointer hover:opacity-80 transition-opacity">HOGFLIX</h1>
        </Link>
      </div>
      
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full bg-netflix-darkgray rounded-lg p-8 shadow-lg">
          <h2 className="text-2xl font-bold mb-6">Create your account</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information Section */}
            <div className="space-y-4">
              <h3 className="text-xl font-medium">Personal Information</h3>
              <SignUpForm 
                selectedPlanId={selectedPlanId}
                setSelectedPlanId={setSelectedPlanId}
              />
            </div>
            
            {/* Plan Selection Section */}
            <PlanSelector 
              selectedPlanId={selectedPlanId}
              onPlanSelect={handlePlanSelect}
            />
          </div>
          
          <div className="flex items-center justify-between pt-4 border-t border-netflix-gray/20 mt-6">
            <p className="text-netflix-gray text-sm">
              Already have an account? <Link to="/login" className="text-white hover:underline">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
