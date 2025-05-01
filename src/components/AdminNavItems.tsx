
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { Link } from 'react-router-dom';
import { Image } from 'lucide-react';

export const AdminNavItems = () => {
  // Use the official PostHog feature flag hook
  const isAdmin = useFeatureFlagEnabled('is_admin');
  
  // The hook returns boolean | undefined, so we need to check if it's explicitly true
  // This ensures that when flags are being loaded or cleared, the component doesn't show
  if (isAdmin !== true) {
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
