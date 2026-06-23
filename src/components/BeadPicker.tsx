import { useMemo, useState } from 'react';
import type { SuperCategory } from '@/types';
import { CATALOGUE, SUPERCATS } from '@/data/catalogue';
import { useStore } from '@/store/store';
import { ItemThumb } from './ItemThumb';
import { PillTabs } from './ui/PillTabs';

const SUPER_TABS = [
  { value: 'beads', label: 'Beads' },
  { value: 'accessories', label: 'Accessories' },
];

export function BeadPicker() {
  const addItem = useStore((s) => s.addItem);
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
    <div className="flex-shrink-0 border-t border-border bg-surface px-5 py-3 max-[639px]:px-4 max-[639px]:pb-3.5">
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

      <div className="no-scrollbar flex gap-2.5 overflow-x-auto pb-1">
        {items.map((def) => (
          <button
            key={def.id}
            onClick={() => addItem(def)}
            className="flex min-w-[72px] flex-shrink-0 cursor-pointer flex-col items-center gap-1.5 rounded-xl border-2 border-transparent p-2 transition-all hover:border-border hover:bg-bg max-[639px]:min-w-[60px] max-[639px]:gap-1 max-[639px]:p-1.5"
          >
            <ItemThumb def={def} size={46} />
            <div className="text-center text-[11px] font-medium leading-tight text-ink">{def.name}</div>
            <div className="text-[10px] text-muted">${def.price}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
