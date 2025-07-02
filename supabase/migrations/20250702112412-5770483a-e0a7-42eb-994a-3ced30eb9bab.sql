-- Fix the upsert_my_list function to handle UUID properly
CREATE OR REPLACE FUNCTION public.upsert_my_list(p_user_id TEXT, p_content_ids TEXT[])
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.user_my_list (user_id, content_ids, updated_at)
  VALUES (p_user_id::uuid, p_content_ids, NOW())
  ON CONFLICT (user_id) DO UPDATE
  SET content_ids = p_content_ids, updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;