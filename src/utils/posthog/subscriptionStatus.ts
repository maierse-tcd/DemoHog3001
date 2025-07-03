/**
 * PostHog Subscription Status Management
 * Tracks subscription status as user properties for cohort analysis
 */

import posthog from 'posthog-js';
import { trackEvent } from './simpleEvents';
import { identifyUser } from './simpleIdentity';

export type SubscriptionStatus = 'none' | 'active' | 'cancelled' | 'expired';

export interface SubscriptionMetadata {
  planId?: string;
  planName?: string;
  price?: string;
  cancelledAt?: string;
  expiredAt?: string;
  reason?: string;
  subscriptionStartDate?: string;
  previousPlanId?: string;
  subscriptionDuration?: number; // in days
  subscriptionValue?: number; // total value
  reactivationCount?: number;
}

/**
 * Enhanced subscription status tracking with comprehensive user properties
 * Enables advanced cohort analysis and user filtering in PostHog
 */
export const setSubscriptionStatus = (
  status: SubscriptionStatus, 
  metadata?: SubscriptionMetadata
) => {
  try {
    if (typeof posthog !== 'undefined' && posthog.setPersonProperties) {
      const timestamp = new Date().toISOString();
      
      // Enhanced subscription properties for advanced cohort analysis
      const subscriptionProperties = {
        // Core status properties
        subscription_status: status,
        is_subscribed: status === 'active',
        subscription_updated_at: timestamp,
        
        // Enhanced metadata properties
        plan_name: metadata?.planName,
        plan_id: metadata?.planId,
        subscription_price: metadata?.price,
        
        // Journey tracking properties
        subscription_start_date: metadata?.subscriptionStartDate,
        subscription_duration_days: metadata?.subscriptionDuration,
        subscription_value: metadata?.subscriptionValue,
        reactivation_count: metadata?.reactivationCount || 0,
        
        // Cancellation tracking
        ...(status === 'cancelled' && {
          subscription_cancelled_at: metadata?.cancelledAt || timestamp,
          cancellation_reason: metadata?.reason,
          previous_plan_id: metadata?.previousPlanId
        }),
        
        // Expiration tracking
        ...(status === 'expired' && {
          subscription_expired_at: metadata?.expiredAt || timestamp
        }),
        
        // Additional cohort properties
        has_ever_subscribed: status !== 'none',
        subscription_history_count: (metadata?.reactivationCount || 0) + (status === 'active' ? 1 : 0)
      };

      // Remove undefined values
      Object.keys(subscriptionProperties).forEach(key => {
        if (subscriptionProperties[key] === undefined) {
          delete subscriptionProperties[key];
        }
      });

      // Set user properties with validation
      posthog.setPersonProperties(subscriptionProperties);
      
      console.log(`PostHog: Enhanced subscription status updated to ${status}`, subscriptionProperties);
      
      // Track status change for data quality monitoring
      trackEvent('subscription_status_property_updated', {
        status,
        properties_count: Object.keys(subscriptionProperties).length,
        timestamp
      });
    }
  } catch (error) {
    console.error('PostHog subscription status update error:', error);
    
    // Track validation errors for monitoring
    trackEvent('subscription_status_error', {
      error: error.message,
      status,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Standardized subscription lifecycle events
 */
export const SUBSCRIPTION_EVENTS = {
  STARTED: 'subscription_started',
  CANCELLED: 'subscription_cancelled', 
  REACTIVATED: 'subscription_reactivated',
  EXPIRED: 'subscription_expired',
  PLAN_CHANGED: 'subscription_plan_changed'
} as const;

/**
 * Track standardized subscription lifecycle events with enhanced properties
 */
export const trackSubscriptionEvent = (
  event: string, 
  properties?: Record<string, any>
) => {
  try {
    const eventProperties = {
      ...properties,
      timestamp: new Date().toISOString(),
      event_version: '2.0' // For tracking data quality improvements
    };

    trackEvent(event, eventProperties);
    console.log(`PostHog: Tracked subscription event: ${event}`, eventProperties);
  } catch (error) {
    console.error('PostHog subscription event tracking error:', error);
    
    // Track error for monitoring
    trackEvent('subscription_event_error', {
      failed_event: event,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Track subscription started with journey metadata
 */
export const trackSubscriptionStarted = (planId: string, planName: string, properties?: Record<string, any>) => {
  trackSubscriptionEvent(SUBSCRIPTION_EVENTS.STARTED, {
    plan_id: planId,
    plan_name: planName,
    subscription_start_date: new Date().toISOString(),
    ...properties
  });
};

/**
 * Track subscription cancellation with reason and journey data
 */
export const trackSubscriptionCancelled = (
  reason: string,
  planId?: string,
  subscriptionDuration?: number,
  properties?: Record<string, any>
) => {
  trackSubscriptionEvent(SUBSCRIPTION_EVENTS.CANCELLED, {
    cancellation_reason: reason,
    plan_id: planId,
    subscription_duration_days: subscriptionDuration,
    cancelled_at: new Date().toISOString(),
    ...properties
  });
};

/**
 * Track subscription reactivation 
 */
export const trackSubscriptionReactivated = (
  planId: string,
  planName: string,
  previousCancellationReason?: string,
  daysSinceCancellation?: number,
  properties?: Record<string, any>
) => {
  trackSubscriptionEvent(SUBSCRIPTION_EVENTS.REACTIVATED, {
    plan_id: planId,
    plan_name: planName,
    previous_cancellation_reason: previousCancellationReason,
    days_since_cancellation: daysSinceCancellation,
    reactivated_at: new Date().toISOString(),
    ...properties
  });
};

/**
 * Sync subscription status from database to PostHog
 */
export const syncSubscriptionStatusToPostHog = async (
  userId: string,
  dbStatus: string,
  planDetails?: {
    planId?: string;
    planName?: string;
    price?: string;
    cancelledAt?: string;
    expiredAt?: string;
  }
) => {
  try {
    // Map database status to our enum
    let status: SubscriptionStatus = 'none';
    
    switch (dbStatus) {
      case 'active':
        status = 'active';
        break;
      case 'cancelled':
        status = 'cancelled';
        break;
      case 'expired':
        status = 'expired';
        break;
      case 'none':
      default:
        status = 'none';
        break;
    }

    // Update user properties
    setSubscriptionStatus(status, planDetails);

    // Track sync event for debugging
    trackEvent('subscription_status_synced', {
      user_id: userId,
      db_status: dbStatus,
      mapped_status: status,
      source: 'database_sync',
      ...planDetails
    });

    console.log(`PostHog: Synced subscription status for user ${userId}: ${dbStatus} -> ${status}`);
  } catch (error) {
    console.error('PostHog subscription sync error:', error);
  }
};

/**
 * Enhanced identify user with subscription properties
 */
export const identifyUserWithSubscription = (
  distinctId: string, 
  userProperties: Record<string, any>,
  subscriptionStatus?: SubscriptionStatus,
  subscriptionMetadata?: Record<string, any>
) => {
  try {
    const enhancedProperties = {
      ...userProperties,
      // Add subscription properties if provided
      ...(subscriptionStatus && {
        subscription_status: subscriptionStatus,
        is_subscribed: subscriptionStatus === 'active',
        subscription_updated_at: new Date().toISOString(),
        ...subscriptionMetadata
      })
    };

    identifyUser(distinctId, enhancedProperties);
    
    console.log(`PostHog: Identified user with subscription data: ${distinctId}`, enhancedProperties);
  } catch (error) {
    console.error('PostHog user identification with subscription error:', error);
  }
};