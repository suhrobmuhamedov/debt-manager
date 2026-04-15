ALTER TABLE users
  ADD COLUMN bot_started_at TIMESTAMP NULL AFTER language_code,
  ADD COLUMN last_reminder_digest_at TIMESTAMP NULL AFTER bot_started_at;