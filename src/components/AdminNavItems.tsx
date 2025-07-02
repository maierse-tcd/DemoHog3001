
import { Link } from 'react-router-dom';
import { Image } from 'lucide-react';
import { useFeatureFlagEnabled } from 'posthog-js/react';

/**
 * Clean admin navigation items using PostHog's native feature flag hooks
 * Shows the Images tab when the is_admin feature flag is enabled
 */
export const AdminNavItems = () => {
  const isAdminEnabled = useFeatureFlagEnabled('is_admin');
  
  // Simple check - PostHog handles loading states internally
  if (!isAdminEnabled) {
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
