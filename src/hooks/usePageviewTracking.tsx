
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { usePostHog } from 'posthog-js/react';

/**
 * Hook that automatically tracks pageviews on route changes
 * Uses the PostHog instance from the provider to ensure correct initialization
 */
export const usePageviewTracking = () => {
  const location = useLocation();
  const posthog = usePostHog();

  useEffect(() => {
    if (posthog) {
      posthog.capture('$pageview');
    }
  }, [location.pathname, location.search, location.hash, posthog]);
};
