# PostHog Subscription Status Tracking Implementation

## Overview
This implementation enables PostHog cohort analysis and user filtering based on subscription status. Users can now be grouped into cohorts like "Never Subscribed", "Previously Subscribed", and "Currently Subscribed" for targeted analysis.

## Key Features Implemented

### 1. User Properties for Cohort Analysis
- `subscription_status`: 'none' | 'active' | 'cancelled' | 'expired'
- `is_subscribed`: boolean for easy filtering
- `subscription_updated_at`: timestamp for tracking changes

### 2. Subscription Lifecycle Event Tracking
- `subscription_activated`: When user starts a subscription
- `subscription_plan_changed`: When user changes plans
- `subscription_cancelled`: When user cancels subscription
- `subscription_status_synced`: For debugging database sync

### 3. Real-time Status Synchronization
- Database changes automatically sync to PostHog
- Real-time listeners update subscription status immediately
- Ensures PostHog data stays in sync with application state

## Implementation Details

### Core Files Created/Modified

#### New Utilities (`src/utils/posthog/subscriptionStatus.ts`)
- `setSubscriptionStatus()`: Updates user properties for cohort analysis
- `trackSubscriptionEvent()`: Tracks subscription lifecycle events
- `syncSubscriptionStatusToPostHog()`: Syncs database status to PostHog
- `identifyUserWithSubscription()`: Enhanced user identification with subscription data

#### Updated Components
1. **Sign Up Flow** (`src/components/auth/signup/useSignUp.tsx`)
   - Sets initial subscription status during registration
   - Tracks subscription activation if user selects a plan

2. **Subscription Settings** (`src/components/profile/hooks/useSubscriptionSettings.tsx`)
   - Updates status when users change or cancel plans
   - Tracks plan change and cancellation events

3. **Auth Integration** (`src/components/PostHogProvider/AuthIntegration.tsx`)
   - Syncs subscription status during user identification
   - Fetches status from database and updates PostHog properties

4. **Real-time Banner** (`src/components/PersistentSubBanner.tsx`)
   - Syncs status changes in real-time when database updates
   - Ensures immediate PostHog updates when subscription changes

### User Property Schema
```javascript
{
  subscription_status: 'active' | 'cancelled' | 'none' | 'expired',
  is_subscribed: boolean,
  subscription_updated_at: string (ISO timestamp),
  planId?: string,
  planName?: string,
  price?: string,
  cancelledAt?: string,
  expiredAt?: string,
  reason?: string
}
```

## PostHog Cohort Setup

### Recommended Cohorts
1. **Never Subscribed**: `subscription_status = 'none'`
2. **Currently Subscribed**: `subscription_status = 'active'`
3. **Previously Subscribed**: `subscription_status = 'cancelled'`
4. **Expired Subscriptions**: `subscription_status = 'expired'`
5. **All Subscribers** (current + past): `is_subscribed = true OR subscription_status = 'cancelled'`

### Analysis Capabilities
- Conversion funnels from signup to subscription
- Churn analysis for cancelled users
- Re-activation campaigns for previous subscribers
- A/B testing subscription flows by cohort
- Retention analysis by subscription status

## Benefits
1. **Cohort Analysis**: Easy filtering and grouping of users by subscription status
2. **Real-time Sync**: PostHog data stays current with application state
3. **Lifecycle Tracking**: Complete visibility into subscription journey
4. **Marketing Insights**: Target campaigns based on subscription behavior
5. **Product Analytics**: Understand user behavior across subscription states

## Next Steps
1. Set up the recommended cohorts in PostHog dashboard
2. Create subscription conversion funnels
3. Build dashboards for subscription analytics
4. Set up alerts for subscription events
5. Implement A/B testing for subscription flows