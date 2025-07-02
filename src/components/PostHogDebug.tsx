import { usePostHog, useFeatureFlagEnabled, useActiveFeatureFlags } from 'posthog-js/react';
import { useAuth } from '../hooks/useAuth';

/**
 * Debug component to help troubleshoot PostHog feature flag issues
 * Only shows in development or when explicitly enabled
 */
export const PostHogDebug = ({ enabled = false }: { enabled?: boolean }) => {
  const posthog = usePostHog();
  const { userEmail, isLoggedIn } = useAuth();
  const isAdminEnabled = useFeatureFlagEnabled('is_admin');
  const activeFlags = useActiveFeatureFlags();

  // Only show in development or when explicitly enabled
  if (!enabled && process.env.NODE_ENV === 'production') {
    return null;
  }

  const distinctId = posthog?.get_distinct_id?.();
  const flagsLoaded = activeFlags !== undefined;

  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <h3 className="font-bold mb-2">PostHog Debug</h3>
      <div className="space-y-1">
        <div>PostHog Loaded: {posthog ? '✅' : '❌'}</div>
        <div>User Email: {userEmail || 'None'}</div>
        <div>Logged In: {isLoggedIn ? '✅' : '❌'}</div>
        <div>Distinct ID: {distinctId || 'None'}</div>
        <div>Flags Loaded: {flagsLoaded ? '✅' : '❌'}</div>
        <div>is_admin Flag: {isAdminEnabled ? '✅' : '❌'}</div>
        <div>Active Flags: {activeFlags ? JSON.stringify(activeFlags) : 'None'}</div>
      </div>
    </div>
  );
};