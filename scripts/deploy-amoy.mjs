import { mkdir, writeFile } from "node:fs/promises";
import { network } from "hardhat";

const KYC_TOPIC = 1;
const AML_TOPIC = 2;

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment value: ${name}`);
  }
  return value;
}

async function main() {
  requireEnv("POLYGON_AMOY_RPC_URL");
  requireEnv("POC_DEPLOYER_PRIVATE_KEY");

  const { ethers } = await network.create();
  const [deployer] = await ethers.getSigners();
  const admin = process.env.POC_ADMIN_ADDRESS || deployer.address;
  const trustedIssuer = process.env.POC_TRUSTED_ISSUER_ADDRESS || deployer.address;

  const ClaimTopicsRegistry = await ethers.getContractFactory("ClaimTopicsRegistry");
  const claimTopicsRegistry = await ClaimTopicsRegistry.deploy(admin);
  await claimTopicsRegistry.waitForDeployment();

  const TrustedIssuersRegistry = await ethers.getContractFactory("TrustedIssuersRegistry");
  const trustedIssuersRegistry = await TrustedIssuersRegistry.deploy(admin);
  await trustedIssuersRegistry.waitForDeployment();

  const IdentityRegistry = await ethers.getContractFactory("IdentityRegistry");
  const identityRegistry = await IdentityRegistry.deploy(
    admin,
    await claimTopicsRegistry.getAddress(),
    await trustedIssuersRegistry.getAddress()
  );
  await identityRegistry.waitForDeployment();

  const Compliance = await ethers.getContractFactory("Compliance");
  const compliance = await Compliance.deploy(admin, await identityRegistry.getAddress());
  await compliance.waitForDeployment();

  const DealToken = await ethers.getContractFactory("DealToken");
  const dealToken = await DealToken.deploy(
    admin,
    process.env.POC_DEAL_TOKEN_NAME || "MPC Private Access Test Deal",
    process.env.POC_DEAL_TOKEN_SYMBOL || "MPCA-T1",
    await identityRegistry.getAddress(),
    await compliance.getAddress()
  );
  await dealToken.waitForDeployment();

  const OfferingController = await ethers.getContractFactory("OfferingController");
  const offeringController = await OfferingController.deploy(
    admin,
    await dealToken.getAddress(),
    await identityRegistry.getAddress()
  );
  await offeringController.waitForDeployment();

  if (admin.toLowerCase() === deployer.address.toLowerCase()) {
    await (await claimTopicsRegistry.addClaimTopic(KYC_TOPIC)).wait();
    await (await claimTopicsRegistry.addClaimTopic(AML_TOPIC)).wait();
    await (await trustedIssuersRegistry.addTrustedIssuer(trustedIssuer, KYC_TOPIC)).wait();
    await (await trustedIssuersRegistry.addTrustedIssuer(trustedIssuer, AML_TOPIC)).wait();

    await (await identityRegistry.grantRole(
      await identityRegistry.REGISTRAR_ROLE(),
      await offeringController.getAddress()
    )).wait();
    await (await identityRegistry.grantRole(
      await identityRegistry.CLAIM_ISSUER_ROLE(),
      await offeringController.getAddress()
    )).wait();
    await (await dealToken.grantRole(await dealToken.ISSUER_ROLE(), await offeringController.getAddress())).wait();
    await (await dealToken.grantRole(await dealToken.CONTROLLER_ROLE(), await offeringController.getAddress())).wait();
  }

  const deployments = {
    network: "polygonAmoy",
    chainId: 80002,
    deployer: deployer.address,
    admin,
    trustedIssuer,
    topics: {
      KYC: KYC_TOPIC,
      AML: AML_TOPIC
    },
    contracts: {
      ClaimTopicsRegistry: await claimTopicsRegistry.getAddress(),
      TrustedIssuersRegistry: await trustedIssuersRegistry.getAddress(),
      IdentityRegistry: await identityRegistry.getAddress(),
      Compliance: await compliance.getAddress(),
      DealToken: await dealToken.getAddress(),
      OfferingController: await offeringController.getAddress()
    },
    deployedAt: new Date().toISOString()
  };

  await mkdir("deployments", { recursive: true });
  await writeFile("deployments/polygon-amoy.json", `${JSON.stringify(deployments, null, 2)}\n`);

  console.log(JSON.stringify(deployments, null, 2));
  if (admin.toLowerCase() === deployer.address.toLowerCase()) {
    console.log("Configured KYC/AML topics, trusted issuer and controller roles.");
  } else {
    console.log("Next: configure topics, trusted issuers and contract roles from the admin wallet.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
