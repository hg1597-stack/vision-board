import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { webcrypto } from "node:crypto";

const { subtle } = webcrypto;
const encoder = new TextEncoder();
const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, "..");
const inputPath = resolve(projectRoot, "content/manual.json");
const outputPath = resolve(projectRoot, "content.enc.js");
const iterations = Number.parseInt(process.env.PBKDF2_ITERATIONS || "310000", 10);

if (!Number.isInteger(iterations) || iterations < 310000) {
  throw new Error("PBKDF2_ITERATIONS must be an integer greater than or equal to 310000.");
}

const source = JSON.parse(await readFile(inputPath, "utf8"));
const authorizedNames = Array.isArray(source.authorizedNames) ? source.authorizedNames : [];
const manual = source.manual;
const names = Array.from(new Set(authorizedNames.map(normalizeName).filter(Boolean)));

if (names.length === 0) {
  throw new Error("content/manual.json must include at least one authorized name.");
}

if (!manual || typeof manual !== "object" || Array.isArray(manual)) {
  throw new Error("content/manual.json must include a manual object.");
}

const dataKeyBytes = randomBytes(32);
const dataKey = await subtle.importKey("raw", dataKeyBytes, "AES-GCM", false, ["encrypt"]);
const payloadIv = randomBytes(12);
const payloadCiphertext = await subtle.encrypt(
  { name: "AES-GCM", iv: payloadIv },
  dataKey,
  encoder.encode(JSON.stringify(manual)),
);

const recipients = [];
for (const name of names) {
  const salt = randomBytes(16);
  const wrapIv = randomBytes(12);
  const wrappingKey = await deriveWrappingKey(encoder.encode(name), salt);
  const wrappedKey = await subtle.encrypt({ name: "AES-GCM", iv: wrapIv }, wrappingKey, dataKeyBytes);

  recipients.push({
    salt: toBase64(salt),
    iv: toBase64(wrapIv),
    wrappedKey: toBase64(new Uint8Array(wrappedKey)),
  });
}

const encryptedManual = {
  version: 1,
  kdf: {
    name: "PBKDF2",
    hash: "SHA-256",
    iterations,
  },
  wrap: {
    name: "AES-GCM",
    length: 256,
  },
  payload: {
    name: "AES-GCM",
    iv: toBase64(payloadIv),
    ciphertext: toBase64(new Uint8Array(payloadCiphertext)),
  },
  recipients,
};

const output = `window.ENCRYPTED_MANUAL = ${JSON.stringify(encryptedManual, null, 2)};\n`;
await writeFile(outputPath, output, "utf8");

console.log(`Encrypted manual written to ${outputPath}`);
console.log(`Wrapped data key count: ${recipients.length}`);

function normalizeName(value) {
  return String(value || "").replace(/\s+/g, "");
}

async function deriveWrappingKey(passwordBytes, salt) {
  const baseKey = await subtle.importKey("raw", passwordBytes, "PBKDF2", false, ["deriveKey"]);
  return subtle.deriveKey(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt,
      iterations,
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"],
  );
}

function randomBytes(length) {
  const bytes = new Uint8Array(length);
  webcrypto.getRandomValues(bytes);
  return bytes;
}

function toBase64(bytes) {
  return Buffer.from(bytes).toString("base64");
}
