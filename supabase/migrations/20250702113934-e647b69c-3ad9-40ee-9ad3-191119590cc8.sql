-- Security Fix Migration: Address Critical RLS and Database Security Issues

-- Step 1: Clean up duplicate RLS policies and add missing ones
DROP POLICY IF EXISTS "Images are viewable by everyone" ON public.content_images;

-- Step 2: Add missing INSERT policy for profiles table
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Step 3: Add missing DELETE policy for user_my_list table
CREATE POLICY "Users can delete their own list" 
ON public.user_my_list 
FOR DELETE 
USING (auth.uid() = user_id);

-- Step 4: Create secure password hashing functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Function to hash passwords securely
CREATE OR REPLACE FUNCTION public.hash_password(password text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT crypt(password, gen_salt('bf', 12));
$$;

-- Function to verify passwords securely
CREATE OR REPLACE FUNCTION public.verify_password(password text, hash text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT hash = crypt(password, hash);
$$;

-- Step 5: Migrate existing plain text passwords to hashed format
UPDATE public.profiles 
SET access_password = public.hash_password(access_password)
WHERE access_password IS NOT NULL 
  AND access_password != '' 
  AND LENGTH(access_password) < 60;

-- Step 6: Create enhanced admin authorization function
CREATE OR REPLACE FUNCTION public.is_admin_or_override()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND (is_admin = true OR admin_override = true)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Step 7: Add input validation functions
CREATE OR REPLACE FUNCTION public.validate_email(email text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
$$;

-- Step 8: Add audit logging table for sensitive operations
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  table_name text,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs" 
ON public.security_audit_log 
FOR SELECT 
USING (public.is_admin_or_override());

-- Step 9: Add database constraints for data integrity
ALTER TABLE public.profiles 
ADD CONSTRAINT valid_email_format 
CHECK (email IS NULL OR public.validate_email(email));

-- Step 10: Create secure content validation function with simpler regex
CREATE OR REPLACE FUNCTION public.sanitize_html_content(content text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT regexp_replace(
    regexp_replace(content, '<script[^>]*>.*?</script>', '', 'gi'),
    'javascript:', '', 'gi'
  );
$$;

-- Add indexes for better performance on security-related queries
CREATE INDEX IF NOT EXISTS idx_profiles_admin_check ON public.profiles(id) WHERE is_admin = true OR admin_override = true;
CREATE INDEX IF NOT EXISTS idx_security_audit_user_id ON public.security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_created_at ON public.security_audit_log(created_at);