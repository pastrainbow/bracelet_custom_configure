import { Loader2, Share2, ShoppingCart } from 'lucide-react';
import { useStore } from '@/store/store';
import { Button } from '../ui/Button';

export function CtaButtons() {
  const count = useStore((s) => s.items.length);
  const cartPending = useStore((s) => s.cartPending);
  const addToCart = useStore((s) => s.addToCart);
  const saveDesign = useStore((s) => s.saveDesign);
  const openShare = useStore((s) => s.openShare);

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="primary"
        onClick={addToCart}
        disabled={count === 0 || cartPending}
        className="w-full py-3.5 max-[639px]:py-3.5"
      >
        {cartPending ? <Loader2 size={16} className="animate-spin" /> : <ShoppingCart size={16} />}
        {cartPending ? 'Adding…' : 'Add to Cart'}
      </Button>
      <Button variant="secondary" onClick={openShare} disabled={count === 0} className="w-full py-3.5">
        <Share2 size={16} />
        Preview &amp; Share
      </Button>
      <Button variant="secondary" onClick={saveDesign} disabled={count === 0} className="w-full py-3.5">
        Save Design
      </Button>
    </div>
  );
}
