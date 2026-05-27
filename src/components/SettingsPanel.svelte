<script lang="ts">
  import { theme, setTheme, type Theme } from '../lib/theme';

  // Bindable so the radio group writes back through setTheme via $effect.
  let selected = $state<Theme>($theme);

  // Keep the local copy in sync with external updates (e.g. another tab).
  $effect(() => {
    selected = $theme;
  });

  function pick(value: Theme) {
    if (value !== $theme) setTheme(value);
  }
</script>

<details class="panel">
  <summary aria-label="Settings">⚙</summary>
  <div class="body" role="menu">
    <h3>Theme</h3>
    <div class="theme-options" role="radiogroup" aria-label="Theme">
      {#each ['light', 'dark', 'system'] as const as opt (opt)}
        <label class="theme-opt" class:active={selected === opt}>
          <input
            type="radio"
            name="theme"
            value={opt}
            checked={selected === opt}
            onchange={() => pick(opt)}
          />
          <span class="cap">{opt[0].toUpperCase() + opt.slice(1)}</span>
        </label>
      {/each}
    </div>

    <p class="meta">
      <a href="https://github.com/" target="_blank" rel="noopener noreferrer">About / source</a>
    </p>
  </div>
</details>

<style>
  .panel {
    position: relative;
  }
  summary {
    list-style: none;
    cursor: pointer;
    user-select: none;
    padding: 0.4rem 0.6rem;
    border-radius: 0.375rem;
    color: var(--fg-muted);
    font-size: 1.1rem;
    line-height: 1;
  }
  summary::-webkit-details-marker {
    display: none;
  }
  summary:hover {
    background: var(--bg-subtle);
    color: var(--fg);
  }
  summary:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
  }
  .panel[open] summary {
    background: var(--bg-subtle);
    color: var(--fg);
  }

  .body {
    position: absolute;
    right: 0;
    top: calc(100% + 0.375rem);
    min-width: 14rem;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    padding: 0.875rem 1rem;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
    z-index: 50;
  }
  h3 {
    margin: 0 0 0.5rem;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--fg-muted);
  }

  .theme-options {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.25rem;
    background: var(--bg-subtle);
    padding: 0.2rem;
    border-radius: 0.375rem;
  }
  .theme-opt {
    position: relative;
    text-align: center;
    padding: 0.4rem 0.5rem;
    border-radius: 0.25rem;
    cursor: pointer;
    font-size: 0.875rem;
    color: var(--fg-muted);
  }
  .theme-opt:hover {
    color: var(--fg);
  }
  .theme-opt.active {
    background: var(--bg);
    color: var(--fg);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  }
  .theme-opt input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }
  .theme-opt:focus-within {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
  }

  .meta {
    margin: 0.875rem 0 0;
    font-size: 0.8125rem;
    color: var(--fg-muted);
  }
  .meta a {
    color: var(--accent);
    text-decoration: none;
  }
  .meta a:hover {
    text-decoration: underline;
  }
</style>
