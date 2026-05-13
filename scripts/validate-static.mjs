import { access, readFile } from "node:fs/promises";

const requiredFiles = [
  "index.html",
  "assets/svrn-alpha-private-access-logo.svg"
];

for (const file of requiredFiles) {
  await access(file);
}

const html = await readFile("index.html", "utf8");

const requiredText = [
  "svrn alpha",
  "Investment",
  "Portfolio",
  "Operations"
];

for (const text of requiredText) {
  if (!html.includes(text)) {
    throw new Error(`Missing required text in index.html: ${text}`);
  }
}

console.log("Static prototype validation passed.");
