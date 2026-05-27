<script lang="ts">
  import { onMount } from 'svelte';
  import { getAllCards, deleteCard } from '../lib/storage';
  import { exportJSON } from '../lib/export';
  import { importJSON, type ImportResult } from '../lib/import';
  import type { Card } from '../lib/types';

  let cards = $state<Card[]>([]);
  let loading = $state(true);
  let error: string | null = $state(null);

  // The id of the card whose Delete button is currently in its "Are you sure?"
  // state. Only one card can be confirming at a time — opening a new confirm
  // closes any other.
  let confirmingId: string | null = $state(null);

  // The id currently being deleted (between click of Yes and IDB completing).
  // Used to disable the Yes button so a double-click doesn't fire twice.
  let deletingId: string | null = $state(null);

  let exporting = $state(false);
  let importing = $state(false);
  let importMessage: string | null = $state(null);
  let fileInput: HTMLInputElement | undefined = $state();

  async function refreshCards() {
    const all = await getAllCards();
    cards = all.sort((a, b) => b.createdAt - a.createdAt);
  }

  onMount(async () => {
    try {
      await refreshCards();
    } catch (e: unknown) {
      error = e instanceof Error ? e.message : 'Failed to load cards.';
    } finally {
      loading = false;
    }
  });

  function askDelete(id: string) {
    confirmingId = id;
  }

  function cancelDelete() {
    confirmingId = null;
  }

  async function confirmDelete(id: string) {
    if (deletingId) return;
    deletingId = id;
    try {
      await deleteCard(id);
      cards = cards.filter((c) => c.id !== id);
      confirmingId = null;
    } catch (e: unknown) {
      error = e instanceof Error ? e.message : 'Delete failed.';
    } finally {
      deletingId = null;
    }
  }

  // Global-ish Esc: cancel pending confirm when the user presses Escape.
  // (A proper global handler lands in a later phase; scoping it to the view
  // is fine for now.)
  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && confirmingId) {
      e.preventDefault();
      cancelDelete();
    }
  }

  // ---- Export / Import ------------------------------------------------------

  async function onExport() {
    if (cards.length === 0 || exporting) return;
    exporting = true;
    error = null;
    try {
      await exportJSON();
    } catch (e: unknown) {
      error = e instanceof Error ? e.message : 'Export failed.';
    } finally {
      exporting = false;
    }
  }

  function onImportClick() {
    importMessage = null;
    error = null;
    fileInput?.click();
  }

  async function onFileChosen(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    // Reset the input now so picking the same file again still triggers change.
    input.value = '';
    if (!file) return;

    importing = true;
    importMessage = null;
    error = null;
    try {
      const text = await file.text();
      const result: ImportResult = await importJSON(text);
      await refreshCards();
      importMessage = formatImportResult(result);
    } catch (e: unknown) {
      error = e instanceof Error ? e.message : 'Import failed.';
    } finally {
      importing = false;
    }
  }

  function formatImportResult(r: ImportResult): string {
    const parts: string[] = [];
    if (r.imported) parts.push(`${r.imported} imported`);
    if (r.updated) parts.push(`${r.updated} updated`);
    if (r.skipped) parts.push(`${r.skipped} skipped`);
    return parts.length === 0 ? 'File was empty.' : '✓ ' + parts.join(', ') + '.';
  }

  // ---- Formatting helpers ---------------------------------------------------

  const dateFmt = new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  });
  function formatDate(ts: number): string {
    return dateFmt.format(ts);
  }
</script>

<svelte:window onkeydown={onKeydown} />

<section class="view">
  <header class="bar">
    <h1>
      {#if loading}Loading…
      {:else}{cards.length} {cards.length === 1 ? 'card' : 'cards'}
      {/if}
    </h1>
    {#if !loading}
      <div class="bar-actions">
        <button
          class="bar-btn"
          onclick={onExport}
          disabled={cards.length === 0 || exporting}
          title={cards.length === 0 ? 'Nothing to export yet' : 'Download all cards as JSON'}
        >
          {exporting ? 'Exporting…' : 'Export'}
        </button>
        <button
          class="bar-btn"
          onclick={onImportClick}
          disabled={importing}
          title="Merge cards from a JSON file"
        >
          {importing ? 'Importing…' : 'Import'}
        </button>
        <input
          bind:this={fileInput}
          type="file"
          accept=".json,application/json"
          onchange={onFileChosen}
          hidden
        />
      </div>
    {/if}
  </header>

  {#if importMessage}
    <p class="status" role="status">{importMessage}</p>
  {/if}

  {#if error}
    <p class="error" role="alert">{error}</p>
  {/if}

  {#if !loading && cards.length === 0 && !error}
    <div class="empty">
      <p>No cards yet.</p>
      <a class="cta" href="#/add">Add your first card</a>
    </div>
  {:else if !loading}
    <ul class="list">
      {#each cards as card (card.id)}
        <li class="row" class:confirming={confirmingId === card.id}>
          <!--
            The row's editable area is an anchor to #/edit/:id — keyboard,
            click, and focus all come free, and we avoid nesting buttons.
            Actions sit beside it as separate, non-link buttons.
          -->
          <a class="row-main" href="#/edit/{card.id}">
            <div class="row-q">{card.question}</div>
            <div class="row-meta">{formatDate(card.createdAt)}</div>
          </a>
          <div class="row-actions">
            {#if confirmingId === card.id}
              <span class="confirm-label">Delete?</span>
              <button
                class="danger"
                disabled={deletingId === card.id}
                onclick={() => confirmDelete(card.id)}
              >
                {deletingId === card.id ? 'Deleting…' : 'Yes'}
              </button>
              <button class="secondary" onclick={cancelDelete}>Cancel</button>
            {:else}
              <button class="secondary" onclick={() => askDelete(card.id)}>
                Delete
              </button>
            {/if}
          </div>
        </li>
      {/each}
    </ul>
  {/if}
</section>

<style>
  .view {
    max-width: 48rem;
    margin: 0 auto;
  }
  .bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }
  h1 {
    margin: 0;
    font-size: 1.5rem;
  }
  .bar-actions {
    display: flex;
    gap: 0.375rem;
  }
  .bar-btn {
    font: inherit;
    font-size: 0.875rem;
    padding: 0.375rem 0.75rem;
    border-radius: 0.375rem;
    border: 1px solid var(--border);
    background: var(--bg-subtle);
    color: var(--fg);
    cursor: pointer;
  }
  .bar-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .bar-btn:not(:disabled):hover {
    filter: brightness(1.05);
  }
  .bar-btn:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
  }
  .status {
    margin: 0 0 1rem;
    padding: 0.5rem 0.75rem;
    background: color-mix(in srgb, var(--accent) 10%, transparent);
    color: var(--fg);
    border-radius: 0.375rem;
    border: 1px solid color-mix(in srgb, var(--accent) 35%, transparent);
    font-size: 0.875rem;
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
  .list {
    list-style: none;
    margin: 0;
    padding: 0;
    border-top: 1px solid var(--border);
  }
  .row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 0;
    border-bottom: 1px solid var(--border);
  }
  .row.confirming {
    background: color-mix(in srgb, var(--danger) 6%, transparent);
  }
  .row-main {
    flex: 1 1 auto;
    min-width: 0; /* allow text truncation in flex children */
    color: inherit;
    text-decoration: none;
    display: block;
    padding: 0.25rem 0.5rem;
    border-radius: 0.375rem;
  }
  .row-main:hover {
    background: var(--bg-subtle);
  }
  .row-main:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: -1px;
  }
  .row-q {
    color: var(--fg);
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
  .row-meta {
    color: var(--fg-muted);
    font-size: 0.8125rem;
    margin-top: 0.5rem;
  }
  .row-actions {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    gap: 0.375rem;
  }
  .confirm-label {
    color: var(--danger);
    font-size: 0.875rem;
    margin-right: 0.25rem;
  }
  button {
    font: inherit;
    padding: 0.375rem 0.75rem;
    border-radius: 0.375rem;
    border: 1px solid var(--border);
    background: var(--bg-subtle);
    color: var(--fg);
    cursor: pointer;
    font-size: 0.875rem;
  }
  button.secondary {
    background: var(--bg-subtle);
  }
  button.danger {
    background: var(--danger);
    color: white;
    border-color: var(--danger);
  }
  button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  button:not(:disabled):hover {
    filter: brightness(1.05);
  }
  button:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
  }
  .error {
    margin: 0 0 1rem;
    padding: 0.5rem 0.75rem;
    background: color-mix(in srgb, var(--danger) 12%, transparent);
    color: var(--danger);
    border-radius: 0.375rem;
    border: 1px solid color-mix(in srgb, var(--danger) 35%, transparent);
  }
</style>
