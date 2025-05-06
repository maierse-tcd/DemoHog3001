
import React from 'react';
import confetti from 'canvas-confetti';
import { SubscriptionCTA } from './plans/SubscriptionCTA';

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
    <div 
      className={`border rounded-lg p-5 transition-all relative overflow-hidden ${
        isSelected 
          ? 'border-[#ea384c] bg-[#1A1F2C]/50 shadow-lg' 
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
      
      <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
      <p className="text-[#8E9196] text-sm mb-4">{plan.description}</p>
      
      <div className="text-xl font-bold mb-4">{plan.price}</div>
      
      <ul className="mb-6 space-y-2">
        {plan.features.map((feature, index) => (
          <li key={index} className="text-sm flex items-start">
            <span className="text-[#ea384c] mr-2">✓</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      
      <SubscriptionCTA 
        planId={plan.id}
        planName={plan.name}
        isSelected={isSelected}
        onSelect={handleSelect}
      />
    </div>
  );
};
