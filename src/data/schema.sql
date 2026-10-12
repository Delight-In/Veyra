-- =====================================================================
-- EduNova Production Database Schema (PostgreSQL 15+ with ltree)
-- Architecture: Unlimited-depth hierarchical tree, Scoped RBAC, 
-- Multilingual content (Hindi/English), Simulations, and Video Checkpoints
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "ltree"; -- Enables ultra-fast unlimited-depth hierarchy queries

-- ---------------------------------------------------------------------
-- 1. USERS & IDENTITY (DPDP Act 2023 Compliant)
-- ---------------------------------------------------------------------
CREATE TYPE user_role_type AS ENUM (
  'super_admin',
  'branch_admin',
  'content_creator',
  'reviewer',
  'learner',
  'parent'
);

CREATE TYPE age_band_type AS ENUM (
  'kids',
  'teens',
  'adults',
  'all'
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role user_role_type NOT NULL DEFAULT 'learner',
  age_band age_band_type NOT NULL DEFAULT 'all',
  preferred_language VARCHAR(5) NOT NULL DEFAULT 'en', -- 'en', 'hi', etc.
  avatar_url TEXT,
  xp_points INT NOT NULL DEFAULT 0,
  streak_days INT NOT NULL DEFAULT 0,
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  -- Child protection under India DPDP Act 2023:
  parent_id UUID REFERENCES users(id) ON DELETE SET NULL,
  parent_consent_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_parent ON users(parent_id);

-- ---------------------------------------------------------------------
-- 2. UNLIMITED-DEPTH CONTENT HIERARCHY
-- ---------------------------------------------------------------------
CREATE TYPE node_type_enum AS ENUM (
  'category',
  'subject',
  'topic',
  'subtopic',
  'sub_subtopic',
  'lesson',
  'video',
  'simulation',
  'quiz'
);

CREATE TYPE node_status_enum AS ENUM (
  'draft',
  'in_review',
  'published',
  'archived'
);

CREATE TABLE nodes (
  id VARCHAR(64) PRIMARY KEY,
  parent_id VARCHAR(64) REFERENCES nodes(id) ON DELETE CASCADE,
  path LTREE NOT NULL, -- e.g. "root.science.physics.mechanics"
  depth INT NOT NULL DEFAULT 0,
  type node_type_enum NOT NULL,
  order_index INT NOT NULL DEFAULT 0,
  status node_status_enum NOT NULL DEFAULT 'draft',
  target_age_band age_band_type NOT NULL DEFAULT 'all',
  icon VARCHAR(64),
  badge VARCHAR(64),
  estimated_minutes INT DEFAULT 10,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fast GIST index for ltree ancestor/descendant queries:
-- Example query: SELECT * FROM nodes WHERE path <@ 'root.science.physics';
CREATE INDEX idx_nodes_path_gist ON nodes USING GIST (path);
CREATE INDEX idx_nodes_parent ON nodes(parent_id);
CREATE INDEX idx_nodes_status ON nodes(status);

-- ---------------------------------------------------------------------
-- 3. MULTILINGUAL CONTENT TRANSLATIONS
-- ---------------------------------------------------------------------
CREATE TABLE node_translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  node_id VARCHAR(64) NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  language VARCHAR(5) NOT NULL, -- 'en', 'hi'
  title VARCHAR(512) NOT NULL,
  description TEXT,
  body_markdown TEXT,
  summary_bullets TEXT,
  transcript TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(node_id, language)
);

CREATE INDEX idx_translations_node_lang ON node_translations(node_id, language);

-- Full-text search index across English and Devanagari Hindi text:
CREATE INDEX idx_translations_search_en ON node_translations USING GIN(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- ---------------------------------------------------------------------
-- 4. SCOPED RBAC PERMISSIONS (Inherited down the tree)
-- ---------------------------------------------------------------------
CREATE TABLE scoped_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  node_id VARCHAR(64) NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  role user_role_type NOT NULL, -- e.g. 'branch_admin' on node_science
  can_publish BOOLEAN NOT NULL DEFAULT FALSE,
  granted_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, node_id, role)
);

-- Query to check if User has permission on Node X (checks node and all ancestors):
-- SELECT * FROM scoped_permissions sp
-- JOIN nodes n ON n.id = sp.node_id
-- WHERE sp.user_id = :uid AND n.path @> (SELECT path FROM nodes WHERE id = :target_id);

-- ---------------------------------------------------------------------
-- 5. INTERACTIVE VIDEO CHECKPOINTS
-- ---------------------------------------------------------------------
CREATE TABLE video_metadata (
  node_id VARCHAR(64) PRIMARY KEY REFERENCES nodes(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration_seconds INT NOT NULL,
  captions_en_vtt TEXT,
  captions_hi_vtt TEXT
);

CREATE TABLE video_checkpoints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  node_id VARCHAR(64) NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  timestamp_seconds INT NOT NULL,
  question_en TEXT NOT NULL,
  question_hi TEXT NOT NULL,
  options_en JSONB NOT NULL,
  options_hi JSONB NOT NULL,
  correct_index INT NOT NULL,
  explanation_en TEXT,
  explanation_hi TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_checkpoints_node ON video_checkpoints(node_id, timestamp_seconds);

-- ---------------------------------------------------------------------
-- 6. SIMULATION CONFIGURATION
-- ---------------------------------------------------------------------
CREATE TABLE simulations (
  node_id VARCHAR(64) PRIMARY KEY REFERENCES nodes(id) ON DELETE CASCADE,
  sim_type VARCHAR(64) NOT NULL, -- 'projectile', 'wave_synth', etc.
  initial_params JSONB NOT NULL,
  instructions_en TEXT,
  instructions_hi TEXT,
  challenges JSONB -- array of challenges with conditions
);

-- ---------------------------------------------------------------------
-- 7. LEARNER PROGRESS, NOTES & RETENTION
-- ---------------------------------------------------------------------
CREATE TABLE learner_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  node_id VARCHAR(64) NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  score INT,
  bookmarked BOOLEAN NOT NULL DEFAULT FALSE,
  notes_content TEXT,
  time_spent_seconds INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, node_id)
);

CREATE INDEX idx_progress_user ON learner_progress(user_id);

-- ---------------------------------------------------------------------
-- 8. AUDIT LOG (Super Admin & Compliance)
-- ---------------------------------------------------------------------
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_name VARCHAR(255) NOT NULL,
  user_role VARCHAR(64) NOT NULL,
  action VARCHAR(128) NOT NULL,
  node_id VARCHAR(64),
  details TEXT,
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);
