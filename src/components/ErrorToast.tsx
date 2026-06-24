import { AlertCircle } from 'lucide-react';
import { useStore } from '@/store/store';

/** Transient error banner shown at the top-centre of the widget. */
export function ErrorToast() {
  const error = useStore((s) => s.error);
  if (!error) return null;

  return (
    <div className="pointer-events-none absolute left-1/2 top-3 z-50 -translate-x-1/2">
      <div
        key={error.id}
        role="alert"
        className="bcfg-toast flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-[13px] font-medium text-white shadow-float"
      >
        <AlertCircle size={15} className="shrink-0" />
        {error.msg}
      </div>
    </div>
  );
}
