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

  const subTabs = useMemo(
    () => SUPERCATS[superCat].map((t) => ({ value: t.cat, label: t.label })),
    [superCat],
  );
  const items = CATALOGUE[category] ?? [];

  const onSuperChange = (value: string) => {
    const next = value as SuperCategory;
    setSuperCat(next);
    setCategory(SUPERCATS[next][0].cat);
  };

  return (
    <div className="flex-shrink-0 border-t border-border bg-surface px-5 py-3 max-[639px]:border-t-0 max-[639px]:px-4 max-[639px]:pb-3.5">
      <div className="mb-2 border-b border-border pb-2">
        <PillTabs tabs={SUPER_TABS} value={superCat} onValueChange={onSuperChange} variant="solid" />
      </div>

      <PillTabs
        tabs={subTabs}
        value={category}
        onValueChange={setCategory}
        variant="soft"
        className="mb-2.5"
      />

      {superCat === 'beads' && <AddSizeSelector />}

      <div className="no-scrollbar grid max-h-[40vh] grid-cols-[repeat(auto-fill,minmax(72px,1fr))] gap-2.5 overflow-y-auto pb-1 max-[639px]:max-h-[34vh] max-[639px]:grid-cols-[repeat(auto-fill,minmax(60px,1fr))]">
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

    </div>
  );
}
