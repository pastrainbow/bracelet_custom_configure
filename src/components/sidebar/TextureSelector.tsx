import { TEXTURES, type TextureId } from '@/data/textures';
import { useStore } from '@/store/store';
import { cn } from '../ui/cn';
import { SectionTitle } from '../ui/SectionTitle';

export function TextureSelector() {
  const texture = useStore((s) => s.texture);
  const setTexture = useStore((s) => s.setTexture);

  return (
    <div>
      <SectionTitle>Background</SectionTitle>
      <div className="flex flex-wrap gap-1">
        {TEXTURES.map((t) => {
          const active = t.id === texture;
          return (
            <button
              key={t.id}
              onClick={() => setTexture(t.id as TextureId)}
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
  );
}
