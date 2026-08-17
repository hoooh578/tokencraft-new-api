# New API migration contract

Run `scripts/migrate-new-api-tc-request-id.sh` explicitly against the New API
PostgreSQL log database. It runs the forward ALTER migration transactionally,
then the concurrent indexes in their required non-transactional boundary.
Repeated runs are idempotent. Do not run it against production without a
separate production authorization.
The nullable direct field preserves historical and missing identity as Unknown;
no backfill and no uniqueness constraint are permitted until retry/attempt
cardinality is approved. Rollback restores the official pinned image and leaves
the additive columns and indexes in place.
