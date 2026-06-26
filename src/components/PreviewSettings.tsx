import { useState } from 'react';
import { ChevronDown, Settings2 } from 'lucide-react';
import { useStore } from '@/store/store';
import { TextureSelector } from './sidebar/TextureSelector';
import { SectionTitle } from './ui/SectionTitle';
import { cn } from './ui/cn';
import { MAX_ZOOM, MIN_ZOOM } from '@/config/constants';

function ZoomControl() {
  const zoom = useStore((s) => s.zoom);
  const setZoom = useStore((s) => s.setZoom);

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <SectionTitle>Zoom</SectionTitle>
        <span className="text-[11px] font-semibold text-muted">{zoom.toFixed(1)}×</span>
      </div>
      <input
        type="range"
        min={MIN_ZOOM}
        max={MAX_ZOOM}
        step={0.1}
        value={zoom}
        onChange={(e) => setZoom(Number(e.target.value))}
        aria-label="Preview zoom"
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-border accent-accent"
      />
    </div>
  );
}

/** Collapsible panel with bowl background + zoom; sits below the bead picker. */
export function PreviewSettings() {
  const [open, setOpen] = useState(true);

  return (
    <div className="flex-shrink-0 border-t border-border bg-surface">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-5 py-2.5 text-left max-[639px]:px-4"
      >
        <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
          <Settings2 size={13} />
          Preview Settings
        </span>
        <ChevronDown
          size={16}
          className={cn('text-muted transition-transform duration-200', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div className="flex flex-col gap-3 px-5 pb-3.5 max-[639px]:px-4">
          <TextureSelector />
          <ZoomControl />
        </div>
      )}
    </div>
  );
}
