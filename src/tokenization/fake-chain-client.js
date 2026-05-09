export class FakeTokenizationChainClient {
  #counter = 0;
  calls = [];

  async registerIdentity(config, { wallet, identityId }) {
    return this.#record("registerIdentity", config, { wallet, identityId });
  }

  async addClaim(config, { wallet, topic, issuer }) {
    return this.#record("addClaim", config, { wallet, topic, issuer });
  }

  async mintTo(config, { investor, amount, offchainRef }) {
    return this.#record("mintTo", config, { investor, amount, offchainRef });
  }

  async controlledTransfer(config, { from, to, amount, requestId }) {
    return this.#record("controlledTransfer", config, { from, to, amount, requestId });
  }

  async #record(method, config, args) {
    this.#counter += 1;
    const txHash = `0x${this.#counter.toString(16).padStart(64, "0")}`;
    const call = Object.freeze({
      method,
      dealId: config.dealId,
      args: Object.freeze({ ...args }),
      txHash
    });

    this.calls.push(call);
    return { txHash };
  }
}
