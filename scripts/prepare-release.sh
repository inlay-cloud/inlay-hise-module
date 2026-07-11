#!/usr/bin/env bash

set -euo pipefail

git fetch origin dist:refs/remotes/origin/dist

if ! git merge-base --is-ancestor "$GITHUB_SHA" refs/remotes/origin/dist; then
    echo "eligible=false" >> "$GITHUB_OUTPUT"
    echo "Tagged commit is not on the dist branch; skipping release."
    exit 0
fi

echo "eligible=true" >> "$GITHUB_OUTPUT"

shopt -s nullglob
files=(./*.js)

if (( ${#files[@]} == 0 )); then
    echo "No JavaScript files were found in the repository root." >&2
    exit 1
fi

zip -j Inlay.zip "${files[@]}"
