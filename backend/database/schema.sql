-- Drop tables if they exist (for fresh start)
DROP TABLE IF EXISTS winners CASCADE;
DROP TABLE IF EXISTS prize_pools CASCADE;
DROP TABLE IF EXISTS draws CASCADE;
DROP TABLE IF EXISTS golf_scores CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS charities CASCADE;

-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    charity_id INTEGER,
    charity_percentage DECIMAL(5,2) DEFAULT 10.00,
    stripe_customer_id VARCHAR(255),
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create charities table
CREATE TABLE charities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    logo_url VARCHAR(500),
    website VARCHAR(255),
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create golf_scores table
CREATE TABLE golf_scores (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER CHECK (score >= 1 AND score <= 45),
    score_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create subscriptions table
CREATE TABLE subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    stripe_subscription_id VARCHAR(255) UNIQUE,
    plan_type VARCHAR(50) CHECK (plan_type IN ('monthly', 'yearly')),
    status VARCHAR(50) CHECK (status IN ('active', 'canceled', 'past_due', 'incomplete')),
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create draws table
CREATE TABLE draws (
    id SERIAL PRIMARY KEY,
    draw_date DATE NOT NULL,
    status VARCHAR(50) CHECK (status IN ('pending', 'simulated', 'published')),
    draw_type VARCHAR(50) CHECK (draw_type IN ('random', 'algorithmic')),
    winning_numbers JSONB,
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create winners table
CREATE TABLE winners (
    id SERIAL PRIMARY KEY,
    draw_id INTEGER REFERENCES draws(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    match_type VARCHAR(20) CHECK (match_type IN ('5-match', '4-match', '3-match')),
    prize_amount DECIMAL(10,2),
    verification_status VARCHAR(50) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
    proof_url VARCHAR(500),
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create prize_pools table
CREATE TABLE prize_pools (
    id SERIAL PRIMARY KEY,
    draw_id INTEGER REFERENCES draws(id) ON DELETE CASCADE,
    total_pool DECIMAL(10,2) DEFAULT 0,
    five_match_pool DECIMAL(10,2) DEFAULT 0,
    four_match_pool DECIMAL(10,2) DEFAULT 0,
    three_match_pool DECIMAL(10,2) DEFAULT 0,
    rollover_amount DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create transactions table
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    subscription_id INTEGER REFERENCES subscriptions(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    charity_contribution DECIMAL(10,2),
    platform_fee DECIMAL(10,2),
    prize_pool_contribution DECIMAL(10,2),
    stripe_payment_intent_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_scores_user_id ON golf_scores(user_id);
CREATE INDEX idx_scores_score_date ON golf_scores(score_date);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_winners_draw_id ON winners(draw_id);
CREATE INDEX idx_winners_user_id ON winners(user_id);

-- Insert sample charities
INSERT INTO charities (name, description, is_featured) VALUES
('Golf For Good', 'Supporting youth golf programs in underserved communities', TRUE),
('Green Earth Initiative', 'Environmental conservation in golf courses', FALSE),
('Health Through Golf', 'Promoting physical and mental health through golf', FALSE),
('Women in Golf', 'Empowering women to take up golf as a sport and career', TRUE),
('Junior Golf Academy', 'Developing young golf talent from underprivileged backgrounds', FALSE);

-- Insert admin user (password: admin123)
INSERT INTO users (email, password_hash, full_name, is_admin) VALUES 
('admin@example.com', '$2a$10$rQKqX5qX5qX5qX5qX5qX5u', 'Admin User', TRUE);