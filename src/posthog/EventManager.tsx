
import { useCallback } from 'react';
import { safeCapture } from '../utils/posthog';
import { slugifyGroupKey } from '../utils/posthog/helpers';

export function usePostHogEventManager() {
  // Standard event capture method
  const captureEvent = useCallback((eventName: string, properties?: Record<string, any>) => {
    try {
      safeCapture(eventName, properties);
      console.log(`PostHog: Event captured: ${eventName}`, properties ? 'with properties' : '');
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
          
        // Include the group property in the event
        const eventProps = {
          ...properties,
          $groups: {
            [groupType]: processedKey
          }
        };
        
        safeCapture(eventName, eventProps);
        console.log(`PostHog: Group event captured: ${eventName} for ${groupType}:${processedKey}`);
      } catch (err) {
        console.error(`Error capturing group event ${eventName}:`, err);
      }
    }, 
  []);

  return { captureEvent, captureGroupEvent };
}
