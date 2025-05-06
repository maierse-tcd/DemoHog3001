
/**
 * Helper utilities for PostHog implementations
 */

/**
 * Slugify a string for consistent group keys
 * Converts spaces to hyphens, removes special characters, and converts to lowercase
 */
export const slugifyGroupKey = (text: string): string => {
  if (!text) return '';
  
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')       // Replace spaces with hyphens
    .replace(/&/g, '-and-')      // Replace & with 'and'
    .replace(/[^\w\-]+/g, '')    // Remove all non-word characters except hyphens
    .replace(/\-\-+/g, '-')      // Replace multiple hyphens with single hyphen
    .replace(/^-+/, '')          // Trim hyphens from start
    .replace(/-+$/, '');         // Trim hyphens from end
};

/**
 * Extract numeric price value from price string
 */
export const extractPriceValue = (priceString: string | undefined): number => {
  if (!priceString) return 0;
  const numericValue = priceString.toString().replace(/[^\d.]/g, '');
  return parseFloat(numericValue) || 0;
};

/**
 * Format subscription group properties consistently
 */
export const formatSubscriptionGroupProps = (
  planName: string, 
  planId: string, 
  price: string | number,
  additionalProps: Record<string, any> = {}
): Record<string, any> => {
  const slugKey = slugifyGroupKey(planName);
  
  return {
    // CRITICAL: name must match the group key exactly for PostHog UI visibility
    name: slugKey,
    
    // Additional properties for analytics value
    display_name: planName,
    plan_id: planId,
    plan_cost: typeof price === 'string' ? extractPriceValue(price) : price,
    updated_at: new Date().toISOString(),
    ...additionalProps
  };
};

