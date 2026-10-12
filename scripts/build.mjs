// Builds the plugin into dist/:
//   dist/index.js   Host half, Node ESM. DSH provides @deepseek-ai/* at runtime.
//   dist/client.js  Browser half, wrapped in the lazy factory format DSH Web's
//                   module loader expects. React comes from the page.
// The package has no runtime dependencies and no install scripts.
import { build } from 'esbuild'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const manifest = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'))
const define = { __GLASSUI_VERSION__: JSON.stringify(manifest.version) }
const banner = `/*! ${manifest.name} ${manifest.version} | MIT License | ${manifest.homepage} */`

await rm(resolve(root, 'dist'), { recursive: true, force: true })
await mkdir(resolve(root, 'dist'), { recursive: true })

await build({
  entryPoints: [resolve(root, 'src/host/index.ts')],
  outfile: resolve(root, 'dist/index.js'),
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  external: ['@deepseek-ai/*'],
  define,
  banner: { js: banner },
  legalComments: 'none',
  logLevel: 'warning',
})

const client = await build({
  entryPoints: [resolve(root, 'src/client/index.tsx')],
  bundle: true,
  platform: 'browser',
  format: 'cjs',
  target: ['chrome111', 'safari16.4', 'firefox115'],
  jsx: 'automatic',
  external: ['react', 'react/jsx-runtime', 'react-dom'],
  loader: { '.css': 'text' },
  define,
  minify: true,
  write: false,
  legalComments: 'none',
  logLevel: 'warning',
})

// DSH Web registers third-party client code through window.__ModuleLoader__;
// the factory receives the page's `require` for the shared React instance.
const id = JSON.stringify(manifest.name)
await writeFile(
  resolve(root, 'dist/client.js'),
  `${banner}\nwindow.__ModuleLoader__.load({id:${id},factory(require){const module={exports:{}};const exports=module.exports;\n${client.outputFiles[0].text}\nreturn module.exports;}});\n`,
)

console.log(`${manifest.name}@${manifest.version}: built dist/index.js and dist/client.js`)
