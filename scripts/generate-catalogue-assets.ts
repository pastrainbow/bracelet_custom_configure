// Offline catalogue asset generator.
//
// Renders every catalogue item to a transparent PNG — reusing the very same
// drawBead/drawAccessory the widget uses at runtime, via @napi-rs/canvas — and
// writes a Shopify product-import CSV. Everything lands in dist-catalogue/.
//
// Run:  npm run generate:catalogue
//
// Pipeline:
//   1. this script            → dist-catalogue/assets/sprite-<id>.png + products.csv
//   2. npm run deploy:shopify → uploads those PNGs to the theme's assets/
//   3. Admin → Products → Import → products.csv
//
// Run with `tsx` so the `@/` path alias (from tsconfig) and the app's TS modules
// resolve directly; this file is intentionally outside the app's tsconfig
// `include`, so it isn't part of `npm run typecheck`.

import { mkdir, writeFile, rm } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCanvas } from '@napi-rs/canvas';
import { CATALOGUE, SUPERCATS } from '@/data/catalogue';
import { isAccessory, type ItemDef, type SuperCategory } from '@/types';
import { drawBead } from '@/engine/render/bead';
import { drawAccessory } from '@/engine/render/accessories';
import { BEAD_SIZES } from '@/config/constants';
import { SPRITE_PADDING } from '@/engine/render/spriteCache';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = resolve(ROOT, 'dist-catalogue');
const ASSET_DIR = resolve(OUT_DIR, 'assets');

/** Radius (px) each sprite is baked at. Big, since it's downscaled at runtime.
 *  The canvas uses the same SPRITE_PADDING framing as the runtime sprite cache,
 *  so the PNG fills a sprite square exactly like the procedural render. */
const GEN_RADIUS = 256;

function renderPng(def: ItemDef): Buffer {
  const side = Math.ceil(GEN_RADIUS * 2 * SPRITE_PADDING);
  const canvas = createCanvas(side, side);
  // napi's 2D context is API-compatible with the browser's; the draw helpers are
  // typed against the DOM type, so cast at this boundary.
  const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D;
  const c = side / 2;
  if (isAccessory(def)) drawAccessory(ctx, c, c, GEN_RADIUS, def);
  else drawBead(ctx, c, c, GEN_RADIUS, def);
  return canvas.toBuffer('image/png');
}

// ─── Shopify product CSV ─────────────────────────────────────────────────────
// One product per item, one row per size variant. Handle = item id (the stable
// identity design codes rely on). Category/super-category ride along as tags so
// the Liquid section can group items without any metafields.

const CSV_COLUMNS = [
  'Handle', 'Title', 'Body (HTML)', 'Vendor', 'Tags', 'Published',
  'Option1 Name', 'Option1 Value', 'Variant SKU', 'Variant Price',
  'Variant Inventory Policy', 'Variant Fulfillment Service',
  'Variant Requires Shipping', 'Variant Taxable', 'Status',
];

function csvCell(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function superOf(cat: string): SuperCategory {
  for (const [superCat, tabs] of Object.entries(SUPERCATS) as [SuperCategory, { cat: string }[]][]) {
    if (tabs.some((t) => t.cat === cat)) return superCat;
  }
  return 'beads';
}

function sizesFor(def: ItemDef): number[] {
  if (isAccessory(def)) return [];
  return def.sizes && def.sizes.length ? def.sizes : [...BEAD_SIZES];
}

function rowsFor(def: ItemDef, cat: string): string[][] {
  const tags = `configurator, super:${superOf(cat)}, cat:${cat}`;
  const sizes = sizesFor(def);
  // Uniform base price across sizes; the widget scales it per size for display
  // (see priceFor). Per-variant pricing isn't charged today (fixed-price cart).
  const price = def.price.toFixed(2);

  if (sizes.length === 0) {
    return [[
      def.id, def.name, '', '', tags, 'TRUE',
      'Size', 'One Size', def.id, price,
      'deny', 'manual', 'TRUE', 'TRUE', 'active',
    ]];
  }
  return sizes.map((mm, i): string[] => {
    const first = i === 0; // product-level columns only go on the first variant row
    return [
      def.id, first ? def.name : '', '', '', first ? tags : '', first ? 'TRUE' : '',
      'Size', `${mm} mm`, `${def.id}-${mm}`, price,
      'deny', 'manual', 'TRUE', 'TRUE', first ? 'active' : '',
    ];
  });
}

async function main(): Promise<void> {
  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(ASSET_DIR, { recursive: true });

  const rows: string[][] = [CSV_COLUMNS];
  let count = 0;
  for (const [cat, defs] of Object.entries(CATALOGUE)) {
    for (const def of defs) {
      await writeFile(resolve(ASSET_DIR, `sprite-${def.id}.png`), renderPng(def));
      rows.push(...rowsFor(def, cat));
      count++;
    }
  }

  const csv = rows.map((r) => r.map(csvCell).join(',')).join('\r\n') + '\r\n';
  await writeFile(resolve(OUT_DIR, 'products.csv'), csv, 'utf8');

  // eslint-disable-next-line no-console
  console.log(`Generated ${count} sprite PNGs + products.csv in dist-catalogue/`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
