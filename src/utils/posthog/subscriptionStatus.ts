/**
 * PostHog Subscription Status Management
 * Tracks subscription status as user properties for cohort analysis
 */

import posthog from 'posthog-js';
import { trackEvent } from './simpleEvents';
import { identifyUser } from './simpleIdentity';

export type SubscriptionStatus = 'none' | 'active' | 'cancelled' | 'expired';

/**
 * Set subscription status as user properties
 * This enables cohort analysis and user filtering in PostHog
 */
export const setSubscriptionStatus = (
  status: SubscriptionStatus, 
  metadata?: {
    planId?: string;
    planName?: string;
    price?: string;
    cancelledAt?: string;
    expiredAt?: string;
    reason?: string;
  }
) => {
  try {
    if (typeof posthog !== 'undefined' && posthog.setPersonProperties) {
      const timestamp = new Date().toISOString();
      
      // Core subscription properties for cohort analysis
      const subscriptionProperties = {
        subscription_status: status,
        is_subscribed: status === 'active',
        subscription_updated_at: timestamp,
        ...metadata
      };

      // Set user properties directly
      posthog.setPersonProperties(subscriptionProperties);
      
      console.log(`PostHog: Updated subscription status to ${status}`, subscriptionProperties);
    }
  } catch (error) {
    console.error('PostHog subscription status update error:', error);
  }
};

/**
 * Track subscription lifecycle events
 */
export const trackSubscriptionEvent = (
  event: string, 
  properties?: Record<string, any>
) => {
  try {
    const eventProperties = {
      ...properties,
      timestamp: new Date().toISOString(),
    };

    trackEvent(event, eventProperties);
    console.log(`PostHog: Tracked subscription event: ${event}`, eventProperties);
  } catch (error) {
    console.error('PostHog subscription event tracking error:', error);
  }
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