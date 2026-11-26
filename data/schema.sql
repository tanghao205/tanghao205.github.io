PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS company (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  summary TEXT,
  website_url TEXT,
  visibility TEXT NOT NULL DEFAULT 'private'
    CHECK (visibility IN ('private', 'public')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS task (
  id INTEGER PRIMARY KEY,
  company_id INTEGER REFERENCES company(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  summary TEXT,
  status TEXT NOT NULL DEFAULT 'idea'
    CHECK (status IN ('idea', 'planned', 'active', 'complete', 'archived')),
  visibility TEXT NOT NULL DEFAULT 'private'
    CHECK (visibility IN ('private', 'public')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS timing (
  id INTEGER PRIMARY KEY,
  task_id INTEGER REFERENCES task(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  starts_at TEXT,
  ends_at TEXT,
  minutes_spent INTEGER CHECK (minutes_spent IS NULL OR minutes_spent >= 0),
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK (ends_at IS NULL OR starts_at IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS material (
  id INTEGER PRIMARY KEY,
  company_id INTEGER REFERENCES company(id) ON DELETE SET NULL,
  task_id INTEGER REFERENCES task(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'note'
    CHECK (kind IN ('note', 'spec', 'link', 'image', 'document', 'other')),
  body TEXT,
  source_url TEXT,
  visibility TEXT NOT NULL DEFAULT 'private'
    CHECK (visibility IN ('private', 'public')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS task_company_id ON task(company_id);
CREATE INDEX IF NOT EXISTS timing_task_id ON timing(task_id);
CREATE INDEX IF NOT EXISTS material_company_id ON material(company_id);
CREATE INDEX IF NOT EXISTS material_task_id ON material(task_id);
