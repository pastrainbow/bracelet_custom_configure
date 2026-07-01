import type { ItemDef } from '@/types';
import { isAccessory } from '@/types';
import { drawBead } from './bead';
import { drawAccessory } from './accessories';

/**
 * Bakes each catalogue item into an offscreen canvas once, so the engine's
 * render loop blits a cached image instead of replaying vector-drawing calls
 * every frame. This is also the seam for swapping in real product photos from
 * Shopify later: `buildSprite` is the only place that knows how to turn an
 * `ItemDef` into pixels, so a future version can draw an `<img>` there instead
 * of calling `drawBead`/`drawAccessory`, leaving the rest of the engine
 * (`drawItem`, positioning, rotation) unchanged.
 */

/** Extra headroom (as a multiple of diameter) so drop shadows/glow aren't clipped.
 *  Exported so the offline sprite generator (scripts/generate-catalogue-assets)
 *  bakes PNGs with the exact same framing this cache expects. */
export const SPRITE_PADDING = 1.4;

/** Round cache keys to this many px so continuous resizing/tweening doesn't
 *  thrash the cache with a near-infinite number of near-identical sprites. */
const RADIUS_STEP = 1;

/** Cap on distinct sprites kept alive; oldest entries are evicted past this. */
const MAX_CACHE_ENTRIES = 600;

export interface ItemSprite {
  image: CanvasImageSource;
  /** On-screen (CSS-pixel) width/height of the square sprite, centred on the item. */
  size: number;
}

const cache = new Map<string, ItemSprite>();

// ─── Image sprites (Shopify-sourced) ─────────────────────────────────────────
// Items with an `imageUrl` are drawn from a pre-loaded PNG instead of the
// procedural gradient/shape. Images are loaded up front by `preloadSprites` so
// `buildSprite` stays synchronous; a def whose image isn't ready falls back to
// the procedural render.
const imageCache = new Map<string, HTMLImageElement>();

function loadImage(url: string): Promise<void> {
  if (imageCache.has(url)) return Promise.resolve();
  return new Promise<void>((resolve) => {
    const img = new Image();
    // Theme-asset CDN sends permissive CORS headers; requesting anonymously
    // keeps the physics canvas untainted so the share-card export still works.
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageCache.set(url, img);
      resolve();
    };
    img.onerror = () => resolve(); // leave it uncached → procedural fallback
    img.src = url;
  });
}

/** Pre-load every image-backed sprite in the catalogue. Resolves immediately
 *  when there are none (e.g. the stub catalogue), so callers can always await. */
export function preloadSprites(defs: ItemDef[]): Promise<void> {
  const urls = Array.from(
    new Set(defs.map((d) => d.imageUrl).filter((u): u is string => !!u)),
  );
  return Promise.all(urls.map(loadImage)).then(() => undefined);
}

function buildSprite(def: ItemDef, radius: number, dpr: number): ItemSprite {
  const size = Math.max(1, Math.ceil(radius * 2 * SPRITE_PADDING));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(size * dpr));
  canvas.height = canvas.width;
  const ctx = canvas.getContext('2d')!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const img = def.imageUrl ? imageCache.get(def.imageUrl) : undefined;
  if (img) {
    // The PNG is baked with the same SPRITE_PADDING framing, so it fills the
    // whole sprite square — matching the procedural render's placement exactly.
    ctx.drawImage(img, 0, 0, size, size);
  } else {
    const c = size / 2;
    if (isAccessory(def)) drawAccessory(ctx, c, c, radius, def);
    else drawBead(ctx, c, c, radius, def);
  }

  return { image: canvas, size };
}

/**
 * The cached image for a catalogue item at a given radius (px), generating it
 * on first use. Position and rotation are applied by the caller (`drawItem`)
 * so one sprite per (item, radius, dpr) covers every placement.
 */
export function getItemSprite(def: ItemDef, radius: number, dpr = 1): ItemSprite {
  const roundedR = Math.max(RADIUS_STEP, Math.round(radius / RADIUS_STEP) * RADIUS_STEP);
  const key = `${def.id}:${roundedR}:${dpr}`;

  let sprite = cache.get(key);
  if (sprite) return sprite;

  sprite = buildSprite(def, roundedR, dpr);
  cache.set(key, sprite);
  if (cache.size > MAX_CACHE_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  return sprite;
}
