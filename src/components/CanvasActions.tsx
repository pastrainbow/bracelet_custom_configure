import { Share2 } from 'lucide-react';
import { useStore } from '@/store/store';
import { cn } from './ui/cn';

const buttonClass =
  'flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface/90 text-muted shadow-float backdrop-blur transition-colors hover:border-gold hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:text-muted';

/** Preview & Share action. On desktop it's a floating button pinned to the bowl's
 *  top-left (default). On mobile pass `inline` to render it as a plain flex item
 *  inside the floating control row (see Studio), which carries the price on the
 *  left and the wrist-fit bar in the middle. */
export function CanvasActions({ inline = false }: { inline?: boolean }) {
  const count = useStore((s) => s.items.length);
  const openShare = useStore((s) => s.openShare);
  const disabled = count === 0;

  return (
    <div
      className={cn(
        inline ? 'flex flex-shrink-0' : 'absolute left-3 top-3 z-30 flex gap-1.5 max-[639px]:hidden',
      )}
    >
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
