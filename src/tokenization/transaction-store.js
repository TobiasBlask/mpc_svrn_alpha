import { TRANSACTION_STATUS } from "./domain.js";

export class InMemoryTransactionStore {
  #transactions = new Map();

  async addSubmitted({ operation, dealId, txHash, metadata = {}, submittedAt }) {
    const transaction = Object.freeze({
      txHash,
      operation,
      dealId,
      metadata: Object.freeze({ ...metadata }),
      status: TRANSACTION_STATUS.SUBMITTED,
      submittedAt: submittedAt || new Date().toISOString(),
      confirmedAt: null,
      failedAt: null,
      error: null
    });

    this.#transactions.set(txHash, transaction);
    return transaction;
  }

  async markConfirmed(txHash, { blockNumber, confirmedAt } = {}) {
    const existing = this.#get(txHash);
    const transaction = Object.freeze({
      ...existing,
      status: TRANSACTION_STATUS.CONFIRMED,
      blockNumber,
      confirmedAt: confirmedAt || new Date().toISOString()
    });

    this.#transactions.set(txHash, transaction);
    return transaction;
  }

  async markFailed(txHash, { error, failedAt } = {}) {
    const existing = this.#get(txHash);
    const transaction = Object.freeze({
      ...existing,
      status: TRANSACTION_STATUS.FAILED,
      failedAt: failedAt || new Date().toISOString(),
      error: error || "unknown error"
    });

    this.#transactions.set(txHash, transaction);
    return transaction;
  }

  async get(txHash) {
    return this.#transactions.get(txHash) || null;
  }

  async list() {
    return [...this.#transactions.values()];
  }

  #get(txHash) {
    const transaction = this.#transactions.get(txHash);
    if (!transaction) {
      throw new Error(`Unknown transaction: ${txHash}`);
    }
    return transaction;
  }
}
