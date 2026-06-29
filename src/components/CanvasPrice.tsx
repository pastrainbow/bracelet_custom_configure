import { selectTotals, useStore } from '@/store/store';

/** Compact running total — price over bead count on two lines — shown at the
 *  left of the mobile floating control row over the bowl (see Studio). The
 *  detailed Order Summary lives in the sidebar's Order Info tab. Mobile only;
 *  its parent row is hidden on desktop. */
export function CanvasPrice() {
  const { count, totalPrice } = useStore((s) => selectTotals(s));

  return (
    <div className="flex flex-shrink-0 flex-col items-start rounded-xl border border-border bg-surface/90 px-2.5 py-1 shadow-float backdrop-blur">
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
