# 📇 flashcards

A fast, fully client-side flashcard tool. No login, no server, no analytics. Cards live in your browser; export the whole library to JSON any time.

**Live:** <https://flashcards-bkowshik.pages.dev>
**Source:** <https://github.com/bkowshik/flashcards>

See [docs/plan.md](docs/plan.md) for the design doc and build phases.

## Quick start

Requires Node 20+ and npm.

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173` with hot module reload.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run check` | `svelte-check` (types + Svelte diagnostics) |

## Stack

[Vite](https://vite.dev) · [Svelte 5](https://svelte.dev) · TypeScript · IndexedDB (via [`idb-keyval`](https://github.com/jakearchibald/idb-keyval)) · [`marked`](https://marked.js.org) + [`DOMPurify`](https://github.com/cure53/DOMPurify) for markdown · [Geist Sans + Geist Mono](https://vercel.com/font) self-hosted via [Fontsource](https://fontsource.org).

Bundle: **~46 KB gzipped JS**, ~3.5 KB gzipped CSS, plus woff2 font subsets loaded on demand. Stays under the 50 KB JS target.

## Project layout

```
src/
├── App.svelte            ← top-level layout + view switch
├── app.css               ← CSS tokens, shared button system, base styles
├── main.ts               ← font imports, mount()
├── components/
│   └── Header.svelte     ← brand + nav tabs
├── lib/
│   ├── router.ts         ← hash-based router
│   ├── storage.ts        ← IndexedDB get/save/delete
│   ├── markdown.ts       ← marked + DOMPurify
│   ├── theme.ts          ← light / dark / system
│   ├── shortcuts.ts      ← global g-chord nav handler
│   ├── keyboard-help.ts  ← shortcut reference rendered on About
│   ├── export.ts         ← JSON backup download
│   ├── import.ts         ← JSON merge restore
│   ├── id.ts             ← URL-safe 8-char id generator
│   └── types.ts          ← Card type
└── views/
    ├── Add.svelte        ← capture / edit a card
    ├── Browse.svelte     ← list, export, import, delete
    ├── Quiz.svelte       ← shuffled queue with flip animation
    └── About.svelte      ← intro, settings, shortcuts, data location
```

## Routes

Hash-based, no server-side routing needed.

- `#/add` — capture a new card (default)
- `#/edit/:id` — edit an existing card (same component as Add)
- `#/browse` — list of all cards
- `#/quiz` — flip through a shuffled queue
- `#/about` — intro, theme picker, keyboard shortcuts, data location

## Keyboard

Nav is Gmail-style chord shortcuts: `g a` (Add) · `g b` (Browse) · `g q` (Quiz). Quiz: `Space` to flip, `n`/`p` (or `→`/`←`) to navigate, `e` to edit the current card. Save in Add is `⌘/Ctrl + Enter`; `Esc` clears the form or cancels an edit.

The full list lives on the [About page](https://flashcards-bkowshik.pages.dev/#/about).

## Data

Cards live in your browser's IndexedDB under the `flashcards` database. Nothing is sent anywhere — clearing your browser data clears your cards.

- **Export** (Browse page) downloads the whole library as JSON.
- **Import** (Browse page) merges a JSON file back in.
- To wipe everything manually: DevTools → Application → IndexedDB → `flashcards` → Delete database.

## Deploy

Hosted on [Cloudflare Pages](https://pages.cloudflare.com) with Git integration: every push to `main` rebuilds and ships to the live URL above. Build settings:

| | |
|---|---|
| Build command | `npm run build` |
| Build output | `dist/` |
| Node version | `20` (via `NODE_VERSION` env var) |

Self-hosted Geist Sans + Geist Mono ship via [Fontsource](https://fontsource.org) — woff2 files land in `dist/assets/` at build, so the app makes no third-party requests in production.

## License

Released under the [MIT License](LICENSE). Copyright © 2026 Bhargav Kowshik.

You're free to fork, modify, and use this for anything — see [LICENSE](LICENSE) for the full terms.
