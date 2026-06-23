import { OrderSummary } from './sidebar/OrderSummary';
import { BraceletInfo } from './sidebar/BraceletInfo';
import { SizeSelector } from './sidebar/SizeSelector';
import { TextureSelector } from './sidebar/TextureSelector';
import { BeadList } from './sidebar/BeadList';
import { Steps } from './sidebar/Steps';
import { CtaButtons } from './sidebar/CtaButtons';

function Divider() {
  return <hr className="border-t border-border" />;
}

export function Sidebar() {
  return (
    <aside className="flex flex-col gap-4 overflow-y-auto border-l border-border bg-surface p-5 max-[1024px]:gap-3 max-[1024px]:p-3.5 max-[639px]:gap-3 max-[639px]:border-l-0 max-[639px]:border-t-2 max-[639px]:p-4 max-[639px]:pb-12">
      <OrderSummary />
      <Divider />
      <BraceletInfo />
      <SizeSelector />
      <TextureSelector />
      <Divider />
      <BeadList />
      <Divider />
      <Steps />
      <Divider />
      <CtaButtons />
    </aside>
  );
}
