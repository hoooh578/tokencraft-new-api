# Gate A1 public release provenance package

This package closes the source-offer portion of the release contract in
`third_party/new-api/README.md` from TokenCraft merge
`0ff659bea400d0eddf90fc936bccd222560c1135`.  It is deliberately a
verbatim, public-safe copy of the contract inputs at the mirrored paths below:

- `third_party/new-api/README.md`
- `third_party/new-api/UPSTREAM.lock.json`
- `third_party/new-api/patches/0001-persist-tc-request-id.patch`
- `third_party/new-api/migrations/README.md`
- `third_party/new-api/migrations/0001_add_tc_request_id.sql`
- `third_party/new-api/migrations/0001_add_tc_request_id_indexes.sql`
- `scripts/verify-new-api-a1.sh`
- `scripts/migrate-new-api-tc-request-id.sh`

The two scripts contain no connection value, credential, private path, or
runtime data. They accept a caller-supplied clean source directory or the
`NEW_API_LOG_DATABASE_URL` environment variable and are included only as
source/install and migration control scripts; running either against a real
environment requires separate authorization.

## Input checksums

| Path | SHA-256 |
| --- | --- |
| `third_party/new-api/README.md` | `f9e7bc30967b393918c47f642d4c71c962a5e197fb11abda0e9c432fb4636924` |
| `third_party/new-api/UPSTREAM.lock.json` | `7c3db95070de9f75b835a66e549e5eeea77c9a6e6190a36ff5d14d128546d3ee` |
| `third_party/new-api/patches/0001-persist-tc-request-id.patch` | `958def972aa44d997ea71f133270247c0cd8620b33ba9d68827dfcd674a779a2` |
| `third_party/new-api/migrations/README.md` | `64c0d967844b9606f0c79eef0c9cf4b49228334a1543cb5ecacb61018888b4d6` |
| `third_party/new-api/migrations/0001_add_tc_request_id.sql` | `2c357331b2cdfb2e2ec441e37b342a34060d00e5ffa2ab368c91561d160e3c0a` |
| `third_party/new-api/migrations/0001_add_tc_request_id_indexes.sql` | `985924653f40f130ba146df06bff21a32705fe331270cd525d6b57865a56affa` |
| `scripts/verify-new-api-a1.sh` | `da7cadd4bc65e86bff10e14f2cc0360c58d65d67d0d3177b1ac178b07b3274b4` |
| `scripts/migrate-new-api-tc-request-id.sh` | `ba5949e9b54eefa97ce151e22f606b4bd6c3b94fc0905249591e7319d031dd07` |

## Source offer and release attachment

The immutable tag containing this package, the complete AGPL source tree, and
`TOKENCRAFT-MODIFICATIONS.md` is the public source offer for this Gate A1
change. It supersedes the earlier source-only tag without changing or deleting
that tag.

No custom image has been built, pushed, or deployed by this publication. The
release contract therefore remains incomplete for any future modified-image
release until, before its switch, a public immutable release record attaches:

1. the exact public source tag and commit;
2. the custom image reference and immutable OCI digest produced from that tag;
3. the verifier result bound to that source, image reference, and digest; and
4. an unauthenticated readback of the record and source archive checksum.

Do not infer an image reference or digest from the official upstream OCI
provenance or the reviewed local image evidence. Those identifiers are not a
public modified-image release.
