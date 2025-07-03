import React from 'react';
import { Link } from 'react-router-dom';
import { Crown, X } from 'lucide-react';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { useAuth } from '../hooks/useAuth';
import { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';

export const PersistentSubBanner = () => {
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const { isLoggedIn } = useAuth();
  const showBanner = useFeatureFlagEnabled('persistent_sub_notification');

  useEffect(() => {
    let channel: any = null;

    const fetchSubscriptionStatus = async () => {
      if (!isLoggedIn) {
        return;
      }
      
      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session?.user?.id) {
          return;
        }

        const { data: profileData } = await supabase
          .from('profiles')
          .select('subscription_status')
          .eq('id', data.session.user.id)
          .maybeSingle();

        if (profileData) {
          setSubscriptionStatus(profileData.subscription_status || 'none');
        } else {
          setSubscriptionStatus('none');
        }

        // Set up real-time listener for this specific user
        channel = supabase
          .channel('subscription-status-changes')
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'profiles',
              filter: `id=eq.${data.session.user.id}`
            },
            (payload) => {
              if (payload.new && payload.new.subscription_status) {
                setSubscriptionStatus(payload.new.subscription_status);
              }
            }
          )
          .subscribe();
      } catch (error) {
        console.error('Error fetching subscription status:', error);
        setSubscriptionStatus('none');
      }
    };

    fetchSubscriptionStatus();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [isLoggedIn]);

  // Show banner optimistically if user is logged in and feature flag is on, hide only if confirmed subscribed
  if (!showBanner || !isLoggedIn || subscriptionStatus === 'active' || !isVisible) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-orange-500/90 to-red-500/90 text-white px-4 py-3 relative mt-16">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Crown className="w-5 h-5 text-yellow-300" />
          <span className="font-medium">
            Unlock premium features with a subscription plan
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <Link 
            to="/profile?tab=subscription" 
            className="bg-white/20 hover:bg-white/30 px-4 py-1 rounded-md text-sm font-medium transition-colors"
          >
            Subscribe Now
          </Link>
          <button
            onClick={() => setIsVisible(false)}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};