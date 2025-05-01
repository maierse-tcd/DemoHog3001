
// Type definitions for the PostHog global window object

interface PostHogFeatureFlags {
  currentFlags: Record<string, boolean | string>;
  override: (flags: Record<string, boolean | string>) => void;
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
  // Adding additional properties for initialization script
  __SV?: number;
  _i?: any[];
  init?: Function;
  people?: any;
}

declare global {
  interface Window {
    posthog?: PostHog | any[];
  }
}

export {};
