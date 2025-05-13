import { useFeatureFlagEnabled } from 'posthog-js/react';
import { useEffect, useState, useRef } from 'react';
import { safeGetDistinctId } from '../utils/posthog';

/**
 * Maximum number of retries to check for feature flag initialization
 */
const MAX_RETRIES = 5;

/**
 * An enhanced wrapper for the PostHog useFeatureFlagEnabled hook
 * With proper retry logic and cleanup to avoid infinite loops
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
  // Cache the last known value to avoid flickering
  const lastKnownValue = useRef<boolean | null>(null);
  
  // Check if user is identified, as feature flags are only reliable after identification
  useEffect(() => {
    // Only perform limited retries if needed
    if (isIdentified || retryCount.current >= MAX_RETRIES) {
      return;
    }
    
    const checkIdentification = () => {
      const distinctId = safeGetDistinctId();
      const hasValidId = !!distinctId && typeof distinctId === 'string';
      
      if (hasValidId) {
        setIsIdentified(true);
        retryCount.current = MAX_RETRIES; // Stop further retries
        
        // Update last known value
        lastKnownValue.current = enabled;
        
        // For debugging purposes
        if (flagName === 'is_admin') {
          console.log(`Feature flag ${flagName}: ${enabled}, user identified: ${!!distinctId}, distinctId: ${distinctId}`);
        }
      } else {
        // Increment retry counter
        retryCount.current += 1;
        
        // Schedule another check with exponential backoff if we haven't reached max retries
        if (retryCount.current < MAX_RETRIES) {
          const delay = Math.min(1000 * Math.pow(2, retryCount.current - 1), 10000); // Max 10 seconds
          timeoutRef.current = setTimeout(checkIdentification, delay);
        }
      }
    };
    
    // Initial check
    checkIdentification();
    
    // Clean up timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [flagName, enabled]);

  // Return the cached value if we have one, otherwise use the current value
  // Only return true if properly identified and the flag is enabled
  return isIdentified ? (lastKnownValue.current ?? enabled) : false;
}

export default useFeatureFlag;
