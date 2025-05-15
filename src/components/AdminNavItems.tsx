
import { Link } from 'react-router-dom';
import { Image } from 'lucide-react';
import { useFeatureFlagEnabled } from 'posthog-js/react';

/**
 * Admin navigation items that are only shown when the user has the is_admin feature flag enabled
 */
export const AdminNavItems = () => {
  // Get flag directly from PostHog
  const isAdmin = useFeatureFlagEnabled('is_admin');
  
  // If the flag isn't true, don't show anything
  if (isAdmin !== true) {
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
