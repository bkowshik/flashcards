<script lang="ts">
  import Header from './components/Header.svelte';
  import Add from './views/Add.svelte';
  import Browse from './views/Browse.svelte';
  import Quiz from './views/Quiz.svelte';
  import About from './views/About.svelte';
  import { route } from './lib/router';
  import { handleGlobalKey } from './lib/shortcuts';
</script>

<svelte:window onkeydown={handleGlobalKey} />

<Header />

<main>
  {#if $route.name === 'add'}
    <Add />
  {:else if $route.name === 'edit'}
    <Add id={$route.id} />
  {:else if $route.name === 'browse'}
    <Browse />
  {:else if $route.name === 'quiz'}
    <Quiz />
  {:else if $route.name === 'about'}
    <About />
  {/if}
</main>

<style>
  main {
    padding: 1.5rem 1.25rem;
  }
</style>
