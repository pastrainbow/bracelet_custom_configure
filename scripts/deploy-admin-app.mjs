// One-command deploy of the embedded catalogue admin app (admin-app/) to
// Cloudflare Workers:
//
//   npm run deploy:admin
//
// Steps:
//   1. Regenerate admin-app/stub-items.generated.json from the widget's
//      built-in catalogue (src/data/catalogue.ts) — the worker checks new
//      items against it for name/handle collisions.
//   2. `wrangler deploy` with the Shopify store/theme/app-id vars taken from
//      .env (so wrangler.jsonc stays free of store-specific values).
//   3. Push SHOPIFY_CLIENT_SECRET as a Worker secret (idempotent overwrite).
//
// One-time prerequisites (see admin-app/SETUP.md): a free Cloudflare account
// and `npx wrangler login`.

import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const STORE = process.env.SHOPIFY_STORE;
const THEME_ID = process.env.SHOPIFY_THEME_ID;
const CLIENT_ID = process.env.SHOPIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET;
const API_VERSION = process.env.SHOPIFY_API_VERSION || '2026-01';

const missing = Object.entries({
  SHOPIFY_STORE: STORE,
  SHOPIFY_THEME_ID: THEME_ID,
  SHOPIFY_CLIENT_ID: CLIENT_ID,
  SHOPIFY_CLIENT_SECRET: CLIENT_SECRET,
})
  .filter(([, v]) => !v)
  .map(([k]) => k);
if (missing.length) {
  console.error(
    `Missing ${missing.join(', ')} in .env — the embedded admin app needs the Dev Dashboard ` +
      'app credentials and the store/theme ids. See .env.example.',
  );
  process.exit(1);
}

// ── 1. Stub-catalogue snapshot for the worker's duplicate checks ─────────────
// Same parse the local admin server used; if the file's style ever changes and
// the parse comes up empty, the check silently degrades (the live-store check
// still covers real dupes).
const catalogueSrc = await readFile(resolve(root, 'src/data/catalogue.ts'), 'utf8');
const stubItems = [];
for (const m of catalogueSrc.matchAll(/\{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)'/g)) {
  stubItems.push({ id: m[1], name: m[2] });
}
await writeFile(
  resolve(root, 'admin-app/stub-items.generated.json'),
  JSON.stringify(stubItems, null, 2) + '\n',
  'utf8',
);
console.log(`Baked ${stubItems.length} built-in catalogue item(s) into the duplicate check.`);

// ── 2 + 3. wrangler deploy + secret ──────────────────────────────────────────
// Relative --config so the absolute project path (which contains a space)
// never has to be quoted on the shell command line.

function wrangler(args, opts = {}) {
  const res = spawnSync(`npx wrangler ${args}`, {
    shell: true,
    cwd: root,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
    ...opts,
  });
  if (res.stdout) process.stdout.write(res.stdout);
  if (res.stderr) process.stderr.write(res.stderr);
  return res;
}

console.log(`\nDeploying the admin app worker (store ${STORE}, theme ${THEME_ID})…`);
const deployRes = wrangler(
  [
    'deploy',
    '--config admin-app/wrangler.jsonc',
    `--var SHOPIFY_STORE:${STORE}`,
    `--var SHOPIFY_THEME_ID:${THEME_ID}`,
    `--var SHOPIFY_CLIENT_ID:${CLIENT_ID}`,
    `--var SHOPIFY_API_VERSION:${API_VERSION}`,
  ].join(' '),
);
if (deployRes.status !== 0) {
  const out = `${deployRes.stdout ?? ''}${deployRes.stderr ?? ''}`;
  console.error(
    /workers\.dev subdomain/i.test(out)
      ? '\nDeploy failed: your Cloudflare account has no workers.dev subdomain yet (one-time step). ' +
          'Register one in the dashboard — Workers & Pages → onboarding prompt (the error above links ' +
          'straight to it) — then rerun npm run deploy:admin.'
      : '\nDeploy failed. If wrangler complained about authentication, run "npx wrangler login" ' +
          'once (free Cloudflare account) and retry — see admin-app/SETUP.md.',
  );
  process.exit(deployRes.status ?? 1);
}

// The client secret is a Worker secret (write-only), not a plaintext var.
// `secret put` reads the value from stdin and is an idempotent overwrite, so
// it simply runs on every deploy. Secrets persist across deploys.
console.log('Updating the SHOPIFY_CLIENT_SECRET worker secret…');
const secretRes = wrangler('secret put SHOPIFY_CLIENT_SECRET --config admin-app/wrangler.jsonc', {
  input: CLIENT_SECRET,
});
if (secretRes.status !== 0) {
  console.error('Storing the client secret failed — the worker cannot call Shopify until it is set. Re-run the deploy.');
  process.exit(secretRes.status ?? 1);
}

const urlMatch = /https:\/\/[\w.-]+\.workers\.dev/.exec(deployRes.stdout ?? '');
console.log('\n✔ Admin app deployed.');
if (urlMatch) {
  console.log(`  URL: ${urlMatch[0]}`);
  console.log(
    '  First deploy? Paste that URL as the App URL in the Shopify Dev Dashboard (admin-app/SETUP.md, step 3).',
  );
}
