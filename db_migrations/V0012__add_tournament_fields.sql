-- Добавление новых полей в таблицу tournaments
ALTER TABLE tournaments 
  ADD COLUMN IF NOT EXISTS time_control VARCHAR(10),
  ADD COLUMN IF NOT EXISTS tournament_type VARCHAR(10) CHECK (tournament_type IN ('blitz', 'rapid')),
  ADD COLUMN IF NOT EXISTS start_time TIME;

-- Добавление комментариев
COMMENT ON COLUMN tournaments.time_control IS 'Контроль времени: 3+2, 5+3, 10+0, 10+5';
COMMENT ON COLUMN tournaments.tournament_type IS 'Тип турнира: blitz или rapid';
COMMENT ON COLUMN tournaments.start_time IS 'Время начала турнира';