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
link_path="${scripts_dir}/Inlay"

IFS='/' read -r -a source_parts <<< "$source_dir"
IFS='/' read -r -a scripts_parts <<< "$scripts_dir"

common_length=0
while [[ $common_length -lt ${#source_parts[@]} &&
         $common_length -lt ${#scripts_parts[@]} &&
         "${source_parts[$common_length]}" == "${scripts_parts[$common_length]}" ]]; do
  ((common_length += 1))
done

relative_source=""
for ((i = common_length; i < ${#scripts_parts[@]}; i++)); do
  relative_source+="../"
done
for ((i = common_length; i < ${#source_parts[@]}; i++)); do
  relative_source+="${source_parts[$i]}/"
done
relative_source="${relative_source%/}"

if [[ -L "$link_path" ]]; then
  rm -- "$link_path"
elif [[ -e "$link_path" ]]; then
  echo "Refusing to replace existing path: $link_path" >&2
  exit 1
fi

ln -s -- "$relative_source" "$link_path"
echo "Created symlink: $link_path -> $relative_source"
