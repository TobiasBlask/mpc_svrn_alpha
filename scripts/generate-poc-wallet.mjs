import { createECDH, randomBytes } from "node:crypto";

function createPrivateKey() {
  while (true) {
    const candidate = randomBytes(32);
    try {
      const ecdh = createECDH("secp256k1");
      ecdh.setPrivateKey(candidate);
      return {
        privateKey: `0x${candidate.toString("hex")}`,
        publicKey: `0x${ecdh.getPublicKey(null, "uncompressed").toString("hex")}`
      };
    } catch {
      // Extremely unlikely. Retry if the random bytes are outside the curve range.
    }
  }
}

const wallet = createPrivateKey();

console.log("Generated a testnet-only EVM wallet key.");
console.log("Do not use this wallet for mainnet funds.");
console.log("");
console.log(`Private key: ${wallet.privateKey}`);
console.log("");
console.log("Import this private key into MetaMask or another wallet to see the address, then fund it with Amoy POL.");
console.log("Store the private key in your local .env.poc or macOS Keychain. Never paste it into Linear, GitHub, or chat.");
