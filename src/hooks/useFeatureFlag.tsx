
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
    const distinctId = safeGetDistinctId();
    setIsIdentified(!!distinctId && typeof distinctId === 'string');
    
    // For debugging purposes
    if (flagName === 'is_admin') {
      console.log(`Feature flag ${flagName}: ${enabled}, user identified: ${!!distinctId}`);
    }
  }, [flagName, enabled]);

  // Only return true if properly identified and the flag is enabled
  return isIdentified && enabled;
}

export default useFeatureFlag;
