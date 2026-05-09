---
tracker:
  kind: linear
  api_key: $LINEAR_API_KEY
  project_slug: mpc-private-access-779a6c14c39d
  active_states:
    - Todo
    - In Progress
  terminal_states:
    - Done
    - Canceled
    - Cancelled
    - Duplicate
polling:
  interval_ms: 15000
workspace:
  root: "/Users/tobias-benediktblask/2026 Tokenisierung/.symphony-workspaces"
hooks:
  after_create: |
    git clone https://github.com/TobiasBlask/mpc_svrn_alpha.git .
    git checkout main
    git checkout -b "$LINEAR_ISSUE_IDENTIFIER"
    git config user.name "${GIT_AUTHOR_NAME:-Codex Symphony}"
    git config user.email "${GIT_AUTHOR_EMAIL:-codex-symphony@users.noreply.github.com}"
    if [ -f "/Users/tobias-benediktblask/2026 Tokenisierung/.env.poc" ]; then
      cp "/Users/tobias-benediktblask/2026 Tokenisierung/.env.poc" .env.poc
    fi
  before_run: |
    if [ -f package.json ]; then npm install --package-lock=false; fi
  after_run: |
    if [ -f package.json ]; then npm run build; fi
  timeout_ms: 300000
agent:
  max_concurrent_agents: 1
  max_turns: 20
  max_retry_backoff_ms: 300000
codex:
  command: codex --config shell_environment_policy.inherit=all --config 'model="gpt-5.2"' --config model_reasoning_effort=medium app-server
  model: gpt-5.2
  effort: medium
  approval_policy: never
  thread_sandbox: dangerFullAccess
  turn_sandbox_policy:
    type: dangerFullAccess
  turn_timeout_ms: 3600000
  stall_timeout_ms: 300000
---
# MPC Private Access Linear Issue Workflow

You are working on MPC Private Access, a compliance-first RWA tokenization platform for German retail access to private-market secondaries.

## Operating Rules

- Treat the Linear issue as the source of truth.
- This is an unattended Symphony orchestration session. Do not ask a human for routine follow-up actions.
- Work only inside the issue workspace created by Symphony.
- Keep edits scoped to the issue and avoid unrelated refactors.
- Preserve user work and do not revert unrelated changes.
- Never commit, print, or store secrets. Linear keys, wallet private keys, KYC provider secrets, payment provider secrets, RPC credentials and custody keys are local/server-only.
- Start by confirming the issue state, title, description, acceptance criteria and labels.
- If a `Todo` issue is selected, move it to `In Progress` before implementation.
- Create or update one persistent Linear progress comment headed `## Codex Workpad`; keep plan, acceptance criteria, validation, branch/workspace and blocker status there.
- Inspect the current behavior or relevant files before changing code, then record the signal in the workpad.
- Do not deploy to mainnet, mint production tokens, approve real KYC cases, approve real payments, or execute real investor transfers.
- If external setup blocks completion, keep the issue in `In Progress`, update the workpad with the exact blocker and unblock action, and stop. Do not expose secret values.

## Product Constraints

- Token standard: ERC-3643 / permissioned security token.
- Chain target: Polygon Amoy for POC; Polygon PoS mainnet only after legal, compliance and security gates.
- Investors: German retail.
- Asset structure: SPV + tokenized debt/security instrument.
- Payments: SEPA-first.
- Transfers: controlled transfer requests only; no free ERC-20 trading or open marketplace in V1.
- Sensitive KYC/AML data stays off-chain. On-chain state should be claims, allowlists and compliance gates only.

## Git / Handoff

- Create a fresh branch from `main` for each issue, using the Linear issue identifier when available.
- Commit coherent changes after validation passes.
- Push the branch to GitHub and open or update a pull request.
- Link the PR on the Linear issue when possible.
- Do not merge automatically unless the issue explicitly requests merging and all required checks are green.

## Required Validation

Run this before handoff when relevant:

```bash
npm run build
```

Use targeted validation for contract, backend or UI work when scripts exist.

## Handoff

When done:

- Update the `## Codex Workpad` with implementation notes, changed files, validation output and blockers.
- Leave the issue in `In Progress` unless the issue explicitly allows direct completion without human review.
- If external setup blocks completion, leave the issue in progress and state the exact blocker without including secrets.
