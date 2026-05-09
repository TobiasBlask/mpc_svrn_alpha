# POC Credentials Explained

This document explains the access data we need for the first MPC Private Access tokenization POC. It is written for a non-Web3-native operator.

The POC goal is simple:

```text
Create a test project
deploy a test security token
allow one test wallet to receive it
block non-approved wallets
verify everything on Polygon Amoy testnet
```

No real investor money, no real securities, and no mainnet deployment are involved at this stage.

## Quick Summary

| Credential | What it is | Why we need it | Risk level |
|---|---|---|---|
| Polygon Amoy RPC URL | API endpoint to talk to Polygon testnet | Deploy and read contracts | Low |
| Testnet wallet private key | Signing key for test deployments | Deploy contracts and mint test tokens | High, but testnet-only |
| Amoy test POL | Fake testnet gas token | Pay testnet transaction fees | Low |
| PolygonScan API key | Explorer API key | Verify contracts publicly | Low/Medium |
| WalletConnect Project ID | App ID for wallet connection | Let users connect wallets later | Low |
| Postgres URL | Sandbox database connection | Store deals, investors, subscriptions later | Medium |
| GitHub access | Repo access | Code, CI, PR flow | Medium/High |

## 1. Polygon Amoy RPC URL

### Plain-English Explanation

An RPC URL is the app's connection point to a blockchain network.

Think of it like:

```text
Browser -> website server
Tokenization backend -> Polygon RPC URL
```

The app does not talk directly to every Polygon node. It sends requests to an RPC provider, and that provider relays them to the Polygon network.

### Why We Need It

We need it to:

- deploy test token contracts
- read wallet balances
- submit mint transactions
- test transfer rules

### What To Use For POC

For the first test, this public RPC is enough:

```text
https://polygon-amoy.drpc.org
```

Put it into `.env.poc` as:

```bash
POLYGON_AMOY_RPC_URL=https://polygon-amoy.drpc.org
```

### Better Later

For more stable testing, create a free account at one of:

- Alchemy
- Infura
- QuickNode
- Ankr

Then use the provider-specific Polygon Amoy RPC URL.

## 2. Testnet Deployer Wallet

### Plain-English Explanation

A wallet is the account that signs blockchain transactions.

The deployer wallet is like the technical admin account for the testnet:

```text
It deploys contracts
It creates test tokens
It sets test permissions
```

The private key is the password/signature key for that wallet.

### Why This Is Sensitive

Anyone with the private key can act as that wallet.

For the POC, this wallet must be:

```text
testnet only
no real assets
no mainnet funds
not reused for production
```

### How To Create One

Run:

```bash
npm run poc:wallet
```

This prints a testnet private key.

Then:

1. Import that private key into MetaMask or another wallet.
2. Copy the wallet address from MetaMask.
3. Put both values into `.env.poc`.

Example format:

```bash
POC_DEPLOYER_PRIVATE_KEY=0x...
POC_DEPLOYER_ADDRESS=0x...
```

Never paste the real private key into:

- Chat
- Linear
- GitHub
- screenshots
- public documentation

## 3. Amoy Test POL

### Plain-English Explanation

Every blockchain transaction needs a small transaction fee, called gas.

On Polygon Amoy testnet, the gas token is fake test POL. It has no real value.

### Why We Need It

The deployer wallet needs test POL to:

- deploy contracts
- mint test tokens
- update allowlists
- test transfers

### How To Get It

Use a Polygon Amoy faucet. A faucet is a website that sends free test tokens to your test wallet.

You will need:

```text
your deployer wallet address
```

Then request test POL from a faucet.

Polygon documentation says the official Polygon faucet has been discontinued and points to third-party faucets such as Alchemy, QuickNode, GetBlock or StakePool.

## 4. PolygonScan API Key

### Plain-English Explanation

PolygonScan is the block explorer for Polygon.

A block explorer lets humans inspect blockchain activity:

```text
Which contract was deployed?
Which wallet owns tokens?
Which transaction succeeded or failed?
```

The API key lets our tooling verify a contract automatically.

### Why We Need It

When we deploy a contract, verification makes the source code readable on PolygonScan.

That helps us and later auditors inspect:

- contract source code
- deployment address
- transaction history
- token events

### What To Do

Create an account/API key on PolygonScan and put it into `.env.poc`:

```bash
POLYGONSCAN_API_KEY=...
```

Keep:

```bash
POLYGONSCAN_API_URL=https://api-amoy.polygonscan.com/api
```

## 5. WalletConnect / Reown Project ID

### Plain-English Explanation

WalletConnect lets a user connect their wallet to a web app.

Reown is the current WalletConnect infrastructure provider.

The Project ID is not a wallet key. It is more like an app identifier.

### Why We Need It

Later, the investor app needs a button like:

```text
Connect wallet
```

The WalletConnect Project ID allows that connection flow to work reliably.

### What To Do

Create a project in Reown Cloud:

```text
https://dashboard.reown.com
```

Put the Project ID into `.env.poc`:

```bash
WALLETCONNECT_PROJECT_ID=...
```

For local development, allow:

```text
http://localhost:4173
http://127.0.0.1:4173
```

## 6. Postgres Sandbox Database

### Plain-English Explanation

The blockchain stores token ownership and transfer events. It should not store private investor information.

The database stores normal app data:

- users
- investors
- KYC status
- deals
- subscriptions
- payment status
- admin approvals
- audit logs

### Why We Need It

For the first pure smart-contract POC, we can delay the database.

For the first backend POC, we need a sandbox Postgres database.

### What To Use

Any of these are fine:

- Supabase
- Neon
- Railway
- Render
- local Postgres

Put the connection string into `.env.poc`:

```bash
DATABASE_URL=postgresql://...
```

Do not use a production MPC database for the POC.

## 7. GitHub Access

### Plain-English Explanation

GitHub is where the code should live once we move beyond local prototyping.

### Why We Need It

We need it for:

- branches
- pull requests
- code review
- CI checks
- later deployment

### Current Status

The GitHub CLI is already logged in locally.

What is still missing:

```text
a dedicated GitHub repository for MPC Private Access
```

Once created, add it to `.env.poc`:

```bash
GITHUB_REPOSITORY=owner/mpc-private-access
```

## Local Setup Steps

Create the local secret file:

```bash
cp .env.poc.example .env.poc
```

Fill in the values.

Check whether the required values are present:

```bash
npm run poc:check
```

Generate a testnet wallet if needed:

```bash
npm run poc:wallet
```

## What Not To Do

Do not put secrets in:

- Linear issues or comments
- Git commits
- Chat messages
- screenshots
- public docs
- presentation decks

For the POC, `.env.poc` is acceptable locally because it is ignored by Git. For production, credentials must move into a proper secret manager.
