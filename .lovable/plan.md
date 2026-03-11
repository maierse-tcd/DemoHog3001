

## Problem

Web analytics events don't show up in PostHog's Web Analytics product. Pageview and pageleave events fire as raw events, but the Web Analytics dashboard stays empty.

The issue is twofold:

1. **Missing `capture_pageleave: true`** in the SDK config — even though pageleave events seem to fire, explicitly enabling this ensures the SDK handles pageleave timing correctly for web analytics session calculations.

2. **The pageview tracking uses a wrapper function (`trackEvent`) instead of calling `posthog.capture('$pageview')` directly.** The `trackEvent` wrapper imports `posthog` from `posthog-js` at module level, which may not be the same initialized instance that the `PostHogProvider` manages. This can cause events to go to an uninitialized/different PostHog instance.

## Plan

### 1. Update PostHog config (`src/components/PostHogProvider/PostHogInitializer.tsx`)

Add `capture_pageleave: true` to the options object so the SDK auto-handles pageleave events with correct timing for web analytics.

### 2. Fix pageview tracking (`src/hooks/usePageviewTracking.tsx`)

Instead of using the `trackEvent` wrapper (which imports a potentially different `posthog` instance), use the `usePostHog()` hook from `posthog-js/react` to get the actual initialized instance and call `.capture('$pageview')` directly on it. This guarantees we're using the same instance the provider initialized.

```tsx
import { usePostHog } from 'posthog-js/react';

export const usePageviewTracking = () => {
  const location = useLocation();
  const posthog = usePostHog();

  useEffect(() => {
    if (posthog) {
      posthog.capture('$pageview');
    }
  }, [location.pathname, location.search, location.hash, posthog]);
};
```

No custom properties needed — PostHog's SDK automatically populates `$current_url`, `$pathname`, `$referrer`, etc. for `$pageview` events. Sending custom ones may actually interfere with the web analytics product expecting its own auto-set properties.

