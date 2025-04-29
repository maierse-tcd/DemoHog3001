
import React from 'react';
import { toast } from '../../hooks/use-toast';
import { Plan, SubscriptionPlan } from '../SubscriptionPlan';

interface SubscriptionSettingsProps {
  selectedPlanId: string;
  updateSelectedPlan: (planId: string) => void;
}

export const SubscriptionSettings: React.FC<SubscriptionSettingsProps> = ({ 
  selectedPlanId, 
  updateSelectedPlan
}) => {
  const availablePlans: Plan[] = [
    {
      id: 'free',
      name: 'Free Plan',
      description: 'Enjoy a limited selection of movies and shows for free.',
      price: '$0/month',
      features: [
        'Limited library of content',
        'Standard definition streaming',
        'Ad-supported viewing',
        'Watch on one device at a time'
      ]
    },
    {
      id: 'premium',
      name: 'Premium Plan',
      description: 'Access to all movies and shows, including premium content.',
      price: '$12.99/month',
      features: [
        'Full library access',
        'HD streaming',
        'Ad-free viewing',
        'Watch on two devices at a time',
        'Download content for offline viewing'
      ],
      recommended: true
    },
    {
      id: 'maximal',
      name: 'Max-imal Plan',
      description: 'Get everything in Premium plus exclusive content and features.',
      price: '$19.99/month',
      features: [
        'Full library access plus exclusive content',
        '4K Ultra HD streaming',
        'Ad-free viewing',
        'Watch on four devices at a time',
        'Download content for offline viewing',
        'Early access to new releases',
        'Exclusive hedgehog documentaries'
      ]
    }
  ];

  const handlePlanSelect = (planId: string) => {
    updateSelectedPlan(planId);
    toast({
      title: 'Plan selection updated',
      description: `You've selected the ${availablePlans.find(plan => plan.id === planId)?.name}`,
    });
  };

  const handleSaveChanges = () => {
    toast({
      title: 'Changes saved',
      description: `Your subscription plan has been updated to ${availablePlans.find(plan => plan.id === selectedPlanId)?.name}`,
    });
  };

  return (
    <div className="bg-netflix-darkgray rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-6">Subscription Plans</h2>
      <p className="text-netflix-gray mb-6">
        Choose the plan that's right for you. You can always change your plan later.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {availablePlans.map(plan => (
          <SubscriptionPlan
            key={plan.id}
            plan={plan}
            selectedPlanId={selectedPlanId}
            onSelect={handlePlanSelect}
          />
        ))}
      </div>
      
      <button onClick={handleSaveChanges} className="bg-netflix-red hover:bg-red-700 text-white px-6 py-3 rounded font-medium transition-colors">
        Save Changes
      </button>
    </div>
  );
};
