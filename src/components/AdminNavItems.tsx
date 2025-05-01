
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { Link } from 'react-router-dom';
import { Image } from 'lucide-react';
import { useEffect, useState } from 'react';
import { usePostHog } from 'posthog-js/react';
import { safeGetDistinctId } from '../utils/posthogUtils';

export const AdminNavItems = () => {
  const posthog = usePostHog();
  const isAdmin = useFeatureFlagEnabled('is_admin');
  const isIdentified = useFeatureFlagEnabled('isIdentified');
  const [showAdmin, setShowAdmin] = useState(false);
  
  // Set up an effect to update the flag consistently
  useEffect(() => {
    // Only show admin when the user is identified AND the admin flag is true
    const shouldShow = isAdmin === true && isIdentified === true;
    setShowAdmin(shouldShow);
    
    // Get current distinct ID for debugging
    const distinctId = safeGetDistinctId();
    
    // Log the flag states for debugging
    console.log("Admin flag check:", {
      distinctId,
      isAdmin,
      isIdentified,
      showingAdminNav: shouldShow,
      currentFlags: posthog?.featureFlags?.getFlags ? posthog.featureFlags.getFlags() : 'Unknown'
    });
    
    // Force a delayed check to catch race conditions
    setTimeout(() => {
      // Re-check flags after a short delay in case they weren't loaded initially
      const shouldShowDelayed = 
        posthog?.isFeatureEnabled?.('is_admin') === true && 
        posthog?.isFeatureEnabled?.('isIdentified') === true;
      
      if (shouldShowDelayed !== shouldShow) {
        console.log("Admin flag delayed check different than initial:", {
          distinctId: safeGetDistinctId(),
          isAdmin: posthog?.isFeatureEnabled?.('is_admin'),
          isIdentified: posthog?.isFeatureEnabled?.('isIdentified'),
          showingAdminNavNow: shouldShowDelayed
        });
        setShowAdmin(shouldShowDelayed);
      }
    }, 2000); // Check again after 2 seconds
  }, [isAdmin, isIdentified, posthog]);
  
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
