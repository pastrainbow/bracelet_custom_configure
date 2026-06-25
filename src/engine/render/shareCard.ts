// ─── SHAREABLE CARD CHROME ───────────────────────────────────────────────────
// Draws the branded card (background, logo/brand, watermark) the bracelet sits
// on. Rendered to a single canvas so the preview is exactly what gets shared.

type Ctx = CanvasRenderingContext2D;

const INK = '#1a1a1a';
const MUTED = '#8a8580';
const ACCENT = '#2d2d2d';

/** The app's logo mark: a dark rounded square with five white dots. */
function drawLogoMark(ctx: Ctx, x: number, y: number, size: number, alpha = 1): void {
  ctx.save();
  ctx.globalAlpha = alpha;

  const r = size * 0.26;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + size, y, x + size, y + size, r);
  ctx.arcTo(x + size, y + size, x, y + size, r);
  ctx.arcTo(x, y + size, x, y, r);
  ctx.arcTo(x, y, x + size, y, r);
  ctx.closePath();
  ctx.fillStyle = ACCENT;
  ctx.fill();

  // Five dots laid out like the 24×24 header SVG.
  const k = size / 24;
  const cx = x + size / 2;
  const cy = y + size / 2;
  ctx.fillStyle = '#fff';
  const dot = (dx: number, dy: number, rad: number) => {
    ctx.beginPath();
    ctx.arc(cx + dx * k, cy + dy * k, rad * k, 0, Math.PI * 2);
    ctx.fill();
  };
  dot(0, 0, 5);
  dot(0, -8, 2);
  dot(0, 8, 2);
  dot(-8, 0, 2);
  dot(8, 0, 2);

  ctx.restore();
}

/** Soft, light card background with a gentle glow behind the bracelet. */
export function drawShareBackground(ctx: Ctx, w: number, h: number): void {
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#fbfaf7');
  bg.addColorStop(1, '#ede9e1');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const glow = ctx.createRadialGradient(w / 2, h * 0.58, 0, w / 2, h * 0.58, w * 0.6);
  glow.addColorStop(0, 'rgba(255,255,255,0.7)');
  glow.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);
}

/** Brand mark, name, tagline and an accent rule in the top-left. */
export function drawShareBrand(ctx: Ctx, w: number, brandName: string, tagline: string): void {
  const pad = Math.round(w * 0.075);
  const logo = Math.round(w * 0.085);
  const logoY = Math.round(w * 0.085);

  drawLogoMark(ctx, pad, logoY, logo);

  ctx.save();
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = INK;
  ctx.font = `700 ${Math.round(w * 0.05)}px -apple-system, system-ui, "Segoe UI", sans-serif`;
  ctx.fillText(brandName, pad + logo + Math.round(w * 0.025), logoY + logo * 0.7);

  ctx.fillStyle = MUTED;
  ctx.font = `600 ${Math.round(w * 0.021)}px -apple-system, system-ui, sans-serif`;
  if ('letterSpacing' in ctx) (ctx as Ctx & { letterSpacing: string }).letterSpacing = '2px';
  const taglineY = logoY + logo + Math.round(w * 0.04);
  ctx.fillText(tagline.toUpperCase(), pad, taglineY);
  if ('letterSpacing' in ctx) (ctx as Ctx & { letterSpacing: string }).letterSpacing = '0px';

  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(2, w * 0.004);
  ctx.beginPath();
  ctx.moveTo(pad, taglineY + Math.round(w * 0.022));
  ctx.lineTo(pad + Math.round(w * 0.12), taglineY + Math.round(w * 0.022));
  ctx.stroke();
  ctx.restore();
}

/** Faint logo + name watermark centred near the bottom. */
export function drawShareWatermark(ctx: Ctx, w: number, h: number, brandName: string): void {
  const size = Math.round(w * 0.045);
  const y = h - Math.round(w * 0.11);

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.globalAlpha = 0.14;
  ctx.font = `700 ${Math.round(w * 0.03)}px -apple-system, system-ui, sans-serif`;
  const textW = ctx.measureText(brandName).width;
  const gap = Math.round(w * 0.02);
  const startX = w / 2 - (size + gap + textW) / 2;

  drawLogoMark(ctx, startX, y - size / 2, size, 0.14);
  ctx.fillStyle = INK;
  ctx.textAlign = 'left';
  ctx.fillText(brandName, startX + size + gap, y + 1);
  ctx.restore();
}
