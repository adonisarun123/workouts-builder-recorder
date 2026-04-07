-- Idempotent: add active flag for soft-hiding catalog rows from public API.
ALTER TABLE reference_options ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE;
