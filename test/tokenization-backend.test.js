import test from "node:test";
import assert from "node:assert/strict";

import {
  createDealTokenConfig,
  FakeTokenizationChainClient,
  InMemoryAuditLog,
  InMemoryTransactionStore,
  TokenizationService,
  TRANSACTION_STATUS,
  WRITE_OPERATION
} from "../src/tokenization/index.js";

const addresses = {
  identityRegistry: "0x1111111111111111111111111111111111111111",
  claimTopicsRegistry: "0x2222222222222222222222222222222222222222",
  trustedIssuersRegistry: "0x3333333333333333333333333333333333333333",
  compliance: "0x4444444444444444444444444444444444444444",
  dealToken: "0x5555555555555555555555555555555555555555",
  offeringController: "0x6666666666666666666666666666666666666666"
};

const walletA = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const walletB = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
const issuer = "0x7777777777777777777777777777777777777777";
const bytes32 = "0x" + "1".repeat(64);

function setup() {
  const config = createDealTokenConfig({
    dealId: "deal_001",
    chainId: 80002,
    contracts: addresses,
    requiredClaimTopics: [1, 2],
    trustedIssuer: issuer
  });

  const chainClient = new FakeTokenizationChainClient();
  const auditLog = new InMemoryAuditLog();
  const transactionStore = new InMemoryTransactionStore();
  const service = new TokenizationService({
    chainClient,
    auditLog,
    transactionStore,
    clock: () => "2026-05-09T21:00:00.000Z"
  });

  return { auditLog, chainClient, config, service, transactionStore };
}

test("validates deal token config without private key material", () => {
  const config = createDealTokenConfig({
    dealId: "deal_001",
    chainId: 80002,
    contracts: addresses,
    requiredClaimTopics: [1, 2],
    trustedIssuer: issuer,
    privateKey: "must-not-be-retained"
  });

  assert.equal(config.dealId, "deal_001");
  assert.equal(config.privateKey, undefined);
});

test("registerWallet writes chain transaction and audit entry", async () => {
  const { auditLog, chainClient, config, service, transactionStore } = setup();

  const tx = await service.registerWallet(config, {
    wallet: walletA,
    identityId: bytes32,
    operatorId: "ops-user-1",
    reason: "KYC approved"
  });

  assert.equal(tx.status, TRANSACTION_STATUS.SUBMITTED);
  assert.equal(chainClient.calls[0].method, "registerIdentity");

  const auditEntries = await auditLog.list();
  assert.equal(auditEntries.length, 1);
  assert.equal(auditEntries[0].operation, WRITE_OPERATION.REGISTER_WALLET);
  assert.equal(auditEntries[0].txHash, tx.txHash);

  assert.equal((await transactionStore.get(tx.txHash)).operation, WRITE_OPERATION.REGISTER_WALLET);
});

test("addClaim, mint and approveTransfer each emit audit entries", async () => {
  const { auditLog, config, service } = setup();

  await service.addClaim(config, {
    wallet: walletA,
    topic: 1,
    issuer,
    operatorId: "ops-user-1"
  });

  await service.mint(config, {
    investor: walletA,
    amount: "1000000000000000000",
    offchainRef: bytes32,
    operatorId: "ops-user-2"
  });

  await service.approveTransfer(config, {
    from: walletA,
    to: walletB,
    amount: "250000000000000000",
    requestId: bytes32,
    approvalRef: "approval-42",
    operatorId: "ops-user-3"
  });

  const operations = (await auditLog.list()).map((entry) => entry.operation);
  assert.deepEqual(operations, [
    WRITE_OPERATION.ADD_CLAIM,
    WRITE_OPERATION.MINT,
    WRITE_OPERATION.APPROVE_TRANSFER
  ]);
});

test("tracks confirmed and failed transaction statuses", async () => {
  const { config, service, transactionStore } = setup();

  const tx = await service.mint(config, {
    investor: walletA,
    amount: "1",
    offchainRef: bytes32,
    operatorId: "ops-user-2"
  });

  await service.markTransactionConfirmed(tx.txHash, { blockNumber: 123 });
  assert.equal((await transactionStore.get(tx.txHash)).status, TRANSACTION_STATUS.CONFIRMED);

  const failedTx = await service.approveTransfer(config, {
    from: walletA,
    to: walletB,
    amount: "1",
    requestId: bytes32,
    operatorId: "ops-user-3"
  });

  await service.markTransactionFailed(failedTx.txHash, { error: "reverted" });
  assert.equal((await transactionStore.get(failedTx.txHash)).status, TRANSACTION_STATUS.FAILED);
});

test("rejects write commands without operator id", async () => {
  const { config, service } = setup();

  await assert.rejects(
    service.mint(config, {
      investor: walletA,
      amount: "1",
      offchainRef: bytes32
    }),
    /operatorId is required/
  );
});
