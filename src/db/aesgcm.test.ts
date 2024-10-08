import { expect } from "jsr:@std/expect";
import { decrypt, encrypt } from "./aesgcm.ts";

const NWC_URL =
  "nostr+walletconnect://0ba9d3de7e3e201aad29ee6b9fca20da0e5fc638c4b0513671eaea9c16a3989f?relay=wss://relay.getalby.com/v1&secret=bdaec8619bcf63a7c797043092ef72a6f62270c0f832561faf8f51f0cfdfce33";

Deno.test("encrypt and decrypt with correct key", async () => {
  const plaintext = NWC_URL;
  const encrypted = await encrypt(plaintext);
  const encrypted2 = await encrypt(plaintext);
  expect(encrypted).not.toEqual(plaintext);
  expect(encrypted2).not.toEqual(encrypted);
  const decrypted = await decrypt(encrypted);
  expect(decrypted).toEqual(plaintext);
});

Deno.test("cannot decrypt with incorrect key", async () => {
  const plaintext = NWC_URL;
  const encrypted = await encrypt(plaintext);
  try {
    const incorrectKey = await crypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: 256, // Can be  128, 192, or 256
      },
      true, // extractable
      ["encrypt", "decrypt"]
    );
    await decrypt(encrypted, incorrectKey);
    // should never get here
    expect(true).toBe(false);
  } catch (error) {
    expect(error.toString()).toEqual("OperationError: Decryption failed");
  }
});
