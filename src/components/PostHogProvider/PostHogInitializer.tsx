
import { useEffect } from 'react';
import { PostHogProvider as OriginalPostHogProvider } from 'posthog-js/react';

interface PostHogInitializerProps {
  apiKey: string;
  apiHost: string;
  children: React.ReactNode;
  onLoaded: () => void;
}

export const PostHogInitializer = ({ 
  apiKey, 
  apiHost, 
  children, 
  onLoaded 
}: PostHogInitializerProps) => {
  // Log configuration on mount for debugging
  useEffect(() => {
    console.log(`Initializing PostHog with host: ${apiHost}`);
  }, [apiHost]);

  return (
    <OriginalPostHogProvider 
      apiKey={apiKey}
      options={{
        api_host: apiHost,
        persistence: 'localStorage' as const,
        capture_pageview: false, // Disable automatic pageview capture - we'll handle it manually
        autocapture: true,
        disable_web_experiments: false, // Enable web experiments for A/B testing
        loaded: (posthogInstance: any) => {
          console.log('PostHog loaded successfully');
          onLoaded();
        }
      }}
    >
      {children}
    </OriginalPostHogProvider>
  );
};

export default PostHogInitializer;
