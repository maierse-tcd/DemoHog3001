
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { Link } from 'react-router-dom';
import { Image } from 'lucide-react';

/**
 * Admin navigation items that are only shown when the user has the is_admin feature flag enabled
 */
export const AdminNavItems = () => {
  // Use the standard PostHog hook for feature flags
  const isAdmin = useFeatureFlagEnabled('is_admin');
  
  // Only render the admin nav item if the user has the is_admin flag enabled
  if (!isAdmin) {
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
