import { useRef } from 'react';
import { useStore } from '@/store/store';
import { useBraceletEngine } from '@/hooks/useBraceletEngine';
import { BeadPicker } from './BeadPicker';
import { PreviewSettings } from './PreviewSettings';
import { Button } from './ui/Button';
import { cn } from './ui/cn';

/**
 * The left half of the configurator: the physics bowl, the arrange button, the
 * hint line, the bead picker and preview settings. Owns the engine (via
 * useBraceletEngine) and the overlay canvas that spans the whole column.
 */
export function Studio() {
  const containerRef = useRef<HTMLDivElement>(null);
  const physicsRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);

  useBraceletEngine(containerRef, physicsRef, overlayRef);

  const mode = useStore((s) => s.mode);
  const count = useStore((s) => s.items.length);
  const toggleArrange = useStore((s) => s.toggleArrange);
  const shareOpen = useStore((s) => s.shareOpen);
  const isBracelet = mode !== 'free';

  return (
    // On mobile the panel is `display:contents` so its children join the page's
    // flex column alongside the sidebar — that makes the sticky bowl region (below)
    // stay pinned while the bead picker, preview settings AND sidebar scroll past
    // it. On desktop it's a normal flex column.
    <div
      ref={containerRef}
      className="relative flex flex-col overflow-hidden max-[639px]:contents"
    >
      {/* On mobile this sticks to the top of the viewport so the bowl stays in
          view while the bead picker / preview settings / sidebar scroll beneath
          it (bg + z-index so that scrolling content slides under, not over). */}
      <div
        className={cn(
          'relative flex min-h-0 flex-1 flex-col items-center justify-center gap-3 transition-[transform,opacity] duration-300 max-[639px]:sticky max-[639px]:top-12 max-[639px]:z-10 max-[639px]:flex-none max-[639px]:gap-2.5 max-[639px]:bg-bg max-[639px]:pb-2 min-[640px]:min-h-[max(44vh,300px)]',
          shareOpen && 'scale-90 opacity-0',
        )}
      >
        {/* Overlay covers the bowl region so the size wheel, custom cursor and
            dragged beads render over it. It's a child of the region so it stays
            aligned (and sized — see engine resize) when the region sticks. */}
        <canvas
          ref={overlayRef}
          className={cn(
            'pointer-events-none absolute inset-0 z-20 h-full w-full transition-opacity duration-300',
            shareOpen && 'opacity-0',
          )}
        />

        {/* The box the bowl must fit inside. The engine sizes the canvas to this
            area (not the whole column), so the bowl scales down to fit instead of
            overflowing onto the button, hint and bead picker on short screens. */}
        <div
          data-canvas-area
          className="flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden max-[639px]:h-[85vw] max-[639px]:max-h-[400px] max-[639px]:min-h-[260px] max-[639px]:flex-none"
        >
          <div data-canvas-wrap className="relative flex items-center justify-center overflow-hidden">
            <div className="transition-transform duration-200">
              <canvas ref={physicsRef} className="block cursor-none touch-none" />
            </div>
          </div>
        </div>

        <div className="flex-shrink-0">
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

        {/* Part of the (mobile-sticky) canvas block so it reads as a caption to the
            bowl and stays put while the controls scroll, rather than scrolling away. */}
        <p
          className={cn(
            'flex-shrink-0 text-center text-[11px] text-muted transition-opacity duration-300',
            shareOpen ? 'opacity-0' : 'opacity-75',
          )}
        >
          Click a bead to resize it
        </p>
      </div>

      {/* Capped to a fraction of the desktop viewport so the bowl always gets the
          majority of the vertical space (and grows large on big screens instead
          of leaving whitespace); the section scrolls internally when its content
          exceeds the cap, so nothing overlaps the bowl or clips off-screen.
          Mobile keeps natural flow (the page scrolls). */}
      <div
        className={cn(
          'transition-[transform,opacity] duration-300 min-[640px]:max-h-[40vh] min-[640px]:min-h-0 min-[640px]:overflow-y-auto',
          shareOpen && 'pointer-events-none translate-y-full opacity-0',
        )}
      >
        <BeadPicker />
        <PreviewSettings />
      </div>
    </div>
  );
}
