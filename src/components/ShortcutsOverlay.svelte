<script lang="ts">
  import { overlayOpen } from '../lib/shortcuts';

  function close() {
    overlayOpen.set(false);
  }

  // Mirrors plan §7 + the implementation. Grouped so the most-used (nav +
  // global) sits first.
  const groups = [
    {
      heading: 'Navigation',
      rows: [
        ['g a', 'Go to Add'],
        ['g b', 'Go to Browse'],
        ['g q', 'Go to Quiz'],
      ],
    },
    {
      heading: 'Global',
      rows: [
        ['?', 'Toggle this overlay'],
        ['Esc', 'Close overlay / cancel inline confirm'],
      ],
    },
    {
      heading: 'Add / Edit',
      rows: [
        ['⌘/Ctrl + Enter', 'Save card'],
        ['Esc', 'Clear (Add) or Cancel (Edit)'],
      ],
    },
    {
      heading: 'Quiz',
      rows: [
        ['Space', 'Flip card'],
        ['n  or  →', 'Next card'],
        ['p  or  ←', 'Previous card'],
        ['e', 'Edit current card'],
      ],
    },
  ];
</script>

{#if $overlayOpen}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="backdrop" onclick={close} role="presentation"></div>

  <div
    class="panel"
    role="dialog"
    aria-modal="true"
    aria-labelledby="shortcuts-title"
  >
    <header>
      <h2 id="shortcuts-title">Keyboard shortcuts</h2>
      <button class="close" onclick={close} aria-label="Close">×</button>
    </header>

    <div class="groups">
      {#each groups as group (group.heading)}
        <section>
          <h3>{group.heading}</h3>
          <dl>
            {#each group.rows as [keys, desc]}
              <dt><kbd>{keys}</kbd></dt>
              <dd>{desc}</dd>
            {/each}
          </dl>
        </section>
      {/each}
    </div>

    <footer>
      Press <kbd>?</kbd> to toggle, <kbd>Esc</kbd> to close.
    </footer>
  </div>
{/if}

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    z-index: 100;
  }
  .panel {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: min(40rem, calc(100vw - 2rem));
    max-height: calc(100vh - 4rem);
    overflow-y: auto;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 0.625rem;
    box-shadow: 0 12px 36px rgba(0, 0, 0, 0.35);
    z-index: 101;
    padding: 1.25rem 1.5rem;
  }

  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }
  h2 {
    margin: 0;
    font-size: 1.125rem;
  }
  .close {
    background: transparent;
    border: 0;
    color: var(--fg-muted);
    font-size: 1.5rem;
    line-height: 1;
    cursor: pointer;
    padding: 0.25rem 0.5rem;
    border-radius: 0.375rem;
  }
  .close:hover {
    background: var(--bg-subtle);
    color: var(--fg);
  }

  .groups {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.25rem 2rem;
  }
  @media (max-width: 36rem) {
    .groups {
      grid-template-columns: 1fr;
    }
  }
  section h3 {
    margin: 0 0 0.5rem;
    font-size: 0.8125rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--fg-muted);
  }
  dl {
    margin: 0;
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0.4rem 0.75rem;
    align-items: center;
  }
  dt {
    margin: 0;
  }
  dd {
    margin: 0;
    color: var(--fg);
    font-size: 0.9375rem;
  }
  kbd {
    font-family: var(--font-mono);
    font-size: 0.8rem;
    background: var(--bg-subtle);
    border: 1px solid var(--border);
    padding: 0.15rem 0.4rem;
    border-radius: 0.3rem;
    color: var(--fg);
    white-space: nowrap;
  }

  footer {
    margin-top: 1rem;
    padding-top: 0.75rem;
    border-top: 1px solid var(--border);
    color: var(--fg-muted);
    font-size: 0.8125rem;
    text-align: center;
  }
  footer kbd {
    font-size: 0.7rem;
  }
</style>
