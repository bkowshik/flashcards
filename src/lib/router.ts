// Hash-based router. Four views + an edit form that reuses the add view.
//
// Routes:
//   #/add           → { name: 'add' }
//   #/edit/:id      → { name: 'edit', id }
//   #/browse        → { name: 'browse' }
//   #/quiz          → { name: 'quiz' }
//   #/about         → { name: 'about' }
//
// Anything unrecognised (including empty hash) resolves to #/add.

import { writable, type Readable } from 'svelte/store';

export type Route =
  | { name: 'add' }
  | { name: 'edit'; id: string }
  | { name: 'browse' }
  | { name: 'quiz' }
  | { name: 'about' };

function parse(hash: string): Route {
  // Strip leading '#' then leading '/' so '#/edit/abc' → 'edit/abc'.
  const path = hash.replace(/^#\/?/, '');
  const [head, ...rest] = path.split('/');

  if (head === 'browse') return { name: 'browse' };
  if (head === 'quiz') return { name: 'quiz' };
  if (head === 'about') return { name: 'about' };
  if (head === 'edit' && rest[0]) return { name: 'edit', id: rest[0] };
  return { name: 'add' };
}

const store = writable<Route>(parse(window.location.hash));

window.addEventListener('hashchange', () => {
  store.set(parse(window.location.hash));
});

export const route: Readable<Route> = store;

export function go(to: Route): void {
  const hash = serialize(to);
  if (window.location.hash === hash) return;
  window.location.hash = hash;
}

function serialize(r: Route): string {
  switch (r.name) {
    case 'add': return '#/add';
    case 'edit': return `#/edit/${r.id}`;
    case 'browse': return '#/browse';
    case 'quiz': return '#/quiz';
    case 'about': return '#/about';
  }
}
