# Symphony Readiness

MPC Private Access is prepared for local Symphony-style autonomous Linear issue execution.

## What Symphony Does

Symphony watches selected Linear issue states, creates isolated local workspaces per issue, and starts Codex agent sessions against those issues. It is an engineering orchestrator, not a user-facing platform feature.

## Current Contract

- Tracker: Linear
- Project: `MPC Private Access`
- Project slug: `mpc-private-access-779a6c14c39d`
- Active issue states: `Todo`, `In Progress`
- Terminal issue states: `Done`, `Canceled`, `Cancelled`, `Duplicate`
- Workspace root: `/Users/tobias-benediktblask/2026 Tokenisierung/.symphony-workspaces`
- Dashboard: `http://127.0.0.1:4000/`
- Validation command: `npm run build`
- Concurrency: 1 agent

## Local Startup

Start from this project root:

```bash
scripts/start-symphony.sh
```

The script reads `LINEAR_API_KEY` from the environment or macOS Keychain. It first checks `mpc-private-access-symphony-linear-api-key`, then falls back to the existing `premise-symphony-linear-api-key` service.

## Activation

Issues in `Backlog` are intentionally ignored. Move one issue to `Todo` when you want Symphony to pick it up.

Recommended first issue:

```text
SVR-127 Define ERC-3643 contract architecture for MPC Private Access
```

## Current Limitation

This project does not yet have a GitHub remote. Symphony can create isolated local workspaces and run the Codex agent, but PR creation should remain disabled until a repository is created and linked.
