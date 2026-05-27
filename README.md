# 📇 flashcards

A fast, fully client-side flashcard tool. No login, no server, no analytics. Cards live in your browser; export the whole library to JSON any time.

- **Live:** <https://flashcards.bkowshik.in>
- **Source:** <https://github.com/bkowshik/flashcards>

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

- **[Vite](https://vite.dev)** — build tool and dev server with HMR.
- **[Svelte 5](https://svelte.dev)** — UI framework with the runes API.
- **TypeScript** — type safety across the app.
- **[`idb-keyval`](https://github.com/jakearchibald/idb-keyval)** — tiny IndexedDB wrapper for local card storage.
- **[`marked`](https://marked.js.org) + [`DOMPurify`](https://github.com/cure53/DOMPurify)** — markdown rendering, sanitized.
- **[Geist Sans + Geist Mono](https://vercel.com/font)** — self-hosted via [Fontsource](https://fontsource.org).

Builds to **~46 KB gzipped JS** + ~3.5 KB CSS, under the 50 KB target.

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

- `#/add` — capture a new card (default)
- `#/edit/:id` — edit an existing card
- `#/browse` — list of all cards
- `#/quiz` — flip through a shuffled queue
- `#/about` — intro, theme picker, keyboard shortcuts, data location

## Keyboard

Nav is Gmail-style chord shortcuts: `g a` (Add) · `g b` (Browse) · `g q` (Quiz). Quiz: `Space` to flip, `n`/`p` (or `→`/`←`) to navigate, `e` to edit. Save in Add is `⌘/Ctrl + Enter`; `Esc` clears or cancels.

Full list on the [About page](https://flashcards.bkowshik.in/#/about).

## Data

Cards live in your browser's IndexedDB under the `flashcards` database. Nothing is sent anywhere.

- **Export** (Browse) — download the whole library as JSON.
- **Import** (Browse) — merge a JSON file back in.
- Wipe everything: DevTools → Application → IndexedDB → `flashcards` → Delete database.

## Deploy

Hosted on [Cloudflare Pages](https://pages.cloudflare.com) with Git integration — every push to `main` rebuilds and ships.

| Setting | Value |
|---|---|
| Build command | `npm run build` |
| Build output | `dist/` |
| Node version | `20` (via `NODE_VERSION` env var) |

## License

[MIT](LICENSE) © 2026 Bhargav Kowshik.
