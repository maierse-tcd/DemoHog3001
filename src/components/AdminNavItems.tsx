
import { Link } from 'react-router-dom';
import { Image } from 'lucide-react';
import { useFeatureFlagEnabled, useActiveFeatureFlags } from 'posthog-js/react';
import { usePostHogIdentification } from '../contexts/PostHogIdentificationContext';
import { useAuth } from '../hooks/useAuth';

/**
 * Admin navigation items that properly wait for PostHog user identification
 * Shows the Images tab when the is_admin feature flag is enabled
 */
export const AdminNavItems = () => {
  const isAdminEnabled = useFeatureFlagEnabled('is_admin');
  const activeFlags = useActiveFeatureFlags();
  const { isIdentified, isIdentifying } = usePostHogIdentification();
  const { isLoggedIn } = useAuth();
  
  // Wait for feature flags to be loaded before showing anything
  const flagsLoaded = activeFlags !== undefined;
  
  // Debug logging
  console.log('AdminNavItems - Flags loaded:', flagsLoaded);
  console.log('AdminNavItems - is_admin flag:', isAdminEnabled);
  console.log('AdminNavItems - PostHog identified:', isIdentified);
  console.log('AdminNavItems - PostHog identifying:', isIdentifying);
  console.log('AdminNavItems - User logged in:', isLoggedIn);
  
  // Don't render while PostHog is identifying the user after login
  if (isLoggedIn && !isIdentified && isIdentifying) {
    console.log('AdminNavItems - Waiting for PostHog user identification...');
    return null;
  }
  
  // Don't render while flags are loading
  if (!flagsLoaded) {
    console.log('AdminNavItems - Waiting for feature flags to load...');
    return null;
  }
  
  // Only show if the admin flag is explicitly true
  if (!isAdminEnabled) {
    console.log('AdminNavItems - is_admin flag is false or undefined, hiding admin items');
    return null;
  }
  
  console.log('AdminNavItems - Showing admin navigation items');
  
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
