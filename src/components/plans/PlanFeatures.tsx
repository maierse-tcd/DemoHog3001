
import React from 'react';
import { Package, Badge, Gift } from 'lucide-react';

export const PlanFeatures: React.FC = () => {
  const features = [
    {
      title: "Hedgehog Everywhere",
      description: "Watch your favorite spiky friends on any device, anytime.",
      icon: "device",
    },
    {
      title: "Cancel Anytime",
      description: "No prickly contracts, no commitments. Change your plan whenever you want.",
      icon: "check",
    },
    {
      title: "Unlimited Hog Content",
      description: "Enjoy unlimited access to our growing collection of hedgehog movies and series.",
      icon: "list",
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 mt-8">
      {features.map((feature, index) => {
        // Choose icon based on index
        let IconComponent;
        if (index === 0) IconComponent = Package;
        else if (index === 1) IconComponent = Badge;
        else IconComponent = Gift;
        
        return (
          <div key={index} className="flex items-start p-6 bg-[#1A1F2C] rounded-lg shadow-lg hover:shadow-xl transition-all">
            <div className="mr-4 bg-[#ea384c] rounded-full p-2">
              <IconComponent className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2 text-white">{feature.title}</h3>
              <p className="text-[#F1F0FB]">{feature.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
