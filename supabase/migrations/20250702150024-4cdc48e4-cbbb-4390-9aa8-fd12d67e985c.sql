-- Update the handle_new_user function to include language from user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, name, email, is_kids, language)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'name',
    new.email,
    COALESCE((new.raw_user_meta_data->>'isKidsAccount')::boolean, false),
    COALESCE(new.raw_user_meta_data->>'language', 'English')
  );
  RETURN new;
END;
$function$;