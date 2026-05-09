import { readFile } from "node:fs/promises";

const required = [
  "POLYGON_AMOY_RPC_URL",
  "POLYGONSCAN_API_KEY",
  "POC_DEPLOYER_PRIVATE_KEY",
  "POC_DEPLOYER_ADDRESS"
];

const optional = [
  "WALLETCONNECT_PROJECT_ID",
  "DATABASE_URL",
  "GITHUB_REPOSITORY"
];

function parseEnv(contents) {
  const result = new Map();
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    result.set(trimmed.slice(0, index), trimmed.slice(index + 1));
  }
  return result;
}

let env = new Map();
try {
  env = parseEnv(await readFile(".env.poc", "utf8"));
} catch {
  console.error("Missing .env.poc. Create it from .env.poc.example.");
  process.exit(1);
}

let missing = 0;

for (const key of required) {
  if (!env.get(key)) {
    console.error(`Missing required POC value: ${key}`);
    missing += 1;
  }
}

for (const key of optional) {
  if (!env.get(key)) {
    console.warn(`Optional value not set yet: ${key}`);
  }
}

if (missing > 0) {
  process.exit(1);
}

console.log("POC environment has the required values.");
