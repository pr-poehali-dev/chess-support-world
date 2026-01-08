-- Удаляем старый constraint
ALTER TABLE t_p91748136_chess_support_world.tournaments DROP CONSTRAINT IF EXISTS valid_status;

-- Добавляем новый constraint с registration_closed
ALTER TABLE t_p91748136_chess_support_world.tournaments 
ADD CONSTRAINT valid_status CHECK (status IN ('draft', 'registration_open', 'registration_closed', 'in_progress', 'finished'));