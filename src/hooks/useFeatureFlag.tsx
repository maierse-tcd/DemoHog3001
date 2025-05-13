import { useFeatureFlagEnabled } from 'posthog-js/react';
import { useEffect, useState, useRef, useCallback } from 'react';
import { safeGetDistinctId } from '../utils/posthog';

/**
 * Configuration constants for flag behavior
 */
const MAX_RETRIES = 2;
const CACHE_DURATION_MS = 5 * 60000; // Cache flag value for 5 minutes
const POSTHOG_FLAG_CACHE_PREFIX = 'ph_flag_';

/**
 * Save flag value to cache
 */
const cacheFlagValue = (flagName: string, value: boolean): void => {
  try {
    localStorage.setItem(
      `${POSTHOG_FLAG_CACHE_PREFIX}${flagName}`, 
      JSON.stringify({
        value,
        timestamp: Date.now()
      })
    );
  } catch (err) {
    // Ignore storage errors
  }
};

/**
 * Get cached flag value if available and not expired
 */
const getCachedFlagValue = (flagName: string): boolean | null => {
  try {
    const cacheData = localStorage.getItem(`${POSTHOG_FLAG_CACHE_PREFIX}${flagName}`);
    if (!cacheData) return null;
    
    const { value, timestamp } = JSON.parse(cacheData);
    const now = Date.now();
    
    // If cache is expired, return null
    if (now - timestamp > CACHE_DURATION_MS) {
      return null;
    }
    
    return value;
  } catch (err) {
    return null;
  }
};

/**
 * An enhanced wrapper for the PostHog useFeatureFlagEnabled hook
 * With proper retry logic, caching and cleanup to avoid infinite loops
 */
export function useFeatureFlag(flagName: string): boolean {
  // Use the official PostHog hook
  const enabled = useFeatureFlagEnabled(flagName);
  // Track if user is identified
  const [isIdentified, setIsIdentified] = useState(false);
  // Final flag value with fallbacks
  const [flagValue, setFlagValue] = useState<boolean | null>(null);
  // Keep track of retry attempts
  const retryCount = useRef(0);
  // Store timeoutId for cleanup
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Last time we checked the identification status
  const lastCheckTime = useRef<number>(0);
  // Track if component is still mounted
  const isMounted = useRef(true);
  
  // Initial check for cached values
  useEffect(() => {
    // Check cache
    const cachedValue = getCachedFlagValue(flagName);
    if (cachedValue !== null) {
      setFlagValue(cachedValue);
    }
  }, [flagName]);
  
  // Check if user is identified, as feature flags are only reliable after identification
  useEffect(() => {
    // Only perform limited retries if needed
    if (isIdentified || retryCount.current >= MAX_RETRIES) {
      return;
    }
    
    // Throttle checks to avoid excessive processing
    const now = Date.now();
    if (now - lastCheckTime.current < 500) {
      return;
    }
    
    lastCheckTime.current = now;
    
    const checkIdentification = () => {
      const distinctId = safeGetDistinctId();
      const hasValidId = !!distinctId && typeof distinctId === 'string';
      
      if (hasValidId) {
        setIsIdentified(true);
        
        // Update with current value from PostHog
        setFlagValue(enabled);
        cacheFlagValue(flagName, enabled);
        
        // For debugging - only log certain flags to reduce noise
        if (flagName === 'is_admin') {
          console.log(`Feature flag ${flagName}: ${enabled}, user: ${distinctId}`);
        }
      } else {
        // Increment retry counter
        retryCount.current += 1;
        
        // Schedule another check with exponential backoff if we haven't reached max retries
        if (retryCount.current < MAX_RETRIES && isMounted.current) {
          const delay = Math.min(2000 * Math.pow(2, retryCount.current - 1), 10000);
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

  // Update flag value when PostHog value changes (for identified users)
  useEffect(() => {
    if (isIdentified) {
      // Update cache and state with current value
      setFlagValue(enabled);
      cacheFlagValue(flagName, enabled);
    }
  }, [enabled, isIdentified, flagName]);
  
  // If we have a value, return it
  if (flagValue !== null) {
    return flagValue;
  }
  
  // Try to get cached value as a last resort
  const cachedValue = getCachedFlagValue(flagName);
  if (cachedValue !== null) {
    return cachedValue;
  }
  
  // Default to official PostHog value, or false if not identified yet
  return isIdentified ? enabled : false;
}

export default useFeatureFlag;
