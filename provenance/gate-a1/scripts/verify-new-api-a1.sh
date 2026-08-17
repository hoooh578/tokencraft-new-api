#!/usr/bin/env bash
set -euo pipefail

root=$(cd "$(dirname "$0")/.." && pwd)
source_dir=${1:?usage: verify-new-api-a1.sh <clean-new-api-clone> [custom-image-tag]}
image_tag=${2:-tokencraft/new-api-gate-a1:local}
lock="$root/third_party/new-api/UPSTREAM.lock.json"
patch="$root/third_party/new-api/patches/0001-persist-tc-request-id.patch"

read_lock() { node -e "const v=require(process.argv[1]); console.log(process.argv[2].split('.').reduce((o,k)=>o[k],v))" "$lock" "$1"; }
tag_object=$(read_lock upstream.tagObject)
tag=$(read_lock upstream.tag)
commit=$(read_lock upstream.commit)
license=$(read_lock upstream.license)
patch_sha=$(read_lock patch.sha256)
oci_digest=$(read_lock officialImage.ociIndexDigest)

[ "$license" = AGPL-3.0-only ]
[ "$(git -C "$source_dir" remote get-url origin)" = https://github.com/QuantumNous/new-api ]
[ "$(git -C "$source_dir" cat-file -t "$tag_object")" = tag ]
[ "$(git -C "$source_dir" rev-parse "refs/tags/$tag")" = "$tag_object" ]
[ "$(git -C "$source_dir" rev-parse "$tag_object^{}")" = "$commit" ]
[ "$(git -C "$source_dir" rev-parse HEAD)" = "$commit" ]
[ -z "$(git -C "$source_dir" status --porcelain --untracked-files=all)" ]
[ "$(shasum -a 256 "$patch" | awk '{print $1}')" = "$patch_sha" ]
[ "$(docker buildx imagetools inspect "calciumion/new-api:$tag" --format '{{.Digest}}')" = "$oci_digest" ]
for file in LICENSE NOTICE THIRD-PARTY-LICENSES.md; do test -s "$source_dir/$file"; done
git -C "$source_dir" apply --check "$patch"
git -C "$source_dir" apply "$patch"
docker run --rm -v "$source_dir:/src" -w /src \
  golang:1.26.1-alpine@sha256:2389ebfa5b7f43eeafbd6be0c3700cc46690ef842ad962f6c5bd6be49ed82039 \
  sh -c 'go test ./middleware ./model'
docker build --tag "$image_tag" "$source_dir"
docker image inspect "$image_tag" --format 'custom_image_id={{.Id}}'
