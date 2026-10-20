#!/usr/bin/env bash
# Attach this version's tarball to the GitHub Release for the tag.
# A missing release is created as a draft. An existing release, including a
# draft, only gains assets whose names are not already attached. A matching
# tarball or SHA256SUMS is left in place and this script exits 1. The notes,
# the draft or published state, and which release is latest are not changed.
set -euo pipefail

version="${VERSION:?}"
repo="${GITHUB_REPOSITORY:?}"
tag="v${version}"
tarball="release/dsh-glassui-${version}.tgz"
sums="release/SHA256SUMS"

if gh release view "$tag" --repo "$repo" >/dev/null 2>&1; then
  names="$(gh release view "$tag" --repo "$repo" --json assets --jq '.assets[].name')"
  for name in "dsh-glassui-${version}.tgz" SHA256SUMS; do
    if printf '%s\n' "$names" | grep -Fxq "$name"; then
      echo "release ${tag} already has ${name}; leaving existing assets unchanged" >&2
      exit 1
    fi
  done
  gh release upload "$tag" "$tarball" "$sums" --repo "$repo"
else
  args=(
    release create "$tag" "$tarball" "$sums"
    --draft
    --title "Glass UI ${version}"
    --notes-file notes.md
    --verify-tag
    --repo "$repo"
  )
  if [ "${PRERELEASE:-}" = "true" ]; then
    args+=(--prerelease)
  fi
  gh "${args[@]}"
fi
