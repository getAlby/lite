export function isValid32ByteHex(input: string): boolean {
  const hexRegex = /^[a-fA-F0-9]{64}$/;
  return hexRegex.test(input);
}