<script lang="ts">
  import { route, go, type Route } from '../lib/router';
  import SettingsPanel from './SettingsPanel.svelte';

  type NavItem = { label: string; route: Route; match: Route['name'][] };

  // Edit shares the Add tab — visually highlighting Add while editing
  // keeps the user oriented to the action they're performing.
  const items: NavItem[] = [
    { label: 'Add', route: { name: 'add' }, match: ['add', 'edit'] },
    { label: 'Browse', route: { name: 'browse' }, match: ['browse'] },
    { label: 'Quiz', route: { name: 'quiz' }, match: ['quiz'] },
  ];
</script>

<header>
  <a class="brand" href="#/add" onclick={(e) => { e.preventDefault(); go({ name: 'add' }); }}>
    Flashcards
  </a>
  <nav>
    {#each items as item (item.label)}
      <button
        class="nav-link"
        class:active={item.match.includes($route.name)}
        onclick={() => go(item.route)}
      >
        {item.label}
      </button>
    {/each}
    <SettingsPanel />
  </nav>
</header>

<style>
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1.25rem;
    border-bottom: 1px solid var(--border);
    background: var(--bg);
  }
  .brand {
    font-weight: 600;
    color: var(--fg);
    text-decoration: none;
    font-size: 1.05rem;
  }
  nav {
    display: flex;
    gap: 0.25rem;
  }
  .nav-link {
    background: transparent;
    border: 0;
    color: var(--fg-muted);
    padding: 0.4rem 0.75rem;
    font: inherit;
    border-radius: 0.375rem;
    cursor: pointer;
  }
  .nav-link:hover {
    background: var(--bg-subtle);
    color: var(--fg);
  }
  .nav-link.active {
    color: var(--fg);
    background: var(--bg-subtle);
    font-weight: 500;
  }
  .nav-link:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
  }
</style>
