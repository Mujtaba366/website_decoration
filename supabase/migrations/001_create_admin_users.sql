-- Create admin_users table for admin authentication
-- This table stores admin credentials and is separate from regular user auth

CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password text NOT NULL,
  email text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);

-- Add RLS policies (optional - restrict access to authenticated admin users only)
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Policy to allow reading admin_users (public query for login)
CREATE POLICY "Allow public read for admin login" ON admin_users
  FOR SELECT
  USING (true);

-- Insert default admin user (CHANGE THESE IN PRODUCTION!)
-- Username: admin
-- Password: changeme123
INSERT INTO admin_users (username, password, email)
VALUES ('admin', 'changeme123', 'admin@example.com')
ON CONFLICT (username) DO NOTHING;
