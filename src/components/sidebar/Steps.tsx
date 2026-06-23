import { Check } from 'lucide-react';
import { useStore } from '@/store/store';
import { cn } from '../ui/cn';
import { SectionTitle } from '../ui/SectionTitle';

const STEPS = ['Choose your beads', 'Arrange into bracelet', 'Confirm & add to cart'];

export function Steps() {
  const progress = useStore((s) => s.progress);

  return (
    <div>
      <SectionTitle>Progress</SectionTitle>
      <div className="flex flex-col gap-2">
        {STEPS.map((label, i) => {
          const stepNum = i + 1;
          const done = progress >= stepNum;
          const active = progress + 1 === stepNum;
          return (
            <div
              key={label}
              className={cn('flex items-center gap-2.5 text-xs', done ? 'text-ink' : 'text-muted')}
            >
              <span
                className={cn(
                  'flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-full border-[1.5px] text-[11px] font-bold transition-all',
                  done
                    ? 'border-accent bg-accent text-white'
                    : active
                      ? 'border-gold text-gold'
                      : 'border-border',
                )}
              >
                {done ? <Check size={12} strokeWidth={3} /> : stepNum}
              </span>
              {label}
            </div>
          );
        })}
      </div>
    </div>
  );
}
