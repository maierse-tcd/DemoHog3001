-- Update password for seb@posthog.com
-- Note: This sets a temporary password, user should change it after login
UPDATE auth.users 
SET encrypted_password = crypt('newpassword123', gen_salt('bf')) 
WHERE email = 'seb@posthog.com';