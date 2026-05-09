# ERC-3643 Contract Architecture (MPC Private Access POC)

This document specifies the minimum on-chain contract set for the MPC Private Access tokenization POC, aligned with ERC-3643 (permissioned security token) patterns.

## Goals / Non-goals

**Goals**

- Permissioned token transfers (no free ERC-20 style trading)
- Compliance gates based on allowlists + verifiable claims (KYC/AML stays off-chain)
- Administrative ability to pause / restrict transferability in edge cases

**Non-goals (V1 / POC)**

- On-chain storage of personal/KYC data
- Public marketplace, order book, or open DEX integrations
- Automated “delivery-vs-payment” settlement on-chain (SEPA-first in V1)

## Core Contract Set (Minimum)

## Suggested Deployment Order (POC)

The following order keeps dependencies resolvable at deploy-time.

1. Deploy `ClaimTopicsRegistry`
2. Deploy `TrustedIssuersRegistry`
3. Deploy `IdentityRegistry` configured with:
   - `ClaimTopicsRegistry` address
   - `TrustedIssuersRegistry` address
4. Deploy `Compliance`
5. Deploy `DealToken` configured with:
   - `IdentityRegistry` address
   - `Compliance` address
6. Deploy `OfferingController` configured with:
   - `DealToken` address
   - privileged registrar/admin addresses (multisig preferred)

After deployment, assign roles and revoke deployer privileges.

### 1) `DealToken` (ERC-3643 token)

**Responsibility**

- Represents a single deal / instrument (SPV-issued security/debt token)
- Enforces transfer restrictions by delegating to:
  - `IdentityRegistry` (who is a verified/eligible identity)
  - `Compliance` module (rule engine)
- Exposes controlled mint/burn entry points (typically via a controller)

**Key interactions**

- `transfer` / `transferFrom` → checks `IdentityRegistry` + `Compliance`
- `mint` / `burn` → restricted to `OfferingController` (or issuer role)

### 2) `IdentityRegistry`

**Responsibility**

- Maps wallet addresses to an identity record (an identity “anchor”)
- Enforces that an address is eligible to hold/receive `DealToken`
- References claim registries to validate claims without storing sensitive data

**Notes**

- The registry should store only minimal identifiers (e.g., an `identityId` or on-chain identity contract address), not personal information.

### 3) `ClaimTopicsRegistry`

**Responsibility**

- Defines which claim topics are required/recognized for eligibility
- Examples (topics are integers / bytes32 depending on implementation):
  - KYC passed
  - AML screening passed
  - German retail suitability classification (if needed later)
  - Sanctions screening status (off-chain computed, on-chain attestable)

### 4) `TrustedIssuersRegistry`

**Responsibility**

- Lists trusted claim issuers and which claim topics they are allowed to issue
- Enables rotating/adding/removing KYC providers or internal claim issuers

### 5) `Compliance` (rule engine)

**Responsibility**

- Implements the business rules for transfers beyond basic eligibility
- Called by the token on `canTransfer(...)` (or similar hook)

**Recommended minimum rule set (POC)**

- Allow transfers only if sender and receiver are eligible identities
- Optional: freeze/paused mode
- Optional: per-address freeze list (sanctions / legal hold)
- Optional: deal lifecycle gates (e.g., transfers disabled during subscription)

### 6) `OfferingController` (minting / offering orchestration)

**Responsibility**

- Single entry point for:
  - Whitelisting onboarding events (register identity / link wallets)
  - Minting tokens after off-chain conditions are met
  - Burning/rollback if needed (under strict admin controls)

**Why a controller?**

- Keeps `DealToken` minimal
- Centralizes admin workflows and audit logging (events)
- Avoids spreading privileged roles across multiple EOAs

### 7) Transfer approval model (controlled transfers)

**Model**

- Transfers are not “free”; they are executed only after a transfer request is approved off-chain.

**Implementation options**

1. **Controller-mediated transfers (recommended for POC)**
   - Users submit an off-chain transfer request.
   - After approval, the backend calls `DealToken.transferFrom(...)` using a granted allowance OR calls a controller method that performs the transfer.

2. **Permit-style approvals (later)**
   - Users sign an EIP-2612-like permit for allowance.
   - Backend executes the transfer post-approval.

In both cases, on-chain enforcement remains in `IdentityRegistry` + `Compliance`.

## Responsibility Map

| Component | On-chain responsibilities | Off-chain responsibilities |
|---|---|---|
| DealToken | Balance accounting, transfer hooks, mint/burn entry points | Deal terms, investor communications, cap table reporting |
| IdentityRegistry | Address ↔ identity mapping, eligibility gating | Identity proofing, KYC/AML workflow, evidence storage |
| ClaimTopicsRegistry | Defines required claim topics | Policy decisions about which topics are required |
| TrustedIssuersRegistry | Whitelists claim issuers per topic | Claim issuer due diligence, key management, rotation procedures |
| Compliance | Transfer rule evaluation and global freezes | Rule configuration governance, monitoring, exception handling |
| OfferingController | Admin workflows for onboarding + issuance + controlled transfers | Subscription flow, payment reconciliation (SEPA), audit trails |
| Transfer approval (process) | Enforced by controller + compliance checks | Review/approval UI, 4-eyes, logging, investor notifications |

## System Diagram (logical)

```mermaid
flowchart LR
  subgraph OffChain[Off-chain]
    UI[Investor / Ops UI]
    KYC[KYC/AML Provider]
    BE[Backend + Workflow Engine]
    SEPA[SEPA / Bank]
  end

  subgraph OnChain[On-chain (Polygon Amoy)]
    TOK[DealToken (ERC-3643)]
    IR[IdentityRegistry]
    CTR[ClaimTopicsRegistry]
    TIR[TrustedIssuersRegistry]
    COMP[Compliance]
    OC[OfferingController]
  end

  UI --> BE
  KYC --> BE
  SEPA --> BE

  BE -->|register/link wallets| IR
  BE -->|manage issuers/topics| TIR
  BE -->|configure topics| CTR
  BE -->|pause/freeze rules| COMP
  BE -->|mint + controlled transfers| OC

  OC -->|mint/burn/transfer orchestration| TOK
  TOK -->|eligibility check| IR
  IR --> CTR
  IR --> TIR
  TOK -->|rule check| COMP
```

## Required Roles (Minimum)

Role naming can be implemented via `Ownable` / `AccessControl`. The intent is to separate duties and enable 4-eyes processes off-chain.

- **Token Admin**: upgrades/config changes for token + registries (ideally a multisig)
- **Issuer / Offering Operator**: mints/burns via `OfferingController`
- **Identity Registrar**: links wallets to identities in `IdentityRegistry`
- **Compliance Admin**: configures rules, can pause/freeze (with safeguards)
- **Trusted Issuer Admin**: manages `TrustedIssuersRegistry` entries

Operationally, the same human team may hold multiple roles at first, but the contracts should keep them distinct.

### Role Matrix (recommended mapping)

| Role | Applies to | Allowed actions |
|---|---|---|
| `DEFAULT_ADMIN_ROLE` / `OWNER` | all contracts | grant/revoke roles; update critical config |
| `ISSUER_ROLE` | `OfferingController`, `DealToken` | mint/burn (only via controller), configure offering windows |
| `REGISTRAR_ROLE` | `IdentityRegistry` | register identity anchors; link/unlink wallets |
| `COMPLIANCE_ADMIN_ROLE` | `Compliance` | pause/unpause; freeze/unfreeze addresses; update rule config |
| `TRUSTED_ISSUER_ADMIN_ROLE` | `TrustedIssuersRegistry` | add/remove issuers; assign topics per issuer |

For POC, these roles can be held by a single multisig, but should remain distinct in the contract model.

## Minimal External Interfaces (for implementation alignment)

These are intentionally simplified and meant as “shape guidance” for Solidity implementation.

### `DealToken`

- `function identityRegistry() external view returns (address)`
- `function compliance() external view returns (address)`
- `function mint(address to, uint256 amount) external` (restricted)
- `function burn(address from, uint256 amount) external` (restricted)

### `IdentityRegistry`

- `function isVerified(address wallet) external view returns (bool)`
- `function registerIdentity(address wallet, bytes32 identityId) external` (restricted)
- `function deleteIdentity(address wallet) external` (restricted)

### `Compliance`

- `function canTransfer(address from, address to, uint256 amount) external view returns (bool)`
- `function paused() external view returns (bool)`
- `function setPaused(bool paused) external` (restricted)

### `OfferingController`

- `function mintTo(address investor, uint256 amount, bytes32 offchainRef) external` (restricted)
- `function controlledTransfer(address from, address to, uint256 amount, bytes32 requestId) external` (restricted)

## Events (auditability without sensitive data)

Recommended minimum event set for operational audit trails:

- `IdentityRegistered(wallet, identityId, registrar)`
- `IdentityRemoved(wallet, registrar)`
- `TrustedIssuerAdded(issuer, topics, admin)` / `TrustedIssuerRemoved(issuer, admin)`
- `CompliancePaused(paused, admin)`
- `AddressFrozen(wallet, frozen, admin)`
- `Minted(to, amount, offchainRef, operator)`
- `ControlledTransferExecuted(from, to, amount, requestId, operator)`

## On-chain vs Off-chain Data Boundaries

**Off-chain only (must not be on-chain)**

- Personal data (name, address, ID docs, date of birth)
- KYC/AML evidence artifacts and provider responses
- Payment details (IBAN, remittance information), SEPA reconciliation data
- Full investor risk profile / suitability questionnaires

**On-chain allowed (recommended minimal set)**

- Eligibility state via claims (topic + issuer + validity) without personal data
- Allowlist / identity linkage (address ↔ identity anchor)
- Compliance gates (paused/frozen flags, rule configuration)
- Audit events for admin actions (e.g., `IdentityRegistered`, `IssuerAdded`, `CompliancePaused`)

## Polygon Amoy Deployment Assumptions (POC)

- Network: Polygon Amoy testnet (chain id `80002`)
- Contracts should be deployed with:
  - deterministic configuration captured in deployment artifacts (addresses, roles)
  - explicit admin address(es) (prefer multisig, even for testnet)
- RPC endpoints, block explorers, and private keys are local-only configuration and must not be committed.

## Operational / Security Notes (POC)

These points are included to keep the implementation compliance-first and auditable.

### Admin key management

- Prefer a multisig (even on testnet) for `DEFAULT_ADMIN_ROLE` / ownership.
- Avoid using EOAs directly for issuer/registrar/compliance admin actions.
- Plan for role separation even if a single multisig holds all roles initially.

### Upgrade strategy

- POC can start with non-upgradeable contracts if that reduces risk.
- If upgradeability is required, document:
  - proxy admin ownership (multisig)
  - upgrade policy (who can propose/execute, timelocks if any)
  - storage layout discipline

### Controlled transfers and approvals

- The on-chain restriction is enforced at execution time (registry + compliance), independent of the off-chain approval decision.
- Off-chain approval should be 4-eyes and recorded with immutable request identifiers.
- Use `bytes32 requestId` / `offchainRef` fields in controller events to link on-chain actions to off-chain audit records without leaking sensitive data.

### Pausing and emergency controls

- `Compliance` should support pausing transfers (global) and optional per-address freezes.
- Define “break-glass” procedures and event logging requirements for any emergency action.

## Open Questions / Decisions to Confirm

These are intentionally left as decisions for the next implementation ticket.

1. **Identity anchor format**: `bytes32 identityId` vs a dedicated on-chain identity contract per user.
2. **Claim representation**: topic-only boolean eligibility vs full ERC-735-like claim structure (issuer + validity + signature).
3. **Transfer execution method**: allowance-based `transferFrom` vs controller-only transfer function (no direct user transfers).
4. **Freeze semantics**: should freezes live in `Compliance`, `IdentityRegistry`, or both?
5. **Supply controls**: do we need a hard cap and/or offering windows enforced on-chain?

## Implementation Checklist (next ticket)

Use this as a practical handoff list when contracts are implemented.

- [ ] Decide identity anchor format (`bytes32 identityId` vs identity contract)
- [ ] Decide claim model (topic boolean vs issuer+signature claims)
- [ ] Choose transfer execution method (allowance-based vs controller-only)
- [ ] Define required claim topics (KYC, AML, sanctions, etc.) and topic IDs
- [ ] Define trusted issuer onboarding/rotation procedure (keys, revoke flow)
- [ ] Specify compliance rules for POC (pause + optional per-address freeze)
- [ ] Define role model and initial role holders (multisig addresses)
- [ ] Write deployment script plan and artifacts format (addresses + role assignments)
- [ ] Define event schema for audit linking (`requestId` / `offchainRef`)
- [ ] Document break-glass procedure for pause/freeze

## Suggested End-to-End Flows

### Onboarding / eligibility

1. Investor completes KYC/AML off-chain.
2. A trusted issuer issues/attests the required claim topics (off-chain evidence).
3. `IdentityRegistrar` links investor wallet(s) to an identity in `IdentityRegistry`.
4. Investor becomes eligible to receive `DealToken`.

### Subscription / minting

1. Investor subscribes off-chain; payment is reconciled via SEPA.
2. `OfferingOperator` mints via `OfferingController` to the investor wallet.

### Secondary transfer (controlled)

1. Seller submits transfer request off-chain (buyer identified).
2. Compliance review approves/denies.
3. Backend executes transfer on-chain using controller-mediated method.
4. `DealToken` enforces eligibility + compliance rules at execution time.
