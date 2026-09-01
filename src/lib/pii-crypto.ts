import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const PREFIX = "enc:";

function getKey(): Buffer {
  const keyHex = process.env.PII_ENCRYPTION_KEY || "";
  if (!keyHex) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("PII_ENCRYPTION_KEY environment variable is required in production. Generate one with: openssl rand -hex 32");
    }
    return crypto.scryptSync("allremotes-dev-key", "salt", 32);
  }
  return Buffer.from(keyHex, "hex");
}

export function isEncrypted(value: unknown): boolean {
  return typeof value === "string" && value.startsWith(PREFIX);
}

export function encrypt(plaintext: string): string {
  if (!plaintext || typeof plaintext !== "string") return plaintext;
  if (plaintext.startsWith(PREFIX)) return plaintext;
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString("base64")}:${encrypted.toString("base64")}:${authTag.toString("base64")}`;
}

export function decrypt(value: string): string {
  if (!value || typeof value !== "string") return value;
  if (!value.startsWith(PREFIX)) return value;
  try {
    const key = getKey();
    const parts = value.slice(PREFIX.length).split(":");
    if (parts.length !== 3) return value;
    const [ivB64, dataB64, tagB64] = parts;
    const iv = Buffer.from(ivB64, "base64");
    const encrypted = Buffer.from(dataB64, "base64");
    const authTag = Buffer.from(tagB64, "base64");
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString("utf8");
  } catch {
    return value;
  }
}

export function emailHash(email: string): string {
  return crypto.createHash("sha256").update(email.toLowerCase().trim()).digest("hex");
}

// ── Nested field helpers ──

function getNested(obj: any, path: string): any {
  return path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

function setNested(obj: any, path: string, value: any): void {
  const keys = path.split(".");
  const last = keys.pop()!;
  keys.reduce((o, k) => ((o[k] ??= {}), o[k]), obj)[last] = value;
}

// ── PII field definitions per collection ──

export const PII_FIELDS = {
  user: ["name", "email"],
  order: [
    "customer.fullName",
    "customer.email",
    "customer.phone",
    "customer.username",
    "shipping.address",
    "shipping.address2",
    "shipping.city",
    "shipping.state",
    "shipping.zipCode",
    "shipping.phone",
    "shipping.country",
  ],
  return: [
    "customerName",
    "email",
    "phone",
    "address",
    "address2",
    "city",
    "state",
    "zipCode",
  ],
  contact: ["name", "email", "phone", "message"],
  customer: ["name", "email", "phone", "address", "address2", "city", "state", "zipCode"],
} as const;

export function encryptPii<T>(obj: T, fields: readonly string[]): T {
  if (!obj || typeof obj !== "object") return obj;
  for (const field of fields) {
    const value = getNested(obj, field);
    if (typeof value === "string" && value && !value.startsWith(PREFIX)) {
      setNested(obj as any, field, encrypt(value));
    }
  }
  return obj;
}

export function decryptPii<T>(obj: T, fields: readonly string[]): T {
  if (!obj || typeof obj !== "object") return obj;
  for (const field of fields) {
    const value = getNested(obj, field);
    if (typeof value === "string" && value && value.startsWith(PREFIX)) {
      setNested(obj as any, field, decrypt(value));
    }
  }
  return obj;
}

export function decryptPiiArray<T>(arr: T[], fields: readonly string[]): T[] {
  return arr.map((item) => decryptPii({ ...item }, fields));
}

export function encryptPiiArray<T>(arr: T[], fields: readonly string[]): T[] {
  return arr.map((item) => encryptPii({ ...item }, fields));
}
