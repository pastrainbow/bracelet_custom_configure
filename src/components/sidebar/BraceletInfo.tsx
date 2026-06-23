import { MAX_BEADS } from '@/config/constants';
import { selectTotals, useStore } from '@/store/store';
import { SectionTitle } from '../ui/SectionTitle';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-bg py-2 text-[13px] last:border-b-0">
      <span className="text-muted">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

export function BraceletInfo() {
  const { count, lengthCm, maxBeadSize } = useStore((s) => selectTotals(s));

  return (
    <div>
      <SectionTitle>Bracelet Info</SectionTitle>
      <div className="grid gap-2">
        <Row label="Bead Count" value={`${count} / ${MAX_BEADS}`} />
        <Row label="Est. Length" value={count > 0 ? `~${lengthCm} cm` : '— cm'} />
        <Row label="Max Bead Size" value={`${maxBeadSize}mm`} />
        <Row label="Recommended" value="15.5 – 16.5 cm" />
      </div>
    </div>
  );
}
