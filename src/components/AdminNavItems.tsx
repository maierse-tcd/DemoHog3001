
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { Link } from 'react-router-dom';
import { Image } from 'lucide-react';
import { useEffect, useState } from 'react';
import { safeGetDistinctId, safeIsFeatureEnabled } from '../utils/posthogUtils';

export const AdminNavItems = () => {
  const isAdmin = useFeatureFlagEnabled('is_admin');
  const [showAdmin, setShowAdmin] = useState(false);
  
  // Set up an effect to update the flag consistently
  useEffect(() => {
    const checkAdminFlag = () => {
      // Get current distinct ID for debugging
      const distinctId = safeGetDistinctId();
      
      // Directly check the flag value
      const adminFlagValue = safeIsFeatureEnabled('is_admin');
      setShowAdmin(adminFlagValue === true);
      
      // Log the flag state for debugging
      console.log("Admin flag check:", {
        distinctId,
        isAdminFlag: adminFlagValue,
        showingAdminNav: adminFlagValue === true,
      });
    };
    
    // Check immediately
    checkAdminFlag();
    
    // Also set up a recurring check every 3 seconds to catch updates
    const interval = setInterval(checkAdminFlag, 3000);
    
    return () => {
      clearInterval(interval);
    };
  }, []);
  
  // Don't render anything unless explicitly allowed
  if (!showAdmin) {
    return null;
  }
  
  return (
    <Link 
      to="/image-manager"
      className="text-white hover:text-netflix-red transition-colors flex items-center gap-2"
    >
      <Image className="h-4 w-4" />
      <span>Images</span>
    </Link>
  );
};
