import type { Config } from '@sveltejs/kit/vite';
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

// SvelteKit plugin options shared between .config/vite.config.ts (dev/build/
// unit-tests) and .config/vitest.pyodide.config.ts (the slow Pyodide check).
// SvelteKit 3 removed svelte.config.js, so these have to live somewhere
// importable instead of a file the CLI auto-discovers by fixed name.
export const kitOptions: Config = {
	preprocess: vitePreprocess(),
	compilerOptions: {
		// Force runes mode for the project, except for libraries. Can be
		// removed in Svelte 6.
		runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
	},
	// Repo root is split into data/ (curriculum content), processes/
	// (feature logic), and platform/ (everything that runs the site).
	// These paths point SvelteKit's routing/assets/service-worker
	// conventions at platform/ instead of the default src/.
	files: {
		routes: 'platform/routes',
		assets: 'platform/static',
		appTemplate: 'platform/app.html',
		serviceWorker: 'platform/service-worker'
	},
	// Custom import specifiers ($data, $processes, ...) are Node
	// subpath imports (#data, #processes, ...) declared in
	// package.json's "imports" field now -- kit's `alias` option and
	// the automatic `$lib` alias are both deprecated/removed.
	// Fully static output (every route is prerendered) -- no server, no
	// edge function, nothing to invoke. `fallback` emits a 404.html
	// carrying the client router, so an unmatched URL (e.g. a mistyped
	// /ide/<slug>) still boots the app and resolves to the right page or
	// a proper in-app 404 instead of the host's bare error page.
	adapter: adapter({ fallback: '404.html' }),
	prerender: {
		// Every route is prerendered, including all /ide/<slug> pages
		// (entries listed in ide/[id]/+page.ts). This guard is defensive:
		// if a question ever links to a slug outside the curriculum list,
		// the crawler hitting that 404 shouldn't fail the whole build.
		handleHttpError: ({ path, message }) => {
			if (path.startsWith('/ide/')) return;
			throw new Error(message);
		}
	}
};
