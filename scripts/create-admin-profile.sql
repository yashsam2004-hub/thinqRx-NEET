-- Create missing profile and set as admin
-- Replace 'your-email@example.com' with your actual email

-- First, ensure the profiles table has a UNIQUE constraint on user_id
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_user_id_key;
ALTER TABLE profiles ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);

-- Create the profile for the user (replace the email)
INSERT INTO profiles (user_id, role, created_at, updated_at)
SELECT 
  id as user_id,
  'admin' as role,
  now() as created_at,
  now() as updated_at
FROM auth.users
WHERE email = 'pindiprolusskiran@gmail.com'
ON CONFLICT (user_id) 
DO UPDATE SET 
  role = 'admin',
  updated_at = now();

-- Verify the profile was created
SELECT 
  p.user_id,
  u.email,
  p.role,
  p.created_at
FROM profiles p
JOIN auth.users u ON u.id = p.user_id
WHERE u.email = 'pindiprolusskiran@gmail.com';
