
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { useState, useEffect } from 'react';
import { safeGetDistinctId } from '../utils/posthog';

/**
 * An enhanced wrapper for the PostHog useFeatureFlagEnabled hook
 * that only checks if the user is identified before returning a value
 */
export function useFeatureFlag(flagName: string): boolean {
  // Use the official PostHog hook
  const phEnabled = useFeatureFlagEnabled(flagName);
  // Track if flag has been checked
  const [flagValue, setFlagValue] = useState<boolean>(false);
  // Track if user is identified
  const [isIdentified, setIsIdentified] = useState<boolean>(false);
  
  // Check if user is identified, as feature flags are only reliable after identification
  useEffect(() => {
    const checkIdentification = () => {
      const distinctId = safeGetDistinctId();
      const hasValidId = !!distinctId && typeof distinctId === 'string';
      
      setIsIdentified(hasValidId);
      
      // If user is identified, use the PostHog value
      if (hasValidId) {
        setFlagValue(phEnabled);
        
        // For debugging - only log certain flags to reduce noise
        if (flagName === 'is_admin') {
          console.log(`Feature flag ${flagName}: ${phEnabled}, user: ${distinctId}`);
        }
      }
    };
    
    // Initial check
    checkIdentification();
    
    // Check again if phEnabled changes
    if (isIdentified) {
      setFlagValue(phEnabled);
    }
  }, [flagName, phEnabled, isIdentified]);

  // Only return true if the user is identified and the flag is enabled
  return isIdentified && flagValue;
}

export default useFeatureFlag;
