
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackEvent } from '../utils/posthog/simple';

/**
 * Hook that automatically tracks pageviews on route changes
 */
export const usePageviewTracking = () => {
  const location = useLocation();

  useEffect(() => {
    // Get page title
    const pageTitle = document.title || 'Hogflix';
    
    // Create pageview properties
    const pageviewProps = {
      $current_url: window.location.href,
      $pathname: location.pathname,
      $search: location.search,
      $hash: location.hash,
      page_title: pageTitle,
      referrer: document.referrer,
      timestamp: new Date().toISOString()
    };

    // Track the pageview
    trackEvent('$pageview', pageviewProps);
    
    console.log(`PostHog: Pageview tracked for route: ${location.pathname}`);
  }, [location.pathname, location.search, location.hash]);
};
