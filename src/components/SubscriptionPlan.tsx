
import React from 'react';
import confetti from 'canvas-confetti';
import { SubscriptionCTA } from './plans/SubscriptionCTA';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

export interface Plan {
  id: string;
  name: string;
  description: string;
  price: string;
  features: string[];
  recommended?: boolean;
  imageUrl?: string;
}

interface SubscriptionPlanProps {
  plan: Plan;
  selectedPlanId: string | null;
  onSelect: (planId: string) => void;
}

export const SubscriptionPlan: React.FC<SubscriptionPlanProps> = ({
  plan,
  selectedPlanId,
  onSelect
}) => {
  const isSelected = plan.id === selectedPlanId;
  
  const handleSelect = () => {
    console.log(`SubscriptionPlan: Selected plan ${plan.id}, previously selected: ${selectedPlanId}`);
    onSelect(plan.id);
    
    // Trigger confetti when plan is selected
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ea384c', '#ef7a85', '#FFDEE2', '#F1F0FB']
    });
  };
  
  return (
    <Card 
      className={`h-full transition-all relative overflow-hidden group ${
        isSelected 
          ? 'border-[#ea384c] shadow-lg shadow-[#ea384c]/10' 
          : 'border-[#8E9196]/20 hover:border-[#ea384c]/40'
      }`}
    >
      {plan.imageUrl && (
        <div className="absolute inset-0 opacity-10 -z-10">
          <img 
            src={plan.imageUrl} 
            alt={plan.name} 
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      {plan.recommended && (
        <div className="absolute top-0 right-0">
          <div className="bg-[#ea384c] text-white px-4 py-1 text-xs font-medium transform translate-x-5 translate-y-2 rotate-45">
            HOG CHOICE
          </div>
        </div>
      )}
      
      <CardHeader className="pt-6 pb-2">
        <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
        <CardDescription className="text-[#8E9196] text-sm">{plan.description}</CardDescription>
      </CardHeader>
      
      <CardContent className="pb-4">
        <div className="text-2xl font-bold mb-4 text-white">{plan.price}</div>
        
        <ul className="space-y-2">
          {plan.features.map((feature, index) => (
            <li key={index} className="text-sm flex items-start">
              <span className="text-[#ea384c] mr-2 flex-shrink-0">✓</span>
              <span className="text-[#F1F0FB]">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      
      <CardFooter className="pt-4 pb-6">
        <SubscriptionCTA 
          planId={plan.id}
          planName={plan.name}
          isSelected={isSelected}
          onSelect={handleSelect}
        />
      </CardFooter>
    </Card>
  );
};
