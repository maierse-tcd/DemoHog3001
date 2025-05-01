
import { useFeatureFlagEnabled } from '../hooks/usePostHogFeatures';
import { Link } from 'react-router-dom';
import { Image } from 'lucide-react';

export const AdminNavItems = () => {
  // Use the feature flag to determine if admin features should be shown
  const isAdmin = useFeatureFlagEnabled('is_admin');
  
  // Only render admin nav items if the feature flag is enabled
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
