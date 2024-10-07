import { Buffer } from "node:buffer";
console.log(
  Buffer.from(
    await crypto.subtle.exportKey(
      "raw",
      await crypto.subtle.generateKey(
        {
          name: "AES-GCM",
          length: 256,
        },
        true,
        ["encrypt", "decrypt"]
      )
    )
  ).toString("base64")
);
