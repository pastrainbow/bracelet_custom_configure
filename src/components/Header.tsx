import { useState } from 'react';
import { cn } from './ui/cn';

const NAV = ['Design', 'Inspiration', 'Plans', 'My Orders'];

function LogoMark() {
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-white">
        <circle cx="12" cy="12" r="5" />
        <circle cx="12" cy="4" r="2" />
        <circle cx="12" cy="20" r="2" />
        <circle cx="4" cy="12" r="2" />
        <circle cx="20" cy="12" r="2" />
      </svg>
    </div>
  );
}

export function Header({ wristHint = 'Wrist size: 15.5 – 16.5 cm' }: { wristHint?: string }) {
  const [active, setActive] = useState('Design');

  return (
    <header className="z-10 flex h-14 flex-shrink-0 items-center gap-3 border-b border-border bg-surface px-7 max-[639px]:h-12 max-[639px]:px-4">
      <div className="flex items-center gap-2 text-[15px] font-bold tracking-wide">
        <LogoMark />
        <div>
          <div>Stone Studio</div>
          <div className="text-[10px] font-normal uppercase tracking-[0.08em] text-muted">
            Custom Bracelet Builder
          </div>
        </div>
      </div>

      <div className="mx-2 h-6 w-px bg-border max-[639px]:hidden" />

      <nav className="ml-2 flex gap-1 max-[639px]:hidden">
        {NAV.map((item) => (
          <button
            key={item}
            onClick={() => setActive(item)}
            className={cn(
              'rounded-pill px-4 py-1.5 text-[13px] transition-all max-[1024px]:px-2.5 max-[1024px]:text-xs',
              active === item ? 'bg-accent text-white' : 'text-muted hover:bg-border hover:text-ink',
            )}
          >
            {item}
          </button>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-2">
        <div className="rounded-pill border border-border bg-bg px-3 py-1 text-[11px] text-muted max-[1024px]:hidden">
          {wristHint}
        </div>
      </div>
    </header>
  );
}
