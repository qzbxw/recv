#!/usr/bin/env sh
set -eu

profile="${1:-coverage.out}"
minimum="${COVERAGE_MIN:-45}"
export GOCACHE="${GOCACHE:-/tmp/reqst-go-build}"

total="$(go tool cover -func="$profile" | awk '/^total:/ { gsub("%", "", $3); print $3 }')"
if [ -z "$total" ]; then
  echo "could not read total coverage from $profile" >&2
  exit 1
fi

awk -v total="$total" -v minimum="$minimum" 'BEGIN {
  if (total + 0 < minimum + 0) {
    printf("backend coverage %.1f%% is below required %.1f%%\n", total, minimum) > "/dev/stderr"
    exit 1
  }
  printf("backend coverage %.1f%% meets required %.1f%%\n", total, minimum)
}'
