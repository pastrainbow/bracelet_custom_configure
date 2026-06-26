import { useMemo, useState } from 'react';
import type { SuperCategory } from '@/types';
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

/** Compact size picker — sets the size of beads added from now on. */
function AddSizeSelector() {
  const beadSize = useStore((s) => s.beadSize);
  const setBeadSize = useStore((s) => s.setBeadSize);

  return (
    <div className="mt-2.5 flex items-center gap-2 border-t border-border pt-2.5">
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
    <div className="flex-shrink-0 border-t border-border bg-surface px-5 py-3 max-[639px]:border-t-0 max-[639px]:px-4 max-[639px]:pb-3.5">
      {/* Item name search — sits at the head of the picker, just under the
          Add Item / Order Info selector, and filters across every type in the
          active super-category. */}
      <div className="relative mb-2.5">
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

      <div className="mb-2.5 border-b border-border pb-2.5">
        <PillTabs tabs={SUPER_TABS} value={superCat} onValueChange={onSuperChange} variant="solid" />
      </div>

      <div className="flex gap-3 max-[639px]:gap-2.5">
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

        {/* Right side: size selector (beads only) + the items grid. */}
        <div className="min-w-0 flex-1">
          {superCat === 'beads' && <AddSizeSelector />}

          {items.length > 0 ? (
            <div className="no-scrollbar mt-2.5 grid max-h-[40vh] grid-cols-[repeat(auto-fill,minmax(72px,1fr))] gap-2.5 overflow-y-auto pb-1 max-[639px]:max-h-[34vh] max-[639px]:grid-cols-[repeat(auto-fill,minmax(60px,1fr))]">
              {items.map((def) => (
                <button
                  key={def.id}
                  onClick={() => addItem(def)}
                  className="flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border-2 border-transparent p-2 transition-all hover:border-border hover:bg-bg max-[639px]:gap-1 max-[639px]:p-1.5"
                >
                  <ItemThumb def={def} size={46} />
                  <div className="text-center text-[11px] font-medium leading-tight text-ink">{def.name}</div>
                  <div className="text-[10px] text-muted">{formatPrice(priceFor(def, beadSize))}</div>
                </button>
              ))}
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
