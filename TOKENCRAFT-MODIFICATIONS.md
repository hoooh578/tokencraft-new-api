# TokenCraft Gate A1 modifications

This repository is the Corresponding Source for the TokenCraft-specific New API
modification recorded by TokenCraft merge commit
`0ff659bea400d0eddf90fc936bccd222560c1135`.

## Upstream baseline

- Upstream repository: `https://github.com/QuantumNous/new-api`
- Upstream annotated tag: `v1.0.0-rc.19-i18nfix.2`
- Tag object: `a5223fdd0081ffca529d6804ead81aa5c7052a8c`
- Peeled source commit: `becc18e3007e9812a7bb2dcfebefc6c19ad3f102`
- License: AGPL-3.0-only; see `LICENSE`, `NOTICE`, and
  `THIRD-PARTY-LICENSES.md`.

## Modification provenance and scope

The only source-code change from the pinned upstream commit is mechanically
equivalent to TokenCraft's
`third_party/new-api/patches/0001-persist-tc-request-id.patch`:

- Patch SHA-256:
  `958def972aa44d997ea71f133270247c0cd8620b33ba9d68827dfcd674a779a2`
- Modified paths: `common/constants.go`, `middleware/request-id.go`,
  `middleware/request_id_tc_test.go`, `model/clickhouse_log_test.go`,
  `model/log.go`, `model/log_tc_request_id_test.go`, and `model/main.go`.

The change captures a validated `X-TC-Request-Id`, records its state, and
persists the fields on New API log records with focused tests. No TokenCraft
application source, deployment configuration, environment configuration,
credentials, database data, customer data, enterprise data, or usage data is
included here.

## Reproducible build

From a checkout of the immutable release tag, build locally with:

```sh
docker build --tag tokencraft-new-api:tokencraft-gate-a1-0ff659be .
```

The upstream `Dockerfile` builds the web and Go components and copies
`LICENSE`, `NOTICE`, and `THIRD-PARTY-LICENSES.md` into `/licenses` in the
resulting image. The official upstream OCI index
`sha256:ebf9066d8aae0d1efe41434692c3bcfeffa3be997b343b93adc16e170647de2b`
is provenance for the approved unmodified upstream release only; it is not a
digest for this modified source or image. The reviewed local custom-image
evidence `sha256:931d2bca1ed2fc272acad1d119ffb543830a5f5e5cd6b0934082b22bc00fcf59`
relates to this patched-source Gate A1 review, but is not a public image
publication and does not indicate a production deployment. Production remained
on the official image when this source was published.

## Warranty

This modification is provided under the same AGPL-3.0 license terms as the
upstream work, without warranty. See the upstream license and notices retained
in this repository for the complete terms and attributions.
