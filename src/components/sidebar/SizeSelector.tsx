import { BEAD_SIZES } from '@/config/constants';
import { useStore } from '@/store/store';
import { cn } from '../ui/cn';
import { SectionTitle } from '../ui/SectionTitle';

export function SizeSelector() {
  const beadSize = useStore((s) => s.beadSize);
  const setBeadSize = useStore((s) => s.setBeadSize);

  return (
    <div>
      <SectionTitle>Beads Size</SectionTitle>
      <div className="mt-1 grid grid-cols-4 gap-1.5">
        {BEAD_SIZES.map((mm) => (
          <button
            key={mm}
            onClick={() => setBeadSize(mm)}
            className={cn(
              'rounded-lg border-[1.5px] py-1.5 text-xs font-medium transition-all',
              beadSize === mm
                ? 'border-accent bg-accent text-white'
                : 'border-border text-ink hover:border-gold hover:text-gold',
            )}
          >
            {mm}mm
          </button>
        ))}
      </div>
    </div>
  );
}
