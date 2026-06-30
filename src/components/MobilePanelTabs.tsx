import type { MobilePanel } from '@/store/store';
import { useStore } from '@/store/store';
import { cn } from './ui/cn';

const PANELS: { value: MobilePanel; label: string }[] = [
  { value: 'add', label: 'Add Item' },
  { value: 'order', label: 'Order Info' },
];

/**
 * Section selector shown only on mobile, pinned beneath the bowl, that switches
 * the control column between the bead picker ("Add Item") and the order/info
 * sidebar ("Order Info"). Styled as full-width underline tabs on the control
 * section's own surface so it reads as the head of that section rather than a
 * floating control, while the gold active underline keeps it distinct from the
 * pill tabs inside each subsection.
 */
export function MobilePanelTabs() {
  const mobilePanel = useStore((s) => s.mobilePanel);
  const setMobilePanel = useStore((s) => s.setMobilePanel);

  return (
    <div
      role="tablist"
      aria-label="Control panel"
      className="flex w-full bg-surface"
    >
      {PANELS.map((p) => {
        const active = mobilePanel === p.value;
        return (
          <button
            key={p.value}
            role="tab"
            aria-selected={active}
            onClick={() => setMobilePanel(p.value)}
            className={cn(
              'flex-1 border-b-2 px-3 py-1.5 text-[13px] tracking-tight transition-colors',
              active
                ? 'border-gold font-semibold text-ink'
                : 'border-border font-medium text-muted hover:text-ink',
            )}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}
