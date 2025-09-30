
CREATE TABLE IF NOT EXISTS t_p91748136_chess_support_world.users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS t_p91748136_chess_support_world.verification_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES t_p91748136_chess_support_world.users(id)
);

CREATE INDEX IF NOT EXISTS idx_verification_tokens_token ON t_p91748136_chess_support_world.verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_user_id ON t_p91748136_chess_support_world.verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON t_p91748136_chess_support_world.users(email);
