
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { useState, useEffect } from 'react';
import { safeGetDistinctId } from '../utils/posthogUtils';

/**
 * An enhanced wrapper for the PostHog useFeatureFlagEnabled hook
 * that only checks if the user is identified before returning a value
 */
export function useFeatureFlag(flagName: string): boolean {
  // Use the official PostHog hook directly
  const phEnabled = useFeatureFlagEnabled(flagName);
  // Track if user is identified
  const [isIdentified, setIsIdentified] = useState<boolean>(false);
  
  // Check if user is identified, as feature flags are only reliable after identification
  useEffect(() => {
    const checkIdentification = () => {
      const distinctId = safeGetDistinctId();
      const hasValidId = !!distinctId && typeof distinctId === 'string';
      
      setIsIdentified(hasValidId);
      
      // For debugging - only log certain flags to reduce noise
      if (flagName === 'is_admin') {
        console.log(`Feature flag ${flagName}: ${phEnabled}, user identified: ${hasValidId}`);
      }
    };
    
    // Initial check
    checkIdentification();
    
    // Check again whenever phEnabled changes
    // This ensures we re-evaluate when PostHog updates
    
  }, [flagName, phEnabled]);

  // Only return true if the user is identified and the flag is enabled
  return isIdentified && phEnabled;
}

export default useFeatureFlag;
