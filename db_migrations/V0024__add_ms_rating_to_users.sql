-- Добавление поля рейтинга МШ (Мир Шахмат) в таблицу users
ALTER TABLE t_p91748136_chess_support_world.users 
ADD COLUMN ms_rating INTEGER NULL;

COMMENT ON COLUMN t_p91748136_chess_support_world.users.ms_rating IS 'Рейтинг МШ (Мир Шахмат)';