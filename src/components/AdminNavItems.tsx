
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { Link } from 'react-router-dom';
import { Image } from 'lucide-react';
import { useEffect, useState } from 'react';
import { usePostHog } from 'posthog-js/react';

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
    
    // Log the flag states for debugging
    console.log("Admin flag check:", {
      isAdmin,
      isIdentified,
      showingAdminNav: shouldShow,
      currentFlags: posthog?.featureFlags?.getFlags ? posthog.featureFlags.getFlags() : 'Unknown'
    });
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
