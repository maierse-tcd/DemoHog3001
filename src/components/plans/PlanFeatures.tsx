
import React from 'react';
import { Package, Badge, Gift } from 'lucide-react';
import { Card, CardContent } from '../ui/card';

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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 mt-8">
      {features.map((feature, index) => {
        // Choose icon based on index
        let IconComponent;
        if (index === 0) IconComponent = Package;
        else if (index === 1) IconComponent = Badge;
        else IconComponent = Gift;
        
        return (
          <Card key={index} className="bg-[#181818] border-[#333333]/30 backdrop-blur-sm overflow-hidden hover:border-[#ea384c]/30 transition-all group">
            <CardContent className="p-6">
              <div className="flex items-start">
                <div className="mr-4 bg-[#ea384c] rounded-full p-2 transform group-hover:scale-110 transition-transform">
                  <IconComponent className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2 text-white">{feature.title}</h3>
                  <p className="text-[#F1F0FB]/80 text-sm">{feature.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
