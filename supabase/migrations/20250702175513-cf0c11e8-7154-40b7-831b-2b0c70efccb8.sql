-- Add subscription tracking fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN subscription_status TEXT DEFAULT 'none',
ADD COLUMN subscription_plan_id TEXT,
ADD COLUMN subscription_cancelled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN subscription_expires_at TIMESTAMP WITH TIME ZONE;

-- Create an index for better performance on subscription queries
CREATE INDEX idx_profiles_subscription_status ON public.profiles(subscription_status);

-- Update existing profiles to have proper default subscription status
UPDATE public.profiles 
SET subscription_status = 'none' 
WHERE subscription_status IS NULL;