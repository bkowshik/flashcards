<script lang="ts">
  import { onMount } from 'svelte';
  import { getAllCards } from '../lib/storage';
  import { renderMarkdown } from '../lib/markdown';
  import { go } from '../lib/router';
  import type { Card } from '../lib/types';

  let cards = $state<Card[]>([]);
  // The queue is a list of indices into `cards`. We never mutate `cards`
  // during a quiz session — only the queue and position move.
  let queue = $state<number[]>([]);
  let position = $state(0);
  let flipped = $state(false);
  let loading = $state(true);
  let error: string | null = $state(null);

  const currentCard = $derived<Card | undefined>(
    queue.length > 0 ? cards[queue[position]] : undefined,
  );
  const atStart = $derived(position === 0);

  onMount(async () => {
    try {
      const all = await getAllCards();
      cards = all;
      queue = shuffle(cards.length);
    } catch (e: unknown) {
      error = e instanceof Error ? e.message : 'Failed to load cards.';
    } finally {
      loading = false;
    }
  });

  // Fisher-Yates shuffle of [0, n). If `avoidFirst` is given and the new
  // queue would start with that index, swap positions 0 and 1 so the user
  // never sees the same card twice across a reshuffle boundary.
  function shuffle(n: number, avoidFirst?: number): number[] {
    const arr = Array.from({ length: n }, (_, i) => i);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    if (avoidFirst !== undefined && arr.length > 1 && arr[0] === avoidFirst) {
      [arr[0], arr[1]] = [arr[1], arr[0]];
    }
    return arr;
  }

  function flip() {
    flipped = !flipped;
  }

  function next() {
    if (queue.length === 0) return;
    flipped = false;
    if (position < queue.length - 1) {
      position += 1;
    } else {
      // End of queue → reshuffle, avoiding the card we just saw as the new
      // first entry. Decisions §12 (plan).
      const lastSeen = queue[position];
      queue = shuffle(cards.length, lastSeen);
      position = 0;
    }
  }

  function prev() {
    if (position === 0) return;
    flipped = false;
    position -= 1;
  }

  function editCurrent() {
    if (currentCard) go({ name: 'edit', id: currentCard.id });
  }

  function onKeydown(e: KeyboardEvent) {
    // The global chord handler in App.svelte uses stopImmediatePropagation
    // to swallow keys it consumes (g, second of chord, ?, Esc-for-overlay),
    // so this handler never sees those.

    // Defensive: ignore when focus is in an editable target. Quiz has no
    // such targets today, but the check is cheap and protects against
    // future additions.
    const t = e.target as HTMLElement | null;
    if (
      t &&
      (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)
    ) {
      return;
    }
    // Ignore modifier combinations — those are reserved for the browser
    // (e.g. ⌘R to reload) and global shortcuts.
    if (e.metaKey || e.ctrlKey || e.altKey) return;

    if (e.key === ' ') {
      e.preventDefault();
      flip();
    } else if (e.key === 'n' || e.key === 'ArrowRight') {
      e.preventDefault();
      next();
    } else if (e.key === 'p' || e.key === 'ArrowLeft') {
      e.preventDefault();
      prev();
    } else if (e.key === 'e') {
      e.preventDefault();
      editCurrent();
    }
  }
</script>

<svelte:window onkeydown={onKeydown} />

<section class="view">
  {#if loading}
    <p class="placeholder">Loading…</p>
  {:else if error}
    <p class="error" role="alert">{error}</p>
  {:else if cards.length === 0}
    <div class="empty">
      <p>No cards yet.</p>
      <a class="cta" href="#/add">Add a card to start quizzing</a>
    </div>
  {:else if currentCard}
    <!--
      Both faces sit in a single grid cell; the cell's height is the max of
      the two faces' natural heights so the layout doesn't jump mid-flip.
      preserve-3d + rotateY + backface-visibility:hidden gives the flip
      effect without any JS.
    -->
    <div class="card-stack" class:flipped role="presentation">
      <div class="face front markdown" aria-hidden={flipped}>
        {@html renderMarkdown(currentCard.question)}
      </div>
      <div class="face back markdown" aria-hidden={!flipped}>
        {@html renderMarkdown(currentCard.answer)}
      </div>
    </div>

    <div class="flip-row">
      <button class="primary" onclick={flip}>
        {flipped ? 'Show question' : 'Show answer'} <kbd>Space</kbd>
      </button>
    </div>

    <div class="meta">Card {position + 1} of {queue.length}</div>

    <div class="nav">
      <button onclick={prev} disabled={atStart} class="secondary">
        <kbd>P</kbd> ← Prev
      </button>
      <button onclick={editCurrent} class="secondary">
        Edit <kbd>E</kbd>
      </button>
      <button onclick={next} class="secondary">
        Next → <kbd>N</kbd>
      </button>
    </div>
  {/if}
</section>

<style>
  .view {
    max-width: 44rem;
    margin: 0 auto;
  }

  .placeholder {
    color: var(--fg-muted);
    font-style: italic;
  }
  .error {
    margin: 0 0 1rem;
    padding: 0.5rem 0.75rem;
    background: color-mix(in srgb, var(--danger) 12%, transparent);
    color: var(--danger);
    border-radius: 0.375rem;
    border: 1px solid color-mix(in srgb, var(--danger) 35%, transparent);
  }

  .empty {
    padding: 3rem 1rem;
    text-align: center;
    color: var(--fg-muted);
  }
  .empty p {
    margin: 0 0 1rem;
  }
  .cta {
    display: inline-block;
    padding: 0.5rem 1rem;
    background: var(--accent);
    color: var(--accent-fg);
    text-decoration: none;
    border-radius: 0.375rem;
  }

  /* ---- Card flip --------------------------------------------------------- */

  .card-stack {
    display: grid;
    grid-template-areas: 'card';
    perspective: 1400px;
    margin: 2rem 0;
    min-height: 10rem;
  }
  .face {
    grid-area: card;
    padding: 2rem;
    background: var(--bg-subtle);
    border: 1px solid var(--border);
    border-radius: 0.625rem;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden; /* Safari */
    transform-style: preserve-3d;
    /* Material's "standard" easing — smoother than `ease` at this duration. */
    transition: transform 0.7s cubic-bezier(0.4, 0, 0.2, 1);
    font-size: 1.0625rem;
    line-height: 1.55;
  }
  .face.front {
    transform: rotateY(0deg);
  }
  .face.back {
    transform: rotateY(180deg);
  }
  .card-stack.flipped .face.front {
    transform: rotateY(-180deg);
  }
  .card-stack.flipped .face.back {
    transform: rotateY(0deg);
  }

  /* ---- Controls ---------------------------------------------------------- */

  .flip-row {
    display: flex;
    justify-content: center;
    margin: 1.5rem 0 0.75rem;
  }
  .meta {
    text-align: center;
    color: var(--fg-muted);
    font-size: 0.875rem;
    margin: 0.5rem 0 1rem;
  }
  .nav {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
  }

  button {
    font: inherit;
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }
  button.primary {
    background: var(--accent);
    color: var(--accent-fg);
    border: 1px solid var(--accent);
  }
  button.secondary {
    background: var(--bg-subtle);
    color: var(--fg);
    border: 1px solid var(--border);
  }
  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  button:not(:disabled):hover {
    filter: brightness(1.05);
  }
  button:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
  }
  kbd {
    font-family: var(--font-mono);
    font-size: 0.72em;
    opacity: 0.85;
    padding: 0.05rem 0.3rem;
    border-radius: 0.25rem;
    background: rgba(0, 0, 0, 0.15);
  }
  button.secondary kbd {
    background: rgba(0, 0, 0, 0.08);
  }
</style>
