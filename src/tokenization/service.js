import { assertAddress, assertBytes32, WRITE_OPERATION } from "./domain.js";

export class TokenizationService {
  constructor({ chainClient, auditLog, transactionStore, clock = () => new Date().toISOString() }) {
    if (!chainClient) {
      throw new Error("chainClient is required");
    }
    if (!auditLog) {
      throw new Error("auditLog is required");
    }
    if (!transactionStore) {
      throw new Error("transactionStore is required");
    }

    this.chainClient = chainClient;
    this.auditLog = auditLog;
    this.transactionStore = transactionStore;
    this.clock = clock;
  }

  async registerWallet(config, command) {
    assertOperator(command.operatorId);
    assertAddress(command.wallet, "wallet");
    assertBytes32(command.identityId, "identityId");

    const tx = await this.chainClient.registerIdentity(config, {
      wallet: command.wallet,
      identityId: command.identityId
    });

    return this.#recordWrite({
      operation: WRITE_OPERATION.REGISTER_WALLET,
      dealId: config.dealId,
      txHash: tx.txHash,
      operatorId: command.operatorId,
      subject: command.wallet,
      metadata: {
        identityId: command.identityId,
        reason: command.reason
      }
    });
  }

  async addClaim(config, command) {
    assertOperator(command.operatorId);
    assertAddress(command.wallet, "wallet");
    assertAddress(command.issuer, "issuer");
    assertTopic(command.topic);

    const tx = await this.chainClient.addClaim(config, {
      wallet: command.wallet,
      topic: command.topic,
      issuer: command.issuer
    });

    return this.#recordWrite({
      operation: WRITE_OPERATION.ADD_CLAIM,
      dealId: config.dealId,
      txHash: tx.txHash,
      operatorId: command.operatorId,
      subject: command.wallet,
      metadata: {
        topic: command.topic,
        issuer: command.issuer
      }
    });
  }

  async mint(config, command) {
    assertOperator(command.operatorId);
    assertAddress(command.investor, "investor");
    assertBytes32(command.offchainRef, "offchainRef");
    assertPositiveAmount(command.amount);

    const tx = await this.chainClient.mintTo(config, {
      investor: command.investor,
      amount: command.amount,
      offchainRef: command.offchainRef
    });

    return this.#recordWrite({
      operation: WRITE_OPERATION.MINT,
      dealId: config.dealId,
      txHash: tx.txHash,
      operatorId: command.operatorId,
      subject: command.investor,
      metadata: {
        amount: command.amount,
        offchainRef: command.offchainRef
      }
    });
  }

  async approveTransfer(config, command) {
    assertOperator(command.operatorId);
    assertAddress(command.from, "from");
    assertAddress(command.to, "to");
    assertBytes32(command.requestId, "requestId");
    assertPositiveAmount(command.amount);

    const tx = await this.chainClient.controlledTransfer(config, {
      from: command.from,
      to: command.to,
      amount: command.amount,
      requestId: command.requestId
    });

    return this.#recordWrite({
      operation: WRITE_OPERATION.APPROVE_TRANSFER,
      dealId: config.dealId,
      txHash: tx.txHash,
      operatorId: command.operatorId,
      subject: command.from,
      metadata: {
        to: command.to,
        amount: command.amount,
        requestId: command.requestId,
        approvalRef: command.approvalRef
      }
    });
  }

  async markTransactionConfirmed(txHash, receipt) {
    return this.transactionStore.markConfirmed(txHash, receipt);
  }

  async markTransactionFailed(txHash, failure) {
    return this.transactionStore.markFailed(txHash, failure);
  }

  async #recordWrite({ operation, dealId, txHash, operatorId, subject, metadata }) {
    const occurredAt = this.clock();

    const transaction = await this.transactionStore.addSubmitted({
      operation,
      dealId,
      txHash,
      metadata,
      submittedAt: occurredAt
    });

    await this.auditLog.record({
      operation,
      dealId,
      txHash,
      operatorId,
      subject,
      metadata,
      occurredAt
    });

    return transaction;
  }
}

function assertOperator(operatorId) {
  if (!operatorId) {
    throw new Error("operatorId is required");
  }
}

function assertTopic(topic) {
  if (!Number.isInteger(topic) || topic <= 0) {
    throw new Error("topic must be a positive integer");
  }
}

function assertPositiveAmount(amount) {
  if (typeof amount !== "string" || !/^[1-9][0-9]*$/.test(amount)) {
    throw new Error("amount must be a positive integer string in base units");
  }
}
