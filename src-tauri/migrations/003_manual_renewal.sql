ALTER TABLE subscriptions ADD COLUMN auto_renew INTEGER NOT NULL DEFAULT 1;
ALTER TABLE subscriptions ADD COLUMN last_overdue_notified_for TEXT;

CREATE TABLE IF NOT EXISTS payments (
    id               TEXT PRIMARY KEY NOT NULL,
    subscription_id  TEXT NOT NULL,
    paid_on          TEXT NOT NULL,
    amount           INTEGER NOT NULL CHECK (amount >= 0),
    currency         TEXT NOT NULL,
    kind             TEXT NOT NULL CHECK (kind IN ('auto', 'manual')),
    created_at       TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_payments_subscription ON payments (subscription_id, paid_on);
