#!/usr/bin/env bash

set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <path/to/YourProject>" >&2
  exit 1
fi

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
source_dir="$(cd -- "${script_dir}/../src" && pwd)"
scripts_dir="$1/Scripts"

mkdir -p -- "$scripts_dir"
scripts_dir="$(cd -- "$scripts_dir" && pwd)"
install_path="${scripts_dir}/Inlay"

rm -rf -- "$install_path"
cp -R -- "$source_dir" "$install_path"
echo "Copied source: $source_dir -> $install_path"
