// Deploy the built widget assets to a Shopify theme using the Shopify CLI.
//
// Theme Access tokens (shptka_...) don't authenticate the raw Admin API, but
// they DO work with the official Shopify CLI. So we stage the two built files
// into a tiny throwaway theme folder and `theme push` just those files.
//
// Safety: `--only` restricts the push to our two asset files and `--nodelete`
// means nothing else on the live theme is ever changed or removed.
//
// Credentials come from the environment (see .env.example). Run via:
//   npm run deploy:shopify        # build + stage + push
//   npm run deploy:upload         # stage + push (assumes dist-widget/ is fresh)

import { mkdir, copyFile, rm } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const STORE = process.env.SHOPIFY_STORE; // e.g. y4i4ta-hn.myshopify.com
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN; // Theme Access token (shptka_...)
const THEME_ID = process.env.SHOPIFY_THEME_ID; // required — the target theme

if (!STORE || !TOKEN || !THEME_ID) {
  console.error(
    'Missing SHOPIFY_STORE, SHOPIFY_ADMIN_TOKEN, or SHOPIFY_THEME_ID.\n' +
      'Copy .env.example to .env and fill all three in.',
  );
  process.exit(1);
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = resolve(root, 'dist-widget');
const shopifyDir = resolve(root, 'shopify');
const stageDir = resolve(root, '.shopify-deploy');

// Files to push, as [ absolute source path, theme-relative destination ].
// Built assets come from dist-widget/; the section is a source file in shopify/.
const PUSH_FILES = [
  [resolve(distDir, 'bracelet-configurator.umd.js'), 'assets/bracelet-configurator.umd.js'],
  [resolve(distDir, 'bracelet-configurator.css'), 'assets/bracelet-configurator.css'],
  [resolve(shopifyDir, 'bracelet-configurator.liquid'), 'sections/bracelet-configurator.liquid'],
];

// The CLI only runs `theme push` in a directory matching the default Shopify
// theme folder structure, otherwise it prompts a confirmation we can't answer
// non-interactively. So we recreate that structure — but every dir except
// assets/ stays EMPTY, so combined with --only there is nothing that could
// ever overwrite the real theme.
const THEME_DIRS = [
  'assets',
  'config',
  'layout',
  'locales',
  'sections',
  'snippets',
  'templates',
];

async function stage() {
  await rm(stageDir, { recursive: true, force: true });
  for (const dir of THEME_DIRS) {
    await mkdir(resolve(stageDir, dir), { recursive: true });
  }
  for (const [src, dest] of PUSH_FILES) {
    await copyFile(src, resolve(stageDir, dest));
  }
}

function push() {
  // Use a relative --path so the absolute project path (which contains a
  // space) never has to be quoted on the shell command line.
  const cmd = [
    'npx @shopify/cli@latest theme push',
    '--path .shopify-deploy',
    `--store ${STORE}`,
    `--theme ${THEME_ID}`,
    '--nodelete',
    '--allow-live',
    ...PUSH_FILES.map(([, dest]) => `--only ${dest}`),
  ].join(' ');

  const res = spawnSync(cmd, {
    stdio: 'inherit',
    shell: true,
    cwd: root,
    env: { ...process.env, SHOPIFY_CLI_THEME_TOKEN: TOKEN, CI: '1' },
  });
  return res.status ?? 1;
}

await stage();
console.log(`Pushing widget assets to theme ${THEME_ID} on ${STORE} via Shopify CLI…`);
const code = push();
await rm(stageDir, { recursive: true, force: true }).catch(() => {});
if (code === 0) {
  console.log('Done. Hard-refresh the product page (Ctrl+Shift+R) to bust the asset cache.');
}
process.exitCode = code;
