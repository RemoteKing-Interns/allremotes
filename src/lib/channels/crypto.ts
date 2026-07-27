import crypto from "crypto";

const ALGO = "aes-256-cbc";
const IV_LEN = 16;

function getKey(): Buffer {
  const key = process.env.CHANNEL_ENCRYPTION_KEY;
  if (!key || key.length < 16) {
    throw new Error("CHANNEL_ENCRYPTION_KEY must be set and at least 16 chars.");
  }
  return crypto.scryptSync(key, "salt", 32);
}

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

export function decrypt(encrypted: string): string {
  const [ivHex, dataHex] = encrypted.split(":");
  if (!ivHex || !dataHex) throw new Error("Invalid encrypted value");
  const iv = Buffer.from(ivHex, "hex");
  const encryptedData = Buffer.from(dataHex, "hex");
  const decipher = crypto.createDecipheriv(ALGO, getKey(), iv);
  const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
  return decrypted.toString("utf8");
}

const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export function signState(): string {
  const key = getKey();
  const raw = `${Date.now()}:${crypto.randomBytes(16).toString("hex")}`;
  const hmac = crypto.createHmac("sha256", key).update(raw).digest("hex");
  return `${raw}:${hmac}`;
}

export function verifyState(state: string): boolean {
  const key = getKey();
  const lastColon = state.lastIndexOf(":");
  if (lastColon === -1) return false;
  const raw = state.slice(0, lastColon);
  const hmac = state.slice(lastColon + 1);
  const expected = crypto.createHmac("sha256", key).update(raw).digest("hex");
  if (!crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expected))) return false;
  const [timestamp] = raw.split(":");
  if (!timestamp) return false;
  const age = Date.now() - Number(timestamp);
  return age >= 0 && age <= STATE_TTL_MS;
}
