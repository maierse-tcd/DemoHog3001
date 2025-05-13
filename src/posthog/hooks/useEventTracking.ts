
/**
 * Hook for tracking events in PostHog
 */

import { useCallback } from 'react';
import { safeCapture, captureEventWithGroup } from '../../utils/posthog';
import { slugifyGroupKey } from '../../utils/posthog/helpers';
import { usePostHogContext } from '../../contexts/PostHogContext';

export function useEventTracking() {
  const { captureEvent, captureGroupEvent } = usePostHogContext();
  
  /**
   * Track an event with properties
   */
  const trackEvent = useCallback((eventName: string, properties?: Record<string, any>) => {
    captureEvent(eventName, properties);
  }, [captureEvent]);
  
  /**
   * Track an event associated with a group
   */
  const trackGroupEvent = useCallback((
    eventName: string, 
    groupType: string, 
    groupKey: string, 
    properties?: Record<string, any>
  ) => {
    // Process the group key for certain group types
    const processedKey = groupType === 'subscription' 
      ? slugifyGroupKey(groupKey) 
      : groupKey;
      
    captureGroupEvent(eventName, groupType, processedKey, properties);
  }, [captureGroupEvent]);
  
  return { trackEvent, trackGroupEvent };
}
