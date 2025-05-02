
import React from 'react';
import { Check } from 'lucide-react';

export const PlanFeatures: React.FC = () => {
  const features = [
    {
      title: "Watch anywhere",
      description: "Stream on smart TVs, tablets, phones, laptops, and more.",
      icon: "layout-grid",
    },
    {
      title: "Cancel anytime",
      description: "No contracts, no commitments. Change or cancel your plan whenever you want.",
      icon: "check",
    },
    {
      title: "Unlimited movies",
      description: "Enjoy unlimited access to our growing library of movies and series.",
      icon: "list",
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 mt-8">
      {features.map((feature, index) => (
        <div key={index} className="flex items-start p-6 bg-netflix-darkgray rounded-lg">
          <div className="mr-4 bg-netflix-red rounded-full p-2">
            <Check className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
            <p className="text-netflix-gray">{feature.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
