import { useEffect, useRef } from 'react';
import type { ItemDef } from '@/types';
import { isAccessory } from '@/types';
import { drawAccessory } from '@/engine/render/accessories';
import { cn } from './ui/cn';

/** Canvas preview of an accessory shape. */
function AccessoryThumb({ def, size }: { def: Extract<ItemDef, { shape: string }>; size: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    const ctx = canvas.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);
    drawAccessory(ctx, size / 2, size / 2, size * 0.43, def);
  }, [def, size]);

  return <canvas ref={ref} style={{ width: size, height: size }} className="block rounded-lg" />;
}

/** CSS-gradient preview of a round bead. */
function BeadThumb({ def, size }: { def: Extract<ItemDef, { gradient: [string, string] }>; size: number }) {
  const background = def.shimmer
    ? `radial-gradient(circle at 35% 35%, #fff 0%, ${def.gradient[0]} 30%, ${def.gradient[1]} 100%)`
    : `radial-gradient(circle at 35% 35%, ${def.gradient[0]}, ${def.gradient[1]})`;

  return (
    <div
      className="relative overflow-hidden rounded-full shadow-[inset_-4px_-4px_10px_rgba(0,0,0,0.2),2px_2px_8px_rgba(0,0,0,0.1)] after:absolute after:left-[20%] after:top-[20%] after:h-[25%] after:w-[30%] after:rounded-full after:bg-white/60 after:blur-[2px] after:content-['']"
      style={{ width: size, height: size, background }}
    />
  );
}

/** Unified thumbnail that renders either a bead or an accessory. */
export function ItemThumb({
  def,
  size = 46,
  className,
}: {
  def: ItemDef;
  size?: number;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center justify-center', className)} style={{ width: size, height: size }}>
      {isAccessory(def) ? <AccessoryThumb def={def} size={size} /> : <BeadThumb def={def} size={size} />}
    </div>
  );
}
