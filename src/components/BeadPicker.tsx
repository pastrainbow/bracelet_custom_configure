import { useMemo, useState } from 'react';
import type { SuperCategory } from '@/types';
import { isSizeAvailable } from '@/types';
import { BEAD_SIZES } from '@/config/constants';
import { CATALOGUE, SUPERCATS } from '@/data/catalogue';
import { formatPrice, priceFor } from '@/data/pricing';
import { useStore } from '@/store/store';
import { ItemThumb } from './ItemThumb';
import { PillTabs } from './ui/PillTabs';
import { cn } from './ui/cn';

const SUPER_TABS = [
  { value: 'beads', label: 'Beads' },
  { value: 'accessories', label: 'Accessories' },
];

/**
 * Size picker — sets the size of beads added from now on. The `compact` variant
 * drops the "Bead size" label and the "mm" suffixes so it can sit beside the
 * search bar on mobile while staying one-tap (no expand step); the full variant
 * is used above the grid on desktop.
 */
function AddSizeSelector({ compact = false, className }: { compact?: boolean; className?: string }) {
  const beadSize = useStore((s) => s.beadSize);
  const setBeadSize = useStore((s) => s.setBeadSize);

  if (compact) {
    return (
      <div className={cn('flex flex-shrink-0 items-center gap-1', className)} aria-label="Bead size">
        {BEAD_SIZES.map((mm) => (
          <button
            key={mm}
            onClick={() => setBeadSize(mm)}
            aria-pressed={beadSize === mm}
            title={`${mm}mm`}
            className={cn(
              'rounded-md border px-2 py-2 text-[11px] font-semibold leading-none transition-colors',
              beadSize === mm
                ? 'border-accent bg-accent text-white'
                : 'border-border text-muted hover:border-gold hover:text-gold',
            )}
          >
            {mm}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('mt-1 flex items-center gap-2', className)}>
      <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
        Bead size
      </span>
      <div className="flex gap-1">
        {BEAD_SIZES.map((mm) => (
          <button
            key={mm}
            onClick={() => setBeadSize(mm)}
            className={cn(
              'rounded-md border px-2 py-1 text-[11px] font-semibold transition-colors',
              beadSize === mm
                ? 'border-accent bg-accent text-white'
                : 'border-border text-muted hover:border-gold hover:text-gold',
            )}
          >
            {mm}mm
          </button>
        ))}
      </div>
    </div>
  );
}

export function BeadPicker() {
  const addItem = useStore((s) => s.addItem);
  const beadSize = useStore((s) => s.beadSize);
  const [superCat, setSuperCat] = useState<SuperCategory>('beads');
  const [category, setCategory] = useState<string>(SUPERCATS.beads[0].cat);
  const [query, setQuery] = useState('');

  const subTabs = SUPERCATS[superCat];
  const trimmed = query.trim().toLowerCase();

  // Every item under the active super-category, used to search across all of its
  // type categories at once. When the search box is empty we fall back to just
  // the selected type's items.
  const items = useMemo(() => {
    if (!trimmed) return CATALOGUE[category] ?? [];
    return SUPERCATS[superCat]
      .flatMap((t) => CATALOGUE[t.cat] ?? [])
      .filter((def) => def.name.toLowerCase().includes(trimmed));
  }, [trimmed, category, superCat]);

  const onSuperChange = (value: string) => {
    const next = value as SuperCategory;
    setSuperCat(next);
    setCategory(SUPERCATS[next][0].cat);
    setQuery('');
  };

  return (
    <div className="flex-shrink-0 border-t border-border bg-surface px-5 py-3 max-[639px]:flex max-[639px]:min-h-0 max-[639px]:flex-1 max-[639px]:flex-col max-[639px]:overflow-hidden max-[639px]:border-t-0 max-[639px]:px-4 max-[639px]:pb-3.5">
      {/* Item name search — sits at the head of the picker, just under the
          Add Item / Order Info selector, and filters across every type in the
          active super-category. Pinned on mobile (flex-shrink-0) so it never
          scrolls away with the items. */}
      <div className="mb-2.5 max-[639px]:mb-1.5 max-[639px]:flex max-[639px]:flex-shrink-0 max-[639px]:items-center max-[639px]:gap-2">
        <div className="relative max-[639px]:min-w-0 max-[639px]:flex-1">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search items by name…"
            aria-label="Search items by name"
            className="w-full rounded-lg border border-border bg-bg py-2 pl-9 pr-8 text-[13px] text-ink placeholder:text-muted focus:border-accent focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-muted transition-colors hover:bg-border hover:text-ink"
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
        {/* Beads-only size selector beside the search bar on mobile; the full
            labelled selector above the grid is hidden on mobile to avoid a
            duplicate (see below). */}
        {superCat === 'beads' && <AddSizeSelector compact className="min-[640px]:hidden" />}
      </div>

      <div className="mb-2.5 border-b border-border pb-2.5 max-[639px]:mb-1 max-[639px]:pb-1.5 max-[639px]:flex-shrink-0">
        <PillTabs tabs={SUPER_TABS} value={superCat} onValueChange={onSuperChange} variant="solid" />
      </div>

      <div className="flex gap-3 max-[639px]:min-h-0 max-[639px]:flex-1 max-[639px]:gap-2.5">
        {/* Type selector as a vertical column down the left edge of the section.
            A snug fixed width keeps single words on one line (e.g. "Pendants")
            while letting multi-word labels wrap (e.g. "Natural Stone"). */}
        <div className="flex w-[88px] flex-shrink-0 flex-col gap-1 max-[639px]:w-[76px]">
          {subTabs.map((t) => {
            const active = !trimmed && category === t.cat;
            return (
              <button
                key={t.cat}
                onClick={() => {
                  setCategory(t.cat);
                  setQuery('');
                }}
                className={cn(
                  'rounded-lg px-3 py-2 text-left text-xs font-semibold tracking-tight transition-colors max-[639px]:px-2.5 max-[639px]:text-[11px]',
                  active
                    ? 'bg-accent text-white'
                    : 'text-muted hover:bg-bg hover:text-ink',
                )}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Right side: size selector (beads only) + the items grid. On mobile a
            flex column whose only scrolling child is the grid below. */}
        <div className="min-w-0 flex-1 max-[639px]:flex max-[639px]:min-h-0 max-[639px]:flex-col">
          {superCat === 'beads' && <AddSizeSelector className="max-[639px]:hidden" />}

          {items.length > 0 ? (
            <div className="no-scrollbar mt-2.5 grid max-h-[40vh] grid-cols-[repeat(auto-fill,minmax(72px,1fr))] content-start gap-2.5 overflow-y-auto pb-1 max-[639px]:max-h-none max-[639px]:min-h-0 max-[639px]:flex-1 max-[639px]:grid-cols-[repeat(auto-fill,minmax(60px,1fr))]">
              {items.map((def) => {
                // Beads stocked only in some diameters can't be added at the
                // currently selected size — grey them out and block adding.
                const available = isSizeAvailable(def, beadSize);
                return (
                  <button
                    key={def.id}
                    onClick={() => available && addItem(def)}
                    disabled={!available}
                    aria-disabled={!available}
                    title={available ? undefined : `Not available in ${beadSize}mm`}
                    className={cn(
                      'flex flex-col items-center gap-1.5 rounded-xl border-2 border-transparent p-2 transition-all max-[639px]:gap-1 max-[639px]:p-1.5',
                      available
                        ? 'cursor-pointer hover:border-border hover:bg-bg'
                        : 'cursor-not-allowed',
                    )}
                  >
                    <div className={cn(!available && 'opacity-40 grayscale')}>
                      <ItemThumb def={def} size={46} />
                    </div>
                    <div
                      className={cn(
                        'w-full text-center text-[11px] font-medium leading-tight',
                        available ? 'text-ink' : 'text-muted',
                      )}
                    >
                      {def.name}
                    </div>
                    {available ? (
                      <div className="text-[10px] text-muted">{formatPrice(priceFor(def, beadSize))}</div>
                    ) : (
                      // Constrain to the card (w-full) with a font small enough to
                      // stay on one line even in the narrowest grid cell (the mobile
                      // grid bottoms out near a 60px card → ~44px of text room, and
                      // "UNAVAILABLE" is ~42px here); overflow-wrap is a last-resort
                      // guard so it breaks rather than clipping the section edge.
                      <div className="w-full text-center text-[6.5px] font-semibold uppercase leading-tight text-muted [overflow-wrap:anywhere]">
                        Unavailable
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="mt-2.5 py-6 text-center text-[13px] text-muted">
              No items match “{query.trim()}”.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
