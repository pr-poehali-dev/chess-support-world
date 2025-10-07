-- Создание таблицы турниров
CREATE TABLE IF NOT EXISTS t_p91748136_chess_support_world.tournaments (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    location VARCHAR(255),
    max_participants INTEGER,
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    CONSTRAINT valid_status CHECK (status IN ('draft', 'registration_open', 'in_progress', 'finished'))
);

-- Индексы для быстрого поиска
CREATE INDEX idx_tournaments_status ON t_p91748136_chess_support_world.tournaments(status);
CREATE INDEX idx_tournaments_start_date ON t_p91748136_chess_support_world.tournaments(start_date);

-- Таблица участников турнира
CREATE TABLE IF NOT EXISTS t_p91748136_chess_support_world.tournament_participants (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'registered',
    UNIQUE(tournament_id, user_id),
    CONSTRAINT valid_participant_status CHECK (status IN ('registered', 'confirmed', 'cancelled'))
);

CREATE INDEX idx_tournament_participants_tournament ON t_p91748136_chess_support_world.tournament_participants(tournament_id);
CREATE INDEX idx_tournament_participants_user ON t_p91748136_chess_support_world.tournament_participants(user_id);
