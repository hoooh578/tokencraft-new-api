#!/usr/bin/env bash
set -euo pipefail

root=$(cd "$(dirname "$0")/.." && pwd)
: "${NEW_API_LOG_DATABASE_URL:?set NEW_API_LOG_DATABASE_URL to a PostgreSQL connection URL}"
psql "$NEW_API_LOG_DATABASE_URL" --set ON_ERROR_STOP=1 --single-transaction \
  --file "$root/third_party/new-api/migrations/0001_add_tc_request_id.sql"
for index_name in idx_logs_tc_request_id idx_logs_tc_request_id_state; do
  invalid=$(psql "$NEW_API_LOG_DATABASE_URL" --tuples-only --no-align --set ON_ERROR_STOP=1 \
    --command "SELECT COALESCE(NOT (SELECT indisvalid FROM pg_index WHERE indexrelid = to_regclass('$index_name')), false)")
  if [ "$invalid" = t ]; then
    psql "$NEW_API_LOG_DATABASE_URL" --set ON_ERROR_STOP=1 \
      --command "DROP INDEX CONCURRENTLY $index_name"
  fi
done
psql "$NEW_API_LOG_DATABASE_URL" --set ON_ERROR_STOP=1 \
  --file "$root/third_party/new-api/migrations/0001_add_tc_request_id_indexes.sql"
