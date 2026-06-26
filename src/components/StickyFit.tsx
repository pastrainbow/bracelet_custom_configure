import { useEffect, useRef, useState } from 'react';
import { Ruler } from 'lucide-react';
import { selectTotals, useStore } from '@/store/store';
import { FitBar, WristSizeField } from './sidebar/BraceletInfo';
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
    <div ref={ref} className="relative z-30 mb-2.5 flex-shrink-0">
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
        <div className="absolute bottom-11 right-0 w-56 rounded-xl border border-border bg-surface p-3 shadow-float">
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
 * Compact wrist-fit row shown only on mobile, inside the Studio's sticky bowl
 * region. The arrange button sits at the bottom-left and the wrist-size control
 * (see WristButton) at the bottom-right, leaving the bottom-centre empty until a
 * wrist size is set — at which point the live fit progress bar fills it. On
 * desktop the fit bar/input live in the sidebar (BraceletInfo), so this
 * component is hidden there.
 */
export function StickyFit() {
  const { count, lengthCm } = useStore((s) => selectTotals(s));
  const wristSizeCm = useStore((s) => s.wristSizeCm);
  const setWristSize = useStore((s) => s.setWristSize);
  const mode = useStore((s) => s.mode);
  const toggleArrange = useStore((s) => s.toggleArrange);

  const isBracelet = mode !== 'free';
  const hasBeads = count > 0;
  const est = hasBeads ? lengthCm : 0;

  return (
    <div className="w-full max-w-[420px] px-4">
      <div className="flex items-center gap-2.5">
        <Button
          variant={isBracelet ? 'gold' : 'primary'}
          size="sm"
          onClick={toggleArrange}
          disabled={!isBracelet && count === 0}
          className="mb-2.5 flex-shrink-0 rounded-pill shadow-float"
        >
          {isBracelet ? 'Scatter' : 'Arrange'}
        </Button>

        {/* Bottom-centre: empty until a wrist size is set, then the live fit bar.
            The extra top margin nudges the bar down so it lines up with the
            vertical centre of the buttons (which carry a bottom margin), since the
            fit label below the bar otherwise pulls the bar above their centre. */}
        <div className="mt-2 min-w-0 flex-1">
          {wristSizeCm != null && (
            <FitBar wrist={wristSizeCm} est={est} hasBeads={hasBeads} compact />
          )}
        </div>

        <WristButton value={wristSizeCm} onChange={setWristSize} />
      </div>
    </div>
  );
}
