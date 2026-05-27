// JSON export. Reads all cards from IndexedDB, packages them with a version
// + timestamp, and triggers a browser download via a transient <a download>.
// See plan §8 for the file shape.

import { getAllCards } from './storage';
import type { Card } from './types';

export type ExportPayload = {
  version: 1;
  exportedAt: string; // ISO 8601
  cards: Card[];
};

export async function exportJSON(): Promise<void> {
  const cards = await getAllCards();
  const payload: ExportPayload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    cards,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);

  // Filename: flashcards-YYYY-MM-DD.json — recognisable, sortable, no clashes
  // when exporting multiple times in a session (browser auto-appends "(1)" etc).
  const today = new Date().toISOString().slice(0, 10);
  const a = document.createElement('a');
  a.href = url;
  a.download = `flashcards-${today}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Free the blob URL on the next tick — Chrome needs the URL to outlive the
  // synchronous click() but we don't want it leaking.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
