#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SYMPHONY_REPO="${SYMPHONY_REPO:-$HOME/Documents/symphony}"
SYMPHONY_ELIXIR="$SYMPHONY_REPO/elixir"
SYMPHONY_PORT="${SYMPHONY_PORT:-4000}"
WORKFLOW_FILE="$PROJECT_ROOT/WORKFLOW.md"
LOGS_ROOT="$PROJECT_ROOT/.symphony-logs"

KEYCHAIN_SERVICES=(
  "${SYMPHONY_LINEAR_KEYCHAIN_SERVICE:-mpc-private-access-symphony-linear-api-key}"
  "premise-symphony-linear-api-key"
)

if [ -z "${LINEAR_API_KEY:-}" ] && command -v security >/dev/null 2>&1; then
  for service in "${KEYCHAIN_SERVICES[@]}"; do
    LINEAR_API_KEY="$(security find-generic-password -a "$USER" -s "$service" -w 2>/dev/null || true)"
    if [ -z "$LINEAR_API_KEY" ]; then
      LINEAR_API_KEY="$(security find-generic-password -s "$service" -w 2>/dev/null || true)"
    fi
    if [ -n "$LINEAR_API_KEY" ]; then
      export LINEAR_API_KEY
      break
    fi
  done
fi

if [ -z "${LINEAR_API_KEY:-}" ]; then
  if [ -t 0 ]; then
    printf "Linear API key: " >&2
    IFS= read -r -s LINEAR_API_KEY
    printf "\n" >&2
    export LINEAR_API_KEY

    if [ -n "$LINEAR_API_KEY" ] && command -v security >/dev/null 2>&1; then
      security add-generic-password -a "$USER" -s "mpc-private-access-symphony-linear-api-key" -w "$LINEAR_API_KEY" -U >/dev/null 2>&1 || true
    fi
  fi
fi

if [ -z "${LINEAR_API_KEY:-}" ]; then
  echo "LINEAR_API_KEY is not set." >&2
  echo "Export it, or store a rotated key in Keychain with:" >&2
  echo "security add-generic-password -a \"$USER\" -s mpc-private-access-symphony-linear-api-key -w '<rotated-linear-api-key>' -U" >&2
  exit 1
fi

if ! command -v mise >/dev/null 2>&1; then
  echo "mise is required. Install it with: brew install mise" >&2
  exit 1
fi

if [ ! -d "$SYMPHONY_REPO/.git" ]; then
  git clone https://github.com/openai/symphony "$SYMPHONY_REPO"
fi

mkdir -p "$PROJECT_ROOT/.symphony-workspaces" "$LOGS_ROOT"

cd "$SYMPHONY_ELIXIR"
mise trust
mise install
mise exec -- mix setup

if [ ! -x "$SYMPHONY_ELIXIR/bin/symphony" ]; then
  mise exec -- mix build
fi

exec mise exec -- ./bin/symphony \
  --i-understand-that-this-will-be-running-without-the-usual-guardrails \
  "$WORKFLOW_FILE" \
  --logs-root "$LOGS_ROOT" \
  --port "$SYMPHONY_PORT"
