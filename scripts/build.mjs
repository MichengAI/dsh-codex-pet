import { build } from 'esbuild';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
const define = { __PET_VERSION__: JSON.stringify(JSON.parse(await readFile('package.json', 'utf8')).version) };
await mkdir('lib', { recursive: true });
await build({ entryPoints: ['src/index.ts'], bundle: true, platform: 'node', format: 'esm', outfile: 'lib/index.js', target: 'node22' });
const result = await build({ entryPoints: ['src/client.tsx'], define, bundle: true, format: 'cjs', write: false, external: ['react', 'react-dom/client', 'react/jsx-runtime'], target: 'es2022', jsx: 'automatic' });
await writeFile('lib/client.js', `window.__ModuleLoader__.load({id:"@michengai/dsh-codex-pet",factory:function(require){var module={exports:{}};var exports=module.exports;\n${result.outputFiles[0].text}\nreturn module.exports;}});\n`, 'utf8');
await build({ entryPoints: ['src/standalone.tsx'], define, bundle: true, format: 'esm', outfile: 'lib/standalone.js', target: 'es2022', jsx: 'automatic' });
