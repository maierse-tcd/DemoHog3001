import { Link } from 'react-router-dom';
import { Image } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { safeGetDistinctId } from '../utils/posthog';
import { useFeatureFlag } from '../hooks/useFeatureFlag';
import { useMemo, useRef, useEffect } from 'react';

// Storage key for admin status cache
const ADMIN_STATUS_CACHE_KEY = 'admin_status_cache';

// Cache duration - 5 minutes
const ADMIN_CACHE_DURATION = 5 * 60 * 1000;

/**
 * Check if a string is a PostHog email
 */
const isPostHogEmail = (email: string | null): boolean => {
  return typeof email === 'string' && 
         email.includes('@') && 
         email.toLowerCase().endsWith('@posthog.com');
};

/**
 * Cache admin status to avoid flickering
 */
const cacheAdminStatus = (isAdmin: boolean): void => {
  try {
    localStorage.setItem(ADMIN_STATUS_CACHE_KEY, JSON.stringify({
      value: isAdmin,
      timestamp: Date.now()
    }));
  } catch (err) {
    // Ignore storage errors
  }
};

/**
 * Get cached admin status if available and fresh
 */
const getCachedAdminStatus = (): boolean | null => {
  try {
    const cached = localStorage.getItem(ADMIN_STATUS_CACHE_KEY);
    if (!cached) return null;
    
    const { value, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > ADMIN_CACHE_DURATION) {
      return null; // Cache expired
    }
    
    return value;
  } catch (err) {
    return null;
  }
};

/**
 * Admin navigation items that are only shown when the user has the is_admin feature flag enabled
 * or has a posthog.com email domain
 */
export const AdminNavItems = () => {
  // Use our enhanced feature flag hook
  const isAdmin = useFeatureFlag('is_admin');
  const { isLoggedIn, userEmail } = useAuth();
  
  // Track if we've already logged debugging info
  const hasLoggedInfo = useRef(false);
  
  // Get the currently identified PostHog user email which might be different from Supabase email
  const posthogDistinctId = safeGetDistinctId();
  
  // Memoize email checks to prevent recalculation on each render
  const { isPosthogEmailUser, isSupabasePosthogEmailUser } = useMemo(() => {
    // Only consider email from posthog if it looks like a valid email
    const isPosthogEmail = isPostHogEmail(posthogDistinctId);
    
    // Check if the Supabase user has a posthog.com email
    const isSupabaseEmail = isPostHogEmail(userEmail);
      
    return { 
      isPosthogEmailUser: isPosthogEmail,
      isSupabasePosthogEmailUser: isSupabaseEmail 
    };
  }, [posthogDistinctId, userEmail]);
  
  // Check cached admin status first
  const cachedAdminStatus = useMemo(() => {
    return getCachedAdminStatus();
  }, []);
  
  // Determine if we should show the admin link
  const showAdminLink = useMemo(() => {
    // First, check if we're even logged in - no point checking if not
    if (!isLoggedIn) return false;
    
    // If we have a valid cache, use it
    if (cachedAdminStatus !== null) {
      return cachedAdminStatus;
    }
    
    // Otherwise calculate based on flags and email domains
    const shouldShow = isLoggedIn && (isAdmin || isPosthogEmailUser || isSupabasePosthogEmailUser);
    
    // Cache the result to avoid flickering
    cacheAdminStatus(shouldShow);
    
    return shouldShow;
  }, [isLoggedIn, isAdmin, isPosthogEmailUser, isSupabasePosthogEmailUser, cachedAdminStatus]);
  
  // Log debug info on mount or when values change, but limit to once
  useEffect(() => {
    if (isLoggedIn && !hasLoggedInfo.current) {
      console.log(`AdminNavItems: isAdmin flag: ${isAdmin}, PostHog email: ${posthogDistinctId}, Supabase email: ${userEmail}, showAdminLink: ${showAdminLink}`);
      hasLoggedInfo.current = true;
      
      // Reset log flag after 30 seconds to allow a fresh log if needed
      setTimeout(() => {
        hasLoggedInfo.current = false;
      }, 30000);
    }
  }, [isLoggedIn, isAdmin, posthogDistinctId, userEmail, showAdminLink]);
  
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
