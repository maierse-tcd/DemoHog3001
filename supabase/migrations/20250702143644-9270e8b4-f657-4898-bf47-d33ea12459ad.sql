-- Update all users' language settings randomly
-- 60% English, 40% other languages randomly distributed

UPDATE public.profiles 
SET language = CASE 
  WHEN random() < 0.6 THEN 'English'
  ELSE (ARRAY['Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Japanese', 'Chinese'])[floor(random() * 7 + 1)]
END,
updated_at = now()
WHERE language IS NOT NULL;