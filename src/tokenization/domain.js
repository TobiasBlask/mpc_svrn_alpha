export const REQUIRED_CONTRACTS = [
  "identityRegistry",
  "claimTopicsRegistry",
  "trustedIssuersRegistry",
  "compliance",
  "dealToken",
  "offeringController"
];

export const TRANSACTION_STATUS = Object.freeze({
  SUBMITTED: "submitted",
  CONFIRMED: "confirmed",
  FAILED: "failed"
});

export const WRITE_OPERATION = Object.freeze({
  REGISTER_WALLET: "register_wallet",
  ADD_CLAIM: "add_claim",
  MINT: "mint",
  APPROVE_TRANSFER: "approve_transfer"
});

const addressPattern = /^0x[a-fA-F0-9]{40}$/;
const bytes32Pattern = /^0x[a-fA-F0-9]{64}$/;

export function assertAddress(value, fieldName) {
  if (!addressPattern.test(value || "")) {
    throw new Error(`${fieldName} must be an EVM address`);
  }
}

export function assertBytes32(value, fieldName) {
  if (!bytes32Pattern.test(value || "")) {
    throw new Error(`${fieldName} must be bytes32`);
  }
}

export function createDealTokenConfig(input) {
  const config = {
    dealId: input.dealId,
    chainId: input.chainId,
    contracts: input.contracts || {},
    requiredClaimTopics: input.requiredClaimTopics || [],
    trustedIssuer: input.trustedIssuer
  };

  if (!config.dealId) {
    throw new Error("dealId is required");
  }

  if (!Number.isInteger(config.chainId)) {
    throw new Error("chainId must be an integer");
  }

  for (const contractName of REQUIRED_CONTRACTS) {
    assertAddress(config.contracts[contractName], `contracts.${contractName}`);
  }

  for (const topic of config.requiredClaimTopics) {
    if (!Number.isInteger(topic) || topic <= 0) {
      throw new Error("requiredClaimTopics must contain positive integers");
    }
  }

  assertAddress(config.trustedIssuer, "trustedIssuer");

  return Object.freeze({
    ...config,
    contracts: Object.freeze({ ...config.contracts }),
    requiredClaimTopics: Object.freeze([...config.requiredClaimTopics])
  });
}
