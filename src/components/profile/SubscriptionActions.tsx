import React from 'react';

interface SubscriptionActionsProps {
  onSaveChanges: () => void;
  onCancelSubscription: () => void;
  isLoading: boolean;
  hasChanges: boolean;
}

export const SubscriptionActions: React.FC<SubscriptionActionsProps> = ({
  onSaveChanges,
  onCancelSubscription,
  isLoading,
  hasChanges
}) => {
  return (
    <div className="flex gap-4">
      <button 
        onClick={onSaveChanges} 
        className="bg-netflix-red hover:bg-red-700 text-white px-6 py-3 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isLoading || !hasChanges}
      >
        {isLoading ? "Saving..." : hasChanges ? "Save Changes" : "No Changes to Save"}
      </button>
      
      <button 
        onClick={onCancelSubscription}
        className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isLoading}
      >
        Cancel Subscription
      </button>
    </div>
  );
};