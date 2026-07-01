import { useEffect, useRef, useState } from 'react';
import { Loader2, Share2, X } from 'lucide-react';
import { useStore } from '@/store/store';
import {
  drawShareBackground,
  drawShareBrand,
  drawShareWatermark,
} from '@/engine/render/shareCard';
import { cn } from './ui/cn';
import { LogoMark } from './ui/LogoMark';

// Display canvas: the bracelet alone, drawn on transparent so it sits on the app
// background. The shareable image is composed separately at high resolution.
const VIEW = 800;
const CARD_W = 1080;
const CARD_H = 1620;

export function ShareView() {
  const shareOpen = useStore((s) => s.shareOpen);
  const closeShare = useStore((s) => s.closeShare);
  const engine = useStore((s) => s.engine);
  const options = useStore((s) => s.options);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sharing, setSharing] = useState(false);
  // Errors are shown inside this view: the global ErrorToast renders under the
  // z-[1000] overlay, so it would be invisible while sharing.
  const [shareError, setShareError] = useState<string | null>(null);

  const brandName = options.brandName ?? 'Stone Studio';
  const tagline = options.brandTagline ?? 'Undefined nature, undefined you.';

  // Draw the bracelet (no bowl) whenever the view opens.
  useEffect(() => {
    if (!shareOpen) return;
    setShareError(null);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !engine) return;
    ctx.clearRect(0, 0, VIEW, VIEW);
    engine.drawBraceletPortrait(ctx, VIEW / 2, VIEW / 2, VIEW * 0.42);
  }, [shareOpen, engine]);

  // Close on Escape.
  useEffect(() => {
    if (!shareOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeShare();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [shareOpen, closeShare]);

  // Lock page scroll while open so the tall builder page can't scroll behind the
  // view. Pin the body at its current offset (rather than `overflow: hidden`,
  // which resets scroll to 0 on mobile and jumps the page on exit), then restore
  // the exact scroll position on close.
  useEffect(() => {
    if (!shareOpen) return;
    const body = document.body;
    const scrollY = window.scrollY;
    const prev = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
    };
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
    return () => {
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.left = prev.left;
      body.style.right = prev.right;
      body.style.width = prev.width;
      window.scrollTo(0, scrollY);
    };
  }, [shareOpen]);

  const handleShare = async () => {
    if (!engine || sharing) return;
    setSharing(true);
    setShareError(null);
    try {
      // Compose the branded share card off-screen at full resolution.
      const off = document.createElement('canvas');
      off.width = CARD_W;
      off.height = CARD_H;
      const ctx = off.getContext('2d');
      if (!ctx) throw new Error('canvas 2d context unavailable');
      drawShareBackground(ctx, CARD_W, CARD_H);
      drawShareBrand(ctx, CARD_W, brandName, tagline);
      engine.drawBraceletPortrait(ctx, CARD_W / 2, CARD_H * 0.56, CARD_W * 0.33);
      drawShareWatermark(ctx, CARD_W, CARD_H, brandName);

      const blob = await new Promise<Blob | null>((resolve) => off.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('canvas export produced no image');

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
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'my-bracelet.png';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[BraceletConfigurator] share failed', err);
      setShareError('Sharing failed — please try again.');
    } finally {
      setSharing(false);
    }
  };

  return (
    <div
      className={cn(
        'fixed inset-x-0 top-0 z-[1000] flex h-[100dvh] items-center justify-center bg-bg transition-opacity duration-300',
        shareOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
      )}
    >
      {/* Brand — top-left */}
      <div className="absolute left-5 top-5 max-[639px]:left-4 max-[639px]:top-4">
        <div className="flex items-center gap-2.5">
          <LogoMark className="h-9 w-9 max-[639px]:h-8 max-[639px]:w-8" />
          <span className="text-xl font-bold tracking-wide text-ink max-[639px]:text-lg">
            {brandName}
          </span>
        </div>
        <div className="mt-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
          {tagline}
        </div>
        <div className="mt-2 h-0.5 w-12 bg-ink" />
      </div>

      {/* Actions — top-right */}
      <div className="absolute right-5 top-5 flex items-center gap-2 max-[639px]:right-4 max-[639px]:top-4">
        <button
          onClick={handleShare}
          disabled={sharing}
          className="inline-flex items-center gap-2 rounded-full bg-surface px-4 py-2 text-[13px] font-semibold text-ink shadow-panel transition-colors hover:bg-white disabled:opacity-70"
        >
          {sharing ? <Loader2 size={16} className="animate-spin" /> : <Share2 size={16} />}
          Share
        </button>
        <button
          onClick={closeShare}
          aria-label="Close preview"
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-surface text-ink shadow-panel transition-colors hover:bg-white"
        >
          <X size={18} />
        </button>
      </div>

      {shareError && (
        <div
          role="alert"
          className="absolute left-1/2 top-20 -translate-x-1/2 rounded-lg bg-red-600 px-4 py-2 text-[13px] font-medium text-white shadow-float"
        >
          {shareError}
        </div>
      )}

      {/* Bracelet — vertically + horizontally centred in the viewport, zooms in */}
      <canvas
        ref={canvasRef}
        width={VIEW}
        height={VIEW}
        className={cn(
          'h-auto w-auto max-h-[min(90dvh,560px)] max-w-[min(90vw,560px)] transition-transform duration-300 ease-out',
          shareOpen ? 'scale-100' : 'scale-90',
        )}
      />

      {/* Watermark — bottom-centre */}
      <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2 opacity-20">
        <LogoMark className="h-6 w-6" />
        <span className="text-sm font-bold tracking-wide text-ink">{brandName}</span>
      </div>
    </div>
  );
}
