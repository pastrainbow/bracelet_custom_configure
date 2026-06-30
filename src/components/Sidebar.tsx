import { useStore } from '@/store/store';
import { OrderSummary } from './sidebar/OrderSummary';
import { BraceletInfo } from './sidebar/BraceletInfo';
import { BeadList } from './sidebar/BeadList';
import { Steps } from './sidebar/Steps';
import { CtaButtons } from './sidebar/CtaButtons';
import { cn } from './ui/cn';

function Divider({ className }: { className?: string }) {
  return <hr className={cn('border-t border-border', className)} />;
}

export function Sidebar() {
  const shareOpen = useStore((s) => s.shareOpen);
  const mobilePanel = useStore((s) => s.mobilePanel);
  return (
    <aside
      className={cn(
        'flex flex-col gap-4 overflow-y-auto border-l border-border bg-surface p-5 transition-all duration-300 max-[1024px]:gap-3 max-[1024px]:p-3.5 max-[639px]:min-h-0 max-[639px]:flex-1 max-[639px]:gap-3 max-[639px]:border-l-0 max-[639px]:border-t-0 max-[639px]:p-4 max-[639px]:pb-12',
        shareOpen && 'pointer-events-none translate-x-full opacity-0',
        mobilePanel !== 'order' && 'max-[639px]:hidden',
      )}
    >
      {/* Source order is the desktop layout; on mobile, CSS `order` floats the
          Progress section (Steps) to the top while keeping dividers interleaved.
          Every child gets an explicit mobile order so none fall back to 0. */}
      <div className="max-[639px]:order-[15]">
        <OrderSummary />
      </div>
      <Divider className="max-[639px]:order-[20]" />
      <div className="max-[639px]:order-[25]">
        <BraceletInfo />
      </div>
      <Divider className="max-[639px]:order-[30]" />
      <div className="max-[639px]:order-[35]">
        <BeadList />
      </div>
      <Divider className="max-[639px]:order-[40]" />
      <div className="max-[639px]:order-[5]">
        <Steps />
      </div>
      <Divider className="max-[639px]:order-[10]" />
      <div className="max-[639px]:order-[45]">
        <CtaButtons />
      </div>
    </aside>
  );
}
