import { useStore, selectTotals } from '@/store/store';
import { Badge } from '../ui/Badge';

export function OrderSummary() {
  const { count, totalPrice } = useStore((s) => selectTotals(s));

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted">Order Summary</div>
        <Badge>{`${count} bead${count !== 1 ? 's' : ''}`}</Badge>
      </div>
      <div className="text-[38px] font-bold leading-none tracking-tight max-[1024px]:text-[30px] max-[639px]:text-[28px]">
        <span className="text-lg font-medium text-muted">$</span>
        {totalPrice.toFixed(2)}
      </div>
    </div>
  );
}
