
# PostHog Integration Guide for HogFlix

This document provides a technical overview of how PostHog is integrated into the HogFlix demo environment, including feature flags, group analytics, and event tracking.

## Table of Contents

1. [PostHog Provider Setup](#posthog-provider-setup)
2. [Feature Flags Implementation](#feature-flags-implementation)
3. [Group Analytics](#group-analytics)
4. [Event Tracking](#event-tracking)
5. [User Identification](#user-identification)
6. [Subscription Plan Analytics](#subscription-plan-analytics)
7. [Debugging Tools](#debugging-tools)

## PostHog Provider Setup

PostHog is initialized in the application through the custom `PostHogProvider` component, located at:

```
src/components/PostHogProvider.tsx
```

Key aspects of the implementation:

- The provider wraps the entire application, ensuring PostHog is available throughout
- It handles automatic user identification when auth state changes
- It includes group identification logic
- It provides methods for updating user properties and groups

Configuration:
- PostHog API key: `phc_O1OL4R6b4MUWUsu8iYorqWfQoGSorFLHLOustqbVB0U`
- Host URL: `https://ph.hogflix.dev`

## Feature Flags Implementation

### Using Feature Flags

Feature flags can be used in two ways:

1. **React Hook (Recommended)**:

```tsx
import { useFeatureFlagEnabled } from 'posthog-js/react';

const MyComponent = () => {
  const myFeatureEnabled = useFeatureFlagEnabled('my_feature');
  
  if (myFeatureEnabled) {
    return <NewFeature />;
  }
  
  return <OldFeature />;
};
```

2. **Utility Function**:

```tsx
import { safeIsFeatureEnabled } from '../utils/posthogUtils';

if (safeIsFeatureEnabled('my_feature')) {
  // Do something when feature is enabled
}
```

### Current Feature Flag Usage

Feature flags are used in several places:

- `src/components/AdminNavItems.tsx` - Controls admin navigation visibility
- `src/pages/Index.tsx` - Shows different features based on admin status
- Several other components conditionally render based on feature flags

### Creating New Feature Flags

1. Create the feature flag in the PostHog dashboard
2. Use the hooks or utility functions mentioned above to check for the flag
3. Implement conditional rendering or logic based on the flag state

## Group Analytics

Group analytics are implemented throughout the application for categorizing users and events.

### Group Types

The primary group type used is `user_type` with possible values:
- `Kid` - For child users
- `Adult` - For adult users

### Implementation Locations

1. **User Type Groups**: 
   - Set in `PostHogProvider.tsx` during authentication
   - Updates when profile type changes

2. **Group Identification**:
   ```tsx
   import { safeGroupIdentify } from '../utils/posthogUtils';
   
   // Identify a user as part of a group
   safeGroupIdentify('user_type', 'Adult', {
     name: 'Adult', // Name property is required for UI visibility
     joined_date: new Date().toISOString()
   });
   ```

3. **Group Events**:
   ```tsx
   import { safeCaptureWithGroup } from '../utils/posthogUtils';
   
   // Capture an event associated with a group
   safeCaptureWithGroup('content_viewed', 'user_type', 'Adult', {
     content_id: '123',
     content_type: 'movie'
   });
   ```

## Event Tracking

Events are tracked throughout the application using utility functions from:

```
src/utils/posthogUtils.ts
```

### Key Event Tracking Utilities

- `safeCapture` - For general event tracking
- `safeCaptureWithGroup` - For events associated with groups
- Custom hooks in `src/hooks/usePostHogFeatures.tsx` and `src/hooks/auth/usePostHogIdentity.tsx`

### Event Tracking Implementation

Events are tracked in many locations, including:

- User authentication (login/logout)
- Content views and interactions
- Plan selection and subscription changes
- Navigation and page views
- Feature usage

## User Identification

Users are identified in PostHog primarily through:

1. **Authentication Events**:
   - In `PostHogProvider.tsx`, auth state changes automatically identify users
   - Email is used as the primary identifier for consistent cross-platform identification

2. **Custom Properties**:
   - User properties are set during identification
   - Additional properties are updated as users interact with the app

Example:
```tsx
posthog.identify(email, {
  email: email,
  name: metadata?.name || email?.split('@')[0],
  supabase_id: userId,
  $set_once: { first_seen: new Date().toISOString() }
});
```

## Subscription Plan Analytics

Plan selection and subscription analytics are tracked with detailed properties:

### Plan Selection Events

When users select a subscription plan in `src/pages/Plans.tsx`:

```tsx
safeCapture('plan_selected', {
  plan_id: planId,
  plan_type: selectedPlan.name,
  plan_cost: extractPriceValue(selectedPlan.price),
  plan_features_count: selectedPlan.features.length,
  is_recommended: selectedPlan.recommended || false,
  selection_timestamp: new Date().toISOString(),
  last_plan_change: new Date().toISOString()
});
```

### Plan Cost Extraction

The `extractPriceValue` function in `src/pages/Plans.tsx` extracts numeric price values from price strings for analytics:

```tsx
const extractPriceValue = (priceString: string): number => {
  const numericValue = priceString.replace(/[^\d.]/g, '');
  return parseFloat(numericValue) || 0;
};
```

## Debugging Tools

Several debugging tools are available:

1. **Browser Console Logs**:
   - PostHog operations are logged to the console
   - User identifications, group changes, and feature flag states are logged

2. **Window Object**:
   - `window.__posthogMethods` exposes methods for debugging
   - Accessible in the browser console for manual testing

3. **Local Storage**:
   - Group identification state is cached in localStorage
   - Available under the key `posthog_last_groups`

## Adding New Analytics

To add new analytics:

1. **Simple Event**:
   ```tsx
   import { safeCapture } from '../utils/posthogUtils';
   
   safeCapture('event_name', {
     property1: 'value1',
     property2: 'value2'
   });
   ```

2. **Group Event**:
   ```tsx
   import { safeCaptureWithGroup } from '../utils/posthogUtils';
   
   safeCaptureWithGroup('event_name', 'group_type', 'group_value', {
     property1: 'value1',
     property2: 'value2'
   });
   ```

3. **Custom User Properties**:
   ```tsx
   import { safeIdentify } from '../utils/posthogUtils';
   
   safeIdentify(userId, {
     new_property: 'value'
   });
   ```

## Common Issues & Solutions

1. **Groups not visible in PostHog UI**
   - Ensure the `name` property is set in group properties
   - Verify that `$groupidentify` events are being sent

2. **Feature flags not working**
   - Verify user is properly identified
   - Check for console errors related to feature flag loading
   - Use `safeReloadFeatureFlags()` to manually reload flags

3. **Events not showing up**
   - Check network requests in DevTools
   - Verify PostHog API key and host URL
   - Ensure events are captured using the safe utility functions

---

For further questions about this implementation, please contact the HogFlix development team.
