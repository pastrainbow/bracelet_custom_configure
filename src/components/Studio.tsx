import { useRef } from 'react';
import { useStore } from '@/store/store';
import { useBraceletEngine } from '@/hooks/useBraceletEngine';
import { BeadPicker } from './BeadPicker';
import { BackgroundDropdown } from './BackgroundDropdown';
import { CanvasActions } from './CanvasActions';
import { StickyFit } from './StickyFit';
import { MobilePanelTabs } from './MobilePanelTabs';
import { Button } from './ui/Button';
import { cn } from './ui/cn';

/**
 * The left half of the configurator: the physics bowl, the arrange button, the
 * hint line and the bead picker. Owns the engine (via useBraceletEngine) and
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
  const shareOpen = useStore((s) => s.shareOpen);
  const mobilePanel = useStore((s) => s.mobilePanel);
  const isBracelet = mode !== 'free';

  return (
    // On mobile the panel is `display:contents` so its children join the page's
    // flex column alongside the sidebar — that makes the sticky bowl region (below)
    // stay pinned while the bead picker AND sidebar scroll past
    // it. On desktop it's a normal flex column.
    <div
      ref={containerRef}
      className="relative flex flex-col overflow-hidden max-[639px]:contents"
    >
      {/* On mobile this sticks to the top of the viewport so the bowl stays in
          view while the bead picker / sidebar scroll beneath it (bg + z-index so
          that scrolling content slides under, not over). */}
      <div
        className={cn(
          'relative flex min-h-0 flex-1 flex-col items-center justify-center gap-3 transition-[transform,opacity] duration-300 max-[639px]:sticky max-[639px]:top-12 max-[639px]:z-10 max-[639px]:flex-none max-[639px]:gap-2.5 max-[639px]:bg-bg min-[640px]:min-h-[max(44vh,300px)]',
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

        {/* Floating actions pinned to the bowl's top-left (Preview & Share, Save
            Design) and the background control on the top-right. */}
        <CanvasActions />
        <BackgroundDropdown />

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

        {/* Desktop: the large centered arrange button (the fit bar stays in the
            sidebar). Hidden on mobile, where StickyFit takes over. */}
        <div className="mb-6 flex-shrink-0 max-[639px]:hidden">
          <Button
            variant={isBracelet ? 'gold' : 'primary'}
            size="md"
            onClick={toggleArrange}
            disabled={!isBracelet && count === 0}
            className="rounded-pill shadow-float"
          >
            {isBracelet ? 'Scatter Beads' : 'Arrange as Bracelet'}
          </Button>
        </div>

        {/* Mobile: compact arrange button + always-visible wrist fit bar/input. */}
        <div className="hidden w-full flex-shrink-0 justify-center max-[639px]:flex">
          <StickyFit />
        </div>

        {/* Mobile: sticky section selector (part of the pinned bowl region) that
            heads the control column and switches the scrolling content below
            between the bead picker and the sidebar. Full-bleed and flush with
            that content (shared surface) so it reads as part of the section; a
            small gap above separates it from the bowl/fit row. */}
        <div className="mt-2 hidden w-full flex-shrink-0 max-[639px]:block">
          <MobilePanelTabs />
        </div>
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
          mobilePanel !== 'add' && 'max-[639px]:hidden',
        )}
      >
        <BeadPicker />
      </div>
    </div>
  );
}
