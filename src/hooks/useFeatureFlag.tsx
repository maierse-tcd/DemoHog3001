
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { useEffect, useState } from 'react';
import { safeGetDistinctId } from '../utils/posthog';

/**
 * An enhanced wrapper for the PostHog useFeatureFlagEnabled hook
 * This provides better consistency and ensures feature flags are properly evaluated
 */
export function useFeatureFlag(flagName: string): boolean {
  // Use the official PostHog hook
  const enabled = useFeatureFlagEnabled(flagName);
  // Track if PostHog has identified a user
  const [isIdentified, setIsIdentified] = useState(false);
  
  // Check if user is identified, as feature flags are only reliable after identification
  useEffect(() => {
    const checkIdentification = () => {
      const distinctId = safeGetDistinctId();
      const hasValidId = !!distinctId && typeof distinctId === 'string';
      setIsIdentified(hasValidId);
      
      // For debugging purposes
      if (flagName === 'is_admin') {
        console.log(`Feature flag ${flagName}: ${enabled}, user identified: ${!!distinctId}, distinctId: ${distinctId}`);
      }
    };
    
    // Check immediately
    checkIdentification();
    
    // Set up an interval to check again (feature flags can take time to load)
    const intervalId = setInterval(checkIdentification, 1000);
    
    // Clear interval on unmount
    return () => clearInterval(intervalId);
  }, [flagName, enabled]);

  // Only return true if properly identified and the flag is enabled
  return isIdentified && enabled;
}

export default useFeatureFlag;
