import { usePostHog, useFeatureFlagEnabled, useActiveFeatureFlags } from 'posthog-js/react';
import { useAuth } from '../hooks/useAuth';

/**
 * Debug component to help troubleshoot PostHog feature flag issues
 * Only shows when the debug_on feature flag is enabled
 */
export const PostHogDebug = ({ enabled = false }: { enabled?: boolean }) => {
  const posthog = usePostHog();
  const { userEmail, isLoggedIn } = useAuth();
  const isAdminEnabled = useFeatureFlagEnabled('is_admin');
  const activeFlags = useActiveFeatureFlags();

  // Only show when explicitly enabled via feature flag
  if (!enabled) {
    return null;
  }

  const distinctId = posthog?.get_distinct_id?.();
  const flagsLoaded = activeFlags !== undefined;

  // Format active flags for better readability
  const formatActiveFlags = (flags: any) => {
    if (!flags) return 'None';
    return Object.keys(flags).map(key => `${key}: ${flags[key]}`).join('\n');
  };

  // Manual refresh function for testing real-time updates
  const handleRefreshFlags = () => {
    if (posthog && typeof posthog.reloadFeatureFlags === 'function') {
      console.log('PostHog: Manually reloading feature flags...');
      posthog.reloadFeatureFlags();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold">PostHog Debug</h3>
        <button 
          onClick={handleRefreshFlags}
          className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs"
          title="Manually refresh feature flags"
        >
          🔄 Refresh
        </button>
      </div>
      <div className="space-y-1">
        <div>PostHog Loaded: {posthog ? '✅' : '❌'}</div>
        <div>User Email: {userEmail || 'None'}</div>
        <div>Logged In: {isLoggedIn ? '✅' : '❌'}</div>
        <div>Distinct ID: {distinctId || 'None'}</div>
        <div>Flags Loaded: {flagsLoaded ? '✅' : '❌'}</div>
        <div>is_admin Flag: {isAdminEnabled ? '✅' : '❌'}</div>
        <div className="border-t border-gray-600 pt-2 mt-2">
          <div className="font-semibold">Active Flags:</div>
          <pre className="whitespace-pre-wrap text-xs mt-1 bg-gray-800 p-2 rounded">
            {formatActiveFlags(activeFlags)}
          </pre>
        </div>
      </div>
      <div className="text-xs text-gray-400 mt-2 border-t border-gray-600 pt-2">
        💡 PostHog polls for flag updates every ~30s. Use refresh button for immediate check.
      </div>
    </div>
  );
};