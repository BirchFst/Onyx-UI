#!/usr/bin/env node
/**
 * Onyx UI · build
 * -----------------------------------------------------------------------------
 * Reads the sources in `src/`, concatenates them and minifies the result into
 * `static/`. Everything a browser loads is produced here — nothing is written
 * by hand into `static/`.
 *
 *   npm run build
 *
 * Targets
 *   onyx-ui.min.*        the core (what every page needs)
 *   onyx-code.min.*      code container extension
 *   onyx-drawer.min.*    drawer extension
 *   onyx-toast.min.*     toast extension
 *   onyx-ui.full.min.*   core + every extension, for people who want one file
 *   docs.min.*           the showcase page's own assets (not part of the library)
 *
 * The header comment of each source file is stripped and replaced by a single
 * banner, so a concatenated file never ends up with six copyright blocks.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import path from 'node:path';
import { transform } from 'esbuild';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(ROOT, 'src');
const OUT = path.join(ROOT, 'static');
const CHECK_ONLY = process.argv.includes('--check');

const CORE_CSS = 'onyx-ui.css';
const CORE_JS = 'onyx-ui.js';
const EXT_CSS = ['extensions/onyx-code.css', 'extensions/onyx-drawer.css', 'extensions/onyx-toast.css'];
const EXT_JS = ['extensions/onyx-code.js', 'extensions/onyx-drawer.js', 'extensions/onyx-toast.js'];

const TARGETS = [
  { name: 'onyx-ui', note: 'core', css: [CORE_CSS], js: [CORE_JS] },
  { name: 'onyx-code', note: 'ext · code container', css: [EXT_CSS[0]], js: [EXT_JS[0]] },
  { name: 'onyx-drawer', note: 'ext · drawer', css: [EXT_CSS[1]], js: [EXT_JS[1]] },
  { name: 'onyx-toast', note: 'ext · toast', css: [EXT_CSS[2]], js: [EXT_JS[2]] },
  {
    name: 'onyx-ui.full',
    note: 'core + every extension (one request instead of eight)',
    css: [CORE_CSS, ...EXT_CSS],
    js: [CORE_JS, ...EXT_JS],
  },
  { name: 'docs', note: 'showcase page only — not shipped with the library', css: ['docs/docs.css'], js: ['docs/docs.js'] },
];

/**
 * Drop a leading `@charset` and the `/*! ... *\/` banner, so concatenated
 * sources don't repeat themselves. Individual `//` and `/* *\/` comments are
 * left alone — the minifier removes those.
 */
function stripHeader(code) {
  return code.replace(/^\uFEFF?\s*(@charset\s+"[^"]*";\s*)?(\/\*![\s\S]*?\*\/\s*)?/, '');
}

async function minify(code, loader) {
  const result = await transform(code, {
    loader,
    minify: true,
    /* keep non-ASCII as-is: this library has Chinese in its comments and labels */
    charset: 'utf8',
    /* keep the `/*!` banner we add ourselves */
    legalComments: 'inline',
  });
  return result.code;
}

async function join(files) {
  const parts = [];
  for (const file of files) {
    const code = await readFile(path.join(SRC, file), 'utf8');
    parts.push(stripHeader(code).trim());
  }
  return parts.join('\n');
}

async function emit(file, code, label) {
  await writeFile(file, code, 'utf8');
  const bytes = Buffer.byteLength(code, 'utf8');
  const gz = gzipSync(Buffer.from(code, 'utf8'), { level: 9 }).length;
  const kb = (n) => (n / 1024).toFixed(2).padStart(7);
  console.log(`  ${path.basename(file).padEnd(24)} ${kb(bytes)} KB raw ${kb(gz)} KB gz   ${label}`);
}

async function main() {
  const coreJs = await readFile(path.join(SRC, CORE_JS), 'utf8');
  const bannerOf = (name) => coreJs.match(new RegExp(`var ${name} = '([^']+)'`))?.[1];
  const VERSION = bannerOf('VERSION') || '0.0.0';

  if (!CHECK_ONLY) await mkdir(OUT, { recursive: true });

  console.log(`\nOnyx UI v${VERSION} · building from src/ → static/\n`);

  for (const target of TARGETS) {
    for (const lang of ['css', 'js']) {
      const files = target[lang];
      if (!files?.length) continue;

      const source = await join(files);
      const minified = await minify(source, lang === 'css' ? 'css' : 'js');
      const file = `${target.name}.min.${lang}`;
      /* the minifier drops @charset, so put it back ahead of the banner —
         a CSS file without it may be decoded as latin-1 by an old server */
      const banner = (lang === 'css' ? '@charset "UTF-8";\n' : '')
        + `/*! ${file} · Onyx UI v${VERSION} · MIT Licensed */\n`;
      const code = banner + minified + '\n';

      if (CHECK_ONLY) {
        const bytes = Buffer.byteLength(code, 'utf8');
        console.log(`  ${file}`.padEnd(26) + `${(bytes / 1024).toFixed(2)} KB`);
      } else {
        await emit(path.join(OUT, file), code, target.note);
      }
    }
  }

  console.log(CHECK_ONLY ? '\n(dry run — nothing written)\n' : `\nDone. ${TARGETS.length} targets → static/\n`);
}

main().catch((error) => {
  console.error('\nBuild failed:', error.message, '\n');
  process.exit(1);
});
