
// Type definitions for the PostHog global window object

interface PostHogFeatureFlags {
  currentFlags: Record<string, boolean | string>;
  override: (flags: Record<string, boolean | string>) => void;
}

interface PostHogPeople {
  set: (properties: Record<string, any>) => void;
  set_once: (properties: Record<string, any>) => void;
  toString: () => string;
}

interface PostHog {
  capture: (event: string, properties?: Record<string, any>) => void;
  identify: (distinctId: string, properties?: Record<string, any>) => void;
  reset: () => void;
  reloadFeatureFlags: () => Promise<void>;
  isFeatureEnabled: (flag: string) => boolean;
  getFeatureFlag: (flag: string) => boolean | string | undefined;
  featureFlags: PostHogFeatureFlags;
  onFeatureFlags: (callback: () => void, timeout?: boolean) => void;
  group: (groupType: string, groupKey: string, groupProperties?: Record<string, any>) => void;
  people: PostHogPeople;
  // Properties for initialization
  __SV?: number;
  _i?: any[];
  init?: Function;
  toString?: () => string;
}

// Type guard to check if an object is a fully initialized PostHog instance
export function isPostHogInstance(obj: any): obj is PostHog {
  return obj && 
         typeof obj === 'object' && 
         !Array.isArray(obj) &&
         typeof obj.capture === 'function';
}

declare global {
  interface Window {
    posthog?: PostHog | any[];
  }
}
