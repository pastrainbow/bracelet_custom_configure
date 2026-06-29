import { useEffect, useRef, useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { TEXTURES, type TextureId } from '@/data/textures';
import { useStore } from '@/store/store';
import { cn } from './ui/cn';

/** Icon button + texture-swatch popover for setting the bowl background. On
 *  desktop it floats at the bowl's top-right (popover opening downward); on mobile
 *  it sits inline in the bottom control row (popover opening upward).
 *
 *  @param direction  which way the popover opens ('down' on desktop, 'up' inline)
 *  @param className   extra classes for the wrapper (e.g. desktop's absolute pin) */
export function BackgroundDropdown({
  direction = 'down',
  className,
}: {
  direction?: 'up' | 'down';
  className?: string;
} = {}) {
  const texture = useStore((s) => s.texture);
  const setTexture = useStore((s) => s.setTexture);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={ref} className={cn('relative z-30 flex-shrink-0', className)}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Set bowl background"
        aria-expanded={open}
        title="Background"
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface/90 text-muted shadow-float backdrop-blur transition-colors hover:border-gold hover:text-ink',
          open && 'border-gold text-ink',
        )}
      >
        <ImageIcon size={16} />
      </button>

      {open && (
        <div
          className={cn(
            'absolute right-0 w-max rounded-xl border border-border bg-surface p-2 shadow-float',
            direction === 'down' ? 'top-11' : 'bottom-11',
          )}
        >
          <div className="mb-1.5 px-1 text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
            Background
          </div>
          <div className="flex gap-1">
            {TEXTURES.map((t) => {
              const active = t.id === texture;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setTexture(t.id as TextureId);
                    setOpen(false);
                  }}
                  className="group flex cursor-pointer flex-col items-center gap-1 rounded-[10px] p-1.5 transition-colors hover:bg-bg"
                >
                  <span
                    className={cn(
                      'h-[38px] w-[38px] rounded-full border-2 shadow-[0_1px_6px_rgba(0,0,0,0.15),inset_-2px_-2px_6px_rgba(0,0,0,0.1)] transition-transform group-hover:scale-105',
                      active ? 'border-accent ring-2 ring-gold' : 'border-transparent',
                    )}
                    style={{ background: t.swatch }}
                  />
                  <span className={cn('text-[10px]', active ? 'font-bold text-ink' : 'font-medium text-muted')}>
                    {t.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
