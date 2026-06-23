import type { ItemDef } from '@/types';
import { isAccessory } from '@/types';
import { drawBead } from './bead';
import { drawAccessory } from './accessories';

type Ctx = CanvasRenderingContext2D;

/** Draw any catalogue item (bead or accessory) at (x, y). */
export function drawItem(
  ctx: Ctx,
  x: number,
  y: number,
  r: number,
  def: ItemDef,
  angle = 0,
): void {
  if (isAccessory(def)) {
    drawAccessory(ctx, x, y, r, def, angle);
  } else {
    drawBead(ctx, x, y, r, def, angle);
  }
}
