const identityRegistryAbi = [
  "function registerIdentity(address wallet, bytes32 identityId)",
  "function addClaim(address wallet, uint256 topic, address issuer)"
];

const offeringControllerAbi = [
  "function registerIdentity(address wallet, bytes32 identityId)",
  "function addClaim(address wallet, uint256 topic, address issuer)",
  "function mintTo(address investor, uint256 amount, bytes32 offchainRef)",
  "function controlledTransfer(address from, address to, uint256 amount, bytes32 requestId)"
];

export class EthersTokenizationChainClient {
  constructor({ ethers, signer }) {
    if (!ethers) {
      throw new Error("ethers module is required");
    }

    if (!signer) {
      throw new Error("signer is required");
    }

    this.ethers = ethers;
    this.signer = signer;
  }

  async registerIdentity(config, { wallet, identityId }) {
    const contract = this.#offeringController(config);
    const tx = await contract.registerIdentity(wallet, identityId);
    return { txHash: tx.hash };
  }

  async addClaim(config, { wallet, topic, issuer }) {
    const contract = this.#offeringController(config);
    const tx = await contract.addClaim(wallet, topic, issuer);
    return { txHash: tx.hash };
  }

  async mintTo(config, { investor, amount, offchainRef }) {
    const contract = this.#offeringController(config);
    const tx = await contract.mintTo(investor, amount, offchainRef);
    return { txHash: tx.hash };
  }

  async controlledTransfer(config, { from, to, amount, requestId }) {
    const contract = this.#offeringController(config);
    const tx = await contract.controlledTransfer(from, to, amount, requestId);
    return { txHash: tx.hash };
  }

  #offeringController(config) {
    return new this.ethers.Contract(
      config.contracts.offeringController,
      offeringControllerAbi,
      this.signer
    );
  }

  #identityRegistry(config) {
    return new this.ethers.Contract(
      config.contracts.identityRegistry,
      identityRegistryAbi,
      this.signer
    );
  }
}
