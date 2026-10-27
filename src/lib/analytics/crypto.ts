/**
 * Crypto utilities for analytics.
 * Uses Web Crypto API in browser, Node crypto on server.
 */

/**
 * Generates a random UUID.
 * Uses Web Crypto API in browser, Node crypto on server.
 */
export function randomUUID(): string {
  // Check if we're in a browser environment with crypto.randomUUID
  if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  // Fallback for environments without crypto.randomUUID
  // This works in both browser and Node
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}