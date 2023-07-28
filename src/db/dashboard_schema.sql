CREATE TABLE IF NOT EXISTS cdn_distributions (
    id SERIAL PRIMARY KEY,
    distribution_id TEXT NOT NULL,
    realtime_config_id JSON NOT NULL
);