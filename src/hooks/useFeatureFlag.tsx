
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { useEffect, useState, useRef } from 'react';
import { safeGetDistinctId } from '../utils/posthog';

/**
 * Maximum number of retries to check for feature flag initialization
 */
const MAX_RETRIES = 3; // Reduced from 5
const CACHE_DURATION_MS = 60000; // Cache flag value for 1 minute

/**
 * An enhanced wrapper for the PostHog useFeatureFlagEnabled hook
 * With proper retry logic, caching and cleanup to avoid infinite loops
 */
export function useFeatureFlag(flagName: string): boolean {
  // Use the official PostHog hook
  const enabled = useFeatureFlagEnabled(flagName);
  // Track if PostHog has identified a user
  const [isIdentified, setIsIdentified] = useState(false);
  // Keep track of retry attempts
  const retryCount = useRef(0);
  // Store timeoutId for cleanup
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Cache the last known value to avoid flickering and reduce checks
  const lastKnownValue = useRef<boolean | null>(null);
  // Track when the flag was last checked
  const lastCheckTime = useRef<number>(0);
  // Track if component is still mounted
  const isMounted = useRef(true);
  
  // Check if user is identified, as feature flags are only reliable after identification
  useEffect(() => {
    // Only perform limited retries if needed
    if (isIdentified || retryCount.current >= MAX_RETRIES) {
      return;
    }
    
    // Check if we're within the cache period
    const now = Date.now();
    if (lastKnownValue.current !== null && now - lastCheckTime.current < CACHE_DURATION_MS) {
      return;
    }
    
    const checkIdentification = () => {
      const distinctId = safeGetDistinctId();
      const hasValidId = !!distinctId && typeof distinctId === 'string';
      
      if (hasValidId) {
        setIsIdentified(true);
        retryCount.current = MAX_RETRIES; // Stop further retries
        
        // Update last check time and cache the value
        lastCheckTime.current = Date.now();
        lastKnownValue.current = enabled;
        
        // For debugging purposes - only log admin flag specifically to reduce noise
        if (flagName === 'is_admin') {
          console.log(`Feature flag ${flagName}: ${enabled}, user identified: ${!!distinctId}`);
        }
      } else {
        // Increment retry counter
        retryCount.current += 1;
        
        // Schedule another check with exponential backoff if we haven't reached max retries
        if (retryCount.current < MAX_RETRIES && isMounted.current) {
          const delay = Math.min(2000 * Math.pow(2, retryCount.current - 1), 10000); // Start with longer delay (2s)
          timeoutRef.current = setTimeout(checkIdentification, delay);
        }
      }
    };
    
    // Initial check
    checkIdentification();
    
    // Clean up timeout on unmount
    return () => {
      isMounted.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [flagName, enabled]);

  // Once identified, we'll use the cache until it expires
  if (isIdentified) {
    const now = Date.now();
    
    // If the cache is fresh, use it
    if (lastKnownValue.current !== null && now - lastCheckTime.current < CACHE_DURATION_MS) {
      return lastKnownValue.current;
    }
    
    // Update cache and return current value
    lastKnownValue.current = enabled;
    lastCheckTime.current = now;
    return enabled;
  }
  
  // If not identified yet, return false
  return false;
}

export default useFeatureFlag;
