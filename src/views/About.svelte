<script lang="ts">
  import { theme, setTheme, type Theme } from '../lib/theme';
  import { shortcutGroups } from '../lib/keyboard-help';

  const REPO_URL = 'https://github.com/bkowshik/flashcards';

  let selected = $state<Theme>($theme);

  // Keep local in sync if theme changes elsewhere (e.g. another tab).
  $effect(() => {
    selected = $theme;
  });

  function pick(value: Theme) {
    if (value !== $theme) setTheme(value);
  }
</script>

<article class="about">
  <header class="intro">
    <h1>
      <span class="emoji" aria-hidden="true">📇</span> flashcards
    </h1>
    <p class="tagline">
      A fast, fully client-side flashcard tool. No login, no server, no
      analytics. Cards live in your browser; export the whole library to JSON
      any time.
    </p>
    <p class="meta">
      Open source at
      <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
        github.com/bkowshik/flashcards
      </a>
    </p>
  </header>

  <section aria-labelledby="data-heading">
    <h2 id="data-heading">
      <span class="emoji" aria-hidden="true">🔒</span> Your data
    </h2>
    <p>
      Cards live in your browser's IndexedDB under the
      <code>flashcards</code> database. Nothing is sent anywhere — clearing
      your browser data clears your cards.
    </p>
    <p>
      Use <strong>Export</strong> on the Browse page to download a JSON
      backup, and <strong>Import</strong> to restore one (e.g. on a new
      device or browser).
    </p>
    <p class="hint">
      To wipe everything: DevTools → Application → IndexedDB →
      <code>flashcards</code> → Delete database.
    </p>
  </section>

  <section aria-labelledby="settings-heading">
    <h2 id="settings-heading">
      <span class="emoji" aria-hidden="true">⚙️</span> Settings
    </h2>

    <div class="row">
      <div class="row-label">
        <h3>Theme</h3>
        <p class="hint">System follows your OS preference.</p>
      </div>
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
    </div>
  </section>

  <section aria-labelledby="shortcuts-heading">
    <h2 id="shortcuts-heading">
      <span class="emoji" aria-hidden="true">⌨️</span> Keyboard shortcuts
    </h2>

    <div class="groups">
      {#each shortcutGroups as group (group.heading)}
        <div class="group">
          <h3>{group.heading}</h3>
          <dl>
            {#each group.rows as [keys, desc]}
              <dt><kbd>{keys}</kbd></dt>
              <dd>{desc}</dd>
            {/each}
          </dl>
        </div>
      {/each}
    </div>
  </section>

  <footer class="credit">
    Built with <span aria-label="brain" role="img">🧠</span> by
    <a href={REPO_URL} target="_blank" rel="noopener noreferrer">Bhargav Kowshik</a>
    <span class="sep">·</span>
    <a
      href="https://github.com/bkowshik/flashcards/blob/main/LICENSE"
      target="_blank"
      rel="noopener noreferrer"
    >MIT</a>
  </footer>
</article>

<style>
  .about {
    max-width: 44rem;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 2.25rem;
  }

  .intro h1 {
    margin: 0 0 0.5rem;
    font-size: 1.5rem;
    letter-spacing: -0.015em;
  }
  .tagline {
    margin: 0 0 0.5rem;
    color: var(--fg);
    line-height: 1.55;
  }
  .meta {
    margin: 0;
    color: var(--fg-muted);
    font-size: 0.9375rem;
  }
  .meta a {
    color: var(--accent);
    text-decoration: none;
  }
  .meta a:hover {
    text-decoration: underline;
  }

  section {
    border-top: 1px solid var(--border);
    padding-top: 1.5rem;
  }
  section h2 {
    margin: 0 0 0.875rem;
    font-size: 1.25rem;
    letter-spacing: -0.01em;
  }
  /* Generic — same treatment whether the emoji lives in the page h1 or a
   * section h2. Sized in `em` so it always scales with the parent heading. */
  .emoji {
    display: inline-block;
    margin-right: 0.35rem;
    font-size: 0.9em;
    /* Color-emoji fonts don't follow `color`; this keeps weight visually
     * balanced against the heading text. */
    vertical-align: 0.02em;
  }
  section p {
    margin: 0 0 0.625rem;
    color: var(--fg);
    line-height: 1.55;
  }
  section p:last-child {
    margin-bottom: 0;
  }
  .hint {
    color: var(--fg-muted);
    font-size: 0.875rem;
  }
  code {
    font-family: var(--font-mono);
    font-size: 0.85em;
    background: var(--bg-subtle);
    padding: 0.05rem 0.3rem;
    border-radius: 0.25rem;
  }

  .row {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 1.25rem;
    align-items: center;
  }
  @media (max-width: 28rem) {
    .row {
      grid-template-columns: 1fr;
    }
  }
  .row-label h3 {
    margin: 0 0 0.15rem;
    font-size: 0.9375rem;
    font-weight: 600;
  }
  .row-label .hint {
    margin: 0;
  }

  .theme-options {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.25rem;
    background: var(--bg-subtle);
    padding: 0.2rem;
    border-radius: 0.375rem;
    min-width: 14rem;
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

  /* Single column so each group reads as one continuous list. */
  .groups {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }
  .group h3 {
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
    grid-template-columns: minmax(8rem, max-content) 1fr;
    gap: 0.4rem 1rem;
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

  .credit {
    margin-top: 1rem;
    padding-top: 1.25rem;
    border-top: 1px solid var(--border);
    color: var(--fg-muted);
    font-size: 0.875rem;
    text-align: center;
  }
  .credit a {
    color: var(--fg-muted);
    text-decoration: none;
    border-bottom: 1px dotted var(--border);
  }
  .credit a:hover {
    color: var(--fg);
    border-bottom-color: var(--fg-muted);
  }
  .credit .sep {
    margin: 0 0.4rem;
    color: var(--border);
  }
</style>
