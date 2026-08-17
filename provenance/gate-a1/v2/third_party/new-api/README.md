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

Before a candidate build, anonymously fetch the public source-offer tag and
archive, then run `scripts/verify-new-api-source-offer.mjs --source-dir
<public-source-clone> --archive <public-tag-archive.tar> --upstream-dir
<clean-upstream-clone> --receipt <receipt.json>`. This provenance verifier
requires the exact public repository, annotated tag object, peeled commit,
parent, archive SHA-256, upstream clean tree, and canonical patch. It
reconstructs the expected source tree and fails closed on any changed blob,
path, file mode, symlink, submodule, or unallowlisted provenance document.

The receipt binds Git tree identity and a canonical Docker-build-context
filesystem manifest. These are not an archive checksum, Docker config image
ID, or OCI manifest digest; final image-digest binding remains a later
production-candidate public release record. This verifier never builds or
pushes an image.

`scripts/verify-new-api-a1.sh <clean-new-api-clone> [custom-image-tag]` remains
the separate canonical build verifier: it checks the pinned upstream annotated
tag, AGPL license files, official OCI digest, canonical patch, bounded Go
tests, and the local Docker build/image ID. Its Docker config image ID is not
an OCI manifest digest and is not evidence from the public-source receipt.

Corresponding Source is this exact upstream commit plus the checked-in patch;
the upstream `LICENSE`, `NOTICE`, and `THIRD-PARTY-LICENSES.md` remain in the
image at `/licenses`. A release must publish this directory, its lockfile, and
the verifier command together with the modified image reference.
