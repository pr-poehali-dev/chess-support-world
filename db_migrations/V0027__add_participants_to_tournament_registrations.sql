-- Add participants to tournament_registrations table
INSERT INTO tournament_registrations (tournament_id, player_id, status)
SELECT 15, id, 'registered'
FROM users
WHERE id IN (8, 10, 13, 14)
ON CONFLICT DO NOTHING;