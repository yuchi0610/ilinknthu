-- Cloudflare D1 Schema
-- Run with: wrangler d1 execute <DB_NAME> --file=schema.sql

CREATE TABLE IF NOT EXISTS scenes (
  id         TEXT    PRIMARY KEY,
  type       TEXT    NOT NULL,
  title      TEXT    NOT NULL,
  "order"    INTEGER NOT NULL DEFAULT 0,
  config     TEXT    NOT NULL DEFAULT '{}',
  visible    INTEGER NOT NULL DEFAULT 1,
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS endings (
  id        TEXT    PRIMARY KEY,
  type      TEXT    NOT NULL,
  label     TEXT    NOT NULL,
  score_min INTEGER NOT NULL DEFAULT 0,
  score_max INTEGER NOT NULL DEFAULT 100,
  config    TEXT    NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS sessions (
  id            TEXT    PRIMARY KEY,
  started_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  ended_at      TEXT,
  scores        TEXT    NOT NULL DEFAULT '{}',
  total_score   INTEGER NOT NULL DEFAULT 0,
  ending_type   TEXT,
  user_agent    TEXT,
  signature_url TEXT
);
