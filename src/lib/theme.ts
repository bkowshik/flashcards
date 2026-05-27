// Theme: 'light' | 'dark' | 'system'. Persisted in localStorage (synchronous
// read so the choice can be applied before Svelte mounts; see plan §6).
//
// 'light' and 'dark' set `data-theme` on <html>. 'system' removes the
// attribute so the prefers-color-scheme media query in app.css drives the
// palette. There is no FOUC because the apply runs at module load.

import { writable, type Readable } from 'svelte/store';

export type Theme = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'flashcards:theme';

function readStored(): Theme {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'light' || v === 'dark' || v === 'system') return v;
  } catch {
    // localStorage can throw in private-mode Safari and on some embedded
    // browsers. Fall through to default.
  }
  return 'system';
}

function applyToDocument(theme: Theme): void {
  const root = document.documentElement;
  if (theme === 'system') {
    root.removeAttribute('data-theme');
  } else {
    root.setAttribute('data-theme', theme);
  }
}

const store = writable<Theme>(readStored());

// Apply the initial value synchronously at module load. Importing this module
// from main.ts before mount() guarantees the right theme is on <html> by the
// time Svelte paints.
applyToDocument(readStored());

export const theme: Readable<Theme> = store;

export function setTheme(value: Theme): void {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Ignore — UI still updates, just won't persist across reloads.
  }
  applyToDocument(value);
  store.set(value);
}
