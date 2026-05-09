import { expect } from "chai";
import { network } from "hardhat";

const KYC_TOPIC = 1;
const AML_TOPIC = 2;

let ethers;
let oneToken;

function identityId(label) {
  return ethers.id(label);
}

async function deployFixture() {
  const [admin, issuer, approvedInvestor, approvedBuyer, unapprovedInvestor] = await ethers.getSigners();

  const ClaimTopicsRegistry = await ethers.getContractFactory("ClaimTopicsRegistry");
  const claimTopicsRegistry = await ClaimTopicsRegistry.deploy(admin.address);

  const TrustedIssuersRegistry = await ethers.getContractFactory("TrustedIssuersRegistry");
  const trustedIssuersRegistry = await TrustedIssuersRegistry.deploy(admin.address);

  const IdentityRegistry = await ethers.getContractFactory("IdentityRegistry");
  const identityRegistry = await IdentityRegistry.deploy(
    admin.address,
    await claimTopicsRegistry.getAddress(),
    await trustedIssuersRegistry.getAddress()
  );

  const Compliance = await ethers.getContractFactory("Compliance");
  const compliance = await Compliance.deploy(admin.address, await identityRegistry.getAddress());

  const DealToken = await ethers.getContractFactory("DealToken");
  const dealToken = await DealToken.deploy(
    admin.address,
    "MPC Private Access Test Deal",
    "MPCA-T1",
    await identityRegistry.getAddress(),
    await compliance.getAddress()
  );

  const OfferingController = await ethers.getContractFactory("OfferingController");
  const offeringController = await OfferingController.deploy(
    admin.address,
    await dealToken.getAddress(),
    await identityRegistry.getAddress()
  );

  await claimTopicsRegistry.addClaimTopic(KYC_TOPIC);
  await claimTopicsRegistry.addClaimTopic(AML_TOPIC);
  await trustedIssuersRegistry.addTrustedIssuer(issuer.address, KYC_TOPIC);
  await trustedIssuersRegistry.addTrustedIssuer(issuer.address, AML_TOPIC);

  await identityRegistry.grantRole(await identityRegistry.REGISTRAR_ROLE(), await offeringController.getAddress());
  await identityRegistry.grantRole(await identityRegistry.CLAIM_ISSUER_ROLE(), await offeringController.getAddress());
  await dealToken.grantRole(await dealToken.ISSUER_ROLE(), await offeringController.getAddress());
  await dealToken.grantRole(await dealToken.CONTROLLER_ROLE(), await offeringController.getAddress());

  async function approveWallet(wallet, label) {
    await offeringController.registerIdentity(wallet.address, identityId(label));
    await offeringController.addClaim(wallet.address, KYC_TOPIC, issuer.address);
    await offeringController.addClaim(wallet.address, AML_TOPIC, issuer.address);
  }

  await approveWallet(approvedInvestor, "approved-investor");
  await approveWallet(approvedBuyer, "approved-buyer");

  return {
    approvedBuyer,
    approvedInvestor,
    compliance,
    dealToken,
    offeringController,
    unapprovedInvestor
  };
}

describe("MPC Private Access ERC-3643 POC", function () {
  before(async function () {
    ({ ethers } = await network.create());
    oneToken = ethers.parseEther("1");
  });

  it("mints to a KYC-approved wallet", async function () {
    const { approvedInvestor, dealToken, offeringController } = await deployFixture();

    await offeringController.mintTo(approvedInvestor.address, oneToken, ethers.id("subscription-1"));

    expect(await dealToken.balanceOf(approvedInvestor.address)).to.equal(oneToken);
  });

  it("rejects minting to a non-whitelisted wallet", async function () {
    const { offeringController, unapprovedInvestor } = await deployFixture();

    await expect(
      offeringController.mintTo(unapprovedInvestor.address, oneToken, ethers.id("subscription-2"))
    ).to.be.revertedWith("DealToken: transfer blocked by compliance");
  });

  it("allows controller-mediated secondary transfer to an approved wallet", async function () {
    const { approvedBuyer, approvedInvestor, dealToken, offeringController } = await deployFixture();

    await offeringController.mintTo(approvedInvestor.address, oneToken, ethers.id("subscription-3"));
    await offeringController.controlledTransfer(
      approvedInvestor.address,
      approvedBuyer.address,
      oneToken,
      ethers.id("transfer-request-1")
    );

    expect(await dealToken.balanceOf(approvedBuyer.address)).to.equal(oneToken);
    expect(await dealToken.balanceOf(approvedInvestor.address)).to.equal(0n);
  });

  it("rejects transfer to an unapproved wallet", async function () {
    const { approvedInvestor, offeringController, unapprovedInvestor } = await deployFixture();

    await offeringController.mintTo(approvedInvestor.address, oneToken, ethers.id("subscription-4"));

    await expect(
      offeringController.controlledTransfer(
        approvedInvestor.address,
        unapprovedInvestor.address,
        oneToken,
        ethers.id("transfer-request-2")
      )
    ).to.be.revertedWith("DealToken: transfer blocked by compliance");
  });

  it("blocks transfers while paused", async function () {
    const { approvedBuyer, approvedInvestor, compliance, offeringController } = await deployFixture();

    await offeringController.mintTo(approvedInvestor.address, oneToken, ethers.id("subscription-5"));
    await compliance.setPaused(true);

    await expect(
      offeringController.controlledTransfer(
        approvedInvestor.address,
        approvedBuyer.address,
        oneToken,
        ethers.id("transfer-request-3")
      )
    ).to.be.revertedWith("DealToken: transfer blocked by compliance");
  });
});
