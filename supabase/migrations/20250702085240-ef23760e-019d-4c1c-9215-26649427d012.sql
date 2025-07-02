-- Create profile for seb@posthog.com and set as admin
INSERT INTO profiles (id, name, email, is_admin, admin_override, created_at, updated_at)
VALUES (
  'c013bce7-b46f-491a-aca5-d24e774be686',
  'seb',
  'seb@posthog.com',
  true,
  true,
  now(),
  now()
);