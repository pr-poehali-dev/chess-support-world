CREATE TABLE IF NOT EXISTS games (
    id TEXT PRIMARY KEY,
    fen TEXT NOT NULL,
    pgn TEXT NOT NULL DEFAULT '',
    white_player_id INTEGER REFERENCES users(id),
    black_player_id INTEGER,
    current_turn TEXT NOT NULL DEFAULT 'w',
    status TEXT NOT NULL DEFAULT 'waiting',
    winner TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_games_white_player ON games(white_player_id);
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_created_at ON games(created_at);