import { Share2 } from 'lucide-react';
import { useStore } from '@/store/store';
import { cn } from './ui/cn';

const buttonClass =
  'flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface/90 text-muted shadow-float backdrop-blur transition-colors hover:border-gold hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:text-muted';

/** Floating Preview & Share action. Pinned to the bowl's top-left on desktop and
 *  to the top-right on mobile (where the top-left carries the price/quantity). */
export function CanvasActions() {
  const count = useStore((s) => s.items.length);
  const openShare = useStore((s) => s.openShare);
  const disabled = count === 0;

  return (
    <div className="absolute left-3 top-3 z-30 flex gap-1.5 max-[639px]:left-auto max-[639px]:right-2 max-[639px]:top-2">
      <button
        onClick={openShare}
        disabled={disabled}
        aria-label="Preview & Share"
        title="Preview & Share"
        className={cn(buttonClass)}
      >
        <Share2 size={16} />
      </button>
    </div>
  );
}
