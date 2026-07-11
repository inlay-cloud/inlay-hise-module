#!/usr/bin/env bash

set -euo pipefail

gh release create "$GITHUB_REF_NAME" \
    Inlay.zip \
    --title "$GITHUB_REF_NAME" \
    --verify-tag
