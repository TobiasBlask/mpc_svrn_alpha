export const INVESTOR_TYPE = Object.freeze({
  RETAIL: "retail",
  PROFESSIONAL: "professional",
  SEMI_PROFESSIONAL: "semi_professional"
});

export const WALLET_STATUS = Object.freeze({
  PENDING_VERIFICATION: "pending_verification",
  VERIFIED: "verified",
  REJECTED: "rejected",
  REVOKED: "revoked"
});

export const KYC_STATUS = Object.freeze({
  NOT_STARTED: "not_started",
  IN_REVIEW: "in_review",
  APPROVED: "approved",
  REJECTED: "rejected",
  EXPIRED: "expired"
});

export const AML_STATUS = Object.freeze({
  NOT_SCREENED: "not_screened",
  CLEAR: "clear",
  REVIEW_REQUIRED: "review_required",
  BLOCKED: "blocked"
});

export const OFFERING_STATUS = Object.freeze({
  DRAFT: "draft",
  OPEN: "open",
  PAUSED: "paused",
  CLOSED: "closed",
  SETTLED: "settled",
  CANCELED: "canceled"
});

export const SUBSCRIPTION_STATUS = Object.freeze({
  DRAFT: "draft",
  DOCUMENTS_PENDING: "documents_pending",
  KYC_PENDING: "kyc_pending",
  PAYMENT_PENDING: "payment_pending",
  OPS_REVIEW: "ops_review",
  APPROVED: "approved",
  TOKEN_MINT_PENDING: "token_mint_pending",
  TOKENS_ISSUED: "tokens_issued",
  REJECTED: "rejected",
  CANCELED: "canceled"
});

export const PAYMENT_STATUS = Object.freeze({
  PENDING: "pending",
  RECEIVED: "received",
  FAILED: "failed",
  REFUNDED: "refunded"
});

export const TOKEN_ALLOCATION_STATUS = Object.freeze({
  RESERVED: "reserved",
  MINT_PENDING: "mint_pending",
  MINTED: "minted",
  FAILED: "failed",
  CANCELED: "canceled"
});

export const DOCUMENT_ACCEPTANCE_STATUS = Object.freeze({
  PENDING: "pending",
  ACCEPTED: "accepted",
  SUPERSEDED: "superseded",
  REVOKED: "revoked"
});

export const SUBSCRIPTION_TRANSITIONS = Object.freeze({
  [SUBSCRIPTION_STATUS.DRAFT]: [
    SUBSCRIPTION_STATUS.DOCUMENTS_PENDING,
    SUBSCRIPTION_STATUS.CANCELED
  ],
  [SUBSCRIPTION_STATUS.DOCUMENTS_PENDING]: [
    SUBSCRIPTION_STATUS.KYC_PENDING,
    SUBSCRIPTION_STATUS.CANCELED
  ],
  [SUBSCRIPTION_STATUS.KYC_PENDING]: [
    SUBSCRIPTION_STATUS.PAYMENT_PENDING,
    SUBSCRIPTION_STATUS.REJECTED,
    SUBSCRIPTION_STATUS.CANCELED
  ],
  [SUBSCRIPTION_STATUS.PAYMENT_PENDING]: [
    SUBSCRIPTION_STATUS.OPS_REVIEW,
    SUBSCRIPTION_STATUS.REJECTED,
    SUBSCRIPTION_STATUS.CANCELED
  ],
  [SUBSCRIPTION_STATUS.OPS_REVIEW]: [
    SUBSCRIPTION_STATUS.APPROVED,
    SUBSCRIPTION_STATUS.REJECTED,
    SUBSCRIPTION_STATUS.CANCELED
  ],
  [SUBSCRIPTION_STATUS.APPROVED]: [
    SUBSCRIPTION_STATUS.TOKEN_MINT_PENDING,
    SUBSCRIPTION_STATUS.CANCELED
  ],
  [SUBSCRIPTION_STATUS.TOKEN_MINT_PENDING]: [
    SUBSCRIPTION_STATUS.TOKENS_ISSUED,
    SUBSCRIPTION_STATUS.REJECTED
  ],
  [SUBSCRIPTION_STATUS.TOKENS_ISSUED]: [],
  [SUBSCRIPTION_STATUS.REJECTED]: [],
  [SUBSCRIPTION_STATUS.CANCELED]: []
});

export const GDPR_FIELD_CLASSIFICATION = Object.freeze({
  investorPersonalData: [
    "legalName",
    "dateOfBirth",
    "taxResidence",
    "homeAddress",
    "email",
    "phone"
  ],
  sensitiveEvidence: [
    "identityDocument",
    "proofOfAddress",
    "kycProviderPayload",
    "amlProviderPayload",
    "suitabilityQuestionnaire"
  ],
  operationalData: [
    "investorId",
    "walletAddress",
    "dealId",
    "offeringId",
    "subscriptionId",
    "paymentStatus",
    "tokenAllocationStatus"
  ],
  onChainClaims: [
    "walletAddress",
    "identityAnchor",
    "claimTopic",
    "claimIssuer",
    "claimValidity"
  ]
});

export function canTransitionSubscription(from, to) {
  return (SUBSCRIPTION_TRANSITIONS[from] || []).includes(to);
}

export function assertSubscriptionTransition(from, to) {
  if (!canTransitionSubscription(from, to)) {
    throw new Error(`Invalid subscription transition: ${from} -> ${to}`);
  }
}

export function createSubscription(input) {
  const subscription = {
    id: input.id,
    investorId: input.investorId,
    offeringId: input.offeringId,
    status: input.status || SUBSCRIPTION_STATUS.DRAFT,
    requestedAmount: input.requestedAmount,
    currency: input.currency || "EUR",
    walletId: input.walletId,
    paymentId: input.paymentId || null,
    tokenAllocationId: input.tokenAllocationId || null
  };

  for (const field of ["id", "investorId", "offeringId", "requestedAmount", "walletId"]) {
    if (!subscription[field]) {
      throw new Error(`${field} is required`);
    }
  }

  if (!Object.values(SUBSCRIPTION_STATUS).includes(subscription.status)) {
    throw new Error(`Unknown subscription status: ${subscription.status}`);
  }

  return Object.freeze(subscription);
}
