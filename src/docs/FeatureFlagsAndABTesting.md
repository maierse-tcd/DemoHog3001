
# HogFlix Feature Flags and A/B Testing Guide

This document provides comprehensive documentation on how feature flags and A/B tests are implemented in the HogFlix application, along with practical examples for implementing your own.

## Table of Contents

1. [Overview](#overview)
2. [Current Feature Flags](#current-feature-flags)
3. [A/B Tests](#ab-tests)
4. [Implementation Guidelines](#implementation-guidelines)
5. [Code Examples](#code-examples)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

## Overview

HogFlix uses PostHog for feature flag management and A/B testing. This allows for:
- Controlled rollout of new features
- User segmentation based on properties
- Experimentation with different variants of components
- Data-driven development decisions

## Current Feature Flags

### 1. `is_admin`

**Purpose**: Controls access to admin features and UI elements.

**Implementation locations**:
- `src/components/AdminNavItems.tsx` - Shows/hides admin navigation items
- `src/pages/Index.tsx` - Controls special admin-only features

**Example usage**:
```tsx
import { useFeatureFlagEnabled } from 'posthog-js/react';

const AdminFeature = () => {
  const isAdmin = useFeatureFlagEnabled('is_admin');
  
  if (!isAdmin) {
    return null;
  }
  
  return <AdminComponent />;
};
```

### 2. `access_password`

**Purpose**: Enables password protection for certain content.

**Implementation locations**:
- `src/pages/Index.tsx` - Checks if content should be password-protected

**Example usage**:
```tsx
const hasPasswordProtection = useFeatureFlagEnabled('access_password');

if (hasPasswordProtection) {
  return <PasswordProtection onCorrectPassword={() => setUnlocked(true)} />;
}
```

## A/B Tests

### 1. `subscription_cta_test`

**Purpose**: Tests different call-to-action designs for subscription buttons.

**Variants**:
- Control: Standard CTA button
- Action: Action-oriented language with color gradient
- Urgency: Timer-based urgency messaging

**Implementation**: `src/components/plans/SubscriptionCTA.tsx`

**How it works**:
The component uses `useFeatureFlagVariantKey` to determine which variant to display and tracks impressions and clicks for each variant.

```tsx
// Get the variant from PostHog feature flag
const variant = useFeatureFlagVariantKey('subscription_cta_test') as string | null;

// Track impressions
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
```

## Implementation Guidelines

### Setting Up Feature Flags

1. **Create the flag in PostHog**:
   - Navigate to PostHog dashboard
   - Go to Feature Flags section
   - Click "New Feature Flag"
   - Set key, description, and rollout percentage

2. **Access the flag in code**:
   
   Using React hooks (recommended):
   ```tsx
   import { useFeatureFlagEnabled } from 'posthog-js/react';
   
   function MyComponent() {
     const isFeatureEnabled = useFeatureFlagEnabled('my_feature_key');
     
     return isFeatureEnabled ? <NewFeature /> : <OldFeature />;
   }
   ```
   
   Using utility function:
   ```tsx
   import { safeIsFeatureEnabled } from '../utils/posthog';
   
   if (safeIsFeatureEnabled('my_feature_key')) {
     // Feature is enabled
   }
   ```

### Setting Up A/B Tests

1. **Create the test in PostHog**:
   - Navigate to PostHog dashboard
   - Go to A/B Testing (Experiments) section
   - Click "New Experiment"
   - Define variants and goals

2. **Implement in code**:
   ```tsx
   import { useFeatureFlagVariantKey } from 'posthog-js/react';
   import { captureTestEvent } from '../utils/posthog';
   
   function MyComponent() {
     // Get assigned variant
     const variant = useFeatureFlagVariantKey('my_test_key');
     
     // Track impression
     useEffect(() => {
       if (variant) {
         captureTestEvent(
           'component_viewed',
           'my_test_key',
           variant,
           { additionalProperty: 'value' }
         );
       }
     }, [variant]);
     
     // Render appropriate variant
     if (variant === 'variant_a') {
       return <VariantA />;
     } else if (variant === 'variant_b') {
       return <VariantB />;
     }
     
     // Default/control
     return <ControlVariant />;
   }
   ```

## Code Examples

### Complete Feature Flag Example

```tsx
import React, { useEffect } from 'react';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { safeCapture } from '../utils/posthog';

const FeatureFlaggedComponent = () => {
  const isEnabled = useFeatureFlagEnabled('new_feature');
  
  useEffect(() => {
    // Track when feature is viewed
    if (isEnabled) {
      safeCapture('new_feature_viewed', {
        timestamp: new Date().toISOString()
      });
    }
  }, [isEnabled]);
  
  if (!isEnabled) {
    return <LegacyComponent />;
  }
  
  return (
    <div>
      <h2>New Feature</h2>
      <p>This is the new feature that's being tested.</p>
      <button onClick={() => safeCapture('new_feature_button_clicked')}>
        Try It
      </button>
    </div>
  );
};
```

### Complete A/B Test Example

```tsx
import React, { useEffect, useState, useRef } from 'react';
import { useFeatureFlagVariantKey } from 'posthog-js/react';
import { captureTestEvent } from '../utils/posthog';

const ABTestComponent = ({ productId, productName }) => {
  const variant = useFeatureFlagVariantKey('pricing_display_test');
  const [hasInteracted, setHasInteracted] = useState(false);
  const firstViewedAt = useRef(new Date());
  
  // Track when component is viewed
  useEffect(() => {
    captureTestEvent(
      'pricing_display_viewed',
      'pricing_display_test',
      variant,
      {
        product_id: productId,
        product_name: productName,
        funnel_step: 'view'
      }
    );
  }, [variant, productId, productName]);
  
  // Handle user interaction
  const handleInteraction = () => {
    if (!hasInteracted) {
      const timeToDecide = (new Date().getTime() - firstViewedAt.current.getTime()) / 1000;
      
      captureTestEvent(
        'pricing_display_interaction',
        'pricing_display_test',
        variant,
        {
          product_id: productId,
          product_name: productName,
          funnel_step: 'interaction',
          time_to_decide: timeToDecide
        }
      );
      
      setHasInteracted(true);
    }
  };
  
  // Render variant A
  if (variant === 'discount_first') {
    return (
      <div onClick={handleInteraction}>
        <h3>SAVE 20%</h3>
        <p>Now only $79.99</p>
        <p className="text-sm line-through">Regular price: $99.99</p>
      </div>
    );
  }
  
  // Render variant B
  if (variant === 'value_first') {
    return (
      <div onClick={handleInteraction}>
        <h3>Premium Quality</h3>
        <p>$79.99 - Best Value!</p>
        <p className="text-sm">You save $20.00</p>
      </div>
    );
  }
  
  // Render control
  return (
    <div onClick={handleInteraction}>
      <h3>Standard Price</h3>
      <p>$79.99</p>
    </div>
  );
};
```

## Best Practices

1. **Always provide a default behavior**: Never assume a feature flag will be available.

2. **Use consistent naming conventions**: Use clear and consistent naming for feature flags and A/B tests.

3. **Track relevant metrics**: Always capture events to measure the impact of features and variants.

4. **Clean up outdated flags**: Remove code related to feature flags that are no longer needed.

5. **Avoid flag dependencies**: Try not to make feature flags dependent on other feature flags.

6. **Test all combinations**: Ensure your application works with all possible combinations of enabled/disabled features.

7. **Document all flags**: Keep documentation updated with the purpose and implementation of each flag.

## Troubleshooting

### Common Issues

1. **Flag not working as expected**:
   - Verify the flag is enabled in PostHog
   - Check if the user is in the right cohort
   - Look for console errors related to PostHog

2. **Events not being captured**:
   - Check network requests to ensure events are being sent
   - Verify PostHog API key and configuration
   - Use the safe capture methods which include error handling

3. **Feature flags not loading**:
   - Use `safeReloadFeatureFlags()` to manually reload flags
   - Check for errors in the console
   - Verify that the user is properly identified

### Debugging Tools

```tsx
// Force reload feature flags
import { safeReloadFeatureFlags } from '../utils/posthog';

// Manually trigger this when needed
await safeReloadFeatureFlags();

// Check current feature flag state in console
import { safeIsFeatureEnabled } from '../utils/posthog';
console.log('Flag state:', safeIsFeatureEnabled('my_flag'));

// Get all active feature flags
import { useActiveFeatureFlags } from 'posthog-js/react';

function DebugComponent() {
  const activeFlags = useActiveFeatureFlags();
  console.log('Active flags:', activeFlags);
  
  return null;
}
```
