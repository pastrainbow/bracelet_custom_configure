import { useRef } from 'react';
import { useStore } from '@/store/store';
import { useBraceletEngine } from '@/hooks/useBraceletEngine';
import { BeadPicker } from './BeadPicker';
import { BackgroundDropdown } from './BackgroundDropdown';
import { CanvasActions } from './CanvasActions';
import { CanvasPrice } from './CanvasPrice';
import { MobileFitBar } from './MobileFitBar';
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
      {/* On mobile the bowl is a fixed (flex-none) block at the top of the
          viewport-height column; the control section below it fills the rest and
          scrolls internally, so the bowl never needs to scroll out of view. */}
      <div
        className={cn(
          'relative flex min-h-0 flex-1 flex-col items-center justify-center gap-3 transition-[transform,opacity] duration-300 max-[639px]:z-10 max-[639px]:flex-none max-[639px]:gap-2 max-[639px]:bg-bg max-[639px]:pt-14 min-[640px]:min-h-[max(44vh,300px)]',
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

        {/* Desktop floating controls over the bowl: Preview & Share (top-left) and
            the background picker (top-right). On mobile both move elsewhere — share
            into the floating control row below, background into StickyFit. */}
        <CanvasActions />
        <BackgroundDropdown className="absolute right-3 top-3 max-[639px]:hidden" />

        {/* Mobile: one floating control row over the bowl's top — the running
            price/quantity (left), the wrist-fit bar filling the space between, and
            the Preview & Share button (right). `items-center` keeps the fit bar's
            progress track vertically aligned with the price pill and share button
            (its status label floats just beneath the track). The row floats over
            the bowl; the region's top padding (below) reserves the space so the
            bowl clears it. */}
        <div className="absolute inset-x-0 top-2 z-30 hidden items-center gap-4 px-2 max-[639px]:flex">
          <CanvasPrice />
          <div className="min-w-0 flex-1">
            <MobileFitBar />
          </div>
          <CanvasActions inline />
        </div>

        {/* The box the bowl must fit inside. The engine sizes the canvas to this
            area (not the whole column), so the bowl scales down to fit instead of
            overflowing onto the button, hint and bead picker on short screens. */}
        <div
          data-canvas-area
          className="flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden max-[639px]:aspect-[8/7] max-[639px]:h-auto max-[639px]:w-[min(88vw,40vh)] max-[639px]:max-w-[480px] max-[639px]:min-w-[200px] max-[639px]:flex-none"
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
          Mobile fills the space left below the pinned bowl (min-h-0 so the
          picker's own internal grid is the only thing that scrolls). */}
      <div
        className={cn(
          'transition-[transform,opacity] duration-300 min-[640px]:max-h-[40vh] min-[640px]:min-h-0 min-[640px]:overflow-y-auto max-[639px]:flex max-[639px]:min-h-0 max-[639px]:flex-1 max-[639px]:flex-col',
          shareOpen && 'pointer-events-none translate-y-full opacity-0',
          mobilePanel !== 'add' && 'max-[639px]:hidden',
        )}
      >
        <BeadPicker />
      </div>
    </div>
  );
}
