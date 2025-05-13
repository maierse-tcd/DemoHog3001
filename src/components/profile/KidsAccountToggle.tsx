
import React from 'react';
import { Checkbox } from '../ui/checkbox';

interface KidsAccountToggleProps {
  isKidsAccount: boolean;
  onToggle: (checked: boolean) => void;
}

export const KidsAccountToggle: React.FC<KidsAccountToggleProps> = ({
  isKidsAccount,
  onToggle
}) => {
  return (
    <div>
      <div className="flex items-center space-x-3">
        <Checkbox 
          id="isKidsAccount" 
          name="isKidsAccount" 
          checked={isKidsAccount}
          onCheckedChange={onToggle}
          className="h-5 w-5 border border-netflix-gray" 
        />
        <label htmlFor="isKidsAccount" className="text-sm font-medium text-netflix-gray">
          This is a kids account
        </label>
      </div>
      <p className="text-sm text-netflix-gray mt-1">
        Kids accounts have restricted content and simplified controls
      </p>
    </div>
  );
};
