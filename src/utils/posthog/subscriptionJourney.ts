/**
 * Subscription Journey Tracking Utilities
 * Provides enhanced metrics for subscription lifecycle analysis
 */

export interface SubscriptionJourneyData {
  subscriptionDuration?: number; // in days
  subscriptionValue?: number; // total value
  reactivationCount?: number;
  daysSinceCancellation?: number;
  previousCancellationReason?: string;
}

/**
 * Calculate subscription duration in days
 */
export const calculateSubscriptionDuration = (
  startDate: string | Date,
  endDate: string | Date = new Date()
): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Calculate subscription value based on duration and price
 */
export const calculateSubscriptionValue = (
  durationDays: number,
  monthlyPrice: number
): number => {
  return Math.round((durationDays / 30) * monthlyPrice * 100) / 100;
};

/**
 * Parse price from string format
 */
export const parsePrice = (priceString: string): number => {
  const match = priceString.match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
};

/**
 * Get subscription journey data from database
 */
export const getSubscriptionJourneyData = async (
  userId: string,
  supabase: any
): Promise<SubscriptionJourneyData> => {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status, subscription_cancelled_at, created_at')
      .eq('id', userId)
      .single();

    if (!profile) return {};

    const journeyData: SubscriptionJourneyData = {};

    // Calculate subscription duration if cancelled
    if (profile.subscription_cancelled_at && profile.created_at) {
      journeyData.subscriptionDuration = calculateSubscriptionDuration(
        profile.created_at,
        profile.subscription_cancelled_at
      );
    }

    // Calculate days since cancellation
    if (profile.subscription_cancelled_at) {
      journeyData.daysSinceCancellation = calculateSubscriptionDuration(
        profile.subscription_cancelled_at,
        new Date()
      );
    }

    return journeyData;
  } catch (error) {
    console.error('Error fetching subscription journey data:', error);
    return {};
  }
};

/**
 * Enhanced cancellation reason tracking
 */
export const CANCELLATION_REASONS = {
  USER_INITIATED: 'user_initiated',
  PAYMENT_FAILED: 'payment_failed',
  TOO_EXPENSIVE: 'too_expensive',
  NOT_USING: 'not_using',
  POOR_EXPERIENCE: 'poor_experience',
  COMPETITOR: 'competitor',
  OTHER: 'other'
} as const;

export type CancellationReason = typeof CANCELLATION_REASONS[keyof typeof CANCELLATION_REASONS];