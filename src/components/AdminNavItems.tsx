
import { Link } from 'react-router-dom';
import { Image } from 'lucide-react';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { useState, useEffect } from 'react';
import { safeGetDistinctId } from '../utils/posthogUtils';

/**
 * Admin navigation items that are only shown when the user has the is_admin feature flag enabled
 */
export const AdminNavItems = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const phFlagEnabled = useFeatureFlagEnabled('is_admin');
  
  useEffect(() => {
    // Only check the flag if the user is identified
    const distinctId = safeGetDistinctId();
    if (distinctId) {
      setIsAdmin(phFlagEnabled);
      console.log(`AdminNavItems - is_admin flag: ${phFlagEnabled}, user: ${distinctId}`);
    } else {
      setIsAdmin(false);
      console.log('AdminNavItems - User not identified, hiding admin items');
    }
  }, [phFlagEnabled]);
  
  // If the flag isn't true, don't show anything
  if (!isAdmin) {
    return null;
  }
  
  return (
    <Link 
      to="/image-manager"
      className="text-netflix-gray hover:text-netflix-white transition-colors flex items-center gap-2 text-sm font-medium"
    >
      <Image size={16} />
      <span>Images</span>
    </Link>
  );
};
