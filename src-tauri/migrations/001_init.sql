CREATE TABLE IF NOT EXISTS subscriptions (
    id                 TEXT PRIMARY KEY NOT NULL,
    name               TEXT NOT NULL,
    amount             INTEGER NOT NULL CHECK (amount >= 0),
    currency           TEXT NOT NULL,
    billing_period     TEXT NOT NULL CHECK (billing_period IN ('weekly', 'monthly', 'yearly')),
    next_payment_date  TEXT NOT NULL,
    anchor_day         INTEGER,
    category           TEXT,
    notes              TEXT,
    cancel_url         TEXT,
    is_active          INTEGER NOT NULL DEFAULT 1,
    last_notified_for  TEXT,
    created_at         TEXT NOT NULL,
    updated_at         TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_next_payment ON subscriptions (next_payment_date);

CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
);
