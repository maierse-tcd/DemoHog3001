
import { Link } from 'react-router-dom';
import { Image } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useFeatureFlag } from '../hooks/useFeatureFlag';
import { safeGetDistinctId } from '../utils/posthogUtils';

/**
 * Admin navigation items that are only shown when the user has the is_admin feature flag enabled
 */
export const AdminNavItems = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const isAdminEnabled = useFeatureFlag('is_admin');
  
  // Add an effect to listen for feature flag changes
  useEffect(() => {
    // Only check the flag if the user is identified
    const distinctId = safeGetDistinctId();
    if (distinctId) {
      setIsAdmin(isAdminEnabled);
      setIsLoading(false);
      console.log(`AdminNavItems - is_admin flag: ${isAdminEnabled}, user: ${distinctId}`);
    } else {
      setIsAdmin(false);
      setIsLoading(false);
      console.log('AdminNavItems - User not identified, hiding admin items');
    }
  }, [isAdminEnabled]);
  
  // Listen for a custom event that will be dispatched after login
  useEffect(() => {
    const handleFeatureFlagsUpdated = () => {
      console.log('AdminNavItems - Feature flags updated event received');
      const distinctId = safeGetDistinctId();
      if (distinctId) {
        // Re-check the feature flag status
        setIsLoading(true);
        setTimeout(() => {
          // Give PostHog a moment to update the flag status
          setIsAdmin(isAdminEnabled);
          setIsLoading(false);
        }, 100);
      }
    };

    // Add event listener for custom event
    window.addEventListener('posthog-feature-flags-updated', handleFeatureFlagsUpdated);
    
    return () => {
      window.removeEventListener('posthog-feature-flags-updated', handleFeatureFlagsUpdated);
    };
  }, [isAdminEnabled]);
  
  // If still loading or the flag isn't true, don't show anything
  if (isLoading) {
    return null; // Don't render while loading
  }
  
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
