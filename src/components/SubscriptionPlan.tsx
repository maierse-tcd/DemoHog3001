
import React from 'react';

export interface Plan {
  id: string;
  name: string;
  description: string;
  price: string;
  features: string[];
  recommended?: boolean;
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
  
  return (
    <div 
      className={`border rounded-lg p-5 transition-all ${
        isSelected 
          ? 'border-netflix-red bg-netflix-darkgray/50 shadow-lg' 
          : 'border-netflix-gray/20 hover:border-netflix-gray/40'
      } ${plan.recommended ? 'relative overflow-hidden' : ''}`}
    >
      {plan.recommended && (
        <div className="absolute top-0 right-0">
          <div className="bg-netflix-red text-white px-4 py-1 text-xs font-medium transform translate-x-5 translate-y-2 rotate-45">
            POPULAR
          </div>
        </div>
      )}
      
      <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
      <p className="text-netflix-gray text-sm mb-4">{plan.description}</p>
      
      <div className="text-xl font-bold mb-4">{plan.price}</div>
      
      <ul className="mb-6 space-y-2">
        {plan.features.map((feature, index) => (
          <li key={index} className="text-sm flex items-start">
            <span className="text-netflix-red mr-2">✓</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      
      <button
        onClick={() => onSelect(plan.id)}
        className={`w-full py-2 px-4 rounded font-medium transition-colors ${
          isSelected 
            ? 'bg-netflix-red text-white' 
            : 'bg-netflix-darkgray text-white hover:bg-netflix-red'
        }`}
      >
        {isSelected ? 'Selected' : 'Choose Plan'}
      </button>
    </div>
  );
};
