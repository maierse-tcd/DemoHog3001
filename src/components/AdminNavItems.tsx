
import { Link } from 'react-router-dom';
import { Image } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { safeGetDistinctId } from '../utils/posthog';
import { useFeatureFlag } from '../hooks/useFeatureFlag';
import { useMemo } from 'react';

/**
 * Admin navigation items that are only shown when the user has the is_admin feature flag enabled
 * or has a posthog.com email domain
 */
export const AdminNavItems = () => {
  // Use our enhanced feature flag hook
  const isAdmin = useFeatureFlag('is_admin');
  const { isLoggedIn, userEmail } = useAuth();
  
  // Get the currently identified PostHog user email which might be different from Supabase email
  const posthogDistinctId = safeGetDistinctId();
  
  // Memoize email checks to prevent recalculation on each render
  const { isPosthogEmailUser, isSupabasePosthogEmailUser } = useMemo(() => {
    // Only consider email from posthog if it looks like a valid email
    const isPosthogEmail = typeof posthogDistinctId === 'string' && 
      posthogDistinctId.includes('@') && 
      posthogDistinctId.toLowerCase().endsWith('@posthog.com');
    
    // Check if the Supabase user has a posthog.com email
    const isSupabaseEmail = typeof userEmail === 'string' && 
      userEmail.toLowerCase().endsWith('@posthog.com');
      
    return { 
      isPosthogEmailUser: isPosthogEmail,
      isSupabasePosthogEmailUser: isSupabaseEmail 
    };
  }, [posthogDistinctId, userEmail]);
  
  // Only render the admin nav item if the user is logged in AND 
  // (has the is_admin flag enabled OR has a posthog.com email in either system)
  const showAdminLink = isLoggedIn && (isAdmin || isPosthogEmailUser || isSupabasePosthogEmailUser);
  
  // For debugging purposes - limit to once when component mounts or when values change
  if (isLoggedIn) {
    console.log(`AdminNavItems: isAdmin flag: ${isAdmin}, PostHog email: ${posthogDistinctId}, Supabase email: ${userEmail}, showAdminLink: ${showAdminLink}`);
  }
  
  if (!showAdminLink) {
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
