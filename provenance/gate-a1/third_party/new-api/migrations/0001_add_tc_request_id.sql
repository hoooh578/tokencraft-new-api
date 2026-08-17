-- Gate A1 forward-only New API log migration. The runner executes the two
-- ALTER statements in one transaction, then executes each concurrent index
-- outside a transaction (PostgreSQL forbids CREATE INDEX CONCURRENTLY inside
-- one). It is safe for the official rc.19 rollback image because old binaries
-- ignore unknown columns.
ALTER TABLE logs ADD COLUMN IF NOT EXISTS tc_request_id varchar(72) NULL;
ALTER TABLE logs ADD COLUMN IF NOT EXISTS tc_request_id_state varchar(16) NOT NULL DEFAULT 'missing';
