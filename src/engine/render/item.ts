import type { ItemDef } from '@/types';
import { getItemSprite } from './spriteCache';

type Ctx = CanvasRenderingContext2D;

/**
 * Draw any catalogue item (bead or accessory) at (x, y) by blitting its
 * cached sprite (see `spriteCache.ts`), rotated by `angle`. `dpr` selects
 * which backing resolution of the sprite to use so it stays crisp on the
 * destination canvas.
 */
export function drawItem(
  ctx: Ctx,
  x: number,
  y: number,
  r: number,
  def: ItemDef,
  angle = 0,
  dpr = 1,
): void {
  const sprite = getItemSprite(def, r, dpr);
  ctx.save();
  ctx.translate(x, y);
  if (angle) ctx.rotate(angle);
  ctx.drawImage(sprite.image, -sprite.size / 2, -sprite.size / 2, sprite.size, sprite.size);
  ctx.restore();
}
