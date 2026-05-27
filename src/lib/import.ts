// JSON import. Parses a file's text, validates with a hand-rolled type guard
// (no Zod — keeps the bundle small), and merges by id: newer `updatedAt` wins,
// older entries are skipped. The whole file is rejected on any malformed
// card so partial imports never leave the user guessing what landed. See
// plan §8 + §12.
//
// All errors thrown carry a user-readable message; the caller can show them
// directly without further translation.

import { saveCard, getCard } from './storage';
import type { Card } from './types';

export type ImportResult = {
  imported: number; // new ids — didn't exist locally
  updated: number; // ids that existed and were overwritten with a newer copy
  skipped: number; // ids that existed and were kept (local copy was newer or equal)
};

type ExportPayload = {
  version: 1;
  cards: Card[];
};

function isCard(v: unknown, i: number): v is Card {
  if (!v || typeof v !== 'object') {
    throw new Error(`Card at index ${i}: not an object.`);
  }
  const c = v as Record<string, unknown>;
  const need = ['id', 'question', 'answer', 'createdAt', 'updatedAt'] as const;
  for (const k of need) {
    if (!(k in c)) {
      throw new Error(`Card at index ${i}: missing "${k}".`);
    }
  }
  if (typeof c.id !== 'string' || c.id.length === 0) {
    throw new Error(`Card at index ${i}: "id" must be a non-empty string.`);
  }
  if (typeof c.question !== 'string') {
    throw new Error(`Card at index ${i}: "question" must be a string.`);
  }
  if (typeof c.answer !== 'string') {
    throw new Error(`Card at index ${i}: "answer" must be a string.`);
  }
  if (typeof c.createdAt !== 'number' || !Number.isFinite(c.createdAt)) {
    throw new Error(`Card at index ${i}: "createdAt" must be a number.`);
  }
  if (typeof c.updatedAt !== 'number' || !Number.isFinite(c.updatedAt)) {
    throw new Error(`Card at index ${i}: "updatedAt" must be a number.`);
  }
  return true;
}

function validate(data: unknown): ExportPayload {
  if (!data || typeof data !== 'object') {
    throw new Error('File is not a JSON object.');
  }
  const obj = data as Record<string, unknown>;
  if (obj.version !== 1) {
    throw new Error(
      `Unsupported file version: ${JSON.stringify(obj.version)} (expected 1).`,
    );
  }
  if (!Array.isArray(obj.cards)) {
    throw new Error('Missing or invalid "cards" array.');
  }
  // Validate every card before writing anything — reject whole file on first
  // bad entry rather than half-importing.
  obj.cards.forEach(isCard);
  return { version: 1, cards: obj.cards as Card[] };
}

export async function importJSON(text: string): Promise<ImportResult> {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('File is not valid JSON.');
  }
  const payload = validate(data);

  let imported = 0;
  let updated = 0;
  let skipped = 0;

  for (const card of payload.cards) {
    const existing = await getCard(card.id);
    if (!existing) {
      await saveCard(card);
      imported++;
    } else if (card.updatedAt > existing.updatedAt) {
      await saveCard(card);
      updated++;
    } else {
      skipped++;
    }
  }

  return { imported, updated, skipped };
}
