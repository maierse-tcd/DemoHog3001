-- Update password for seb@posthog.com to sebsebseb
UPDATE auth.users 
SET encrypted_password = crypt('sebsebseb', gen_salt('bf')) 
WHERE email = 'seb@posthog.com';