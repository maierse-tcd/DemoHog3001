
import React, { useEffect, useState, useRef } from 'react';
import { useFeatureFlagVariantKey } from 'posthog-js/react';
import { Button } from '../ui/button';
import { safeCapture, captureTestEvent } from '../../utils/posthog';
import { Timer } from 'lucide-react';

interface SubscriptionCTAProps {
  planId: string;
  planName: string;
  isSelected: boolean;
  onSelect: () => void;
}

/**
 * A/B test component for subscription call-to-action buttons
 * Uses PostHog feature flag to determine which variant to show
 */
export const SubscriptionCTA: React.FC<SubscriptionCTAProps> = ({
  planId,
  planName,
  isSelected,
  onSelect
}) => {
  // Get the variant from PostHog feature flag
  const variant = useFeatureFlagVariantKey('subscription_cta_test') as string | null;
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  
  // Track when component was first viewed for time-to-decision metric
  const firstViewedAt = useRef<Date | null>(null);
  
  // Set first viewed timestamp
  useEffect(() => {
    if (!firstViewedAt.current) {
      firstViewedAt.current = new Date();
    }
  }, []);
  
  // Log impression when component is rendered with a specific variant
  useEffect(() => {
    if (variant) {
      captureTestEvent(
        'subscription_cta_impression',
        'subscription_cta_test',
        variant,
        {
          plan_id: planId,
          plan_name: planName,
          funnel_step: 'view_cta',
          timestamp: new Date().toISOString()
        }
      );
    }
  }, [variant, planId, planName]);
  
  // Timer effect for urgency variant
  useEffect(() => {
    if (variant === 'urgency' && timeLeft > 0) {
      const timerId = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      
      return () => clearTimeout(timerId);
    }
  }, [variant, timeLeft]);
  
  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Handle button click with tracking
  const handleClick = () => {
    // Calculate time to decision if first view timestamp exists
    const timeToDecide = firstViewedAt.current 
      ? (new Date().getTime() - firstViewedAt.current.getTime()) / 1000 
      : null;
    
    captureTestEvent(
      'subscription_cta_clicked',
      'subscription_cta_test',
      variant || 'control',
      {
        plan_id: planId,
        plan_name: planName,
        funnel_step: 'click_cta',
        time_to_decide: timeToDecide,
        timestamp: new Date().toISOString()
      }
    );
    
    onSelect();
  };

  // Render control variant (original design)
  if (!variant || variant === 'control') {
    return (
      <Button
        onClick={handleClick}
        className={`w-full py-2 px-4 rounded font-medium transition-colors ${
          isSelected 
            ? 'bg-[#ea384c] text-white' 
            : 'bg-[#1A1F2C] text-white hover:bg-[#ea384c]'
        }`}
      >
        {isSelected ? 'Selected' : 'Choose Plan'}
      </Button>
    );
  }
  
  // Render action-oriented variant
  if (variant === 'action') {
    return (
      <Button
        onClick={handleClick}
        className={`w-full py-2 px-4 rounded font-medium transition-all transform hover:scale-105 hover:shadow-lg ${
          isSelected 
            ? 'bg-[#ea384c] text-white' 
            : 'bg-gradient-to-r from-[#ea384c] to-[#ef7a85] text-white'
        }`}
      >
        {isSelected ? 'Journey Started!' : 'Start Your Hog Journey'}
      </Button>
    );
  }
  
  // Render urgency-focused variant
  if (variant === 'urgency') {
    return (
      <div className="space-y-2">
        <Button
          onClick={handleClick}
          className={`w-full py-2 px-4 rounded font-medium transition-all animate-pulse ${
            isSelected 
              ? 'bg-[#ea384c] text-white' 
              : 'bg-[#ea384c] text-white hover:bg-[#d02c3f]'
          }`}
        >
          {isSelected ? 'Offer Claimed!' : 'Join Now - Limited Offer!'}
        </Button>
        
        {!isSelected && (
          <div className="flex items-center justify-center text-sm text-[#ea384c]">
            <Timer className="w-4 h-4 mr-1" />
            <span>Offer ends in {formatTime(timeLeft)}</span>
          </div>
        )}
      </div>
    );
  }
  
  // Fallback in case of unexpected variant
  return (
    <Button
      onClick={handleClick}
      className={`w-full py-2 px-4 rounded font-medium ${
        isSelected 
          ? 'bg-[#ea384c] text-white' 
          : 'bg-[#1A1F2C] text-white hover:bg-[#ea384c]'
      }`}
    >
      {isSelected ? 'Selected' : 'Choose Plan'}
    </Button>
  );
};
