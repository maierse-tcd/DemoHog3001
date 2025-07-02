import React from 'react';
import { Button } from './ui/button';
import { AlertTriangle, Crown } from 'lucide-react';

interface SubscriptionNotificationProps {
  isSubscribed: boolean;
  onUpgrade: () => void;
}

export const SubscriptionNotification: React.FC<SubscriptionNotificationProps> = ({
  isSubscribed,
  onUpgrade
}) => {
  if (isSubscribed) return null;

  return (
    <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-orange-500/20 rounded-full">
            <AlertTriangle className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">No Active Subscription</h3>
            <p className="text-gray-300 text-sm">
              You're currently not subscribed to any plan. Upgrade now to access premium features!
            </p>
          </div>
        </div>
        <Button 
          onClick={onUpgrade}
          className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-medium px-6 py-2 rounded-lg transition-all duration-200 flex items-center gap-2"
        >
          <Crown className="w-4 h-4" />
          Upgrade Now
        </Button>
      </div>
    </div>
  );
};