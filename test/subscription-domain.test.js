import test from "node:test";
import assert from "node:assert/strict";

import {
  assertSubscriptionTransition,
  canTransitionSubscription,
  createSubscription,
  GDPR_FIELD_CLASSIFICATION,
  SUBSCRIPTION_STATUS
} from "../src/subscriptions/index.js";

test("creates a subscription in draft status", () => {
  const subscription = createSubscription({
    id: "sub_001",
    investorId: "inv_001",
    offeringId: "off_001",
    walletId: "wallet_001",
    requestedAmount: "10000.00"
  });

  assert.equal(subscription.status, SUBSCRIPTION_STATUS.DRAFT);
  assert.equal(subscription.currency, "EUR");
});

test("allows the happy-path subscription lifecycle", () => {
  const path = [
    SUBSCRIPTION_STATUS.DRAFT,
    SUBSCRIPTION_STATUS.DOCUMENTS_PENDING,
    SUBSCRIPTION_STATUS.KYC_PENDING,
    SUBSCRIPTION_STATUS.PAYMENT_PENDING,
    SUBSCRIPTION_STATUS.OPS_REVIEW,
    SUBSCRIPTION_STATUS.APPROVED,
    SUBSCRIPTION_STATUS.TOKEN_MINT_PENDING,
    SUBSCRIPTION_STATUS.TOKENS_ISSUED
  ];

  for (let index = 0; index < path.length - 1; index++) {
    assert.equal(canTransitionSubscription(path[index], path[index + 1]), true);
  }
});

test("rejects invalid subscription transitions", () => {
  assert.equal(
    canTransitionSubscription(SUBSCRIPTION_STATUS.DRAFT, SUBSCRIPTION_STATUS.TOKENS_ISSUED),
    false
  );

  assert.throws(
    () => assertSubscriptionTransition(SUBSCRIPTION_STATUS.DRAFT, SUBSCRIPTION_STATUS.TOKENS_ISSUED),
    /Invalid subscription transition/
  );
});

test("keeps GDPR-sensitive data out of on-chain claims", () => {
  assert.equal(GDPR_FIELD_CLASSIFICATION.onChainClaims.includes("legalName"), false);
  assert.equal(GDPR_FIELD_CLASSIFICATION.sensitiveEvidence.includes("identityDocument"), true);
});
