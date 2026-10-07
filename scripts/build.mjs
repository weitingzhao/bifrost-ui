#!/usr/bin/env node
// Builds into a private dist.tmp-<pid> and swaps it in only after tsc and the style copy
// succeed. Both dev servers alias @bifrost/ui to dist/, and prepare runs this on every
// npm install, so dist/ must never be deleted ahead of a compile that may fail.
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, renameSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const STYLES = ['bifrost-ui.css', 'semantic.css', 'patterns.css', 'shell.css', 'materials.css'];

export function compileWithTsc(root, outDir) {
  const tsc = createRequire(import.meta.url).resolve('typescript/bin/tsc');
  execFileSync(process.execPath, [tsc, '-p', 'tsconfig.build.json', '--outDir', outDir], {
    cwd: root,
    stdio: 'inherit',
  });
}

export function build({ root, compile = compileWithTsc }) {
  const dist = join(root, 'dist');
  const tmp = join(root, `dist.tmp-${process.pid}`);
  const old = join(root, `dist.old-${process.pid}`);
  rmSync(tmp, { recursive: true, force: true });
  rmSync(old, { recursive: true, force: true });
  try {
    compile(root, tmp);
    mkdirSync(join(tmp, 'styles'), { recursive: true });
    for (const name of STYLES) {
      cpSync(join(root, 'src', 'styles', name), join(tmp, 'styles', name));
    }
  } catch (err) {
    rmSync(tmp, { recursive: true, force: true });
    throw err;
  }
  if (existsSync(dist)) renameSync(dist, old);
  renameSync(tmp, dist);
  rmSync(old, { recursive: true, force: true });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    build({ root: resolve(dirname(fileURLToPath(import.meta.url)), '..') });
  } catch (err) {
    console.error(`bifrost-ui build failed; existing dist/ left in place: ${err.message}`);
    process.exit(1);
  }
}
