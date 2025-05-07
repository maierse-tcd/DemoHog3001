
# PostHog Integration Guide for HogFlix (Netflix Clone)

This document provides a comprehensive overview of how PostHog is integrated into the HogFlix application, with examples of feature flags, experiments, and best practices for implementation.

## Table of Contents

1. [Overview](#overview)
2. [PostHog Provider Setup](#posthog-provider-setup)
3. [Feature Flags](#feature-flags)
    - [Current Feature Flags](#current-feature-flags)
    - [Implementing Feature Flags](#implementing-feature-flags)
4. [A/B Testing (Experiments)](#ab-testing-experiments)
    - [Current Experiments](#current-experiments)
    - [Implementing Experiments](#implementing-experiments)
5. [Event Tracking](#event-tracking)
    - [Basic Events](#basic-events)
    - [Group Analytics](#group-analytics)
6. [User Identification](#user-identification)
7. [Best Practices](#best-practices)
8. [Debugging Tools](#debugging-tools)

## Overview

HogFlix uses PostHog for:
- Feature flags to control feature visibility
- A/B testing to experiment with different UI variants
- User analytics to track behavior
- Group analytics for subscription and user type segmentation

This implementation allows for gradual feature rollout, user segmentation, and data-driven development decisions.

## PostHog Provider Setup

PostHog is initialized through the `PostHogProvider` component that wraps the entire application:

```tsx
// src/components/PostHogProvider.tsx (simplified)
import { PostHogProvider as OriginalPostHogProvider } from 'posthog-js/react';
import posthog from 'posthog-js';

// PostHog configuration
const POSTHOG_KEY = 'phc_O1OL4R6b4MUWUsu8iYorqWfQoGSorFLHLOustqbVB0U';
const POSTHOG_HOST = 'https://ph.hogflix.dev';

export const PostHogProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <PostHogContextProvider value={contextValue}>
      <OriginalPostHogProvider 
        apiKey={POSTHOG_KEY}
        options={{
          api_host: POSTHOG_HOST,
          persistence: 'localStorage',
          capture_pageview: true,
          autocapture: true,
          loaded: (posthogInstance: any) => {
            console.log('PostHog loaded successfully');
            // Additional setup code...
          }
        }}
      >
        {children}
      </OriginalPostHogProvider>
    </PostHogContextProvider>
  );
};
```

## Feature Flags

Feature flags enable conditional rendering of components or functionality based on configuration in the PostHog dashboard.

### Current Feature Flags

The application currently uses these feature flags:

1. **`is_admin`** - Controls admin-only features and UI elements
2. **`hide_plan`** - Controls visibility of Plans menu item for logged-in users
3. **`single_plan_selection`** - Controls whether users see only their selected plan on the signup page

### Implementing Feature Flags

There are two recommended ways to use feature flags:

#### 1. Using the React Hook (Preferred Method)

```tsx
import { useFeatureFlagEnabled } from 'posthog-js/react';

const AdminFeature = () => {
  // Check if the feature flag is enabled
  const isAdmin = useFeatureFlagEnabled('is_admin');
  
  if (!isAdmin) {
    return null; // Don't render anything if user doesn't have admin flag
  }
  
  return <AdminComponent />;
};
```

#### 2. Using Utility Function

```tsx
import { safeIsFeatureEnabled } from '../utils/posthog';

if (safeIsFeatureEnabled('my_feature_flag')) {
  // Do something when feature is enabled
}
```

#### Real Example: Hiding Plans Menu Item

Here's how we implemented the `hide_plan` feature flag in our navigation:

```tsx
// src/components/Navbar.tsx
import { useFeatureFlag } from '../hooks/useFeatureFlag';
import { useAuth } from '../hooks/useAuth';

export const Navbar = () => {
  const { isLoggedIn } = useAuth();
  const hidePlan = useFeatureFlag('hide_plan');
  
  // Determine if we should show the Plans menu item
  const showPlansMenuItem = !(isLoggedIn && hidePlan);
  
  return (
    <nav>
      {/* Navigation links */}
      <div className="hidden md:flex space-x-6 ml-10">
        {/* Other navigation links */}
        
        {/* Only show Plans when showPlansMenuItem is true */}
        {showPlansMenuItem && (
          <Link to="/plans" className="text-sm font-medium">
            <CreditCard size={16} />
            Plans
          </Link>
        )}
      </div>
    </nav>
  );
};
```

#### Real Example: Single Plan Selection

Here's how we implemented the `single_plan_selection` feature flag:

```tsx
// src/components/auth/PlanSelector.tsx
import { useFeatureFlag } from '../../hooks/useFeatureFlag';

export const PlanSelector = ({ plans, selectedPlanId, onPlanSelect }) => {
  // Feature flag to control single plan selection mode
  const singlePlanSelectionEnabled = useFeatureFlag('single_plan_selection');
  
  // Get the selected plan details if we have one
  const selectedPlan = selectedPlanId 
    ? plans.find(plan => plan.id === selectedPlanId)
    : null;

  // Filter plans if single plan selection is enabled and we have a selected plan
  const displayPlans = (singlePlanSelectionEnabled && selectedPlan) 
    ? [selectedPlan]
    : plans;
    
  return (
    <div>
      {singlePlanSelectionEnabled && selectedPlan ? (
        <>
          <h3>Your Selected Plan</h3>
          <p>You've selected the {selectedPlan.name} plan.</p>
        </>
      ) : (
        <>
          <h3>Choose your plan</h3>
          <p>Select the subscription plan that works for you!</p>
        </>
      )}
      
      <div className="space-y-4">
        {displayPlans.map(plan => (
          <SubscriptionPlan
            key={plan.id}
            plan={plan}
            selectedPlanId={selectedPlanId}
            onSelect={handlePlanSelect}
          />
        ))}
      </div>
    </div>
  );
};
```

## A/B Testing (Experiments)

PostHog experiments allow testing different variants of components to measure their effectiveness.

### Current Experiments

The application contains a subscription CTA test:

1. **`subscription_cta_test`** - Tests different call-to-action designs for subscription buttons

### Implementing Experiments

To implement an A/B test:

1. Create the experiment in PostHog dashboard
2. Use `useFeatureFlagVariantKey` to get the current variant
3. Track impressions and interactions for each variant

```tsx
import { useEffect } from 'react';
import { useFeatureFlagVariantKey } from 'posthog-js/react';
import { captureTestEvent } from '../utils/posthog';

const ExperimentComponent = () => {
  // Get the current experiment variant
  const variant = useFeatureFlagVariantKey('button_color_test');
  
  // Track when component is viewed
  useEffect(() => {
    if (variant) {
      captureTestEvent(
        'button_impression',
        'button_color_test',
        variant,
        { 
          page: 'signup',
          position: 'header'
        }
      );
    }
  }, [variant]);
  
  // Render different variants based on experiment
  if (variant === 'red_button') {
    return <Button className="bg-red-500">Sign Up Now</Button>;
  } else if (variant === 'blue_button') {
    return <Button className="bg-blue-500">Sign Up Now</Button>;
  }
  
  // Control variant (default)
  return <Button className="bg-gray-500">Sign Up</Button>;
};
```

#### Real Example: Subscription CTA Test

Here's how we implement an A/B test for subscription CTAs:

```tsx
// Simplified from src/components/plans/SubscriptionCTA.tsx
import { useFeatureFlagVariantKey } from 'posthog-js/react';
import { captureTestEvent } from '../../utils/posthog';

export const SubscriptionCTA = ({ planName, planId }) => {
  // Get experiment variant
  const variant = useFeatureFlagVariantKey('subscription_cta_test');
  
  // Track impression
  useEffect(() => {
    if (variant) {
      captureTestEvent(
        'subscription_cta_impression',
        'subscription_cta_test',
        variant,
        {
          plan_id: planId,
          plan_name: planName
        }
      );
    }
  }, [variant, planId, planName]);
  
  // Handle click with tracking
  const handleClick = () => {
    captureTestEvent(
      'subscription_cta_click',
      'subscription_cta_test',
      variant,
      {
        plan_id: planId,
        plan_name: planName
      }
    );
    
    // Navigate or perform action
    navigate('/signup');
  };
  
  // Render variant-specific button
  if (variant === 'action') {
    return (
      <Button 
        onClick={handleClick}
        className="bg-gradient-to-r from-netflix-red to-netflix-red-dark"
      >
        Start Watching Now
      </Button>
    );
  } else if (variant === 'urgency') {
    return (
      <Button onClick={handleClick} className="bg-netflix-red">
        Limited Time Offer - Subscribe Now
      </Button>
    );
  }
  
  // Control variant
  return (
    <Button onClick={handleClick} className="bg-netflix-red">
      Choose Plan
    </Button>
  );
};
```

## Event Tracking

PostHog captures events for user behavior analysis.

### Basic Events

For tracking basic events:

```tsx
import { safeCapture } from '../utils/posthog';

// Track a simple event
safeCapture('button_clicked');

// Track an event with properties
safeCapture('content_viewed', {
  content_id: '123',
  content_type: 'movie',
  duration_seconds: 120
});
```

### Group Analytics

Groups allow segmenting users by characteristics:

```tsx
import { safeGroupIdentify, captureEventWithGroup } from '../utils/posthog';

// Identify a user as part of a group
safeGroupIdentify('subscription', 'premium', {
  name: 'premium', // Required for UI visibility
  plan_id: 'premium-monthly',
  plan_cost: 14.99
});

// Capture an event associated with a group
captureEventWithGroup(
  'premium_feature_used', 
  'subscription', 
  'premium', 
  {
    feature_name: '4k_streaming',
    duration_minutes: 45
  }
);
```

## User Identification

Users are identified in PostHog when they log in:

```tsx
import { safeIdentify } from '../utils/posthog';

// On user login
const handleLogin = (userData) => {
  // Identify the user in PostHog
  safeIdentify(userData.email, {
    name: userData.name,
    account_type: userData.accountType,
    signed_up_at: userData.createdAt
  });
  
  // Continue with login flow...
};
```

## Best Practices

1. **Consistent Feature Flag Naming**
   - Use descriptive, lowercase names with underscores
   - Example: `enable_new_dashboard`, `hide_beta_features`

2. **Always Provide Fallbacks**
   - Never assume a feature flag is available
   - Always have a default behavior

3. **Track Meaningful Events**
   - Track events that correspond to important user actions
   - Include useful properties with each event

4. **Clean Up Outdated Flags**
   - Remove code related to feature flags that are no longer needed
   - This prevents technical debt accumulation

5. **Test All Combinations**
   - Ensure your application works with all possible combinations of enabled/disabled features

## Debugging Tools

For debugging PostHog integration:

```tsx
import { useActiveFeatureFlags } from 'posthog-js/react';
import { safeReloadFeatureFlags } from '../utils/posthog';

// Component to display active feature flags (for development only)
const FeatureFlagDebugger = () => {
  const activeFlags = useActiveFeatureFlags();
  
  return (
    <div className="debug-panel">
      <h3>Active Feature Flags:</h3>
      <pre>{JSON.stringify(activeFlags, null, 2)}</pre>
      <button onClick={() => safeReloadFeatureFlags()}>
        Reload Flags
      </button>
    </div>
  );
};
```

---

This integration guide should help your team understand how PostHog is implemented in the application and how to extend it with new feature flags and experiments.

