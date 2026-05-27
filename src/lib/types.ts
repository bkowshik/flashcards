// The single domain entity. See docs/plan.md §5.

export type Card = {
  id: string;        // 8-char URL-safe nanoid, see ./id.ts
  question: string;  // markdown source
  answer: string;    // markdown source
  createdAt: number; // ms since epoch
  updatedAt: number; // ms since epoch
};
