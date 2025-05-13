
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { Link } from 'react-router-dom';
import { Image } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { safeGetDistinctId } from '../utils/posthog';
import posthog from 'posthog-js';

/**
 * Admin navigation items that are only shown when the user has the is_admin feature flag enabled
 * or has a posthog.com email domain
 */
export const AdminNavItems = () => {
  // Use the standard PostHog hook for feature flags
  const isAdmin = useFeatureFlagEnabled('is_admin');
  const { isLoggedIn, userEmail } = useAuth();
  
  // Get the currently identified PostHog user email which might be different from Supabase email
  const posthogDistinctId = safeGetDistinctId();
  
  // Only consider email from posthog if it looks like a valid email
  const isPosthogEmail = typeof posthogDistinctId === 'string' && 
    posthogDistinctId.includes('@') && 
    posthogDistinctId.toLowerCase().endsWith('@posthog.com');
  
  // Check if the Supabase user has a posthog.com email
  const isSupabasePosthogEmail = userEmail && 
    userEmail.toLowerCase().endsWith('@posthog.com');
  
  // Only render the admin nav item if the user is logged in AND 
  // (has the is_admin flag enabled OR has a posthog.com email in either system)
  const showAdminLink = isLoggedIn && (isAdmin || isPosthogEmail || isSupabasePosthogEmail);
  
  // For debugging purposes
  if (isLoggedIn) {
    console.log(`AdminNavItems: isAdmin flag: ${isAdmin}, PostHog email: ${posthogDistinctId}, Supabase email: ${userEmail}`);
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
