// IndexedDB wrappers. We use idb-keyval's primitives (get/set/del/entries) but
// open the database ourselves so we can host multiple stores in one DB — the
// 'cards' store (Phase 2) and a 'settings' store (provisioned now, used by
// Phase 7's theme toggle). idb-keyval's own `createStore` only supports a
// single store per DB.
//
// One IndexedDB, two object stores, one file in DevTools → cleaner than
// fanning out into separate databases.

import { get, set, del, entries, type UseStore } from 'idb-keyval';
import type { Card } from './types';

const DB_NAME = 'flashcards';
const CARDS = 'cards';
const SETTINGS = 'settings';

const dbp: Promise<IDBDatabase> = new Promise((resolve, reject) => {
  const request = indexedDB.open(DB_NAME, 1);
  request.onupgradeneeded = () => {
    const db = request.result;
    db.createObjectStore(CARDS);
    db.createObjectStore(SETTINGS);
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

// idb-keyval's helpers accept a `UseStore` function — `(txMode, callback) => Promise`.
// The callback already returns a promise (via idb-keyval's `promisifyRequest`)
// that resolves when the request — or for writes, the whole transaction —
// completes. We just thread that promise through; do not wrap it.
//
// (Earlier this file set `tx.oncomplete` ourselves, which silently overwrote
// idb-keyval's own handler and deadlocked every write.)
const makeStore =
  (storeName: string): UseStore =>
  (txMode, callback) =>
    dbp.then((db) =>
      callback(db.transaction(storeName, txMode).objectStore(storeName)),
    );

const cardsStore = makeStore(CARDS);
// Provisioned in the DB schema (above) so Phase 7 can wire up theme
// persistence without bumping the IndexedDB version. Not exported yet.
// const settingsStore = makeStore(SETTINGS);

// ---- Card operations -------------------------------------------------------

export function saveCard(card: Card): Promise<void> {
  return set(card.id, card, cardsStore);
}

export function getCard(id: string): Promise<Card | undefined> {
  return get<Card>(id, cardsStore);
}

export async function getAllCards(): Promise<Card[]> {
  const items = await entries<string, Card>(cardsStore);
  // entries() returns [key, value] tuples; we only need the values.
  return items.map(([, card]) => card);
}

export function deleteCard(id: string): Promise<void> {
  return del(id, cardsStore);
}
