CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'mentor', 'admin')),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE student_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  education VARCHAR(200),
  bio TEXT,
  interests TEXT,
  visibility VARCHAR(20) NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'public'))
);

CREATE TABLE skills (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  category VARCHAR(100)
);

CREATE TABLE student_skills (
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  proficiency VARCHAR(20) NOT NULL DEFAULT 'beginner',
  PRIMARY KEY (student_id, skill_id)
);

CREATE TABLE challenges (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100),
  difficulty VARCHAR(20) NOT NULL DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  deadline DATE,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE challenge_skills (
  challenge_id INTEGER NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  PRIMARY KEY (challenge_id, skill_id)
);

CREATE TABLE participations (
  id SERIAL PRIMARY KEY,
  challenge_id INTEGER NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'joined',
  joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (challenge_id, student_id)
);

CREATE TABLE submissions (
  id SERIAL PRIMARY KEY,
  participation_id INTEGER NOT NULL REFERENCES participations(id) ON DELETE CASCADE,
  mentor_id INTEGER REFERENCES users(id),
  summary TEXT NOT NULL,
  repository_url VARCHAR(300),
  demo_url VARCHAR(300),
  status VARCHAR(30) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'in_review', 'revision_requested', 'reviewed')),
  submitted_at TIMESTAMP
);

CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  submission_id INTEGER NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  mentor_id INTEGER NOT NULL REFERENCES users(id),
  requirement_score INTEGER NOT NULL CHECK (requirement_score BETWEEN 1 AND 5),
  technical_score INTEGER NOT NULL CHECK (technical_score BETWEEN 1 AND 5),
  problem_solving_score INTEGER NOT NULL CHECK (problem_solving_score BETWEEN 1 AND 5),
  documentation_score INTEGER NOT NULL CHECK (documentation_score BETWEEN 1 AND 5),
  communication_score INTEGER NOT NULL CHECK (communication_score BETWEEN 1 AND 5),
  feedback TEXT NOT NULL,
  decision VARCHAR(30) NOT NULL CHECK (decision IN ('revision_requested', 'reviewed')),
  reviewed_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE portfolio_items (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  submission_id INTEGER NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  visibility VARCHAR(20) NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'public')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);