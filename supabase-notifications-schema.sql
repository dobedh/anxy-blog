-- Notifications table for Anxy platform
-- Created: 2025-10-14
-- Purpose: Track user notifications for social interactions (follows, likes, comments)

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Recipient
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Actor (who triggered the notification)
  actor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_name TEXT NOT NULL,
  actor_avatar_url TEXT,

  -- Notification details
  type VARCHAR(50) NOT NULL,
  title TEXT NOT NULL,
  message TEXT,

  -- Related entities (nullable - depends on notification type)
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,

  -- Metadata
  is_read BOOLEAN DEFAULT false NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Constraints
  CONSTRAINT notification_type_valid CHECK (
    type IN ('NEW_FOLLOWER', 'POST_LIKE', 'COMMENT', 'COMMENT_LIKE', 'MENTION')
  ),
  CONSTRAINT no_self_notify CHECK (user_id != actor_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read)
  WHERE is_read = false;

-- RLS Policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING ( auth.uid() = user_id );

-- System can insert notifications (any authenticated user can trigger notifications)
CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK ( true );

-- Users can update their own notifications (for marking as read)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING ( auth.uid() = user_id )
  WITH CHECK ( auth.uid() = user_id );

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING ( auth.uid() = user_id );

-- Trigger: Auto-update read_at when is_read changes to true
CREATE OR REPLACE FUNCTION update_notification_read_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_read = true AND OLD.is_read = false THEN
    NEW.read_at = timezone('utc'::text, now());
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER notification_read_at_trigger
  BEFORE UPDATE ON notifications
  FOR EACH ROW EXECUTE PROCEDURE update_notification_read_at();

-- Optional: Function to clean up old read notifications (run via cron job)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM notifications
  WHERE is_read = true
    AND read_at < (NOW() - INTERVAL '30 days');
END;
$$ language 'plpgsql';
