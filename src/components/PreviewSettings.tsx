import { useState } from 'react';
import { ChevronDown, Settings2 } from 'lucide-react';
import { TextureSelector } from './sidebar/TextureSelector';
import { cn } from './ui/cn';

/** Collapsible panel with bowl background; sits below the bead picker.
 *  Collapsed by default so the bowl gets the vertical space (these are secondary
 *  controls); expanding it scrolls within the capped controls area. */
export function PreviewSettings() {
  const [open, setOpen] = useState(false);

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
        </div>
      )}
    </div>
  );
}
