import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { afterEach, test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { build, STYLES } from './build.mjs';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const roots = [];

function fixtureRoot({ source }) {
  const root = mkdtempSync(join(tmpdir(), 'bifrost-ui-build-'));
  roots.push(root);
  mkdirSync(join(root, 'src', 'styles'), { recursive: true });
  for (const name of STYLES) writeFileSync(join(root, 'src', 'styles', name), `/* ${name} */\n`);
  writeFileSync(join(root, 'src', 'index.ts'), source);
  writeFileSync(
    join(root, 'tsconfig.build.json'),
    JSON.stringify({
      compilerOptions: { target: 'ES2022', module: 'ESNext', strict: true, rootDir: 'src', outDir: 'dist' },
      include: ['src'],
    }),
  );
  mkdirSync(join(root, 'dist'));
  writeFileSync(join(root, 'dist', 'index.js'), 'export const previous = true;\n');
  return root;
}

function leftovers(root) {
  return readdirSync(root).filter((name) => name.startsWith('dist.'));
}

afterEach(() => {
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});

test('package.json build does not delete dist before compiling', () => {
  const pkg = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8'));
  assert.doesNotMatch(pkg.scripts.build, /rm\s+-rf\s+dist/);
  assert.match(pkg.scripts.build, /scripts\/build\.mjs/);
});

test('a tsc failure leaves the previous dist in place', () => {
  const root = fixtureRoot({ source: "export const broken: number = 'not a number';\n" });
  assert.throws(() => build({ root }));
  assert.equal(readFileSync(join(root, 'dist', 'index.js'), 'utf8'), 'export const previous = true;\n');
  assert.deepEqual(leftovers(root), []);
});

test('a successful build replaces dist with the new output and styles', () => {
  const root = fixtureRoot({ source: 'export const current = 1;\n' });
  build({ root });
  assert.match(readFileSync(join(root, 'dist', 'index.js'), 'utf8'), /current = 1/);
  for (const name of STYLES) {
    assert.equal(readFileSync(join(root, 'dist', 'styles', name), 'utf8'), `/* ${name} */\n`);
  }
  assert.deepEqual(leftovers(root), []);
});
