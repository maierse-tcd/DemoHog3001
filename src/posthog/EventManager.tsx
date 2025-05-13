
/**
 * PostHog Event Manager
 * Provides utilities for tracking events in PostHog
 */

import { useCallback } from 'react';
import { safeCapture } from '../utils/posthog';
import { slugifyGroupKey } from '../utils/posthog/helpers';
import { captureEventWithGroup } from '../utils/posthog/events';

export function usePostHogEventManager() {
  // Standard event capture method
  const captureEvent = useCallback((eventName: string, properties?: Record<string, any>) => {
    try {
      console.log(`PostHog: Capturing event: ${eventName}`, properties ? 'with properties' : '');
      safeCapture(eventName, properties);
    } catch (err) {
      console.error(`Error capturing event ${eventName}:`, err);
    }
  }, []);

  // Capture event with group context
  const captureGroupEvent = useCallback(
    (eventName: string, groupType: string, groupKey: string, properties?: Record<string, any>) => {
      try {
        // Process the group key for certain group types
        const processedKey = groupType === 'subscription' 
          ? slugifyGroupKey(groupKey) 
          : groupKey;
          
        console.log(`PostHog: Capturing group event: ${eventName} for ${groupType}:${processedKey}`);
        
        captureEventWithGroup(eventName, groupType, processedKey, properties);
      } catch (err) {
        console.error(`Error capturing group event ${eventName}:`, err);
      }
    }, 
  []);

  return { captureEvent, captureGroupEvent };
}
