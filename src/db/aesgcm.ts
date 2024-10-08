import { Buffer } from "node:buffer";

const encryptionKeyBase64 = Deno.env.get("ENCRYPTION_KEY");
if (!encryptionKeyBase64) {
  console.log("no ENCRYPTION_KEY provided, exiting");
  Deno.exit(1);
}

const encryptionKey = await crypto.subtle.importKey(
  "raw",
  Buffer.from(encryptionKeyBase64, "base64"),
  {
    name: "AES-GCM",
    length: 256, // Can be  128, 192, or 256
  },
  true, // extractable
  ["encrypt", "decrypt"]
);

const IV_LENGTH = 12;

// Encrypt with random IV and prepend IV to ciphertext
export async function encrypt(
  plaintext: string,
  key = encryptionKey
): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH)); // Secure random IV

  const encoded = new TextEncoder().encode(plaintext);

  const ciphertext = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    encoded
  );

  // Combine IV and ciphertext
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);

  return Buffer.from(combined.buffer).toString("base64");
}

// Decrypt by extracting IV from the beginning of ciphertext
export async function decrypt(
  combinedBase64: string,
  key = encryptionKey
): Promise<string> {
  const combined = Buffer.from(combinedBase64, "base64");

  const iv = combined.subarray(0, IV_LENGTH); // Extract first IV_LENGTH bytes as IV
  const ciphertext = combined.subarray(IV_LENGTH);

  const decrypted = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    ciphertext
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}
