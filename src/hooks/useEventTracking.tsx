import { useEffect, useCallback } from 'react';
import { usePostHog } from 'posthog-js/react';
import { useLocation } from 'react-router-dom';

export const useEventTracking = () => {
  const posthog = usePostHog();
  const location = useLocation();

  // Track page views
  useEffect(() => {
    if (posthog) {
      posthog.capture('$pageview', {
        $current_url: window.location.href,
        path: location.pathname
      });
    }
  }, [location.pathname, posthog]);

  // Track scroll depth
  useEffect(() => {
    if (!posthog) return;

    let maxScroll = 0;
    const trackScroll = () => {
      const scrollPercent = Math.round(
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      );
      
      // Track significant scroll milestones
      if (scrollPercent > maxScroll && scrollPercent % 25 === 0) {
        maxScroll = scrollPercent;
        posthog.capture('scroll_depth', {
          scroll_percent: scrollPercent,
          page: location.pathname
        });
      }
    };

    window.addEventListener('scroll', trackScroll, { passive: true });
    return () => window.removeEventListener('scroll', trackScroll);
  }, [posthog, location.pathname]);

  // Enhanced event tracking functions
  const trackContentInteraction = useCallback((contentId: string, action: string, metadata?: any) => {
    if (posthog) {
      posthog.capture('content_interaction', {
        content_id: contentId,
        action,
        ...metadata,
        timestamp: new Date().toISOString()
      });
    }
  }, [posthog]);

  const trackSearchBehavior = useCallback((query: string, resultsCount: number) => {
    if (posthog) {
      posthog.capture('search_performed', {
        query,
        results_count: resultsCount,
        query_length: query.length,
        timestamp: new Date().toISOString()
      });
    }
  }, [posthog]);

  const trackVideoEngagement = useCallback((videoId: string, duration: number, watchTime: number) => {
    if (posthog) {
      const watchPercentage = (watchTime / duration) * 100;
      posthog.capture('video_engagement', {
        video_id: videoId,
        watch_time: watchTime,
        duration,
        watch_percentage: Math.round(watchPercentage),
        completed: watchPercentage >= 95,
        timestamp: new Date().toISOString()
      });
    }
  }, [posthog]);

  const trackUserJourney = useCallback((step: string, metadata?: any) => {
    if (posthog) {
      posthog.capture('user_journey_step', {
        step,
        ...metadata,
        timestamp: new Date().toISOString()
      });
    }
  }, [posthog]);

  return {
    trackContentInteraction,
    trackSearchBehavior,
    trackVideoEngagement,
    trackUserJourney
  };
};