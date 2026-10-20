#!/usr/bin/env bash
# Attach this version's tarball to the GitHub Release for the tag.
# Whether a release exists is read from `gh release list --json tagName,isDraft`
# only. A missing tag is created as a draft. A draft gains the tarball and
# SHA256SUMS only when those names are not already attached. A published
# release (isDraft is not true) is left completely unchanged and this script
# exits 1. A matching asset on a draft is also left in place and the script
# exits 1. Notes, the draft or published state, and which release is latest
# are not changed.
set -euo pipefail

version="${VERSION:?}"
repo="${GITHUB_REPOSITORY:?}"
tag="v${version}"
tarball="release/dsh-glassui-${version}.tgz"
sums="release/SHA256SUMS"

state="$(
  gh release list --repo "$repo" --limit 1000 --json tagName,isDraft |
    RELEASE_TAG="$tag" node -e '
      const tag = process.env.RELEASE_TAG
      const list = JSON.parse(require("fs").readFileSync(0, "utf8"))
      if (!Array.isArray(list)) throw new Error("release list JSON must be an array")
      const found = list.find(item => item && item.tagName === tag)
      if (!found) process.stdout.write("absent")
      else if (found.isDraft === true) process.stdout.write("draft")
      else process.stdout.write("published")
    '
)"

if [ "$state" = "published" ]; then
  echo "release ${tag} is already published; leaving the release and its assets unchanged" >&2
  exit 1
fi

if [ "$state" = "draft" ]; then
  names="$(gh release view "$tag" --repo "$repo" --json assets --jq '.assets[].name')"
  for name in "dsh-glassui-${version}.tgz" SHA256SUMS; do
    if printf '%s\n' "$names" | grep -Fxq "$name"; then
      echo "release ${tag} already has ${name}; leaving existing assets unchanged" >&2
      echo "remove it with: gh release delete-asset ${tag} ${name} --repo ${repo} --yes" >&2
      exit 1
    fi
  done
  gh release upload "$tag" "$tarball" "$sums" --repo "$repo"
elif [ "$state" = "absent" ]; then
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
else
  echo "could not classify release ${tag} from the release list" >&2
  exit 1
fi
