// Global keyboard shortcuts.
//
// Two-key chord navigation (`g` then `a`/`b`/`q`) avoids browser-reserved
// modifier combos and works identically across Win/Linux/Mac (see plan §7).
// `?` toggles the shortcuts overlay; Esc closes it.
//
// View-local shortcuts (Quiz's Space / n / p / e, Add's ⌘+Enter) stay in
// their components — this module only handles the navigation chord and the
// overlay toggle.

import { writable, get } from 'svelte/store';
import { go } from './router';

export const overlayOpen = writable(false);

let chordActive = false;
let chordTimer: number | undefined;
const CHORD_WINDOW_MS = 1500;

// Read-only accessor for view components (e.g. Quiz) that need to skip their
// own dispatch when a chord is mid-completion. Without this, pressing `g`
// then `n` in Quiz would advance to the next card after the chord clears.
export function isChordActive(): boolean {
  return chordActive;
}

function clearChord() {
  chordActive = false;
  if (chordTimer !== undefined) {
    window.clearTimeout(chordTimer);
    chordTimer = undefined;
  }
}

function isEditable(t: EventTarget | null): boolean {
  if (!(t instanceof HTMLElement)) return false;
  return (
    t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable
  );
}

// When the global handler consumes a key, we call both preventDefault (to
// block default browser action) AND stopImmediatePropagation (to keep
// view-level <svelte:window> handlers from also acting on the same key).
// Without the latter, pressing `g` then `n` would clear the chord *and*
// advance the Quiz, which is two surprises stacked.
function consume(e: KeyboardEvent): void {
  e.preventDefault();
  e.stopImmediatePropagation();
}

export function handleGlobalKey(e: KeyboardEvent): void {
  // Esc closes the overlay even from inside an input — globally useful.
  if (e.key === 'Escape' && get(overlayOpen)) {
    consume(e);
    overlayOpen.set(false);
    return;
  }

  // Otherwise, ignore keys while typing — saves us from stealing letters
  // mid-word in the Add form.
  if (isEditable(e.target)) return;

  // Ignore browser/system modifier combos. (Shift is fine — `?` needs it.)
  if (e.metaKey || e.ctrlKey || e.altKey) return;

  // Second keystroke of a chord — absorbed regardless of whether it matches a
  // known target, so view handlers can't act on it after the chord clears.
  if (chordActive) {
    clearChord();
    consume(e);
    if (e.key === 'a') go({ name: 'add' });
    else if (e.key === 'b') go({ name: 'browse' });
    else if (e.key === 'q') go({ name: 'quiz' });
    return;
  }

  // Start a chord.
  if (e.key === 'g') {
    consume(e);
    chordActive = true;
    chordTimer = window.setTimeout(clearChord, CHORD_WINDOW_MS);
    return;
  }

  // Toggle the shortcuts overlay. `?` is Shift+/ on US layouts; the key
  // value of `e.key` is already `?` regardless of layout details.
  if (e.key === '?') {
    consume(e);
    overlayOpen.update((v) => !v);
    return;
  }
}
