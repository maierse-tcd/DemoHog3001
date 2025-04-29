
import React from 'react';

export const HelpCenter: React.FC = () => {
  return (
    <div className="bg-netflix-darkgray rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-6">Help Center</h2>
      <div className="space-y-6">
        <div>
          <h3 className="font-medium mb-2">Frequently Asked Questions</h3>
          <div className="space-y-3">
            <div className="border border-netflix-gray/30 rounded-lg p-4">
              <h4 className="font-medium">How do I change my plan?</h4>
              <p className="text-netflix-gray mt-2">You can change your plan by going to your Subscription tab in your Profile.</p>
            </div>
            <div className="border border-netflix-gray/30 rounded-lg p-4">
              <h4 className="font-medium">How do I cancel my subscription?</h4>
              <p className="text-netflix-gray mt-2">To cancel your subscription, go to your Subscription tab and click on "Cancel Subscription".</p>
            </div>
            <div className="border border-netflix-gray/30 rounded-lg p-4">
              <h4 className="font-medium">What devices can I watch on?</h4>
              <p className="text-netflix-gray mt-2">You can watch on any device that supports a web browser, including your smart TV, game consoles, streaming media players, phones, and tablets.</p>
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="font-medium mb-2">Contact Support</h3>
          <p className="text-netflix-gray mb-4">Need more help? Contact our support team.</p>
          <button className="bg-netflix-red hover:bg-red-700 text-white px-4 py-2 rounded transition-colors">
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
};
