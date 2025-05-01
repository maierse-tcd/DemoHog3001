
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { Link } from 'react-router-dom';
import { Image } from 'lucide-react';
import { useEffect, useState } from 'react';

export const AdminNavItems = () => {
  // Use the official PostHog feature flag hook with reliable checking
  const isAdmin = useFeatureFlagEnabled('is_admin');
  const [showAdmin, setShowAdmin] = useState(false);
  
  // Set up an effect to update the flag consistently
  useEffect(() => {
    // Only show the admin section when the flag is explicitly true
    setShowAdmin(isAdmin === true);
    
    // Log the flag state for debugging
    console.log("Admin feature flag state:", isAdmin);
  }, [isAdmin]);
  
  // Don't render anything unless the flag is explicitly true
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
