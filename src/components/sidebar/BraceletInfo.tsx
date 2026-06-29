import { useEffect, useState } from 'react';
import {
  BRACELET_EASE_MAX_CM,
  BRACELET_EASE_MIN_CM,
  DEFAULT_WRIST_CM,
  WRIST_MAX_CM,
  WRIST_MIN_CM,
} from '@/config/constants';
import { selectTotals, useStore } from '@/store/store';
import { cn } from '../ui/cn';
import { SectionTitle } from '../ui/SectionTitle';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-bg py-2 text-[13px] last:border-b-0">
      <span className="text-muted">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

/** Editable wrist-size field (cm). Commits to the store only when valid. */
function isInBounds(n: number): boolean {
  return Number.isFinite(n) && n >= WRIST_MIN_CM && n <= WRIST_MAX_CM;
}

export function WristSizeField({
  value,
  onChange,
  compact = false,
}: {
  value: number | null;
  onChange: (cm: number | null) => void;
  compact?: boolean;
}) {
  const showError = useStore((s) => s.showError);
  const [text, setText] = useState(value != null ? String(value) : '');

  // Keep the field in sync if the value is changed elsewhere (e.g. reset).
  useEffect(() => {
    setText(value != null ? String(value) : '');
  }, [value]);

  // While typing, only live-commit valid in-bounds values; don't nag the user
  // mid-entry (e.g. "1" on the way to "16"). Validation happens on commit.
  const handleChange = (raw: string) => {
    setText(raw);
    const n = Number.parseFloat(raw);
    onChange(isInBounds(n) ? n : null);
  };

  // On blur / Enter: an out-of-range value resets to the default and explains.
  const handleCommit = () => {
    const raw = text.trim();
    if (raw === '') {
      onChange(null); // intentionally cleared — no error
      return;
    }
    const n = Number.parseFloat(raw);
    if (!isInBounds(n)) {
      onChange(DEFAULT_WRIST_CM);
      setText(String(DEFAULT_WRIST_CM));
      showError(`Wrist size out of range — must be ${WRIST_MIN_CM}–${WRIST_MAX_CM} cm`);
    }
  };

  const input = (
    <div className="flex items-center gap-1.5">
      <input
        type="number"
        inputMode="decimal"
        min={WRIST_MIN_CM}
        max={WRIST_MAX_CM}
        step={0.5}
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleCommit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur();
        }}
        placeholder="16"
        aria-label="Wrist size in centimetres"
        className={cn(
          'rounded-md border border-border bg-surface text-right font-semibold text-ink outline-none transition-colors focus:border-gold',
          compact ? 'w-12 px-1.5 py-1 text-[13px]' : 'w-16 px-2 py-1 text-[13px]',
        )}
      />
      <span className="text-xs text-muted">cm</span>
    </div>
  );

  // Compact: just the bare input cluster — used inside the mobile wrist-size
  // popover, which supplies its own "Wrist size" label.
  if (compact) {
    return input;
  }

  return (
    <div className="flex items-center justify-between border-b border-bg py-2 text-[13px]">
      <span className="text-muted">Wrist Size</span>
      {input}
    </div>
  );
}

interface FitStatus {
  label: string;
  fillClass: string;
  textClass: string;
}

function getFitStatus(est: number, recMin: number, recMax: number, hasBeads: boolean): FitStatus {
  if (!hasBeads) {
    return { label: 'Add beads to reach your size', fillClass: 'bg-muted', textClass: 'text-muted' };
  }
  if (est < recMin) {
    return {
      label: `${(recMin - est).toFixed(1)} cm to go`,
      fillClass: 'bg-gold',
      textClass: 'text-gold',
    };
  }
  if (est > recMax) {
    return {
      label: `${(est - recMax).toFixed(1)} cm too long — remove some beads`,
      fillClass: 'bg-red-500',
      textClass: 'text-red-600',
    };
  }
  return {
    label: 'Great fit for your wrist ✓',
    fillClass: 'bg-emerald-500',
    textClass: 'text-emerald-600',
  };
}

/** Recommended bracelet length range (cm) for a given wrist size. */
export function recommendedRange(wrist: number): { recMin: number; recMax: number } {
  return { recMin: wrist + BRACELET_EASE_MIN_CM, recMax: wrist + BRACELET_EASE_MAX_CM };
}

/** Fit bar showing how the estimated length matches the recommended range. */
export function FitBar({
  wrist,
  est,
  hasBeads,
  compact = false,
  floatingLabel = false,
}: {
  wrist: number;
  est: number;
  hasBeads: boolean;
  compact?: boolean;
  /** Position the status label absolutely beneath the track so it doesn't add to
   *  the bar's height — lets the track itself be vertically centred against
   *  neighbouring controls (used in the mobile floating control row). */
  floatingLabel?: boolean;
}) {
  const { recMin, recMax } = recommendedRange(wrist);
  // A little headroom past the ideal zone so an over-long bracelet reads as overshoot.
  const scaleMax = recMax + 1.5;

  const pct = (cm: number) => `${Math.max(0, Math.min(1, cm / scaleMax)) * 100}%`;
  const status = getFitStatus(est, recMin, recMax, hasBeads);

  return (
    // For floatingLabel, the root is intentionally NOT a positioning context, so
    // the absolutely-positioned label escapes to the nearest positioned ancestor
    // (the full-width mobile control row) and thus centres on the bowl rather than
    // on this off-centre fit column.
    <div className={cn(compact ? '' : 'mt-2.5')}>
      <div
        className={cn(
          'relative w-full overflow-hidden rounded-full bg-bg',
          compact ? 'h-2' : 'h-2.5',
        )}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={Math.round(scaleMax)}
        aria-valuenow={Number(est.toFixed(1))}
        aria-label="Bracelet length versus recommended fit"
      >
        {/* Ideal "good fit" zone — the target to fill up to. */}
        <div
          className="absolute inset-y-0 bg-emerald-300/45"
          style={{ left: pct(recMin), width: `calc(${pct(recMax)} - ${pct(recMin)})` }}
        />
        {/* Current estimated length. */}
        <div
          className={cn(
            'absolute inset-y-0 left-0 rounded-full transition-all duration-300',
            status.fillClass,
          )}
          style={{ width: pct(est) }}
        />
      </div>
      <div
        className={cn(
          'font-medium',
          floatingLabel
            ? 'pointer-events-none absolute inset-x-0 top-1/2 mt-[6px] text-center text-[11px] leading-tight'
            : compact
              ? 'mt-1 text-[11px] leading-tight'
              : 'mt-1.5 text-[12px]',
          status.textClass,
        )}
      >
        {status.label}
      </div>
    </div>
  );
}

export function BraceletInfo() {
  const { count, lengthCm } = useStore((s) => selectTotals(s));
  const wristSizeCm = useStore((s) => s.wristSizeCm);
  const setWristSize = useStore((s) => s.setWristSize);

  const hasBeads = count > 0;
  const est = hasBeads ? lengthCm : 0;
  const rec = wristSizeCm != null ? recommendedRange(wristSizeCm) : null;

  return (
    <div>
      <SectionTitle>Bracelet Info</SectionTitle>

      <div className="grid gap-2">
        <Row label="Est. Length" value={hasBeads ? `~${lengthCm} cm` : '— cm'} />
        {rec && (
          <Row label="Recommended" value={`${rec.recMin.toFixed(1)} – ${rec.recMax.toFixed(1)} cm`} />
        )}
        {/* On mobile the wrist input + fit bar live in the sticky bowl region
            (see StickyFit), so hide the duplicates here. */}
        <div className="max-[639px]:hidden">
          <WristSizeField value={wristSizeCm} onChange={setWristSize} />
        </div>
      </div>

      <div className="max-[639px]:hidden">
        {wristSizeCm != null ? (
          <FitBar wrist={wristSizeCm} est={est} hasBeads={hasBeads} />
        ) : (
          <p className="mt-2 text-[12px] leading-snug text-muted">
            Enter your wrist size for a personalised recommended length and live fit check.
          </p>
        )}
      </div>
    </div>
  );
}
