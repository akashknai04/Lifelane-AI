-- Initialize PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Log initialization
CREATE TABLE IF NOT EXISTS _schema_version (
    id SERIAL PRIMARY KEY,
    version VARCHAR(32) NOT NULL,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO _schema_version (version) VALUES ('0.1.0_phase0_init');
