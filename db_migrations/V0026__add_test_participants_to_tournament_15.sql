-- Add test participants to tournament 15
INSERT INTO tournament_participants (tournament_id, user_id, status)
SELECT 15, id, 'registered'
FROM users
WHERE id IN (8, 10, 13, 14)
ON CONFLICT DO NOTHING;