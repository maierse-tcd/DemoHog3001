
import { Link } from 'react-router-dom';
import { Image } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { safeGetDistinctId } from '../utils/posthog';
import { useFeatureFlag } from '../hooks/useFeatureFlag';
import { useMemo, useRef, useEffect, useState } from 'react';

// Storage key for admin status cache
const ADMIN_STATUS_CACHE_KEY = 'admin_status_cache';

// Cache duration - 5 minutes
const ADMIN_CACHE_DURATION = 5 * 60 * 1000;

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
 * or has admin_override set to true in the database
 */
export const AdminNavItems = () => {
  // Component state
  const [isLoading, setIsLoading] = useState(true);
  const [showAdminLink, setShowAdminLink] = useState(false);
  
  // Get flag from PostHog
  const isAdminFlag = useFeatureFlag('is_admin');
  // Get database override and auth state
  const { isLoggedIn, userEmail, adminOverride } = useAuth();
  
  // Track if we've already logged debugging info
  const hasLoggedInfo = useRef(false);
  
  // Get the currently identified PostHog user email
  const posthogDistinctId = safeGetDistinctId();
  
  // Check cached admin status first
  const cachedAdminStatus = useMemo(() => {
    return getCachedAdminStatus();
  }, []);
  
  // Determine if we should show the admin link
  useEffect(() => {
    // Don't determine status until we're logged in
    if (!isLoggedIn) {
      setIsLoading(false);
      setShowAdminLink(false);
      return;
    }
    
    // If we have a valid cache, use it immediately to prevent flickering
    if (cachedAdminStatus !== null) {
      setShowAdminLink(cachedAdminStatus);
      setIsLoading(false);
      return;
    }
    
    // Prioritize database override over feature flag
    const hasAdminAccess = adminOverride === true || isAdminFlag === true;
    
    // Update state and cache the result
    setShowAdminLink(hasAdminAccess);
    setIsLoading(false);
    cacheAdminStatus(hasAdminAccess);
    
  }, [isLoggedIn, isAdminFlag, adminOverride, cachedAdminStatus]);
  
  // Log debug info on mount or when values change, but limit to once
  useEffect(() => {
    if (isLoggedIn && !hasLoggedInfo.current && !isLoading) {
      console.log(
        `AdminNavItems: isAdmin flag: ${isAdminFlag}, ` +
        `adminOverride: ${adminOverride}, ` + 
        `PostHog email: ${posthogDistinctId}, ` +
        `Supabase email: ${userEmail}, ` +
        `showAdminLink: ${showAdminLink}`
      );
      hasLoggedInfo.current = true;
      
      // Reset log flag after 30 seconds to allow a fresh log if needed
      setTimeout(() => {
        hasLoggedInfo.current = false;
      }, 30000);
    }
  }, [isLoggedIn, isAdminFlag, posthogDistinctId, userEmail, showAdminLink, adminOverride, isLoading]);
  
  // Show loading placeholder or nothing
  if (isLoading) {
    return null; // Or a loading indicator if preferred
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
