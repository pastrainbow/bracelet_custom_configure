import { selectTotals, useStore } from '@/store/store';

/** Compact running total pinned to the bowl's top-left on mobile: total price and
 *  bead count, always visible above the bowl (the detailed Order Summary lives in
 *  the sidebar's Order Info tab). Hidden on desktop. */
export function CanvasPrice() {
  const { count, totalPrice } = useStore((s) => selectTotals(s));

  return (
    <div className="absolute left-2 top-2 z-30 hidden flex-col items-start rounded-xl border border-border bg-surface/90 px-2.5 py-1 shadow-float backdrop-blur max-[639px]:flex">
      <span className="text-[15px] font-bold leading-none text-ink">
        <span className="text-[11px] font-medium text-muted">$</span>
        {totalPrice.toFixed(2)}
      </span>
      <span className="mt-0.5 text-[10px] font-medium leading-none text-muted">
        {count} bead{count !== 1 ? 's' : ''}
      </span>
    </div>
  );
}
