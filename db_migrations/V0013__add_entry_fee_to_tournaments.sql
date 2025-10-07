-- Добавление поля орг.взнос в таблицу tournaments
ALTER TABLE tournaments 
  ADD COLUMN IF NOT EXISTS entry_fee NUMERIC(10, 2) DEFAULT 0;

COMMENT ON COLUMN tournaments.entry_fee IS 'Организационный взнос в рублях';