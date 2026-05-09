# Tokenization Backend Skeleton

This module owns chain orchestration for the MPC Private Access POC.

## Boundary

The backend service coordinates write operations against the deployed tokenization contracts:

- wallet allowlisting / identity registration
- claim writes for eligibility topics
- mint commands after off-chain subscription and payment checks
- controlled secondary transfer execution after approval
- transaction status tracking
- audit logging for every write operation

It does not own KYC evidence, investor personal data, SEPA reconciliation, or private key material.

## Runtime Model

`TokenizationService` depends on injected interfaces:

- `chainClient`: writes to contracts
- `auditLog`: records write intents/results
- `transactionStore`: tracks submitted/confirmed/failed transactions

Private keys are not part of service configuration. Production signing should happen in an injected signer or custody integration. Local development can use `FakeTokenizationChainClient`.

## Config Model

`createDealTokenConfig(...)` validates:

- deal id
- chain id
- contract addresses
- required claim topic ids
- trusted issuer address

The config intentionally excludes raw private keys.
