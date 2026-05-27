// 8-char URL-safe ID via crypto.getRandomValues. No dependency, no modulo bias
// (the 6-bit mask matches the 64-char alphabet exactly). See docs/plan.md §5.

const ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';

export function newId(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  let id = '';
  for (let i = 0; i < 8; i++) id += ALPHABET[bytes[i] & 63];
  return id;
}
