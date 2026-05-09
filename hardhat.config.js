import dotenv from "dotenv";
import { defineConfig } from "hardhat/config";
import hardhatToolboxMochaEthers from "@nomicfoundation/hardhat-toolbox-mocha-ethers";

dotenv.config({ path: ".env.poc" });

const deployerPrivateKey = process.env.POC_DEPLOYER_PRIVATE_KEY
  ? process.env.POC_DEPLOYER_PRIVATE_KEY.startsWith("0x")
    ? process.env.POC_DEPLOYER_PRIVATE_KEY
    : `0x${process.env.POC_DEPLOYER_PRIVATE_KEY}`
  : "";

const accounts = deployerPrivateKey
  ? [deployerPrivateKey]
  : [];

export default defineConfig({
  plugins: [hardhatToolboxMochaEthers],
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      type: "edr-simulated",
      chainType: "l1"
    },
    polygonAmoy: {
      type: "http",
      chainType: "l1",
      url: process.env.POLYGON_AMOY_RPC_URL || "",
      accounts
    }
  },
  etherscan: {
    apiKey: {
      polygonAmoy: process.env.POLYGONSCAN_API_KEY || ""
    }
  }
});
