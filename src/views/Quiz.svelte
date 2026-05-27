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
      <div class="empty-icon" aria-hidden="true">🎯</div>
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
        <span class="face-label">Question</span>
        {@html renderMarkdown(currentCard.question)}
      </div>
      <div class="face back markdown" aria-hidden={!flipped}>
        <span class="face-label">Answer</span>
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
      <button onclick={prev} disabled={atStart}>
        <kbd>P</kbd> ← Prev
      </button>
      <button onclick={editCurrent}>
        Edit <kbd>E</kbd>
      </button>
      <button onclick={next}>
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
  .empty-icon {
    font-size: 2.5rem;
    line-height: 1;
    margin-bottom: 0.75rem;
    opacity: 0.85;
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
    position: relative;
    grid-area: card;
    padding: 2.5rem 2rem 2rem;
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
  /* Tiny uppercase label in the top-left corner makes Q vs A unambiguous
   * at a glance — without it both faces look identical post-flip. */
  .face-label {
    position: absolute;
    top: 0.75rem;
    left: 1rem;
    font-size: 0.6875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--fg-muted);
  }
  .face.back .face-label {
    color: var(--accent);
  }
  .face.front {
    transform: rotateY(0deg);
  }
  .face.back {
    /* Subtle accent-tinted border + label so the reveal feels distinct from
     * the prompt without making the answer card a different shape. */
    transform: rotateY(180deg);
    border-color: color-mix(in srgb, var(--accent) 40%, var(--border));
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
</style>
