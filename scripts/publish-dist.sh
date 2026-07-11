#!/usr/bin/env bash
#
# Usage examples:
#   ./scripts/publish-dist.sh
#   ./scripts/publish-dist.sh --push
#   SRC_DIR=Src ./scripts/publish-dist.sh --push

set -euo pipefail

SRC_REF="${SRC_REF:-main}"
SRC_DIR="${SRC_DIR:-src}"
DIST_BRANCH="${DIST_BRANCH:-dist}"
REMOTE="${REMOTE:-origin}"

push=false

usage() {
    echo "Usage: $0 [--push]" >&2
}

case "${1:-}" in
    "")
        ;;
    --push)
        push=true
        ;;
    -h|--help)
        usage
        exit 0
        ;;
    *)
        usage
        echo "Error: unsupported argument: $1" >&2
        exit 2
        ;;
esac

if (( $# > 1 )); then
    usage
    echo "Error: too many arguments." >&2
    exit 2
fi

if ! repo_root="$(git rev-parse --show-toplevel 2>/dev/null)"; then
    echo "Error: this script must be run inside a Git repository." >&2
    exit 1
fi

cd "$repo_root"

echo "Validating repository state..."

if [[ -n "$(git status --porcelain --untracked-files=all)" ]]; then
    echo "Error: the working tree is not clean. Commit, stash, or remove changes before publishing." >&2
    exit 1
fi

if ! git check-ref-format --branch "$SRC_REF" >/dev/null 2>&1; then
    echo "Error: invalid source branch name: $SRC_REF" >&2
    exit 1
fi

if ! git check-ref-format --branch "$DIST_BRANCH" >/dev/null 2>&1; then
    echo "Error: invalid dist branch name: $DIST_BRANCH" >&2
    exit 1
fi

if ! git show-ref --verify --quiet "refs/heads/$SRC_REF"; then
    echo "Error: source branch '$SRC_REF' does not exist locally." >&2
    exit 1
fi

if [[ "$(git symbolic-ref --quiet --short HEAD 2>/dev/null || true)" == "$DIST_BRANCH" ]]; then
    echo "Error: cannot publish while '$DIST_BRANCH' is checked out." >&2
    exit 1
fi

if ! src_type="$(git cat-file -t "${SRC_REF}:${SRC_DIR}" 2>/dev/null)"; then
    echo "Error: '$SRC_DIR' does not exist in source branch '$SRC_REF'." >&2
    exit 1
fi

if [[ "$src_type" != "tree" ]]; then
    echo "Error: '$SRC_DIR' in source branch '$SRC_REF' is not a directory." >&2
    exit 1
fi

unlocker_path="${SRC_DIR%/}/Unlocker.js"
release_workflow_path=".github/workflows/release.yml"

if ! unlocker_source="$(git show "${SRC_REF}:${unlocker_path}" 2>/dev/null)"; then
    echo "Error: '$unlocker_path' does not exist in source branch '$SRC_REF'." >&2
    exit 1
fi

if ! release_workflow_blob="$(git rev-parse "${SRC_REF}:${release_workflow_path}" 2>/dev/null)"; then
    echo "Error: '$release_workflow_path' does not exist in source branch '$SRC_REF'." >&2
    exit 1
fi

module_version="$(
    sed -nE \
        's/^[[:space:]]*const[[:space:]]+var[[:space:]]+moduleVersion[[:space:]]*=[[:space:]]*"HISE-([0-9]+\.[0-9]+\.[0-9]+)"[[:space:]]*;.*$/\1/p' \
        <<< "$unlocker_source"
)"

if [[ -z "$module_version" ]]; then
    echo "Error: could not parse a moduleVersion in the form 'HISE-X.Y.Z' from '$unlocker_path'." >&2
    exit 1
fi

if [[ "$module_version" == *$'\n'* ]]; then
    echo "Error: found multiple moduleVersion declarations in '$unlocker_path'." >&2
    exit 1
fi

dist_tag="v${module_version}"

if ! git check-ref-format "refs/tags/$dist_tag" >/dev/null 2>&1; then
    echo "Error: module version produced an invalid tag name: $dist_tag" >&2
    exit 1
fi

if git show-ref --verify --quiet "refs/tags/$dist_tag"; then
    echo "Error: tag '$dist_tag' already exists locally." >&2
    exit 1
fi

if [[ "$push" == true ]] && ! git remote get-url "$REMOTE" >/dev/null 2>&1; then
    echo "Error: remote '$REMOTE' does not exist." >&2
    exit 1
fi

if [[ "$push" == true ]]; then
    echo "Checking whether tag '$dist_tag' exists on '$REMOTE'..."

    if ! remote_tag_refs="$(
        git ls-remote --tags "$REMOTE" \
            "refs/tags/$dist_tag" \
            "refs/tags/$dist_tag^{}"
    )"; then
        echo "Error: could not check tag '$dist_tag' on remote '$REMOTE'." >&2
        exit 1
    fi

    if [[ -n "$remote_tag_refs" ]]; then
        echo "Error: tag '$dist_tag' already exists on remote '$REMOTE'." >&2
        exit 1
    fi
fi

echo "Publishing module version HISE-$module_version as tag '$dist_tag'."
echo "Generating '$DIST_BRANCH' from '$SRC_DIR' on '$SRC_REF'..."
dist_commit="$(git subtree split --prefix="$SRC_DIR" "$SRC_REF")"

if ! git cat-file -e "${dist_commit}^{commit}" 2>/dev/null; then
    echo "Error: git subtree split did not produce a valid commit." >&2
    exit 1
fi

echo "Adding '$release_workflow_path' to generated distribution commit..."
dist_index="$(mktemp)"
rm -f "$dist_index"
trap 'rm -f "$dist_index"' EXIT

GIT_INDEX_FILE="$dist_index" git read-tree "$dist_commit"
GIT_INDEX_FILE="$dist_index" git update-index --add \
    --cacheinfo "100644,$release_workflow_blob,$release_workflow_path"
dist_tree="$(GIT_INDEX_FILE="$dist_index" git write-tree)"
dist_commit="$(git commit-tree "$dist_tree" -p "$dist_commit" -m 'Include release workflow')"

echo "Updating local branch '$DIST_BRANCH' to $dist_commit..."
git branch -f "$DIST_BRANCH" "$dist_commit"

echo "Tagging generated commit $dist_commit as '$dist_tag'..."
git tag "$dist_tag" "$dist_commit"

if [[ "$push" == true ]]; then
    echo "Pushing '$DIST_BRANCH' to '$REMOTE/$DIST_BRANCH' with force-with-lease..."
    git push --force-with-lease "$REMOTE" "$DIST_BRANCH:$DIST_BRANCH"

    echo "Pushing tag '$dist_tag' to '$REMOTE'..."
    git push "$REMOTE" "refs/tags/$dist_tag:refs/tags/$dist_tag"
else
    echo "Skipping push. Use --push to publish '$DIST_BRANCH' and '$dist_tag' to '$REMOTE'."
fi

echo "Latest generated '$DIST_BRANCH' commit: $dist_commit"
echo "Latest generated release tag: $dist_tag"
