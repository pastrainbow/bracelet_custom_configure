// Local admin GUI for adding and managing beads/accessories in the Shopify
// catalogue.
//
// Run:  npm run admin   →  http://localhost:5190
//
// Management (needs Admin API credentials — the list is pulled live from the
// store, never from local files):
//   GET    /api/products        → every product tagged `configurator`
//   PUT    /api/items/<handle>  → rename / re-categorise / change sizes,
//                                 prices & stock, optionally replace the
//                                 sprite. The handle (permanent item id used in
//                                 design codes) never changes. productSet syncs
//                                 the variant set declaratively; stock is then
//                                 set via inventorySetQuantities.
//   DELETE /api/items/<handle>  → productDelete + best-effort removal of the
//                                 sprite theme asset and the local ledger row.
//
// What one "Add item" submit does, in order:
//   1. Process the uploaded image into a widget-ready sprite: trim transparent
//      margins, centre it in a square with the same SPRITE_PADDING framing the
//      runtime sprite cache expects, save admin/sprites/sprite-<handle>.png.
//   2. Push that PNG to the theme's assets/ via the Shopify CLI (same staged
//      `theme push --only` technique as scripts/deploy-shopify.mjs — works with
//      the Theme Access shptka_ token).
//   3. Create the product on Shopify via the Admin GraphQL API (productSet):
//      handle = item id, tags `configurator, super:<x>, cat:<slug>`, one "Size"
//      variant per selected size with its own price, SKU + stock quantity at
//      the primary location. Needs Admin API credentials (SHOPIFY_CLIENT_ID/SECRET or a
//      legacy SHOPIFY_PRODUCTS_TOKEN; see .env.example). Without them this
//      step falls back to writing an import-ready CSV.
//   4. Publish the product to the Online Store channel so the Liquid section's
//      smart collection (tag = configurator) picks it up.
//
// Env (read from .env via `node --env-file`):
//   SHOPIFY_STORE, SHOPIFY_ADMIN_TOKEN (shptka_, theme push), SHOPIFY_THEME_ID.
//   Admin API auth (either one enables automatic product creation):
//     SHOPIFY_CLIENT_ID + SHOPIFY_CLIENT_SECRET — Dev Dashboard app credentials;
//       exchanged for a 24h token via the OAuth client credentials grant and
//       auto-refreshed (apps created after Jan 2026 only offer this), or
//     SHOPIFY_PRODUCTS_TOKEN — static shpat_ token from a legacy admin-created
//       custom app.
//   SHOPIFY_API_VERSION (optional), ADMIN_PORT (optional),
//   ADMIN_DRY_RUN=1 (optional — skip all remote calls, for testing the flow).

import { createServer } from 'node:http';
import { mkdir, readFile, writeFile, copyFile, rm } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { createCanvas, loadImage } from '@napi-rs/canvas';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ADMIN_DIR = resolve(ROOT, 'admin');
const SPRITE_DIR = resolve(ADMIN_DIR, 'sprites');
const CSV_DIR = resolve(ADMIN_DIR, 'pending-import');
const STAGE_DIR = resolve(ROOT, '.shopify-admin-push');

const STORE = process.env.SHOPIFY_STORE;
const THEME_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;
const THEME_ID = process.env.SHOPIFY_THEME_ID;
const PRODUCTS_TOKEN = process.env.SHOPIFY_PRODUCTS_TOKEN;
const CLIENT_ID = process.env.SHOPIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET;
const API_VERSION = process.env.SHOPIFY_API_VERSION || '2026-01';
const PORT = Number(process.env.ADMIN_PORT) || Number(process.env.PORT) || 5190;
const DRY_RUN = process.env.ADMIN_DRY_RUN === '1' || process.argv.includes('--dry-run');

const themeConfigured = Boolean(STORE && THEME_TOKEN && THEME_ID);
const clientCredsConfigured = Boolean(STORE && CLIENT_ID && CLIENT_SECRET);
const productsConfigured = Boolean(STORE && PRODUCTS_TOKEN) || clientCredsConfigured;

// Mirrors src/data/catalogue.ts (stub categories) — the admin can also type a
// brand-new slug; the widget title-cases unknown slugs for the tab label.
const CATEGORIES = {
  beads: [
    { cat: 'crystal', label: 'Crystal' },
    { cat: 'stone', label: 'Natural Stone' },
    { cat: 'shell', label: 'Shell' },
    { cat: 'accent', label: 'Accent' },
  ],
  accessories: [
    { cat: 'charms', label: 'Charms' },
    { cat: 'spacers', label: 'Spacers' },
    { cat: 'pendants', label: 'Pendants' },
  ],
};

/** Must match src/config/constants.ts BEAD_SIZES — the size wheel only offers these. */
const BEAD_SIZES = [6, 10, 12, 14];

// ─── Duplicate detection sources ─────────────────────────────────────────────

/** Items baked into the widget's stub catalogue (they were also imported into
 *  the store by the initial CSV). Parsed from the source of truth so the list
 *  can't drift; if the file's style ever changes and the parse comes up empty,
 *  the check silently degrades (the live-store check still covers real dupes). */
async function stubCatalogueItems() {
  try {
    const src = await readFile(resolve(ROOT, 'src/data/catalogue.ts'), 'utf8');
    const items = [];
    for (const m of src.matchAll(/\{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)'/g)) {
      items.push({ id: m[1], name: m[2] });
    }
    return items;
  } catch {
    return [];
  }
}

/** Ledger of items successfully added through this app (admin/items.json).
 *  Used for duplicate checks when the Admin API isn't configured, and as an
 *  audit trail. Only fully-successful submissions are recorded, so a failed
 *  push can always be retried. */
const LEDGER_PATH = resolve(ADMIN_DIR, 'items.json');

async function readLedger() {
  try {
    const list = JSON.parse(await readFile(LEDGER_PATH, 'utf8'));
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

async function appendLedger(entry) {
  const list = await readLedger();
  list.push(entry);
  await writeFile(LEDGER_PATH, JSON.stringify(list, null, 2) + '\n', 'utf8');
}

/** Rewrite the ledger through `mutate(list) → list`. Used to keep the ledger's
 *  duplicate-check data in step with edits/deletes made through this app. */
async function rewriteLedger(mutate) {
  const list = mutate(await readLedger());
  await writeFile(LEDGER_PATH, JSON.stringify(list, null, 2) + '\n', 'utf8');
}

/** Escape a value for embedding in a quoted Shopify search term. Edited names
 *  are not restricted to NAME_RE, so quotes/backslashes must not break out. */
const searchTerm = (s) => s.replace(/(["\\])/g, '\\$1');

/** Every local/remote place an item's name or handle could collide.
 *  Throws with a specific, actionable message on the first collision found.
 *  `excludeHandle` skips the item itself when checking a rename — matching
 *  your own current name/handle is not a collision. */
async function assertNoDuplicates(item, excludeHandle = null) {
  const nameLc = item.name.toLowerCase();

  for (const stub of await stubCatalogueItems()) {
    if (stub.id === excludeHandle) continue;
    if (stub.id === item.handle || stub.name.toLowerCase() === nameLc) {
      throw new Error(
        `"${stub.name}" (${stub.id}) is already part of the built-in catalogue — pick a different name.`,
      );
    }
  }

  for (const entry of await readLedger()) {
    if (entry.handle === excludeHandle) continue;
    if (entry.handle === item.handle || (entry.name ?? '').toLowerCase() === nameLc) {
      throw new Error(
        `"${entry.name}" (${entry.handle}) was already added by this app on ${entry.addedAt?.slice(0, 10) ?? 'an earlier date'}. ` +
          'If that was a mistake or you removed it from Shopify, delete its entry in admin/items.json and retry.',
      );
    }
  }

  if (productsConfigured && !DRY_RUN) {
    if (item.handle !== excludeHandle) {
      const byHandle = await gql(
        `query ($q: String!) { products(first: 1, query: $q) { nodes { id title } } }`,
        { q: `handle:"${item.handle}"` },
      );
      if (byHandle.products.nodes.length) {
        throw new Error(
          `A product with handle "${item.handle}" already exists on the store ` +
            `("${byHandle.products.nodes[0].title}"). Pick a different name, or edit that product in the Shopify admin.`,
        );
      }
    }
    // Search is token-based, so confirm an exact (case-insensitive) title match.
    const byTitle = await gql(
      `query ($q: String!) { products(first: 10, query: $q) { nodes { handle title } } }`,
      { q: `title:"${searchTerm(item.name)}"` },
    );
    const clash = byTitle.products.nodes.find(
      (n) => n.title.toLowerCase() === nameLc && n.handle !== excludeHandle,
    );
    if (clash) {
      throw new Error(
        `A product named "${clash.title}" already exists on the store (handle ${clash.handle}) — pick a different name.`,
      );
    }
  }
}

// ─── Sprite processing ───────────────────────────────────────────────────────
// Must match the framing baked by scripts/generate-catalogue-assets.ts: the
// runtime draws the PNG across the whole sprite square, where the square side
// is diameter × SPRITE_PADDING (see src/engine/render/spriteCache.ts). So the
// item artwork must occupy the central 1/1.4 of the image, padding transparent.

const SPRITE_PADDING = 1.4;
const OUT_DIAMETER = 512; // same content size as the generator (GEN_RADIUS 256)
const OUT_SIDE = Math.ceil(OUT_DIAMETER * SPRITE_PADDING);

const MAX_PIXELS = 16 * 1024 * 1024; // ~16 MP decode cap — bounds memory use
const MIN_CONTENT_PX = 32;

async function processSprite(imageBuffer) {
  let img;
  try {
    img = await loadImage(imageBuffer);
  } catch {
    throw new Error('Could not decode the image — is it a valid PNG/JPEG/WebP file?');
  }
  const { width: w, height: h } = img;
  if (!w || !h) throw new Error('Could not decode the image.');
  if (w * h > MAX_PIXELS) {
    throw new Error(`Image is too large (${w}×${h}). Keep it under ~16 megapixels — 512–2048 px is plenty.`);
  }

  const src = createCanvas(w, h);
  const sctx = src.getContext('2d');
  sctx.drawImage(img, 0, 0);

  // Trim transparent margins so the artwork itself is what gets framed.
  const data = sctx.getImageData(0, 0, w, h).data;
  let minX = w, minY = h, maxX = -1, maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > 8) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) throw new Error('The image is fully transparent — there is nothing to use as a sprite.');

  const cw = maxX - minX + 1;
  const ch = maxY - minY + 1;
  if (Math.max(cw, ch) < MIN_CONTENT_PX) {
    throw new Error(
      `The visible artwork is only ${cw}×${ch} px — too small to look good as a sprite. Use at least ${MIN_CONTENT_PX} px (512 px+ recommended).`,
    );
  }
  const scale = OUT_DIAMETER / Math.max(cw, ch);
  const dw = cw * scale;
  const dh = ch * scale;

  const out = createCanvas(OUT_SIDE, OUT_SIDE);
  const octx = out.getContext('2d');
  octx.imageSmoothingEnabled = true;
  octx.imageSmoothingQuality = 'high';
  octx.drawImage(src, minX, minY, cw, ch, (OUT_SIDE - dw) / 2, (OUT_SIDE - dh) / 2, dw, dh);
  return out.toBuffer('image/png');
}

function decodeDataUrl(dataUrl) {
  const m = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl || '');
  if (!m) throw new Error('Expected a PNG, JPEG or WebP image.');
  return { format: m[1], buffer: Buffer.from(m[2], 'base64') };
}

// ─── Theme asset push (Shopify CLI, same technique as deploy-shopify.mjs) ────

const CLI_TIMEOUT_MS = 5 * 60 * 1000;

function runShell(cmd, env) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(cmd, { shell: true, cwd: ROOT, env });
    let out = '';
    let timedOut = false;
    // shell:true wraps the CLI in cmd.exe, so kill the whole process tree.
    const timer = setTimeout(() => {
      timedOut = true;
      if (process.platform === 'win32') spawn('taskkill', ['/pid', String(child.pid), '/T', '/F']);
      else child.kill('SIGKILL');
    }, CLI_TIMEOUT_MS);
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (out += d));
    child.on('error', (err) => {
      clearTimeout(timer);
      reject(new Error(`Could not start the Shopify CLI (${err.message}) — is Node/npx available on PATH?`));
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (timedOut) reject(new Error(`Shopify CLI timed out after ${CLI_TIMEOUT_MS / 60000} minutes:\n${out.slice(-1000)}`));
      else if (code === 0) resolvePromise(out);
      else reject(new Error(`Shopify CLI exited with code ${code}:\n${out.slice(-2000)}`));
    });
  });
}

const THEME_DIRS = ['assets', 'config', 'layout', 'locales', 'sections', 'snippets', 'templates'];

async function pushThemeAsset(fileName, sourcePath) {
  await rm(STAGE_DIR, { recursive: true, force: true });
  for (const dir of THEME_DIRS) await mkdir(resolve(STAGE_DIR, dir), { recursive: true });
  await copyFile(sourcePath, resolve(STAGE_DIR, 'assets', fileName));

  const cmd = [
    'npx @shopify/cli@latest theme push',
    '--path .shopify-admin-push',
    `--store ${STORE}`,
    `--theme ${THEME_ID}`,
    '--nodelete',
    '--allow-live',
    `--only assets/${fileName}`,
  ].join(' ');

  try {
    await runShell(cmd, { ...process.env, SHOPIFY_CLI_THEME_TOKEN: THEME_TOKEN, CI: '1' });
  } finally {
    await rm(STAGE_DIR, { recursive: true, force: true }).catch(() => {});
  }
}

// ─── Admin GraphQL API ───────────────────────────────────────────────────────

// Dev Dashboard apps (post-Jan-2026) don't expose a static shpat_ token; the
// client credentials grant exchanges the app's client id/secret for a 24h
// access token. Cached and refreshed 5 minutes before expiry. A static
// SHOPIFY_PRODUCTS_TOKEN (legacy custom app) bypasses all of this.
let tokenCache = { token: PRODUCTS_TOKEN ?? null, expiresAt: PRODUCTS_TOKEN ? Infinity : 0 };

async function adminToken() {
  if (tokenCache.token && Date.now() < tokenCache.expiresAt) return tokenCache.token;

  let res;
  try {
    res = await fetch(`https://${STORE}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      }),
      signal: AbortSignal.timeout(30_000),
    });
  } catch (err) {
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      throw new Error('Token request timed out after 30s — check your connection and try again.');
    }
    throw new Error(`Could not reach Shopify to get an access token (${err.cause?.code ?? err.message}) — check SHOPIFY_STORE and your connection.`);
  }
  if (!res.ok) {
    // Shopify's OAuth errors come back as an HTML page; the <title> carries the
    // useful part (e.g. "400 - Oauth error application_cannot_be_found").
    const body = await res.text();
    const detail = (/<title>([^<]*)<\/title>/i.exec(body)?.[1] ?? body.slice(0, 300)).trim();
    throw new Error(
      `Access-token request failed (HTTP ${res.status}: ${detail}) — check SHOPIFY_CLIENT_ID / ` +
        `SHOPIFY_CLIENT_SECRET and that the app is installed on ${STORE}.`,
    );
  }
  const json = await res.json();
  if (!json.access_token) throw new Error('Shopify returned no access token — check the app credentials.');
  const ttlSec = Math.max(60, (json.expires_in ?? 86399) - 300);
  tokenCache = { token: json.access_token, expiresAt: Date.now() + ttlSec * 1000 };
  return tokenCache.token;
}

async function gql(query, variables) {
  const token = await adminToken();
  let res;
  try {
    res = await fetch(`https://${STORE}/admin/api/${API_VERSION}/graphql.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
      signal: AbortSignal.timeout(30_000),
    });
  } catch (err) {
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      throw new Error('Admin API request timed out after 30s — check your connection and try again.');
    }
    throw new Error(`Could not reach the Shopify Admin API (${err.cause?.code ?? err.message}) — check SHOPIFY_STORE and your connection.`);
  }
  if (res.status === 401 || res.status === 403) {
    // A cached client-credentials token could also have been revoked server-side
    // (e.g. secret rotated) — drop it so the next attempt fetches a fresh one.
    if (!PRODUCTS_TOKEN) tokenCache = { token: null, expiresAt: 0 };
    throw new Error(
      `Admin API rejected the token (HTTP ${res.status}) — check the app has write_products, ` +
        'write_inventory, read_locations and write_publications scopes' +
        (PRODUCTS_TOKEN
          ? ' and SHOPIFY_PRODUCTS_TOKEN is a valid shpat_ token.'
          : ', is installed on the store, and the scopes were re-approved after any change.'),
    );
  }
  if (res.status === 404) {
    throw new Error(`Admin API endpoint not found — check SHOPIFY_STORE ("${STORE}") and SHOPIFY_API_VERSION ("${API_VERSION}").`);
  }
  if (res.status === 429) {
    throw new Error('Admin API rate limit hit — wait a few seconds and try again.');
  }
  if (!res.ok) {
    throw new Error(`Admin API HTTP ${res.status} — ${(await res.text()).slice(0, 300)}`);
  }
  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join('; '));
  }
  return json.data;
}

async function primaryLocationId() {
  const data = await gql(`{ locations(first: 1) { nodes { id name } } }`);
  const loc = data.locations.nodes[0];
  if (!loc) throw new Error('No inventory location found on the store.');
  return loc.id;
}

async function createProduct(item, variants, locationId) {
  const input = {
    title: item.name,
    handle: item.handle,
    status: 'ACTIVE',
    tags: ['configurator', `super:${item.superCategory}`, `cat:${item.category}`],
    productOptions: [
      { name: 'Size', position: 1, values: variants.map((v) => ({ name: v.label })) },
    ],
    variants: variants.map((v) => ({
      optionValues: [{ optionName: 'Size', name: v.label }],
      price: v.price.toFixed(2),
      sku: v.sku,
      inventoryPolicy: 'DENY',
      inventoryItem: { tracked: true, requiresShipping: true },
      inventoryQuantities: [{ locationId, name: 'available', quantity: v.qty }],
    })),
  };

  const data = await gql(
    `mutation ($input: ProductSetInput!) {
       productSet(input: $input) {
         product { id handle }
         userErrors { field message }
       }
     }`,
    { input },
  );
  const errs = data.productSet.userErrors;
  if (errs?.length) throw new Error(errs.map((e) => `${e.field}: ${e.message}`).join('; '));
  return data.productSet.product.id;
}

/** Find the Online Store publication id. The channel app's handle
 *  (`online_store`) is the stable identifier; its title is a display string.
 *  Note `Publication.catalog` is null for sales channels (it belongs to
 *  market/B2B catalog publications), so it can't be used for this. */
async function onlineStorePublicationId() {
  let nodes;
  try {
    const data = await gql(`{ publications(first: 25) { nodes { id app { title handle } } } }`);
    nodes = data.publications.nodes.map((n) => ({
      id: n.id,
      handle: n.app?.handle ?? '',
      title: n.app?.title ?? '',
    }));
  } catch {
    // Fallback for API versions without Publication.app: the channel name.
    const data = await gql(`{ publications(first: 25) { nodes { id name } } }`);
    nodes = data.publications.nodes.map((n) => ({ id: n.id, handle: '', title: n.name ?? '' }));
  }
  const online =
    nodes.find((n) => n.handle === 'online_store') ??
    nodes.find((n) => /online store/i.test(n.title));
  if (online) return online.id;
  if (nodes.length === 1) return nodes[0].id;
  const seen = nodes.map((n) => n.title || n.handle || n.id).join(', ') || 'none';
  throw new Error(`Could not identify the Online Store sales channel (publications found: ${seen}).`);
}

async function publishProduct(productId) {
  const publicationId = await onlineStorePublicationId();
  const data = await gql(
    `mutation ($id: ID!, $input: [PublicationInput!]!) {
       publishablePublish(id: $id, input: $input) { userErrors { field message } }
     }`,
    { id: productId, input: [{ publicationId }] },
  );
  const errs = data.publishablePublish.userErrors;
  if (errs?.length) throw new Error(errs.map((e) => e.message).join('; '));
}

// ─── Managing existing items ─────────────────────────────────────────────────

const MANAGED_TAG_RE = /^(configurator$|super:|cat:)/;

/** All configurator products, live from the store (never from local files). */
async function listProducts() {
  const products = [];
  let after = null;
  for (let page = 0; page < 20; page++) {
    const data = await gql(
      `query ($q: String!, $after: String) {
         products(first: 100, query: $q, after: $after, sortKey: TITLE) {
           pageInfo { hasNextPage endCursor }
           nodes {
             id title handle status tags
             variants(first: 100) {
               nodes { id price sku inventoryQuantity selectedOptions { name value } }
             }
           }
         }
       }`,
      { q: 'tag:configurator', after },
    );
    for (const n of data.products.nodes) {
      const superTag = n.tags.find((t) => t.startsWith('super:'))?.slice(6) ?? null;
      const catTag = n.tags.find((t) => t.startsWith('cat:'))?.slice(4) ?? null;
      products.push({
        id: n.id,
        name: n.title,
        handle: n.handle,
        status: n.status,
        superCategory: superTag === 'beads' || superTag === 'accessories' ? superTag : null,
        category: catTag,
        variants: n.variants.nodes.map((v) => ({
          label: v.selectedOptions.find((o) => o.name === 'Size')?.value ?? v.selectedOptions[0]?.value ?? '',
          price: Number(v.price),
          sku: v.sku ?? '',
          qty: v.inventoryQuantity ?? 0,
        })),
      });
    }
    if (!data.products.pageInfo.hasNextPage) break;
    after = data.products.pageInfo.endCursor;
  }
  return products;
}

async function productByHandle(handle) {
  const data = await gql(
    `query ($q: String!) { products(first: 1, query: $q) { nodes { id title handle tags status } } }`,
    { q: `handle:"${handle}"` },
  );
  const node = data.products.nodes[0];
  return node && node.handle === handle ? node : null;
}

/** Declarative product update via productSet: the variant set in the input
 *  becomes THE variant set (existing variants are matched by their "Size"
 *  option value, absent ones are deleted, new ones created). Quantities are
 *  set separately afterwards — productSet only honours inventoryQuantities for
 *  newly-created variants. */
async function updateProduct(productId, item, variants, tags) {
  const input = {
    id: productId,
    title: item.name,
    tags,
    productOptions: [
      { name: 'Size', position: 1, values: variants.map((v) => ({ name: v.label })) },
    ],
    variants: variants.map((v) => ({
      optionValues: [{ optionName: 'Size', name: v.label }],
      price: v.price.toFixed(2),
      sku: v.sku,
      inventoryPolicy: 'DENY',
      inventoryItem: { tracked: true, requiresShipping: true },
    })),
  };
  const data = await gql(
    `mutation ($input: ProductSetInput!) {
       productSet(input: $input) {
         product {
           id
           variants(first: 100) {
             nodes { id inventoryItem { id } selectedOptions { name value } }
           }
         }
         userErrors { field message }
       }
     }`,
    { input },
  );
  const errs = data.productSet.userErrors;
  if (errs?.length) throw new Error(errs.map((e) => `${e.field}: ${e.message}`).join('; '));
  return data.productSet.product.variants.nodes;
}

/** Set the on-hand quantity of every desired variant at the location. If any
 *  inventory item is not yet stocked there (possible for variants productSet
 *  just created), activate them at the location and retry once. */
async function setVariantQuantities(variantNodes, desired, locationId) {
  const qtyByLabel = new Map(desired.map((v) => [v.label, v.qty]));
  const quantities = [];
  for (const node of variantNodes) {
    const label = node.selectedOptions.find((o) => o.name === 'Size')?.value;
    if (qtyByLabel.has(label)) {
      quantities.push({ inventoryItemId: node.inventoryItem.id, locationId, quantity: qtyByLabel.get(label) });
    }
  }
  if (quantities.length !== desired.length) {
    throw new Error('Could not match every size to a product variant after the update — check the product in the Shopify admin.');
  }

  const setQuantities = async () => {
    const data = await gql(
      `mutation ($input: InventorySetQuantitiesInput!) {
         inventorySetQuantities(input: $input) { userErrors { field message } }
       }`,
      { input: { name: 'available', reason: 'correction', ignoreCompareQuantity: true, quantities } },
    );
    const errs = data.inventorySetQuantities.userErrors;
    if (errs?.length) throw new Error(errs.map((e) => e.message).join('; '));
  };

  try {
    await setQuantities();
  } catch (firstErr) {
    try {
      for (const q of quantities) {
        await gql(
          `mutation ($id: ID!, $loc: ID!, $qty: Int) {
             inventoryActivate(inventoryItemId: $id, locationId: $loc, available: $qty) {
               inventoryLevel { id }
               userErrors { field message }
             }
           }`,
          { id: q.inventoryItemId, loc: q.locationId, qty: q.quantity },
        );
      }
      await setQuantities();
    } catch {
      throw firstErr;
    }
  }
}

async function deleteProduct(productId) {
  const data = await gql(
    `mutation ($input: ProductDeleteInput!) {
       productDelete(input: $input) { deletedProductId userErrors { field message } }
     }`,
    { input: { id: productId } },
  );
  const errs = data.productDelete.userErrors;
  if (errs?.length) throw new Error(errs.map((e) => e.message).join('; '));
  if (!data.productDelete.deletedProductId) throw new Error('Shopify did not confirm the deletion.');
}

/** GraphQL against the theme endpoints using the Theme Access (shptka_) token,
 *  which only works through the Theme Kit Access proxy — the same door the
 *  Shopify CLI uses for theme pushes. Used to delete sprite assets. */
async function themeGql(query, variables) {
  const res = await fetch(`https://theme-kit-access.shopifyapps.com/cli/admin/api/${API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: {
      'X-Shopify-Access-Token': THEME_TOKEN,
      'X-Shopify-Shop': STORE,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`Theme API HTTP ${res.status} — ${(await res.text()).slice(0, 200)}`);
  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors.map((e) => e.message).join('; '));
  return json.data;
}

/** Sprites fetched from the theme, cached in memory (filename → png buffer).
 *  Entries are dropped when this app replaces or deletes the sprite; the TTL
 *  covers changes made elsewhere (e.g. the theme code editor). */
const themeSpriteCache = new Map();
const THEME_SPRITE_TTL_MS = 10 * 60 * 1000;

/** Download one theme asset's content. The theme proxy serves binary files as
 *  base64 (OnlineStoreThemeFileBodyBase64); a direct Admin API token with
 *  read_themes would get a CDN url instead — both shapes are handled. */
async function themeAssetPng(fileName) {
  const hit = themeSpriteCache.get(fileName);
  if (hit && Date.now() - hit.at < THEME_SPRITE_TTL_MS) return hit.buf;

  const query = `query ($themeId: ID!, $files: [String!]!) {
    theme(id: $themeId) {
      files(filenames: $files, first: 1) {
        nodes {
          filename
          body {
            ... on OnlineStoreThemeFileBodyBase64 { contentBase64 }
            ... on OnlineStoreThemeFileBodyUrl { url }
          }
        }
      }
    }
  }`;
  const vars = { themeId: `gid://shopify/OnlineStoreTheme/${THEME_ID}`, files: [fileName] };

  let data = null;
  let lastErr;
  for (const run of [
    ...(productsConfigured ? [() => gql(query, vars)] : []),
    ...(themeConfigured ? [() => themeGql(query, vars)] : []),
  ]) {
    try {
      data = await run();
      break;
    } catch (err) {
      lastErr = err;
    }
  }
  if (!data) throw lastErr ?? new Error('No credentials available for theme file reads.');

  const body = data.theme?.files?.nodes?.[0]?.body;
  let buf = null;
  if (body?.contentBase64) {
    buf = Buffer.from(body.contentBase64, 'base64');
  } else if (body?.url) {
    const res = await fetch(body.url, { signal: AbortSignal.timeout(30_000) });
    if (!res.ok) throw new Error(`Sprite download failed (HTTP ${res.status}).`);
    buf = Buffer.from(await res.arrayBuffer());
  }
  if (!buf?.length) throw new Error(`The theme has no ${fileName}.`);
  themeSpriteCache.set(fileName, { buf, at: Date.now() });
  return buf;
}

/** Best-effort sprite-asset removal: try the Admin API token first (needs the
 *  write_themes scope), then the Theme Access token via the CLI proxy. An
 *  orphaned sprite asset is harmless, so callers downgrade failures to a warn. */
async function deleteThemeAsset(fileName) {
  const mutation = `mutation ($themeId: ID!, $files: [String!]!) {
    themeFilesDelete(themeId: $themeId, files: $files) {
      deletedThemeFiles { filename }
      userErrors { field message }
    }
  }`;
  const vars = { themeId: `gid://shopify/OnlineStoreTheme/${THEME_ID}`, files: [`assets/${fileName}`] };
  let lastErr;
  for (const run of [
    ...(productsConfigured ? [() => gql(mutation, vars)] : []),
    ...(themeConfigured ? [() => themeGql(mutation, vars)] : []),
  ]) {
    try {
      const data = await run();
      const errs = data.themeFilesDelete.userErrors;
      if (errs?.length) throw new Error(errs.map((e) => e.message).join('; '));
      return;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr ?? new Error('No credentials available for theme file deletion.');
}

// ─── CSV fallback (no products token) ────────────────────────────────────────
// Same column layout as scripts/generate-catalogue-assets.ts, importable via
// Shopify admin → Products → Import.

const CSV_COLUMNS = [
  'Handle', 'Title', 'Body (HTML)', 'Vendor', 'Tags', 'Published',
  'Option1 Name', 'Option1 Value', 'Variant SKU', 'Variant Price',
  'Variant Inventory Policy', 'Variant Fulfillment Service',
  'Variant Requires Shipping', 'Variant Taxable', 'Status',
];

function csvCell(v) {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

async function writeImportCsv(item, variants) {
  const tags = `configurator, super:${item.superCategory}, cat:${item.category}`;
  const rows = [CSV_COLUMNS];
  variants.forEach((v, i) => {
    const first = i === 0;
    rows.push([
      item.handle, first ? item.name : '', '', '', first ? tags : '', first ? 'TRUE' : '',
      'Size', v.label, v.sku, v.price.toFixed(2),
      'deny', 'manual', 'TRUE', 'TRUE', first ? 'active' : '',
    ]);
  });
  await mkdir(CSV_DIR, { recursive: true });
  const path = resolve(CSV_DIR, `${item.handle}.csv`);
  await writeFile(path, rows.map((r) => r.map(csvCell).join(',')).join('\r\n') + '\r\n', 'utf8');
  return path;
}

// ─── Validation ──────────────────────────────────────────────────────────────

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const NAME_RE = /^[A-Za-z0-9]+(?: [A-Za-z0-9]+)*$/;
const MAX_NAME_LEN = 60;

/** The item id (product handle) is always derived from the name:
 *  "Rose Quartz" → "rose-quartz". Names are restricted to letters, numbers and
 *  single spaces, so the mapping is total and collision-free per unique name. */
function handleFromName(name) {
  return name.toLowerCase().replace(/ /g, '-');
}

/** `fixedHandle` = editing an existing item: the handle is permanent (design
 *  codes and the sprite filename reference it), so it is taken as-is instead of
 *  being derived from the name — which in turn lets edited names use any
 *  printable characters (store products created outside this app may already
 *  have such names, and they must survive an edit unrenamed). */
function validateItem(body, fixedHandle = null) {
  // Collapse runs of whitespace so "Rose  Quartz" and "Rose Quartz" are the same item.
  const name = String(body.name ?? '').trim().replace(/\s+/g, ' ');
  const superCategory = body.superCategory;
  const category = String(body.category ?? '').trim();
  const sizes = Array.isArray(body.sizes) ? body.sizes : [];

  if (!name) throw new Error('Name is required.');
  // eslint-disable-next-line no-control-regex
  if (/[\x00-\x1f\x7f]/.test(name)) throw new Error('Name contains control characters.');
  if (!fixedHandle && !NAME_RE.test(name)) throw new Error('Name can only contain letters, numbers and spaces (e.g. "Rose Quartz").');
  if (name.length > MAX_NAME_LEN) throw new Error(`Name is too long (max ${MAX_NAME_LEN} characters).`);
  const handle = fixedHandle ?? handleFromName(name);
  if (superCategory !== 'beads' && superCategory !== 'accessories') throw new Error('Pick beads or accessories.');
  if (!SLUG_RE.test(category) || category.length > 40) throw new Error('Category must be a short lowercase slug (e.g. "crystal").');
  if (!sizes.length) throw new Error('Select at least one size.');

  // Each size carries its own price (beads are priced per diameter; the
  // one-size accessory row is just the degenerate single-variant case).
  const variants = sizes.map((s) => {
    const qty = Number(s.qty);
    if (!Number.isInteger(qty) || qty < 0 || qty > 1000000) throw new Error('Stock must be a whole number ≥ 0.');
    const price = Number(s.price);
    if (!Number.isFinite(price) || price <= 0 || price > 100000) throw new Error('Each selected size needs a positive price.');
    if (superCategory === 'accessories') {
      return { label: 'One Size', sku: handle, qty, price };
    }
    const mm = Number(s.mm);
    if (!BEAD_SIZES.includes(mm)) throw new Error(`Bead sizes must be one of: ${BEAD_SIZES.join(', ')} mm.`);
    return { label: `${mm} mm`, sku: `${handle}-${mm}`, qty, price };
  });
  if (superCategory === 'accessories' && variants.length !== 1) throw new Error('Accessories have a single "One Size" price and stock count.');
  const labels = new Set(variants.map((v) => v.label));
  if (labels.size !== variants.length) throw new Error('Duplicate sizes selected.');

  return { item: { name, handle, superCategory, category }, variants };
}

// ─── The add-item pipeline ───────────────────────────────────────────────────

async function handleAddItem(body) {
  const { item, variants } = validateItem(body);
  const { buffer } = decodeDataUrl(body.image);

  // Fail fast on any name/handle collision BEFORE touching the theme or store.
  await assertNoDuplicates(item);

  const steps = [];
  const step = (name, status, detail = '') => steps.push({ name, status, detail });

  // 1. Sprite
  const spriteName = `sprite-${item.handle}.png`;
  const spritePath = resolve(SPRITE_DIR, spriteName);
  const png = await processSprite(buffer);
  await mkdir(SPRITE_DIR, { recursive: true });
  await writeFile(spritePath, png);
  step('Process sprite', 'done', `Saved admin/sprites/${spriteName} (${OUT_SIDE}×${OUT_SIDE}, widget framing). Future full deploys re-push it automatically.`);

  // 2. Theme asset
  if (DRY_RUN) {
    step('Upload sprite to theme', 'skip', 'Dry run (ADMIN_DRY_RUN=1) — nothing pushed.');
  } else if (!themeConfigured) {
    step('Upload sprite to theme', 'fail', 'SHOPIFY_STORE / SHOPIFY_ADMIN_TOKEN / SHOPIFY_THEME_ID missing in .env.');
  } else {
    try {
      await pushThemeAsset(spriteName, spritePath);
      step('Upload sprite to theme', 'done', `assets/${spriteName} pushed to theme ${THEME_ID}.`);
    } catch (err) {
      step('Upload sprite to theme', 'fail', `${err.message} — run "npm run deploy:upload" later to retry; the sprite is saved locally.`);
    }
  }

  // 3 + 4. Product, stock, publish
  if (DRY_RUN) {
    step('Create product & stock', 'skip', 'Dry run — no product created.');
    step('Publish to Online Store', 'skip', 'Dry run.');
  } else if (!productsConfigured) {
    const csvPath = await writeImportCsv(item, variants);
    step(
      'Create product & stock',
      'warn',
      `No Admin API credentials in .env, so the product was NOT created automatically. ` +
        `Import-ready CSV written to ${csvPath} — Shopify admin → Products → Import. ` +
        `Then set stock per variant (CSV import can't set quantities). ` +
        `To enable automatic creation, add SHOPIFY_CLIENT_ID + SHOPIFY_CLIENT_SECRET from your Dev Dashboard app (see .env.example).`,
    );
    step('Publish to Online Store', 'warn', 'After the CSV import, make sure the product is available on the Online Store channel.');
  } else {
    let productId = null;
    try {
      const locationId = await primaryLocationId();
      productId = await createProduct(item, variants, locationId);
      const stockSummary = variants.map((v) => `${v.label}: $${v.price.toFixed(2)} × ${v.qty}`).join(', ');
      step('Create product & stock', 'done', `Product "${item.name}" (${item.handle}) created with stock — ${stockSummary}.`);
    } catch (err) {
      step('Create product & stock', 'fail', err.message);
    }
    if (productId) {
      try {
        await publishProduct(productId);
        step('Publish to Online Store', 'done', 'Visible to the configurator collection (tag: configurator).');
      } catch (err) {
        step(
          'Publish to Online Store',
          'warn',
          `${err.message} — publish it manually: Shopify admin → the product → Sales channels → Online Store.`,
        );
      }
    } else {
      step('Publish to Online Store', 'skip', 'Product was not created.');
    }
  }

  const ok = steps.every((s) => s.status !== 'fail');

  // Record fully-successful (non-dry) additions so later submissions are
  // checked against them. Failed runs are NOT recorded, so retrying works.
  if (ok && !DRY_RUN) {
    await appendLedger({
      name: item.name,
      handle: item.handle,
      superCategory: item.superCategory,
      category: item.category,
      variants: variants.map((v) => ({ label: v.label, sku: v.sku, qty: v.qty, price: v.price })),
      mode: productsConfigured ? 'api' : 'csv',
      addedAt: new Date().toISOString(),
    }).catch(() => {}); // the ledger is best-effort — never fail the push over it
  }
  return { ok, steps };
}

// ─── The edit-item pipeline ──────────────────────────────────────────────────

const requireProductsApi = () => {
  if (!productsConfigured) {
    throw new Error(
      'Managing existing items needs Admin API credentials (SHOPIFY_CLIENT_ID + SHOPIFY_CLIENT_SECRET, ' +
        'or SHOPIFY_PRODUCTS_TOKEN) in .env — the CSV fallback only supports adding.',
    );
  }
};

async function handleUpdateItem(handle, body) {
  const { item, variants } = validateItem(body, handle);
  // The sprite is optional on edit — null/absent means "keep the current one".
  const image = body.image ? decodeDataUrl(body.image).buffer : null;

  const steps = [];
  const step = (name, status, detail = '') => steps.push({ name, status, detail });

  if (DRY_RUN) {
    step('Validate changes', 'done', `"${item.name}" (${handle}) — ${variants.map((v) => `${v.label}: $${v.price.toFixed(2)} × ${v.qty}`).join(', ')}.`);
    step('Update product', 'skip', 'Dry run (ADMIN_DRY_RUN=1) — nothing sent to Shopify.');
    return { ok: true, steps };
  }
  requireProductsApi();

  const existing = await productByHandle(handle);
  if (!existing) {
    throw new Error(`No product with handle "${handle}" exists on the store — it may have been deleted. Refresh the list.`);
  }
  // Renaming? Make sure the new name doesn't collide with anything else first.
  if (item.name.toLowerCase() !== existing.title.toLowerCase()) {
    await assertNoDuplicates(item, handle);
  }

  // 1. Optional sprite replacement (same filename → the widget picks it up).
  if (image) {
    const spriteName = `sprite-${handle}.png`;
    const spritePath = resolve(SPRITE_DIR, spriteName);
    const png = await processSprite(image);
    await mkdir(SPRITE_DIR, { recursive: true });
    await writeFile(spritePath, png);
    themeSpriteCache.delete(`assets/${spriteName}`);
    if (!themeConfigured) {
      step('Replace sprite', 'fail', `Saved admin/sprites/${spriteName} locally, but SHOPIFY_STORE / SHOPIFY_ADMIN_TOKEN / SHOPIFY_THEME_ID are missing in .env so it was not uploaded.`);
    } else {
      try {
        await pushThemeAsset(spriteName, spritePath);
        step('Replace sprite', 'done', `assets/${spriteName} overwritten on theme ${THEME_ID}.`);
      } catch (err) {
        step('Replace sprite', 'fail', `${err.message} — the new sprite is saved locally; run "npm run deploy:upload" later to retry.`);
      }
    }
  }

  // 2. Product fields + variant set. Tags outside this app's vocabulary
  //    (anything not configurator/super:/cat:) are preserved.
  const preservedTags = existing.tags.filter((t) => !MANAGED_TAG_RE.test(t));
  const tags = ['configurator', `super:${item.superCategory}`, `cat:${item.category}`, ...preservedTags];
  let variantNodes = null;
  try {
    variantNodes = await updateProduct(existing.id, item, variants, tags);
    step('Update product', 'done', `"${item.name}" (${handle}) — ${variants.map((v) => `${v.label}: $${v.price.toFixed(2)}`).join(', ')}.`);
  } catch (err) {
    step('Update product', 'fail', err.message);
  }

  // 3. Stock levels.
  if (variantNodes) {
    try {
      await setVariantQuantities(variantNodes, variants, await primaryLocationId());
      step('Set stock', 'done', variants.map((v) => `${v.label}: ${v.qty}`).join(', ') + '.');
    } catch (err) {
      step('Set stock', 'fail', `${err.message} — adjust the quantities in the Shopify admin.`);
    }
  } else {
    step('Set stock', 'skip', 'Product update failed.');
  }

  const ok = steps.every((s) => s.status !== 'fail');
  if (ok) {
    // Keep the ledger's name/details in step so its duplicate checks stay honest.
    await rewriteLedger((list) =>
      list.map((e) =>
        e.handle === handle
          ? {
              ...e,
              name: item.name,
              superCategory: item.superCategory,
              category: item.category,
              variants: variants.map((v) => ({ label: v.label, sku: v.sku, qty: v.qty, price: v.price })),
              editedAt: new Date().toISOString(),
            }
          : e,
      ),
    ).catch(() => {});
  }
  return { ok, steps };
}

// ─── The delete-item pipeline ────────────────────────────────────────────────

async function handleDeleteItem(handle) {
  if (!SLUG_RE.test(handle)) throw new Error('Invalid item handle.');

  const steps = [];
  const step = (name, status, detail = '') => steps.push({ name, status, detail });

  if (DRY_RUN) {
    step('Delete product', 'skip', `Dry run (ADMIN_DRY_RUN=1) — "${handle}" was not deleted.`);
    return { ok: true, steps };
  }
  requireProductsApi();

  const existing = await productByHandle(handle);
  if (!existing) {
    throw new Error(`No product with handle "${handle}" exists on the store — it may already be deleted. Refresh the list.`);
  }

  // 1. The product itself. If this fails, stop — nothing else should change.
  try {
    await deleteProduct(existing.id);
    step('Delete product', 'done', `"${existing.title}" (${handle}) removed from the store. Existing orders keep their line items.`);
  } catch (err) {
    step('Delete product', 'fail', err.message);
    return { ok: false, steps };
  }

  // 2. Sprite theme asset — best-effort; an orphaned sprite is harmless.
  const spriteName = `sprite-${handle}.png`;
  themeSpriteCache.delete(`assets/${spriteName}`);
  try {
    await deleteThemeAsset(spriteName);
    step('Remove sprite from theme', 'done', `assets/${spriteName} deleted from theme ${THEME_ID}.`);
  } catch (err) {
    step(
      'Remove sprite from theme',
      'warn',
      `Could not delete assets/${spriteName} (${err.message}). It is harmless — remove it in the theme code editor if you want it gone.`,
    );
  }

  // 3. Local sprite copy + ledger row (so the name can be reused later).
  await rm(resolve(SPRITE_DIR, spriteName), { force: true }).catch(() => {});
  await rewriteLedger((list) => list.filter((e) => e.handle !== handle)).catch(() => {});
  step('Clean up local records', 'done', 'Local sprite copy and admin/items.json entry removed; the name can be reused.');

  return { ok: steps.every((s) => s.status !== 'fail'), steps };
}

// ─── HTTP plumbing ───────────────────────────────────────────────────────────

const MAX_BODY = 25 * 1024 * 1024;

function readBody(req) {
  return new Promise((resolvePromise, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY) {
        // Stop buffering but drain the rest instead of destroying the socket,
        // so the client receives this message rather than a raw network error.
        req.removeAllListeners('data');
        req.removeAllListeners('end');
        req.resume();
        const err = new Error('Image too large (max 25 MB).');
        err.statusCode = 413;
        reject(err);
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => resolvePromise(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(body);
}

function parseJsonBody(buf) {
  try {
    return JSON.parse(buf.toString('utf8'));
  } catch {
    throw new Error('Invalid request body (expected JSON).');
  }
}

/** Only one add/edit/delete pipeline at a time — the staged theme-push
 *  directory and the ledger read-modify-write are not safe to run concurrently. */
let pushInFlight = false;

/** Runs `fn` under the single-pipeline lock, 429ing a concurrent caller. */
async function withPushLock(res, fn) {
  if (pushInFlight) {
    sendJson(res, 429, { ok: false, error: 'Another operation is still running — wait for it to finish, then retry.' });
    return;
  }
  pushInFlight = true;
  try {
    sendJson(res, 200, await fn());
  } finally {
    pushInFlight = false;
  }
}

const server = createServer(async (req, res) => {
  try {
    if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
      const html = await readFile(resolve(ADMIN_DIR, 'index.html'));
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
      return;
    }

    if (req.method === 'GET' && req.url === '/api/config') {
      sendJson(res, 200, {
        store: STORE ?? null,
        themeId: THEME_ID ?? null,
        themeConfigured,
        productsConfigured,
        apiVersion: API_VERSION,
        dryRun: DRY_RUN,
        beadSizes: BEAD_SIZES,
        categories: CATEGORIES,
      });
      return;
    }

    if (req.method === 'POST' && req.url === '/api/preview') {
      const body = parseJsonBody(await readBody(req));
      const { buffer } = decodeDataUrl(body.image);
      const png = await processSprite(buffer);
      sendJson(res, 200, { sprite: `data:image/png;base64,${png.toString('base64')}` });
      return;
    }

    if (req.method === 'GET' && req.url === '/api/products') {
      if (DRY_RUN) {
        // Dry run makes no remote calls, so serve the ledger as clearly-marked
        // mock rows to keep the manage UI testable.
        const products = (await readLedger()).map((e) => ({
          id: `mock:${e.handle}`,
          name: e.name,
          handle: e.handle,
          status: 'ACTIVE',
          superCategory: e.superCategory,
          category: e.category,
          variants: (e.variants ?? []).map((v) => ({ label: v.label, price: v.price ?? e.price ?? 0, sku: v.sku, qty: v.qty })),
        }));
        sendJson(res, 200, { products, mock: true });
        return;
      }
      requireProductsApi();
      sendJson(res, 200, { products: await listProducts() });
      return;
    }

    // Sprite thumbnails for the manage list: the local copy when this machine
    // has one (items added here), otherwise pulled from the theme on Shopify
    // (covers everything else). 404 → the UI shows a letter placeholder.
    const spriteMatch = /^\/api\/sprites\/([a-z0-9-]+)\.png(?:\?.*)?$/.exec(req.url ?? '');
    if (req.method === 'GET' && spriteMatch) {
      const fileName = `sprite-${spriteMatch[1]}.png`;
      const sendPng = (png) => {
        res.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'no-cache' });
        res.end(png);
      };
      try {
        sendPng(await readFile(resolve(SPRITE_DIR, fileName)));
        return;
      } catch {
        /* no local copy — try the theme */
      }
      if (!DRY_RUN && (productsConfigured || themeConfigured) && THEME_ID) {
        try {
          sendPng(await themeAssetPng(`assets/${fileName}`));
          return;
        } catch {
          /* fall through to 404 */
        }
      }
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('No sprite found locally or on the theme');
      return;
    }

    if (req.method === 'POST' && req.url === '/api/items') {
      await withPushLock(res, async () => handleAddItem(parseJsonBody(await readBody(req))));
      return;
    }

    const itemMatch = /^\/api\/items\/([a-z0-9-]+)$/.exec(req.url ?? '');
    if (itemMatch && (req.method === 'PUT' || req.method === 'DELETE')) {
      const handle = itemMatch[1];
      await withPushLock(res, async () =>
        req.method === 'PUT'
          ? handleUpdateItem(handle, parseJsonBody(await readBody(req)))
          : handleDeleteItem(handle),
      );
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  } catch (err) {
    if (res.headersSent) {
      res.end();
      return;
    }
    sendJson(res, err.statusCode ?? 400, { ok: false, error: err.message ?? String(err) });
  }
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use — is the admin app already running? (set ADMIN_PORT to change it)`);
  } else {
    console.error(`Server failed to start: ${err.message}`);
  }
  process.exit(1);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Bracelet catalogue admin → http://localhost:${PORT}`);
  console.log(`  theme push:   ${themeConfigured ? `configured (theme ${THEME_ID} on ${STORE})` : 'NOT configured'}`);
  const productsMode = PRODUCTS_TOKEN ? 'static token' : 'client credentials';
  console.log(`  products API: ${productsConfigured ? `configured (${API_VERSION}, ${productsMode})` : 'not configured — CSV fallback'}`);
  if (DRY_RUN) console.log('  DRY RUN — no remote calls will be made.');
});
