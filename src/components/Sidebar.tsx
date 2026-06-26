import { useStore } from '@/store/store';
import { OrderSummary } from './sidebar/OrderSummary';
import { BraceletInfo } from './sidebar/BraceletInfo';
import { BeadList } from './sidebar/BeadList';
import { Steps } from './sidebar/Steps';
import { CtaButtons } from './sidebar/CtaButtons';
import { cn } from './ui/cn';

function Divider() {
  return <hr className="border-t border-border" />;
}

export function Sidebar() {
  const shareOpen = useStore((s) => s.shareOpen);
  const mobilePanel = useStore((s) => s.mobilePanel);
  return (
    <aside
      className={cn(
        'flex flex-col gap-4 overflow-y-auto border-l border-border bg-surface p-5 transition-all duration-300 max-[1024px]:gap-3 max-[1024px]:p-3.5 max-[639px]:gap-3 max-[639px]:border-l-0 max-[639px]:border-t-0 max-[639px]:p-4 max-[639px]:pb-12',
        shareOpen && 'pointer-events-none translate-x-full opacity-0',
        mobilePanel !== 'order' && 'max-[639px]:hidden',
      )}
    >
      <OrderSummary />
      <Divider />
      <BraceletInfo />
      <Divider />
      <BeadList />
      <Divider />
      <Steps />
      <Divider />
      <CtaButtons />
    </aside>
  );
}
