import { useEffect, useRef, useState } from 'react';
import { Loader2, Share2, X } from 'lucide-react';
import { useStore } from '@/store/store';
import {
  drawShareBackground,
  drawShareBrand,
  drawShareWatermark,
} from '@/engine/render/shareCard';

// Fixed, high-resolution share artifact. The same canvas is shown (scaled) and
// exported, so the preview is exactly what gets shared.
const CARD_W = 1080;
const CARD_H = 1620;

export function ShareView() {
  const shareOpen = useStore((s) => s.shareOpen);
  const closeShare = useStore((s) => s.closeShare);
  const engine = useStore((s) => s.engine);
  const options = useStore((s) => s.options);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sharing, setSharing] = useState(false);

  const brandName = options.brandName ?? 'Stone Studio';
  const tagline = options.brandTagline ?? 'Undefined nature, undefined you.';

  // Render the branded card whenever the view opens.
  useEffect(() => {
    if (!shareOpen) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !engine) return;

    ctx.clearRect(0, 0, CARD_W, CARD_H);
    drawShareBackground(ctx, CARD_W, CARD_H);
    drawShareBrand(ctx, CARD_W, brandName, tagline);
    engine.drawBraceletPortrait(ctx, CARD_W / 2, CARD_H * 0.56, CARD_W * 0.33);
    drawShareWatermark(ctx, CARD_W, CARD_H, brandName);
  }, [shareOpen, engine, brandName, tagline]);

  // Close on Escape.
  useEffect(() => {
    if (!shareOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeShare();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [shareOpen, closeShare]);

  if (!shareOpen) return null;

  const handleShare = async () => {
    const canvas = canvasRef.current;
    if (!canvas || sharing) return;
    setSharing(true);
    try {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) return;

      if (options.onShare) {
        await options.onShare(blob);
        return;
      }

      const file = new File([blob], 'my-bracelet.png', { type: 'image/png' });
      const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
      if (nav.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: brandName });
        } catch {
          /* user cancelled the share sheet */
        }
      } else {
        // Desktop fallback: download the image.
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'my-bracelet.png';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={CARD_W}
          height={CARD_H}
          className="block max-h-[94vh] max-w-full rounded-2xl shadow-float"
        />

        <button
          onClick={closeShare}
          aria-label="Close preview"
          className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-ink shadow-panel backdrop-blur transition-colors hover:bg-white"
        >
          <X size={18} />
        </button>

        <button
          onClick={handleShare}
          disabled={sharing}
          className="absolute right-3 top-3 inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-[13px] font-semibold text-ink shadow-panel backdrop-blur transition-colors hover:bg-white disabled:opacity-70"
        >
          {sharing ? <Loader2 size={16} className="animate-spin" /> : <Share2 size={16} />}
          Share
        </button>
      </div>
    </div>
  );
}
