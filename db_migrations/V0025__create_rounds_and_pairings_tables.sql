-- Таблица для хранения туров турнира
CREATE TABLE IF NOT EXISTS tournament_rounds (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER NOT NULL REFERENCES tournaments(id),
    round_number INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    started_at TIMESTAMP,
    finished_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tournament_id, round_number)
);

-- Таблица для хранения пар в турах
CREATE TABLE IF NOT EXISTS tournament_pairings (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER NOT NULL REFERENCES tournaments(id),
    round_id INTEGER NOT NULL REFERENCES tournament_rounds(id),
    white_player_id INTEGER NOT NULL REFERENCES users(id),
    black_player_id INTEGER REFERENCES users(id),
    game_id TEXT REFERENCES games(id),
    result VARCHAR(10),
    board_number INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(round_id, white_player_id)
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_rounds_tournament ON tournament_rounds(tournament_id);
CREATE INDEX IF NOT EXISTS idx_rounds_status ON tournament_rounds(status);
CREATE INDEX IF NOT EXISTS idx_pairings_round ON tournament_pairings(round_id);
CREATE INDEX IF NOT EXISTS idx_pairings_players ON tournament_pairings(white_player_id, black_player_id);
CREATE INDEX IF NOT EXISTS idx_pairings_game ON tournament_pairings(game_id);

-- Комментарии к таблицам
COMMENT ON TABLE tournament_rounds IS 'Туры турнира с информацией о статусе и времени';
COMMENT ON TABLE tournament_pairings IS 'Пары участников в каждом туре турнира';
COMMENT ON COLUMN tournament_pairings.board_number IS 'Номер доски в туре для отображения';
COMMENT ON COLUMN tournament_pairings.result IS 'Результат партии: 1-0, 0-1, 1/2-1/2';
