<script lang="ts">
  import { onMount } from 'svelte';
  import { getCard, saveCard } from '../lib/storage';
  import { newId } from '../lib/id';
  import { go } from '../lib/router';

  let { id }: { id?: string } = $props();

  let question = $state('');
  let answer = $state('');
  let savedThisSession = $state(0);
  let loading = $state(false);
  let saving = $state(false);
  let error: string | null = $state(null);
  let questionEl: HTMLTextAreaElement | undefined = $state();

  const isEdit = $derived(!!id);
  // Both fields must have non-whitespace content. Trim is used only for the
  // check; the actual saved values preserve the user's formatting.
  const canSave = $derived(
    question.trim().length > 0 && answer.trim().length > 0,
  );

  // Load the card when in edit mode. Runs again if the route id changes.
  $effect(() => {
    if (!id) {
      question = '';
      answer = '';
      error = null;
      return;
    }
    loading = true;
    error = null;
    getCard(id)
      .then((card) => {
        if (card) {
          question = card.question;
          answer = card.answer;
        } else {
          error = `Card "${id}" not found.`;
        }
      })
      .catch((e: unknown) => {
        error = e instanceof Error ? e.message : 'Failed to load card.';
      })
      .finally(() => {
        loading = false;
      });
  });

  onMount(() => {
    questionEl?.focus();
  });

  async function save() {
    if (!canSave || saving) return;
    saving = true;
    error = null;
    try {
      const now = Date.now();
      if (id) {
        // Edit: preserve createdAt, bump updatedAt.
        const existing = await getCard(id);
        if (!existing) throw new Error('Card no longer exists.');
        await saveCard({ ...existing, question, answer, updatedAt: now });
        go({ name: 'browse' });
      } else {
        // Create: new id, both timestamps = now.
        await saveCard({
          id: newId(),
          question,
          answer,
          createdAt: now,
          updatedAt: now,
        });
        savedThisSession += 1;
        question = '';
        answer = '';
        // Keep the user on the capture screen for the next card.
        questionEl?.focus();
      }
    } catch (e: unknown) {
      error = e instanceof Error ? e.message : 'Save failed.';
    } finally {
      saving = false;
    }
  }

  function clearOrCancel() {
    if (isEdit) {
      // In edit mode, Esc cancels and returns to Browse without saving.
      go({ name: 'browse' });
    } else {
      question = '';
      answer = '';
      error = null;
      questionEl?.focus();
    }
  }

  function onKeydown(e: KeyboardEvent) {
    // ⌘/Ctrl+Enter: save from anywhere in the form (including inside textareas).
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      save();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      clearOrCancel();
    }
  }
</script>

<section class="view">
  <h1>{isEdit ? 'Edit card' : 'Add card'}</h1>

  {#if error}
    <p class="error" role="alert">{error}</p>
  {/if}

  {#if loading}
    <p class="placeholder">Loading…</p>
  {:else}
    <!-- Form-level keydown is fine: focus is always inside an interactive
         child (textarea or button) when the shortcuts apply. -->
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <form
      onsubmit={(e) => {
        e.preventDefault();
        save();
      }}
      onkeydown={onKeydown}
    >
      <label>
        <span class="field-label">Question</span>
        <textarea
          bind:this={questionEl}
          bind:value={question}
          rows="3"
          placeholder="Write the prompt…"
          spellcheck="true"
        ></textarea>
      </label>

      <label>
        <span class="field-label">Answer</span>
        <textarea
          bind:value={answer}
          rows="10"
          placeholder="…and the answer (markdown supported)"
          spellcheck="true"
        ></textarea>
      </label>

      <div class="actions">
        <button type="submit" disabled={!canSave || saving}>
          {isEdit ? 'Save' : 'Add'}
          <kbd>⌘↵</kbd>
        </button>
        <button
          type="button"
          class="secondary"
          onclick={clearOrCancel}
          disabled={!isEdit && !question && !answer}
        >
          {isEdit ? 'Cancel' : 'Clear'}
          <kbd>Esc</kbd>
        </button>
      </div>
    </form>

    {#if !isEdit && savedThisSession > 0}
      <p class="status">
        ✓ Saved {savedThisSession} card{savedThisSession === 1 ? '' : 's'} this session
      </p>
    {/if}
  {/if}
</section>

<style>
  .view {
    max-width: 40rem;
    margin: 0 auto;
  }
  h1 {
    margin: 0 0 1rem;
    font-size: 1.5rem;
  }
  form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }
  .field-label {
    font-size: 0.875rem;
    color: var(--fg-muted);
    font-weight: 500;
  }
  textarea {
    font: inherit;
    width: 100%;
    resize: vertical;
    padding: 0.625rem 0.75rem;
    background: var(--bg);
    color: var(--fg);
    border: 1px solid var(--border);
    border-radius: 0.375rem;
    line-height: 1.5;
  }
  textarea:focus {
    border-color: var(--accent);
    outline: 2px solid var(--accent);
    outline-offset: -1px;
  }
  .actions {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }
  button {
    font: inherit;
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    border: 1px solid var(--accent);
    background: var(--accent);
    color: var(--accent-fg);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }
  button.secondary {
    background: var(--bg-subtle);
    color: var(--fg);
    border-color: var(--border);
  }
  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  button:not(:disabled):hover {
    filter: brightness(1.05);
  }
  kbd {
    font-family: var(--font-mono);
    font-size: 0.75em;
    opacity: 0.85;
    padding: 0.05rem 0.3rem;
    border-radius: 0.25rem;
    background: rgba(0, 0, 0, 0.15);
  }
  button.secondary kbd {
    background: rgba(0, 0, 0, 0.08);
  }
  .status {
    margin-top: 1rem;
    color: var(--fg-muted);
    font-size: 0.875rem;
  }
  .error {
    margin: 0 0 1rem;
    padding: 0.5rem 0.75rem;
    background: color-mix(in srgb, var(--danger) 12%, transparent);
    color: var(--danger);
    border-radius: 0.375rem;
    border: 1px solid color-mix(in srgb, var(--danger) 35%, transparent);
  }
  .placeholder {
    color: var(--fg-muted);
    font-style: italic;
  }
</style>
