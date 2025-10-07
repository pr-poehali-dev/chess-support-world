-- Таблица для регистрации игроков на турниры
CREATE TABLE IF NOT EXISTS tournament_registrations (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER NOT NULL REFERENCES tournaments(id),
    player_id INTEGER NOT NULL REFERENCES users(id),
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'registered',
    UNIQUE(tournament_id, player_id)
);

-- Индекс для быстрого поиска регистраций по турниру
CREATE INDEX IF NOT EXISTS idx_tournament_registrations_tournament ON tournament_registrations(tournament_id);

-- Индекс для быстрого поиска регистраций по игроку
CREATE INDEX IF NOT EXISTS idx_tournament_registrations_player ON tournament_registrations(player_id);