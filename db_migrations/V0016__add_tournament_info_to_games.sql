ALTER TABLE t_p91748136_chess_support_world.games 
ADD COLUMN tournament_id INTEGER REFERENCES t_p91748136_chess_support_world.tournaments(id),
ADD COLUMN round_number INTEGER,
ADD COLUMN result VARCHAR(10);