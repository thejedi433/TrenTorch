import path from 'node:path';
import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';
import { kitOptions } from './kit-options.ts';

// Separate from vite.config.ts on purpose: the Pyodide check is slow and needs
// the network (it downloads the numpy wheel), so it must not run as part of
// `npm test`. Run it with `npm run test:pyodide`.
const projectRoot = path.resolve(import.meta.dirname, '..');

export default defineConfig({
	root: projectRoot,
	// Same shared SvelteKit options (the #data/#processes subpath imports etc.
	// come from package.json) as vite.config.ts.
	plugins: [sveltekit(kitOptions)],
	test: {
		name: 'pyodide',
		environment: 'node',
		include: ['pyodide-check/**/*.spec.ts'],
		testTimeout: 60_000,
		hookTimeout: 180_000
	}
});
