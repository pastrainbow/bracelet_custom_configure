import { Trash2, X } from 'lucide-react';
import type { PlacedItem } from '@/types';
import { isAccessory } from '@/types';
import { BEAD_SIZES } from '@/config/constants';
import { formatPrice, priceFor } from '@/data/pricing';
import { useStore } from '@/store/store';
import { cn } from '../ui/cn';
import { SectionTitle } from '../ui/SectionTitle';

function dotBackground(item: PlacedItem): string {
  if (isAccessory(item.def)) return item.def.color;
  return `radial-gradient(circle at 35% 35%, ${item.def.gradient[0]}, ${item.def.gradient[1]})`;
}

function BeadRow({ item }: { item: PlacedItem }) {
  const selectedId = useStore((s) => s.selectedId);
  const selectItem = useStore((s) => s.selectItem);
  const removeItem = useStore((s) => s.removeItem);
  const resizeItem = useStore((s) => s.resizeItem);

  const selected = item.id === selectedId;
  const canResize = !isAccessory(item.def);

  return (
    <div
      onClick={() => selectItem(selected ? null : item.id)}
      className={cn(
        'cursor-pointer rounded-md border-b border-bg py-1.5 transition-colors',
        selected && '-mx-1.5 bg-gold/10 px-1.5 pb-2',
      )}
    >
      <div className="flex items-center gap-2.5 text-xs">
        <span
          className="h-5 w-5 flex-shrink-0 rounded-full shadow-[inset_-2px_-2px_5px_rgba(0,0,0,0.2)]"
          style={{ background: dotBackground(item) }}
        />
        <span className="flex-1 text-muted">{`${item.def.name} · ${item.size}mm`}</span>
        <span className="text-[11px] text-muted">{formatPrice(priceFor(item.def, item.size))}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            removeItem(item.id);
          }}
          title="Remove"
          className="flex h-5 w-5 items-center justify-center rounded-full text-muted transition-colors hover:bg-red-100 hover:text-red-600"
        >
          <X size={14} />
        </button>
      </div>

      {selected && canResize && (
        <div className="ml-[30px] mt-1.5 flex gap-1">
          {BEAD_SIZES.map((mm) => (
            <button
              key={mm}
              onClick={(e) => {
                e.stopPropagation();
                resizeItem(item.id, mm);
              }}
              className={cn(
                'rounded-[5px] border px-[7px] py-[3px] text-[10px] font-semibold transition-colors',
                item.size === mm
                  ? 'border-accent bg-accent text-white'
                  : 'border-border text-muted hover:border-accent hover:text-accent',
              )}
            >
              {mm}mm
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function BeadList() {
  const items = useStore((s) => s.items);
  const clearAll = useStore((s) => s.clearAll);
  const setAllBeadSize = useStore((s) => s.setAllBeadSize);
  const hasBeads = items.length > 0;

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <SectionTitle>Your Beads</SectionTitle>
        {hasBeads && (
          <div className="flex items-center gap-1.5">
            <select
              value=""
              onChange={(e) => {
                const mm = Number(e.target.value);
                if (mm) setAllBeadSize(mm);
              }}
              aria-label="Set all beads to a size"
              className="cursor-pointer rounded-md border border-border bg-surface px-1.5 py-1 text-[11px] font-medium text-muted outline-none transition-colors hover:border-gold focus:border-gold"
            >
              <option value="" disabled selected hidden>Set All Sizes</option>
              {BEAD_SIZES.map((mm) => (
                <option key={mm} value={mm}>
                  {mm}mm
                </option>
              ))}
            </select>
            <button
              onClick={clearAll}
              className="flex items-center gap-1 rounded-md border border-border px-1.5 py-1 text-[11px] font-medium text-muted transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 size={12} />
              Clear
            </button>
          </div>
        )}
      </div>

      {!hasBeads ? (
        <div className="px-5 py-5 text-center text-[13px] text-muted">
          <div className="mb-2 text-[28px] leading-none">○</div>
          Add beads from the picker below
        </div>
      ) : (
        <div className="flex max-h-[200px] flex-col overflow-y-auto max-[639px]:max-h-40">
          {items.map((item) => (
            <BeadRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
