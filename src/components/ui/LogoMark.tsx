import { cn } from './cn';

/** The brand logo: a dark rounded square with five white dots. Size via className. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center rounded-lg bg-accent', className)}>
      <svg viewBox="0 0 24 24" className="h-[56%] w-[56%] fill-white">
        <circle cx="12" cy="12" r="5" />
        <circle cx="12" cy="4" r="2" />
        <circle cx="12" cy="20" r="2" />
        <circle cx="4" cy="12" r="2" />
        <circle cx="20" cy="12" r="2" />
      </svg>
    </div>
  );
}
