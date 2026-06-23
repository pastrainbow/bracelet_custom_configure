import { useRef } from 'react';
import { useStore } from '@/store/store';
import { useBraceletEngine } from '@/hooks/useBraceletEngine';
import { BeadPicker } from './BeadPicker';
import { Button } from './ui/Button';

/**
 * The left half of the configurator: the physics bowl, the arrange button, the
 * hint line, and the bead picker. Owns the engine (via useBraceletEngine) and
 * the overlay canvas that spans the whole column.
 */
export function Studio() {
  const containerRef = useRef<HTMLDivElement>(null);
  const physicsRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);

  useBraceletEngine(containerRef, physicsRef, overlayRef);

  const mode = useStore((s) => s.mode);
  const count = useStore((s) => s.items.length);
  const toggleArrange = useStore((s) => s.toggleArrange);
  const isBracelet = mode !== 'free';

  return (
    <div ref={containerRef} className="relative flex flex-col overflow-hidden max-[639px]:overflow-visible">
      {/* Overlay spans the entire column so dragged beads can render anywhere. */}
      <canvas
        ref={overlayRef}
        className="pointer-events-none absolute inset-0 z-20 h-full w-full"
      />

      <div className="relative flex min-h-0 flex-1 items-center justify-center max-[639px]:min-h-0 max-[639px]:flex-none max-[639px]:flex-col max-[639px]:gap-2.5 max-[639px]:pb-2">
        <div
          data-canvas-wrap
          className="relative flex items-center justify-center max-[639px]:h-[85vw] max-[639px]:max-h-[400px] max-[639px]:min-h-[280px] max-[639px]:w-full"
        >
          <canvas ref={physicsRef} className="cursor-none touch-none" />
        </div>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 max-[639px]:static max-[639px]:translate-x-0">
          <Button
            variant={isBracelet ? 'gold' : 'primary'}
            size="lg"
            onClick={toggleArrange}
            disabled={!isBracelet && count === 0}
            className="rounded-pill shadow-float"
          >
            {isBracelet ? 'Scatter Beads' : 'Arrange as Bracelet'}
          </Button>
        </div>
      </div>

      <p className="mt-1.5 text-center text-[11px] text-muted opacity-75">
        Right-click or hold a bead to change its size
      </p>

      <BeadPicker />
    </div>
  );
}
