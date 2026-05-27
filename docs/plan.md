# Flashcards — Project Plan

A fast, minimal, fully client-side flashcard tool.

---

## 1. Vision

A web app that lets me capture flashcards in seconds and review them on any device, with no login, no server, and no friction. Cards live in the browser. Data is mine — I can export the entire library to JSON any time.

The goal is **not** to be a spaced-repetition system. It's the lightest possible card capture + review surface for personal study — small enough to load instantly, simple enough that adding a card takes no more thought than jotting a note.

---

## 2. Principles

These guide every "should we add X?" decision.

1. **Minimal dependencies.** Every dep must justify its weight. Default answer is no.
2. **Standard practices.** No cutting-edge tooling for novelty's sake. Familiar over clever.
3. **Fast and light.** Bundle target ≤ 50 KB gzipped. First paint < 200 ms.
4. **Client-only.** No server, no API calls at runtime, no analytics, no external CDNs.
5. **Keyboard-first.** Every primary action has a shortcut. Mouse is fallback.
6. **The user's data is the user's.** Local storage. Export any time. No lock-in.

---

## 3. Requirements

### Functional (v1)

- **Add a card.** Two fields: question and answer. Both accept markdown source.
- **Quick capture flow.** Open the app, press a shortcut, type, save with one keystroke, stay on the capture screen for the next card.
- **Browse cards.** A list view showing all cards, newest first. Click to edit, key to delete.
- **Edit a card.** Same form as Add, pre-populated. Save updates in place.
- **Delete a card.** With a confirmation step (no accidents).
- **Quiz mode.** Pick a random card, show the question, flip to reveal the answer, advance to the next.
- **Markdown rendering.** Question and answer render markdown (headings, lists, bold/italic, inline code, code blocks, links). No math, no images in v1.
- **Persistence.** All cards stored in IndexedDB. Survives reload, restart, browser update.
- **Export JSON.** Download all cards as a single `.json` file.
- **Import JSON.** Upload a `.json` file, merge with existing cards (de-duplicate by id).
- **Theme toggle.** Light, dark, follow system. Persists.

### Non-functional

| Concern | Target |
|---|---|
| Bundle size (gzipped) | ≤ 50 KB (aim ~35 KB), measured as gzipped JS + CSS in `dist/assets/` after `vite build`; excludes `index.html` and the favicon |
| First paint | < 200 ms on a warm cache |
| Time-to-interactive | < 500 ms on a cold load over 4G |
| Runtime network requests | Zero (after initial load) |
| Browser support | Last 2 versions of Chrome, Safari, Firefox |
| Accessibility | Keyboard-navigable everywhere; semantic HTML; visible focus rings |
| Privacy | No analytics, no telemetry, no third-party scripts |

### Out of scope for v1

Explicitly **not** building (each is achievable later — see §10):

- Spaced repetition scheduling (FSRS, SM-2, Leitner)
- Cloze deletions (`{{c1::hidden}}` style cards)
- Math rendering (KaTeX — adds ~80 KB)
- Images or audio on cards
- Tags or decks (single flat card list in v1)
- PWA installability / offline shell
- Sync across devices
- Multi-user accounts
- Search within cards
- Bulk operations (multi-select delete, etc.)
- Drag-and-drop import

---

## 4. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Package manager | **npm** | Standard, no surprises. |
| Build tool | **Vite** | De facto standard for client-side apps. Fast HMR, small output. |
| UI framework | **Svelte 5** | Compiler-based, ~10 KB runtime. Scoped styles built in. Reactive primitives (`$state`, `$derived`) fit this app naturally. |
| Language | **TypeScript** | Catch bugs before they ship. Standard for any non-trivial app. |
| Styling | **Plain CSS** in Svelte's scoped `<style>` blocks + ~10 CSS custom properties for tokens | No Tailwind, no CSS-in-JS. Svelte already scopes styles. Tokens via `:root` vars give us themability. |
| Storage | **`idb-keyval`** (~0.6 KB) | Thin promise wrapper over IndexedDB. Localstorage's API, IndexedDB's capacity. |
| Markdown | **`marked`** (~12 KB) + **`DOMPurify`** (~6 KB) | Standard, battle-tested pair. Marked parses, DOMPurify sanitises before render. |
| Routing | **Hash-based, ~20 lines of custom code** | No router lib needed. Three views, bookmarkable URLs. |
| Dev tooling | **Prettier + ESLint** | Standard, not shipped. |

**Total runtime bundle estimate: ~35 KB gzipped** (Svelte ~10 + marked ~12 + DOMPurify ~6 + idb-keyval <1 + app code ~5–8).

---

## 5. Data model

A single entity: `Card`.

```ts
type Card = {
  id: string;          // nanoid (8 chars, URL-safe)
  question: string;    // markdown source
  answer: string;      // markdown source
  createdAt: number;   // ms since epoch
  updatedAt: number;   // ms since epoch
};
```

### Storage layout (IndexedDB via `idb-keyval`)

Two custom stores in one database:

```
flashcards (db)
├── cards (store)        — key: card.id, value: Card
└── settings (store)     — key: 'theme', value: 'light' | 'dark' | 'system'
```

Storing one card per key (rather than one big array) means:

- Add / edit / delete are independent writes — no read-modify-write of the whole library
- Browse uses `entries('cards')` to get them all at once
- Scales to tens of thousands of cards before we'd need to rethink

### ID format

Hand-rolled nanoid, 8 URL-safe chars (e.g. `V1StGXR8`), built on `crypto.getRandomValues`. ~10 lines, no dependency. `crypto.randomUUID()` is also free and built into browsers, but its 36-character output makes URLs and storage noisier for no real win at this scale.

```ts
// src/lib/id.ts — full implementation
const ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-'; // 64 chars

export function newId(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  let id = '';
  for (let i = 0; i < 8; i++) id += ALPHABET[bytes[i] & 63]; // mask to 6 bits, no modulo bias
  return id;
}
```

64⁸ ≈ 281 trillion possibilities; collision probability for a personal library (<10K cards) is ~10⁻⁹. The 6-bit mask matches the 64-char alphabet exactly, so there's no modulo-bias to worry about.

---

## 6. Views & UX

Three views, switched by hash in the URL. Routes:

- `#/add` — blank Add form (default landing)
- `#/edit/{id}` — same Add component, pre-populated with that card
- `#/browse` — list of all cards
- `#/quiz` — quiz mode

### `#/add` — Add (default landing for new cards)

```
┌─────────────────────────────────────────────┐
│  Flashcards          [Add] Browse Quiz  ⚙   │
├─────────────────────────────────────────────┤
│                                             │
│  Question                                   │
│  ┌─────────────────────────────────────┐    │
│  │ What are the characteristics of      │    │
│  │ classes in a class frequency?        │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  Answer                                     │
│  ┌─────────────────────────────────────┐    │
│  │ - Do not overlap                     │    │
│  │ - Accommodate all data               │    │
│  │ - Of the same size                   │    │
│  │ - Decimals match raw data            │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  [Save (⌘↵)]      [Clear]                   │
│                                             │
│  ✓ Saved 3 cards this session               │
└─────────────────────────────────────────────┘
```

Behaviour:

- Cursor lands in the question field on load.
- Tab moves from question → answer → Save button.
- ⌘/Ctrl+Enter saves and clears both fields, cursor returns to question. No navigation away.
- Markdown is **not** previewed in v1 — too much chrome. You see the rendered version in Quiz.
- A small "✓ Saved N cards this session" line gives feedback without a modal toast.

### `#/browse` — Browse

A simple list, newest first.

```
┌─────────────────────────────────────────────┐
│  Flashcards          Add [Browse] Quiz  ⚙   │
├─────────────────────────────────────────────┤
│  42 cards                  [Export] [Import]│
├─────────────────────────────────────────────┤
│  What are the characteristics of classes…   │
│    - Do not overlap, - Accommodate all data │
│    May 27 · [Edit] [Delete]                 │
│  ─────────────────────────────────────────  │
│  Define spaced repetition.                  │
│    A learning technique where…              │
│    May 26 · [Edit] [Delete]                 │
│  ...                                        │
└─────────────────────────────────────────────┘
```

Behaviour:

- Click a row anywhere → open in edit mode (= Add view, pre-populated).
- `Delete` shows an inline "Are you sure? [Yes] [Cancel]" — no modal.
- No pagination in v1; just render the lot. If it ever gets slow (thousands of cards), revisit with virtualization.

### `#/quiz` — Quiz

```
┌─────────────────────────────────────────────┐
│  Flashcards          Add Browse [Quiz]  ⚙   │
├─────────────────────────────────────────────┤
│                                             │
│                                             │
│      What are the characteristics of        │
│        classes in a class frequency?        │
│                                             │
│                                             │
│           [Flip (Space)]                    │
│                                             │
│           ───────────                       │
│           Card 1 of 42                      │
│      [← Prev (P)]      [Next (N) →]         │
└─────────────────────────────────────────────┘
```

Behaviour:

- Picks a random card from the library on entry. Cycles through a shuffled queue; once exhausted, re-shuffles.
- Space flips between question and answer (CSS-only flip transition).
- N (or →) advances to next card.
- P (or ←) steps back to the previous card in the queue. No-op at index 0 of the current shuffle — does not wrap into the previous round (that would replay a card the user just saw with no warning). The Prev button is visually disabled in that state.
- E opens the current card in edit mode.
- Empty state if there are no cards: "Add a card to start quizzing."

### Settings (⚙ in header)

A simple panel — not a separate route, just a `<details>` or popover:

- Theme: Light / Dark / System
- Export JSON
- Import JSON
- Card count
- Link: "About / source"

**Theme implementation.** Three persisted values: `light`, `dark`, `system` (default `system`). `light` and `dark` set `data-theme` on `<html>`; `system` removes the attribute and lets a `prefers-color-scheme: dark` media query drive the dark palette. This means there is no FOUC on first load (the OS preference is applied by CSS alone) and explicit choices override the OS preference cleanly. Setting persists in **`localStorage`** under key `flashcards:theme` — IndexedDB's async read would cause a flash for users who picked Light/Dark explicitly (page starts in system theme, snaps to their choice once IDB resolves). The IDB `settings` store provisioned in Phase 2 is unused for v1 and reserved for future settings that don't need pre-mount access.

---

## 7. Keyboard shortcuts

Modifier-based shortcuts (`⌘/Ctrl + letter`) are a minefield: browsers reserve most letter combos and won't let pages override them (notably `⌘N`, `⌘T`, `⌘W`), and `⌘` vs `Ctrl` differs by platform. The Gmail / GitHub / Linear pattern — **plain-letter chord prefixes** — sidesteps both problems: no browser interception (no modifier), and one set of bindings works identically on Windows, Linux, and macOS.

| Shortcut | Where | Action |
|---|---|---|
| `g` then `a` | global | Go to Add |
| `g` then `b` | global | Go to Browse |
| `g` then `q` | global | Go to Quiz |
| `?` | global | Show shortcuts overlay |
| Esc | global | Close overlay / cancel inline confirm |
| ⌘/Ctrl + Enter | Add | Save card, clear, stay |
| Esc | Add | Clear fields |
| Space | Quiz | Flip card |
| `n` or `→` | Quiz | Next card |
| `p` or `←` | Quiz | Previous card (no-op at start of current shuffle) |
| `e` | Quiz | Edit current card |
| `/` | Browse | (reserved for future search) |

**Chord implementation:** when `g` is pressed (with no input focused), set a `chordActive` flag and a 1.5s timeout. The next keypress within that window dispatches the chord; outside it, the flag clears. Single keydown handler on `window`, ignored when `event.target` is an `<input>` / `<textarea>` / `[contenteditable]`.

`⌘/Ctrl + Enter` is the one modifier shortcut kept — it's universally safe inside textareas (no browser intercepts it in form contexts) and matches every chat/editor app's "submit" convention.

---

## 8. Export / Import format

Single canonical format: JSON. One file in, one file out, round-trips the entire library losslessly.

```json
{
  "version": 1,
  "exportedAt": "2026-05-27T14:23:00.000Z",
  "cards": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "question": "What are the characteristics of classes in a class frequency?",
      "answer": "- Do not overlap\n- Accommodate all data\n- Of the same size\n- Decimals match raw data",
      "createdAt": 1748345000000,
      "updatedAt": 1748345000000
    }
  ]
}
```

**Import behaviour:** on JSON upload, parse, validate against the schema with a hand-rolled type guard (no Zod — keeps the bundle small). If any card in the file fails validation, **reject the whole file** with a clear error pointing at the first bad entry — partial imports leave the user guessing what landed. On a clean file, for each card: if `id` already exists locally, take the one with the more recent `updatedAt`; otherwise insert. Report `N imported, M updated, K skipped` after.

---

## 9. File / project structure

```
flashcards/
├── docs/
│   └── plan.md                  ← this file
├── public/
│   └── favicon.svg
├── src/
│   ├── lib/
│   │   ├── types.ts             ← Card type, etc
│   │   ├── storage.ts           ← idb-keyval wrappers
│   │   ├── markdown.ts          ← marked + DOMPurify wrapper
│   │   ├── id.ts                ← 8-char nanoid via crypto.getRandomValues
│   │   ├── export.ts            ← JSON exporter
│   │   ├── import.ts            ← JSON importer + validator
│   │   ├── router.ts            ← hash-based router (~20 lines)
│   │   └── shortcuts.ts         ← global keydown dispatch
│   ├── views/
│   │   ├── Add.svelte
│   │   ├── Browse.svelte
│   │   └── Quiz.svelte
│   ├── components/
│   │   ├── Header.svelte
│   │   ├── SettingsPanel.svelte
│   │   └── ShortcutsOverlay.svelte
│   ├── App.svelte
│   ├── app.css                  ← :root tokens + base styles
│   └── main.ts
├── .gitignore
├── .prettierrc
├── eslint.config.js
├── index.html
├── package.json
├── README.md
├── svelte.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## 10. Build phases

Each phase is independently shippable — i.e. the app works at the end of each phase, with each new phase adding a capability.

### Phase 1 — Skeleton (~30 min) ✅

- `npm create vite@latest` → Svelte + TS template
- Hash-based router (`src/lib/router.ts`) supporting `#/add`, `#/edit/:id`, `#/browse`, `#/quiz`; unknown hashes fall through to `add`
- Three placeholder view files in `src/views/`
- `Header.svelte` with three nav links; `add` and `edit` share the highlighted state
- CSS tokens in `app.css`, light + dark via `prefers-color-scheme`
- App renders, can switch views

**Exit:** open the page, click between Add / Browse / Quiz. Bundle: **16.6 KB gzipped** (15.7 JS + 0.9 CSS) — 33% of budget.

### Phase 2 — Persistence + Add (~30 min)

- `src/lib/types.ts` with `Card` type
- `src/lib/storage.ts` wrapping `idb-keyval`: `saveCard`, `getAllCards`, `getCard`, `deleteCard`
- `Add.svelte` with two textareas, Save button, Cmd+Enter shortcut
- Save writes to IndexedDB, clears form, shows "Saved N this session" counter

**Exit:** add cards, refresh page, cards persist (visible via DevTools → Application → IndexedDB).

### Phase 3 — Browse + Edit + Delete (~30 min)

- `Browse.svelte` reads all cards, renders list
- Click row → navigates to `#/add?id={id}`, Add view loads that card for editing
- Inline delete with confirm step
- Saving an edited card updates in place

**Exit:** add, edit, delete cards through the UI.

### Phase 4 — Markdown rendering (~20 min)

- `src/lib/markdown.ts`: `renderMarkdown(source: string): string` — marked + DOMPurify
- Use in Browse (one-line preview, plaintext) and Quiz (full render)

**Exit:** lists and code blocks render correctly in Quiz view.

### Phase 5 — Quiz mode (~30 min)

- `Quiz.svelte`: shuffle queue, current index, flipped state
- Space to flip, N to advance, E to edit
- CSS flip transition
- Empty state copy

**Exit:** can quiz on the cards. Feels good. Keyboard works.

### Phase 6 — Export / Import (~30 min)

- `src/lib/export.ts`: `exportJSON()` — trigger a download via `<a download>`
- `src/lib/import.ts`: parse + validate + merge
- Wire into Settings panel

**Exit:** can round-trip the full library through JSON without loss or duplication.

### Phase 7 — Polish (~30 min) ✅

- Theme toggle (Light / Dark / System) via `data-theme` on `<html>`, persisted in `localStorage` (sync read = no FOUC)
- Settings panel (`<details>` popover with ⚙ in header)
- Shortcuts overlay (`?`) with grouped two-column layout
- Global chord nav `g a` / `g b` / `g q` via a single `window` keydown handler that uses `stopImmediatePropagation` so view-level handlers can't double-fire on a consumed key
- Quiz flip eased to `0.7s cubic-bezier(0.4, 0, 0.2, 1)` (Material standard)
- README with screenshots (`docs/screenshots/{add,browse,quiz}.png`)

**Exit:** v1 done. Bundle **48.16 KB gzipped** (96% of budget). Lighthouse perf **100/100**.

**Total estimated build time: ~3.5 hours of focused work.**

---

## 11. Future directions (not v1)

Listed roughly in the order I'd reach for them. Each is a follow-on once v1 is in daily use and the real gap is clear.

| Feature | When to consider |
|---|---|
| **Tags** | Once the card count passes ~50 and Browse feels noisy. |
| **Search** | Same — once Browse needs filtering. Plain substring on question + answer; no need for fuzzy matching at first. |
| **Spaced repetition (FSRS)** | Once daily Quiz feels random rather than helpful. ~3 KB lib, big UX change. |
| **Cloze deletions** | If the format of what I want to learn calls for it (definitions, lists). |
| **PWA installability + offline shell** | When I want it on my phone home screen. ~5 KB plugin. |
| **Math (KaTeX)** | Only if a real card needs it. ~80 KB — don't take lightly. |
| **Images on cards** | Significant — needs IDB blob storage + paste handling. |
| **Sync across devices** | Major architectural shift — needs a backend or a sync protocol like Y.js + a relay. |
| **Mobile-native capture (share sheet)** | Tied to PWA + Web Share Target API. |

---

## 12. Open questions

Things I haven't decided and don't need to until they come up:

1. **Confirm-delete UX** — inline "Are you sure?" vs. brief undo toast. Inline is simpler; undo is friendlier. Will pick once it's built and felt.
2. **Whether Add view auto-saves drafts** — if you start typing and navigate away, do we keep the draft? Default no; revisit if it bites.

### Decisions made along the way

Smaller calls that came up during planning, captured here so they don't get re-litigated:

- **Markdown safety.** `marked` defaults are fine. Raw HTML in markdown source is disabled in `marked` config *and* the output is sanitised with DOMPurify (belt and braces).
- **Quiz queue.** Shuffle-and-cycle, not pure random. Fisher-Yates shuffle on entry, advance through the queue once, then reshuffle on exhaustion. The reshuffle guarantees the last card of the previous round isn't the first of the next (re-roll the shuffle if it would be), avoiding immediate repeats at the boundary.
- **Empty-state copy.** Each view writes its own one-liner (e.g. Quiz: "Add a card to start quizzing."). Tasteful, not jokey.
- **Validation library.** None. Hand-rolled type guards for the import path; the model is too small to justify Zod's ~10 KB.

---

## 13. Done criteria for v1

The app is done when, on a fresh machine:

- [x] I can `git clone`, `npm install`, `npm run dev`, and have a working app in under 60 seconds.
- [x] I can add a card with markdown lists in the answer, save it, reload the page, and see it persist.
- [x] I can quiz on a library of cards using only the keyboard.
- [x] I can export the library to JSON and re-import it on the same machine without duplicates.
- [x] The built `dist/` is < 50 KB gzipped (excluding favicon) — **48.16 KB**.
- [x] Lighthouse perf score ≥ 95 — **100/100** (FCP 1.2s · LCP 1.3s · TBT 90ms · CLS 0 · SI 1.2s).
- [x] No console errors on any view.

**v1 shipped.**
