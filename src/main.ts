import { mount } from 'svelte'
import './app.css'
// Importing theme runs its module-level apply step before App mounts,
// preventing a flash between system theme and the user's saved choice.
import './lib/theme'
import App from './App.svelte'

const app = mount(App, {
  target: document.getElementById('app')!,
})

export default app
