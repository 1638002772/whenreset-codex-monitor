CREATE TABLE IF NOT EXISTS app_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  payload TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS wishes (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  count INTEGER NOT NULL DEFAULT 0
);

INSERT OR IGNORE INTO wishes (id, count) VALUES (1, 0);

CREATE TABLE IF NOT EXISTS email_subscribers (
  email TEXT PRIMARY KEY,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS notification_config (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  feishu_webhook TEXT NOT NULL,
  feishu_secret TEXT NOT NULL DEFAULT ''
);
