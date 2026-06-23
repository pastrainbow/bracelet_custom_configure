import type { ReactNode } from 'react';
import { cn } from './cn';

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-xl border border-border bg-bg px-2 py-0.5 text-[11px] text-muted',
        className,
      )}
    >
      {children}
    </span>
  );
}
