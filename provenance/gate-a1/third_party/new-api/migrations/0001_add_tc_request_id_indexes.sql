-- Must be executed outside a transaction by migrate-new-api-tc-request-id.sh.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_logs_tc_request_id
  ON logs (tc_request_id) WHERE tc_request_id IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_logs_tc_request_id_state
  ON logs (tc_request_id_state);
