-- schema.sql - PostgreSQL (Neon) schema for CBF Antidoping system

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Roles
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL
);

-- Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255),
  password_hash TEXT NOT NULL,
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  organization VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Clubs
CREATE TABLE IF NOT EXISTS clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  federation VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Athletes
CREATE TABLE IF NOT EXISTS athletes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(150) NOT NULL,
  last_name VARCHAR(150) NOT NULL,
  date_of_birth DATE,
  nationality VARCHAR(100),
  gender VARCHAR(20),
  id_document VARCHAR(100) UNIQUE,
  club_id UUID REFERENCES clubs(id),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tests
CREATE TABLE IF NOT EXISTS tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  sample_id VARCHAR(150) UNIQUE,
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  collected_date TIMESTAMP WITH TIME ZONE,
  laboratory VARCHAR(255),
  technician VARCHAR(255),
  chain_of_custody TEXT,
  status VARCHAR(50) DEFAULT 'scheduled',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Test results
CREATE TABLE IF NOT EXISTS test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
  result VARCHAR(50),
  substances JSONB,
  analysis_report TEXT,
  reported_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  reported_by UUID REFERENCES users(id)
);

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID,
  action VARCHAR(255),
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Seed roles
INSERT INTO roles (name) VALUES
('club'),
('federation'),
('laboratory'),
('cbf_staff'),
('admin')
ON CONFLICT (name) DO NOTHING;
