-- Fix Supabase database warnings by cleaning up policies and data types

-- Step 1: Drop duplicate RLS policies
DROP POLICY IF EXISTS "Anyone can view content images" ON public.content_images;
DROP POLICY IF EXISTS "Allow anyone to read content_items" ON public.content_items;
DROP POLICY IF EXISTS "Allow public read access to content_items" ON public.content_items;

-- Step 2: Create security definer function to avoid recursive RLS issues
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Step 3: Fix data type inconsistency - change user_my_list.user_id from text to uuid
ALTER TABLE public.user_my_list ALTER COLUMN user_id TYPE uuid USING user_id::uuid;

-- Step 4: Recreate cleaner RLS policies for content_images
CREATE POLICY "Content images are publicly viewable" 
ON public.content_images 
FOR SELECT 
USING (true);

-- Step 5: Recreate cleaner RLS policies for content_items
CREATE POLICY "Content items are publicly viewable" 
ON public.content_items 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage content items" 
ON public.content_items 
FOR ALL 
USING (auth.role() = 'authenticated'::text)
WITH CHECK (auth.role() = 'authenticated'::text);

-- Step 6: Update subscription_plans policy to use security definer function
DROP POLICY IF EXISTS "Only admins can modify subscription plans" ON public.subscription_plans;

CREATE POLICY "Only admins can modify subscription plans" 
ON public.subscription_plans 
FOR ALL 
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- Step 7: Add foreign key constraints for better data integrity
ALTER TABLE public.content_images 
ADD CONSTRAINT fk_content_images_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.user_my_list 
ADD CONSTRAINT fk_user_my_list_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 8: Add indexes for better performance on foreign keys
CREATE INDEX IF NOT EXISTS idx_content_images_user_id ON public.content_images(user_id);
CREATE INDEX IF NOT EXISTS idx_user_my_list_user_id ON public.user_my_list(user_id);

-- Step 9: Update RLS policies for user_my_list to use uuid
DROP POLICY IF EXISTS "Users can insert their own list" ON public.user_my_list;
DROP POLICY IF EXISTS "Users can update their own list" ON public.user_my_list;
DROP POLICY IF EXISTS "Users can view their own list" ON public.user_my_list;

CREATE POLICY "Users can view their own list" 
ON public.user_my_list 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own list" 
ON public.user_my_list 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own list" 
ON public.user_my_list 
FOR UPDATE 
USING (auth.uid() = user_id);