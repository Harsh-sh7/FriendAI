-- Add completed_tasks_count column to users table
-- Run this in your Supabase SQL editor

ALTER TABLE users 
ADD COLUMN completed_tasks_count INTEGER DEFAULT 0;

-- Create index for better performance
CREATE INDEX idx_users_completed_tasks_count ON users(completed_tasks_count);

-- Update existing users to have a count of 0 if they don't have any
UPDATE users 
SET completed_tasks_count = 0 
WHERE completed_tasks_count IS NULL;

-- Optional: Initialize existing users' counts based on their completed tasks
-- This is a one-time migration to set correct counts for existing users
UPDATE users 
SET completed_tasks_count = (
  SELECT COUNT(*) 
  FROM tasks 
  WHERE tasks.user_id = users.id 
    AND tasks.completed = true
)
WHERE completed_tasks_count = 0;

COMMENT ON COLUMN users.completed_tasks_count IS 'Total number of tasks completed by the user (persists even after task deletion)';
