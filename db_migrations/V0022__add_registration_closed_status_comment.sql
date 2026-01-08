-- Add registration_closed status to tournaments
-- This status will be set automatically 15 minutes before tournament start

COMMENT ON COLUMN tournaments.status IS 'Tournament status: draft, registration_open, registration_closed, in_progress, completed, cancelled';
