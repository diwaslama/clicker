-- Users table
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text,
  city text,
  is_anonymous boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Clicks table (one row per user)
CREATE TABLE clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_clicks bigint DEFAULT 0,
  last_updated timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Atomically increment clicks for a user
CREATE OR REPLACE FUNCTION increment_clicks(p_user_id uuid, p_amount int)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO clicks (user_id, total_clicks, last_updated)
  VALUES (p_user_id, p_amount, now())
  ON CONFLICT (user_id) DO UPDATE SET
    total_clicks = clicks.total_clicks + EXCLUDED.total_clicks,
    last_updated = now();
END;
$$;

-- Allow client to call increment_clicks via RPC
GRANT EXECUTE ON FUNCTION increment_clicks(uuid, int) TO anon;
GRANT EXECUTE ON FUNCTION increment_clicks(uuid, int) TO authenticated;

-- Leaderboard view (order by total_clicks desc when querying)
CREATE OR REPLACE VIEW leaderboard AS
SELECT 
  users.id AS user_id,
  users.display_name,
  users.city,
  clicks.total_clicks
FROM users
JOIN clicks ON clicks.user_id = users.id
ORDER BY clicks.total_clicks DESC;

-- Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clicks ENABLE ROW LEVEL SECURITY;

-- Public read for leaderboard
CREATE POLICY "users_select_all" ON users FOR SELECT USING (true);
CREATE POLICY "clicks_select_all" ON clicks FOR SELECT USING (true);

-- Users can only update their own row
CREATE POLICY "users_update_own" ON users FOR UPDATE
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "clicks_update_own" ON clicks FOR UPDATE
  USING (
    user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
  );

-- Allow users to insert their own profile
CREATE POLICY "users_insert_own" ON users FOR INSERT
  WITH CHECK (auth_user_id = auth.uid());
