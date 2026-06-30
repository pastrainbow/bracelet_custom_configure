import type { ReactNode } from 'react';
import { cn } from './cn';

export function SectionTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'mb-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-muted',
        className,
      )}
    >
      {children}
    </div>
  );
}
