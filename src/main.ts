import { mount } from 'svelte'
// Geist Sans + Geist Mono as variable fonts. One self-hosted woff2 per family
// covers every weight we use. Loaded before app.css so the @font-face is
// registered by the time tokens reference it, and self-hosted (via Fontsource)
// so the app makes no third-party calls — the files ship in dist/assets/.
import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import './app.css'
// Importing theme runs its module-level apply step before App mounts,
// preventing a flash between system theme and the user's saved choice.
import './lib/theme'
import App from './App.svelte'

const app = mount(App, {
  target: document.getElementById('app')!,
})

export default app
