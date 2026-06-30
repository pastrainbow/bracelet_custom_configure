import { useEffect, useRef, useState } from 'react';
import { Loader2, Ruler, ShoppingCart, Trash2 } from 'lucide-react';
import { selectTotals, useStore } from '@/store/store';
import { WristSizeField } from './sidebar/BraceletInfo';
import { BackgroundDropdown } from './BackgroundDropdown';
import { Button } from './ui/Button';
import { cn } from './ui/cn';

/**
 * Collapsible wrist-size control for the mobile sticky fit row. Renders as a
 * compact pill at the bottom-right corner of the bowl; tapping it expands a
 * popover (opening upward) with the wrist-size input and a short instruction,
 * so the bowl's bottom-centre stays clear until a size is entered.
 */
function WristButton({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (cm: number | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative z-30 flex-shrink-0">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Set wrist size"
        aria-expanded={open}
        className={cn(
          'flex items-center gap-1.5 rounded-pill border border-border bg-surface/90 px-3 py-1.5 text-[13px] font-semibold text-ink shadow-float backdrop-blur transition-colors hover:border-gold',
          open && 'border-gold',
        )}
      >
        <Ruler size={14} className="text-muted" />
        {value != null ? `${value} cm` : 'Wrist size'}
      </button>

      {open && (
        <div className="absolute bottom-11 left-0 w-56 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-surface p-3 shadow-float">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[12px] font-semibold text-ink">Wrist size</span>
            <WristSizeField value={value} onChange={onChange} compact />
          </div>
          <p className="mt-2 text-[11px] leading-snug text-muted">
            Enter your wrist size for a live fit check.
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Compact control row shown only on mobile, inside the Studio's sticky bowl
 * region. Left to right: the wrist-size control (see WristButton), the background
 * picker, a clear-all button and an add-to-cart button, then the arrange button
 * pushed to the right. The
 * live fit progress bar lives above the bowl now (see MobileFitBar). On desktop
 * the fit bar/input live in the sidebar (BraceletInfo), so this is hidden there.
 */
export function StickyFit() {
  const { count } = useStore((s) => selectTotals(s));
  const wristSizeCm = useStore((s) => s.wristSizeCm);
  const setWristSize = useStore((s) => s.setWristSize);
  const mode = useStore((s) => s.mode);
  const toggleArrange = useStore((s) => s.toggleArrange);
  const clearAll = useStore((s) => s.clearAll);
  const addToCart = useStore((s) => s.addToCart);
  const cartPending = useStore((s) => s.cartPending);

  const isBracelet = mode !== 'free';

  return (
    <div className="w-full max-w-[420px] px-4">
      <div className="flex items-center gap-2">
        <WristButton value={wristSizeCm} onChange={setWristSize} />

        <BackgroundDropdown direction="up" />

        <button
          onClick={clearAll}
          disabled={count === 0}
          aria-label="Clear all beads"
          title="Clear all beads"
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-border bg-surface/90 text-muted shadow-float backdrop-blur transition-colors hover:border-gold hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:text-muted"
        >
          <Trash2 size={16} />
        </button>

        <button
          onClick={addToCart}
          disabled={count === 0 || cartPending}
          aria-label="Add to cart"
          title="Add to cart"
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-border bg-surface/90 text-muted shadow-float backdrop-blur transition-colors hover:border-gold hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:text-muted"
        >
          {cartPending ? <Loader2 size={16} className="animate-spin" /> : <ShoppingCart size={16} />}
        </button>

        <div className="flex-1" />

        <Button
          variant={isBracelet ? 'gold' : 'primary'}
          size="md"
          onClick={toggleArrange}
          disabled={!isBracelet && count === 0}
          className="flex-shrink-0 rounded-pill shadow-float"
        >
          {isBracelet ? 'Scatter' : 'Arrange'}
        </Button>
      </div>
    </div>
  );
}
