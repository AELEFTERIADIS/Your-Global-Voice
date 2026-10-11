#!/usr/bin/env bash
set -euo pipefail
# Install only the pinned, checksum-verified scanner in a disposable directory.
scanner_dir="$(mktemp -d "${RUNNER_TEMP:-/tmp}/ygv-gitleaks.XXXXXX")"
curl --fail --location --silent --show-error --max-time 60 \
  https://github.com/gitleaks/gitleaks/releases/download/v8.24.3/gitleaks_8.24.3_linux_x64.tar.gz \
  --output "$scanner_dir/gitleaks.tar.gz"
(cd "$scanner_dir" && printf '%s  gitleaks.tar.gz\n' '9991e0b2903da4c8f6122b5c3186448b927a5da4deef1fe45271c3793f4ee29c' | sha256sum --check)
tar -xzf "$scanner_dir/gitleaks.tar.gz" -C "$scanner_dir" gitleaks
"$scanner_dir/gitleaks" git . --log-opts='--all' --config .github/gitleaks.toml --redact=100 --no-banner
"$scanner_dir/gitleaks" dir . --config .github/gitleaks.toml --redact=100 --no-banner
