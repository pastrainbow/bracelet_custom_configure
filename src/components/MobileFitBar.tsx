import { selectTotals, useStore } from '@/store/store';
import { FitBar } from './sidebar/BraceletInfo';

/** Wrist fit progress bar shown on the bowl's top control line on mobile.
 *  Renders nothing until a wrist size is entered — the prompt to do so already
 *  lives in the wrist-size input (see StickyFit), so there's no placeholder text. */
export function MobileFitBar() {
  const { count, lengthCm } = useStore((s) => selectTotals(s));
  const wristSizeCm = useStore((s) => s.wristSizeCm);

  if (wristSizeCm == null) return null;

  const hasBeads = count > 0;
  const est = hasBeads ? lengthCm : 0;

  return <FitBar wrist={wristSizeCm} est={est} hasBeads={hasBeads} compact floatingLabel />;
}
