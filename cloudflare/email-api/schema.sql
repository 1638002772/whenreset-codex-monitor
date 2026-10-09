CREATE TABLE IF NOT EXISTS email_subscribers (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  email_normalized TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'unsubscribed')),
  verify_token_hash TEXT UNIQUE,
  verify_expires_at TEXT,
  verification_sent_at TEXT,
  created_at TEXT NOT NULL,
  consented_at TEXT NOT NULL,
  confirmed_at TEXT,
  unsubscribed_at TEXT
);

CREATE INDEX IF NOT EXISTS email_subscribers_status_idx
  ON email_subscribers(status, created_at);

CREATE TABLE IF NOT EXISTS signup_attempts (
  ip_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS signup_attempts_ip_created_idx
  ON signup_attempts(ip_hash, created_at);

CREATE TABLE IF NOT EXISTS mail_jobs (
  id TEXT PRIMARY KEY,
  dedupe_key TEXT NOT NULL UNIQUE,
  recipient TEXT NOT NULL,
  message_json TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('queued', 'sending', 'sent', 'failed')),
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  lease_until TEXT,
  last_error TEXT
);

CREATE INDEX IF NOT EXISTS mail_jobs_queue_idx
  ON mail_jobs(status, attempts, created_at);
