import { cloudStorage } from '@tma.js/sdk-react';

/**
 * Thin promise wrapper over Telegram CloudStorage (SDK v3).
 * UI should access CloudStorage ONLY through these functions.
 * No direct calls to cloudStorage / window.Telegram in components.
 */

/** Check if CloudStorage is available in the current environment (Telegram client with required version). */
export function isSupported(): boolean {
  return cloudStorage.setItem.isAvailable();
}

/** Save a value at the given key. */
export async function setItem(key: string, value: string): Promise<void> {
  await cloudStorage.setItem(key, value);
}

/** Read a value at the given key. Returns '' if the key does not exist. */
export async function getItem(key: string): Promise<string> {
  return cloudStorage.getItem(key);
}

/** Get a list of all keys in CloudStorage. */
export async function getKeys(): Promise<string[]> {
  return cloudStorage.getKeys();
}

/** Delete a value at the given key. */
export async function deleteItem(key: string): Promise<void> {
  await cloudStorage.deleteItem(key);
}
