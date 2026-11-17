import path from 'node:path';
import { defineConfig } from 'vitest/config';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { kitOptions } from './kit-options.ts';

// Config now lives one level below the repo root. Vite defaults `root`
// to the directory containing this file, which would otherwise make it
// look for static/, etc. inside .config/ itself -- point it back
// at the real project root explicitly. Every entry point (npm scripts,
// svelte-kit sync) points vite at this file with --config/-c.
const projectRoot = path.resolve(import.meta.dirname, '..');

// vitest's projects[].extends resolves relative to `root` (set above to
// the real project root), not relative to this config file's own
// directory -- a bare './vite.config.ts' self-reference would resolve to
// a file at the repo root that no longer exists. Absolute path
// sidesteps that, same fix as prettier.config.js's tailwindStylesheet.
const thisConfigFile = path.resolve(import.meta.dirname, 'vite.config.ts');

export default defineConfig({
	root: projectRoot,
	server: {
		fs: {
			// SvelteKit's dev-server allow-list is derived from the `files`
			// option below (and the #assets/#font subpath imports in
			// package.json only cover import resolution, not this list) --
			// `platform/assets` and `platform/fonts` (this repo's other
			// platform/ subdirectories) never make it onto it, so the dev
			// server 403s every logo and self-hosted-font request. Allowing
			// the whole project root directly is the actual fix, not another
			// one-off entry: any future platform/* subdirectory needs this too.
			allow: [projectRoot]
		}
	},
	plugins: [
		tailwindcss(),
		// SvelteKit 3: svelte.config.js is gone -- everything that used to
		// live there (adapter, files, prerender, plus the old vitePlugin.*
		// passthrough) is now passed directly to the plugin, top-level, via
		// the shared kitOptions module (see .config/kit-options.ts).
		sveltekit(kitOptions)
	],
	// NOTE: the codemirror manualChunks hint lives under
	// environments.client below -- a root-level rollupOptions.output would
	// also apply to the serviceWorker environment, which rolldown builds
	// with codeSplitting: false, and manualChunks is rejected there.
	environments: {
		client: {
			build: {
				rollupOptions: {
					output: {
						// The editor is one dynamic import (CodeEditor.svelte), but
						// CodeMirror is ~10 packages -- left alone Rollup emits a
						// dozen tiny chunks, i.e. a dozen requests, every time the IDE
						// route mounts. Fold the whole editor stack into one chunk.
						manualChunks(id) {
							if (
								/[\\/]node_modules[\\/](@?codemirror|@lezer|crelt|style-mod|w3c-keyname)[\\/]/.test(
									id
								)
							)
								return 'codemirror';
						}
					}
				}
			}
		}
	},
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: thisConfigFile,
				test: {
					name: 'server',
					environment: 'node',
					include: [
						'platform/**/*.{test,spec}.{js,ts}',
						'processes/**/*.{test,spec}.{js,ts}',
						'data/**/*.{test,spec}.{js,ts}',
						'supabase/**/*.{test,spec}.{js,ts}'
					],
					exclude: [
						'platform/**/*.svelte.{test,spec}.{js,ts}',
						'processes/**/*.svelte.{test,spec}.{js,ts}'
					]
				}
			},
			{
				extends: thisConfigFile,
				resolve: { conditions: ['browser'] },
				test: {
					name: 'client',
					environment: 'jsdom',
					include: [
						'platform/**/*.svelte.{test,spec}.{js,ts}',
						'processes/**/*.svelte.{test,spec}.{js,ts}'
					],
					setupFiles: [path.resolve(import.meta.dirname, 'vitest-setup-client.ts')]
				}
			},
			{
				extends: thisConfigFile,
				test: {
					name: 'smoke',
					environment: 'node',
					include: ['e2e/**/*.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
