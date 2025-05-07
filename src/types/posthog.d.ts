
// Type definitions for the PostHog global window object

interface PostHogFeatureFlags {
  // Making currentFlags optional to match the actual implementation
  currentFlags?: Record<string, boolean | string>;
  override: (flags: Record<string, boolean | string>) => void;
  getFlags?: () => Record<string, boolean | string> | string[];
  _refresh?: () => void;
  _startPolling?: (timeoutMs: number) => void;
}

interface PostHogPeople {
  set: (properties: Record<string, any>) => void;
  set_once: (properties: Record<string, any>) => void;
  toString: () => string;
}

export interface PostHog {
  capture: (event: string, properties?: Record<string, any>) => void;
  identify: (distinctId: string, properties?: Record<string, any>) => void;
  alias: (alias: string, distinctId?: string) => void;
  reset: () => void;
  reloadFeatureFlags: () => Promise<void> | void;
  isFeatureEnabled: (flag: string) => boolean;
  getFeatureFlag: (flag: string) => boolean | string | undefined;
  featureFlags: PostHogFeatureFlags;
  onFeatureFlags: (callback: () => void, timeout?: boolean) => void;
  group: (groupType: string, groupKey: string, groupProperties?: Record<string, any>) => void;
  people: PostHogPeople;
  get_distinct_id: () => string;
  // Properties for initialization
  __SV?: number;
  _i?: any[];
  init?: Function;
  toString?: () => string;
}

declare global {
  interface Window {
    posthog?: PostHog | any[];
  }
}
