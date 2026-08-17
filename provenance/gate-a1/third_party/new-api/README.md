# TokenCraft New API identity patch

This directory pins the source and official OCI lineage used to build the
TokenCraft-specific New API image. A build must clone the annotated upstream
tag, verify its peeled commit, apply the checked-in patch, and build only from
that verified local tree. It must not use a floating tag or patch an official
binary image.

The upstream project is AGPL-3.0. Any published or network-served custom image
must retain `LICENSE`, `NOTICE`, and `THIRD-PARTY-LICENSES.md`, preserve the
required attribution, mark this modification, and make Corresponding Source
and build instructions available before release.

Run `scripts/verify-new-api-a1.sh <clean-new-api-clone>` before a build. The
clone must be checked out at the lock's peeled commit; the verifier rejects a
different remote, tag object, source commit, patch hash, or licence files. It
then performs `git apply --check`, applies the patch, runs the bounded Go tests
in the pinned Go builder image, and builds the supplied custom image tag. The
official OCI digest is provenance for the approved base release only: it is
never retagged as the modified image and any digest drift fails verification.

Corresponding Source is this exact upstream commit plus the checked-in patch;
the upstream `LICENSE`, `NOTICE`, and `THIRD-PARTY-LICENSES.md` remain in the
image at `/licenses`. A release must publish this directory, its lockfile, and
the verifier command together with the modified image reference.
