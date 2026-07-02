// Bracelet Catalogue Admin — embedded Shopify custom app, hosted as a
// Cloudflare Worker.
//
// Deploy:  npm run deploy:admin      (one-time setup: admin-app/SETUP.md)
//
// The same add/edit/delete catalogue GUI that used to run locally
// (admin/server.mjs), reworked to live inside the Shopify admin:
//   GET    /                          → the admin UI (ui.html), embedded via App Bridge
//   GET    /api/config                → store/theme/category/bead-size config
//   GET    /api/products              → every product tagged `configurator`, live
//   GET    /api/sprites/<handle>.png  → the sprite as it exists on the theme
//   POST   /api/items                 → add: sprite → theme asset, productSet, publish
//   PUT    /api/items/<handle>        → edit (the handle is permanent)
//   DELETE /api/items/<handle>        → productDelete + theme sprite removal
//
// Differences from the local server this replaces:
//   - Sprite processing (trim + frame) happens in the BROWSER (ui.html); the
//     worker receives the finished square PNG and only validates it.
//   - Theme assets are written via the Admin GraphQL themeFilesUpsert mutation
//     (needs the write_themes scope) — no Shopify CLI, no Theme Access token.
//   - Every /api request must carry an App Bridge session token
//     (Authorization: Bearer <jwt>), verified against the app's client secret,
//     so only staff logged in to this store's admin can call the worker.
//   - No local ledger / CSV fallback: the live store is the single source of
//     truth, and Admin API credentials are mandatory.
//
// Bindings (set by scripts/deploy-admin-app.mjs from .env):
//   vars:   SHOPIFY_STORE, SHOPIFY_THEME_ID, SHOPIFY_CLIENT_ID, SHOPIFY_API_VERSION
//   secret: SHOPIFY_CLIENT_SECRET

import uiHtml from './ui.html';
import stubItems from './stub-items.generated.json';

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

const httpError = (statusCode, message) => Object.assign(new Error(message), { statusCode });

// ─── Session-token auth (App Bridge) ─────────────────────────────────────────
// Embedded-app session tokens are JWTs signed HS256 with the app's client
// secret. Verifying one proves the request came from a staff member with the
// app open inside THIS store's admin — nothing else on the internet can mint
// one. Tokens live ~60 s; the UI fetches a fresh one per request.

const b64urlToBytes = (s) => {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4);
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
};
const b64urlToJson = (s) => JSON.parse(new TextDecoder().decode(b64urlToBytes(s)));

async function verifySessionToken(env, request) {
  const denied = (why) =>
    httpError(401, `Not authenticated (${why}). Reload the app inside the Shopify admin.`);

  const m = /^Bearer\s+(.+)$/.exec(request.headers.get('Authorization') ?? '');
  if (!m) throw denied('missing session token');
  const parts = m[1].split('.');
  if (parts.length !== 3) throw denied('malformed token');

  let header, claims;
  try {
    header = b64urlToJson(parts[0]);
    claims = b64urlToJson(parts[1]);
  } catch {
    throw denied('malformed token');
  }
  if (header.alg !== 'HS256') throw denied('unexpected algorithm');

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(env.SHOPIFY_CLIENT_SECRET),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['verify'],
  );
  const ok = await crypto.subtle.verify(
    'HMAC', key, b64urlToBytes(parts[2]), enc.encode(`${parts[0]}.${parts[1]}`),
  );
  if (!ok) throw denied('bad signature');

  const now = Date.now() / 1000;
  const skew = 5;
  if (typeof claims.exp !== 'number' || claims.exp < now - skew) throw denied('token expired');
  if (typeof claims.nbf === 'number' && claims.nbf > now + skew) throw denied('token not yet valid');
  if (claims.aud !== env.SHOPIFY_CLIENT_ID) throw denied('token is for a different app');
  if (claims.dest !== `https://${env.SHOPIFY_STORE}`) throw denied('token is for a different store');
  return claims;
}

// ─── Admin GraphQL API ───────────────────────────────────────────────────────
// Dev Dashboard apps don't expose a static shpat_ token; the client
// credentials grant exchanges the app's client id/secret for a 24h access
// token. Cached per isolate and refreshed 5 minutes before expiry.

let tokenCache = { token: null, expiresAt: 0 };

async function adminToken(env) {
  if (tokenCache.token && Date.now() < tokenCache.expiresAt) return tokenCache.token;

  let res;
  try {
    res = await fetch(`https://${env.SHOPIFY_STORE}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: env.SHOPIFY_CLIENT_ID,
        client_secret: env.SHOPIFY_CLIENT_SECRET,
      }),
      signal: AbortSignal.timeout(30_000),
    });
  } catch (err) {
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      throw new Error('Token request timed out after 30s — retry in a moment.');
    }
    throw new Error(`Could not reach Shopify to get an access token (${err.message}) — check SHOPIFY_STORE and redeploy.`);
  }
  if (!res.ok) {
    // Shopify's OAuth errors come back as an HTML page; the <title> carries the
    // useful part (e.g. "400 - Oauth error application_cannot_be_found").
    const body = await res.text();
    const detail = (/<title>([^<]*)<\/title>/i.exec(body)?.[1] ?? body.slice(0, 300)).trim();
    throw new Error(
      `Access-token request failed (HTTP ${res.status}: ${detail}) — check SHOPIFY_CLIENT_ID / ` +
        `SHOPIFY_CLIENT_SECRET and that the app is installed on ${env.SHOPIFY_STORE}, then redeploy.`,
    );
  }
  const json = await res.json();
  if (!json.access_token) throw new Error('Shopify returned no access token — check the app credentials.');
  const ttlSec = Math.max(60, (json.expires_in ?? 86399) - 300);
  tokenCache = { token: json.access_token, expiresAt: Date.now() + ttlSec * 1000 };
  return tokenCache.token;
}

async function gql(env, query, variables) {
  const token = await adminToken(env);
  let res;
  try {
    res = await fetch(`https://${env.SHOPIFY_STORE}/admin/api/${env.SHOPIFY_API_VERSION || '2026-01'}/graphql.json`, {
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
      throw new Error('Admin API request timed out after 30s — retry in a moment.');
    }
    throw new Error(`Could not reach the Shopify Admin API (${err.message}).`);
  }
  if (res.status === 401 || res.status === 403) {
    // The cached client-credentials token may have been revoked server-side
    // (e.g. secret rotated) — drop it so the next attempt fetches a fresh one.
    tokenCache = { token: null, expiresAt: 0 };
    throw new Error(
      `Admin API rejected the token (HTTP ${res.status}) — check the app has the write_products, ` +
        'write_inventory, read_locations, write_publications and write_themes scopes, is installed ' +
        'on the store, and that the scopes were re-approved after any change.',
    );
  }
  if (res.status === 404) {
    throw new Error(`Admin API endpoint not found — check SHOPIFY_STORE ("${env.SHOPIFY_STORE}") and SHOPIFY_API_VERSION.`);
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

// ─── Duplicate detection ─────────────────────────────────────────────────────

/** Escape a value for embedding in a quoted Shopify search term. Edited names
 *  are not restricted to NAME_RE, so quotes/backslashes must not break out. */
const searchTerm = (s) => s.replace(/(["\\])/g, '\\$1');

/** Every place an item's name or handle could collide: the widget's built-in
 *  stub catalogue (baked into the bundle at deploy time from
 *  src/data/catalogue.ts) and the live store. Throws with a specific,
 *  actionable message on the first collision found. `excludeHandle` skips the
 *  item itself when checking a rename. */
async function assertNoDuplicates(env, item, excludeHandle = null) {
  const nameLc = item.name.toLowerCase();

  for (const stub of stubItems) {
    if (stub.id === excludeHandle) continue;
    if (stub.id === item.handle || stub.name.toLowerCase() === nameLc) {
      throw new Error(
        `"${stub.name}" (${stub.id}) is already part of the built-in catalogue — pick a different name.`,
      );
    }
  }

  if (item.handle !== excludeHandle) {
    const byHandle = await gql(
      env,
      `query ($q: String!) { products(first: 1, query: $q) { nodes { id title } } }`,
      { q: `handle:"${item.handle}"` },
    );
    if (byHandle.products.nodes.length) {
      throw new Error(
        `A product with handle "${item.handle}" already exists on the store ` +
          `("${byHandle.products.nodes[0].title}"). Pick a different name, or edit that product instead.`,
      );
    }
  }
  // Search is token-based, so confirm an exact (case-insensitive) title match.
  const byTitle = await gql(
    env,
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

// ─── Sprite validation ───────────────────────────────────────────────────────
// The trim/centre/frame work happens in the browser (ui.html) with the same
// SPRITE_PADDING framing the runtime sprite cache expects; the worker only
// checks it received a plausible finished sprite.

const MAX_SPRITE_B64 = 8 * 1024 * 1024; // ~6 MB binary — a 717px PNG is far smaller

/** Validate a processed-sprite data URL and return its raw base64 payload
 *  (which is exactly what themeFilesUpsert wants). */
function spriteBase64(dataUrl) {
  const m = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl || '');
  if (!m) throw new Error('Expected the processed sprite as a PNG data URL — reload the app and re-select the image.');
  const b64 = m[1];
  if (b64.length > MAX_SPRITE_B64) throw new Error('Sprite PNG is too large (max ~6 MB).');

  // PNG signature + IHDR live in the first 24 bytes — enough to sanity-check.
  const head = Uint8Array.from(atob(b64.slice(0, 64)), (c) => c.charCodeAt(0));
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (head.length < 24 || sig.some((b, i) => head[i] !== b) ||
      String.fromCharCode(...head.subarray(12, 16)) !== 'IHDR') {
    throw new Error('The uploaded sprite is not a valid PNG.');
  }
  const dv = new DataView(head.buffer);
  const w = dv.getUint32(16);
  const h = dv.getUint32(20);
  if (w !== h || w < 64 || w > 1024) {
    throw new Error(`Unexpected sprite dimensions ${w}×${h} — reload the app and re-select the image.`);
  }
  return b64;
}

// ─── Theme assets (Admin API, write_themes) ──────────────────────────────────

const themeGid = (env) => `gid://shopify/OnlineStoreTheme/${env.SHOPIFY_THEME_ID}`;

async function upsertThemeAsset(env, fileName, base64) {
  const data = await gql(
    env,
    `mutation ($themeId: ID!, $files: [OnlineStoreThemeFilesUpsertFileInput!]!) {
       themeFilesUpsert(themeId: $themeId, files: $files) {
         upsertedThemeFiles { filename }
         userErrors { field message }
       }
     }`,
    { themeId: themeGid(env), files: [{ filename: `assets/${fileName}`, body: { type: 'BASE64', value: base64 } }] },
  );
  const errs = data.themeFilesUpsert.userErrors;
  if (errs?.length) throw new Error(errs.map((e) => `${e.field}: ${e.message}`).join('; '));
}

async function deleteThemeAsset(env, fileName) {
  const data = await gql(
    env,
    `mutation ($themeId: ID!, $files: [String!]!) {
       themeFilesDelete(themeId: $themeId, files: $files) {
         deletedThemeFiles { filename }
         userErrors { field message }
       }
     }`,
    { themeId: themeGid(env), files: [`assets/${fileName}`] },
  );
  const errs = data.themeFilesDelete.userErrors;
  if (errs?.length) throw new Error(errs.map((e) => e.message).join('; '));
}

/** Sprite PNGs fetched from the theme, cached per isolate (filename → bytes).
 *  Entries are dropped when this app replaces or deletes the sprite; the TTL
 *  covers changes made elsewhere (e.g. the theme code editor). */
const themeSpriteCache = new Map();
const THEME_SPRITE_TTL_MS = 10 * 60 * 1000;

/** Download one theme asset's content. Binary files come back either as
 *  base64 (OnlineStoreThemeFileBodyBase64) or as a CDN url
 *  (OnlineStoreThemeFileBodyUrl) depending on size — both shapes handled. */
async function themeAssetPng(env, fileName) {
  const hit = themeSpriteCache.get(fileName);
  if (hit && Date.now() - hit.at < THEME_SPRITE_TTL_MS) return hit.bytes;

  const data = await gql(
    env,
    `query ($themeId: ID!, $files: [String!]!) {
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
     }`,
    { themeId: themeGid(env), files: [fileName] },
  );

  const body = data.theme?.files?.nodes?.[0]?.body;
  let bytes = null;
  if (body?.contentBase64) {
    bytes = Uint8Array.from(atob(body.contentBase64), (c) => c.charCodeAt(0));
  } else if (body?.url) {
    const res = await fetch(body.url, { signal: AbortSignal.timeout(30_000) });
    if (!res.ok) throw new Error(`Sprite download failed (HTTP ${res.status}).`);
    bytes = new Uint8Array(await res.arrayBuffer());
  }
  if (!bytes?.length) throw httpError(404, `The theme has no ${fileName}.`);
  themeSpriteCache.set(fileName, { bytes, at: Date.now() });
  return bytes;
}

// ─── Products ────────────────────────────────────────────────────────────────

async function primaryLocationId(env) {
  const data = await gql(env, `{ locations(first: 1) { nodes { id name } } }`);
  const loc = data.locations.nodes[0];
  if (!loc) throw new Error('No inventory location found on the store.');
  return loc.id;
}

async function createProduct(env, item, variants, locationId) {
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
    env,
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
 *  (`online_store`) is the stable identifier; its title is a display string. */
async function onlineStorePublicationId(env) {
  let nodes;
  try {
    const data = await gql(env, `{ publications(first: 25) { nodes { id app { title handle } } } }`);
    nodes = data.publications.nodes.map((n) => ({
      id: n.id,
      handle: n.app?.handle ?? '',
      title: n.app?.title ?? '',
    }));
  } catch {
    // Fallback for API versions without Publication.app: the channel name.
    const data = await gql(env, `{ publications(first: 25) { nodes { id name } } }`);
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

async function publishProduct(env, productId) {
  const publicationId = await onlineStorePublicationId(env);
  const data = await gql(
    env,
    `mutation ($id: ID!, $input: [PublicationInput!]!) {
       publishablePublish(id: $id, input: $input) { userErrors { field message } }
     }`,
    { id: productId, input: [{ publicationId }] },
  );
  const errs = data.publishablePublish.userErrors;
  if (errs?.length) throw new Error(errs.map((e) => e.message).join('; '));
}

const MANAGED_TAG_RE = /^(configurator$|super:|cat:)/;

/** All configurator products, live from the store. */
async function listProducts(env) {
  const products = [];
  let after = null;
  for (let page = 0; page < 20; page++) {
    const data = await gql(
      env,
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

async function productByHandle(env, handle) {
  const data = await gql(
    env,
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
async function updateProduct(env, productId, item, variants, tags) {
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
    env,
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
async function setVariantQuantities(env, variantNodes, desired, locationId) {
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
      env,
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
          env,
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

async function deleteProduct(env, productId) {
  const data = await gql(
    env,
    `mutation ($input: ProductDeleteInput!) {
       productDelete(input: $input) { deletedProductId userErrors { field message } }
     }`,
    { input: { id: productId } },
  );
  const errs = data.productDelete.userErrors;
  if (errs?.length) throw new Error(errs.map((e) => e.message).join('; '));
  if (!data.productDelete.deletedProductId) throw new Error('Shopify did not confirm the deletion.');
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

async function handleAddItem(env, body) {
  const { item, variants } = validateItem(body);
  const b64 = spriteBase64(body.image);

  // Fail fast on any name/handle collision BEFORE touching the theme or store.
  await assertNoDuplicates(env, item);

  const steps = [];
  const step = (name, status, detail = '') => steps.push({ name, status, detail });

  // 1. Sprite → theme asset. Without it the widget can't draw the item, so a
  //    failure here aborts before the product is created.
  const spriteName = `sprite-${item.handle}.png`;
  try {
    await upsertThemeAsset(env, spriteName, b64);
    themeSpriteCache.delete(`assets/${spriteName}`);
    step('Upload sprite to theme', 'done', `assets/${spriteName} written to theme ${env.SHOPIFY_THEME_ID}.`);
  } catch (err) {
    step('Upload sprite to theme', 'fail', `${err.message} — nothing was created; fix the problem and submit again.`);
    step('Create product & stock', 'skip', 'Sprite upload failed.');
    step('Publish to Online Store', 'skip', 'Sprite upload failed.');
    return { ok: false, steps };
  }

  // 2 + 3. Product, stock, publish.
  let productId = null;
  try {
    const locationId = await primaryLocationId(env);
    productId = await createProduct(env, item, variants, locationId);
    const stockSummary = variants.map((v) => `${v.label}: $${v.price.toFixed(2)} × ${v.qty}`).join(', ');
    step('Create product & stock', 'done', `Product "${item.name}" (${item.handle}) created with stock — ${stockSummary}.`);
  } catch (err) {
    step('Create product & stock', 'fail', err.message);
  }
  if (productId) {
    try {
      await publishProduct(env, productId);
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

  return { ok: steps.every((s) => s.status !== 'fail'), steps };
}

// ─── The edit-item pipeline ──────────────────────────────────────────────────

async function handleUpdateItem(env, handle, body) {
  const { item, variants } = validateItem(body, handle);
  // The sprite is optional on edit — null/absent means "keep the current one".
  const b64 = body.image ? spriteBase64(body.image) : null;

  const steps = [];
  const step = (name, status, detail = '') => steps.push({ name, status, detail });

  const existing = await productByHandle(env, handle);
  if (!existing) {
    throw new Error(`No product with handle "${handle}" exists on the store — it may have been deleted. Refresh the list.`);
  }
  // Renaming? Make sure the new name doesn't collide with anything else first.
  if (item.name.toLowerCase() !== existing.title.toLowerCase()) {
    await assertNoDuplicates(env, item, handle);
  }

  // 1. Optional sprite replacement (same filename → the widget picks it up).
  if (b64) {
    const spriteName = `sprite-${handle}.png`;
    try {
      await upsertThemeAsset(env, spriteName, b64);
      themeSpriteCache.delete(`assets/${spriteName}`);
      step('Replace sprite', 'done', `assets/${spriteName} overwritten on theme ${env.SHOPIFY_THEME_ID}.`);
    } catch (err) {
      step('Replace sprite', 'fail', `${err.message} — the previous sprite is still in place.`);
    }
  }

  // 2. Product fields + variant set. Tags outside this app's vocabulary
  //    (anything not configurator/super:/cat:) are preserved.
  const preservedTags = existing.tags.filter((t) => !MANAGED_TAG_RE.test(t));
  const tags = ['configurator', `super:${item.superCategory}`, `cat:${item.category}`, ...preservedTags];
  let variantNodes = null;
  try {
    variantNodes = await updateProduct(env, existing.id, item, variants, tags);
    step('Update product', 'done', `"${item.name}" (${handle}) — ${variants.map((v) => `${v.label}: $${v.price.toFixed(2)}`).join(', ')}.`);
  } catch (err) {
    step('Update product', 'fail', err.message);
  }

  // 3. Stock levels.
  if (variantNodes) {
    try {
      await setVariantQuantities(env, variantNodes, variants, await primaryLocationId(env));
      step('Set stock', 'done', variants.map((v) => `${v.label}: ${v.qty}`).join(', ') + '.');
    } catch (err) {
      step('Set stock', 'fail', `${err.message} — adjust the quantities in the Shopify admin.`);
    }
  } else {
    step('Set stock', 'skip', 'Product update failed.');
  }

  return { ok: steps.every((s) => s.status !== 'fail'), steps };
}

// ─── The delete-item pipeline ────────────────────────────────────────────────

async function handleDeleteItem(env, handle) {
  if (!SLUG_RE.test(handle)) throw new Error('Invalid item handle.');

  const steps = [];
  const step = (name, status, detail = '') => steps.push({ name, status, detail });

  const existing = await productByHandle(env, handle);
  if (!existing) {
    throw new Error(`No product with handle "${handle}" exists on the store — it may already be deleted. Refresh the list.`);
  }

  // 1. The product itself. If this fails, stop — nothing else should change.
  try {
    await deleteProduct(env, existing.id);
    step('Delete product', 'done', `"${existing.title}" (${handle}) removed from the store. Existing orders keep their line items.`);
  } catch (err) {
    step('Delete product', 'fail', err.message);
    return { ok: false, steps };
  }

  // 2. Sprite theme asset — best-effort; an orphaned sprite is harmless.
  const spriteName = `sprite-${handle}.png`;
  themeSpriteCache.delete(`assets/${spriteName}`);
  try {
    await deleteThemeAsset(env, spriteName);
    step('Remove sprite from theme', 'done', `assets/${spriteName} deleted from theme ${env.SHOPIFY_THEME_ID}.`);
  } catch (err) {
    step(
      'Remove sprite from theme',
      'warn',
      `Could not delete assets/${spriteName} (${err.message}). It is harmless — remove it in the theme code editor if you want it gone.`,
    );
  }

  return { ok: steps.every((s) => s.status !== 'fail'), steps };
}

// ─── HTTP plumbing ───────────────────────────────────────────────────────────

function json(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

const REQUIRED_ENV = ['SHOPIFY_STORE', 'SHOPIFY_THEME_ID', 'SHOPIFY_CLIENT_ID', 'SHOPIFY_CLIENT_SECRET'];

function requireEnv(env) {
  const missing = REQUIRED_ENV.filter((k) => !env[k]);
  if (missing.length) {
    throw httpError(
      500,
      `Worker is missing ${missing.join(', ')} — run "npm run deploy:admin" (it sets the vars and the secret from .env).`,
    );
  }
}

/** Best-effort guard against concurrent add/edit/delete pipelines. Workers are
 *  distributed so this only covers requests landing on the same isolate — fine
 *  for a single-merchant tool where double-submits are the realistic case. */
let pushInFlight = false;

async function withPushLock(fn) {
  if (pushInFlight) {
    return json(429, { ok: false, error: 'Another operation is still running — wait for it to finish, then retry.' });
  }
  pushInFlight = true;
  try {
    return json(200, await fn());
  } finally {
    pushInFlight = false;
  }
}

async function route(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;

  if (request.method === 'GET' && (path === '/' || path === '/index.html')) {
    requireEnv(env);
    // Only the store's own admin may iframe this page; App Bridge needs the
    // app's client id (public) as its api key.
    return new Response(uiHtml.replace(/__SHOPIFY_API_KEY__/g, env.SHOPIFY_CLIENT_ID), {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Security-Policy': `frame-ancestors https://${env.SHOPIFY_STORE} https://admin.shopify.com`,
        'Cache-Control': 'no-store',
      },
    });
  }

  if (!path.startsWith('/api/')) {
    return new Response('Not found', { status: 404 });
  }

  requireEnv(env);
  await verifySessionToken(env, request);

  if (request.method === 'GET' && path === '/api/config') {
    return json(200, {
      store: env.SHOPIFY_STORE,
      themeId: env.SHOPIFY_THEME_ID,
      apiVersion: env.SHOPIFY_API_VERSION || '2026-01',
      beadSizes: BEAD_SIZES,
      categories: CATEGORIES,
    });
  }

  if (request.method === 'GET' && path === '/api/products') {
    return json(200, { products: await listProducts(env) });
  }

  const spriteMatch = /^\/api\/sprites\/([a-z0-9-]+)\.png$/.exec(path);
  if (request.method === 'GET' && spriteMatch) {
    const bytes = await themeAssetPng(env, `assets/sprite-${spriteMatch[1]}.png`);
    return new Response(bytes, {
      headers: { 'Content-Type': 'image/png', 'Cache-Control': 'no-cache' },
    });
  }

  if (request.method === 'POST' && path === '/api/items') {
    const body = await request.json().catch(() => {
      throw new Error('Invalid request body (expected JSON).');
    });
    return withPushLock(() => handleAddItem(env, body));
  }

  const itemMatch = /^\/api\/items\/([a-z0-9-]+)$/.exec(path);
  if (itemMatch && (request.method === 'PUT' || request.method === 'DELETE')) {
    const handle = itemMatch[1];
    if (request.method === 'DELETE') {
      return withPushLock(() => handleDeleteItem(env, handle));
    }
    const body = await request.json().catch(() => {
      throw new Error('Invalid request body (expected JSON).');
    });
    return withPushLock(() => handleUpdateItem(env, handle, body));
  }

  return new Response('Not found', { status: 404 });
}

export default {
  async fetch(request, env) {
    try {
      return await route(request, env);
    } catch (err) {
      return json(err.statusCode ?? 400, { ok: false, error: err.message ?? String(err) });
    }
  },
};
