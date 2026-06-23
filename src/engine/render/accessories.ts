import type { AccessoryDef, AccessoryShape } from '@/types';
import { darkenHex, lightenHex } from './color';

type Ctx = CanvasRenderingContext2D;
type ShapeFn = (ctx: Ctx, x: number, y: number, r: number, color: string) => void;

function withShadow(ctx: Ctx, blur = 7): void {
  ctx.shadowColor = 'rgba(0,0,0,0.28)';
  ctx.shadowBlur = blur;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 2;
}

const heart: ShapeFn = (ctx, x, y, r, color) => {
  ctx.save();
  ctx.translate(x, y - r * 0.04);
  const s = r * 0.72;
  withShadow(ctx);
  ctx.beginPath();
  ctx.moveTo(0, s * 0.5);
  ctx.bezierCurveTo(-s * 0.05, s * 0.28, -s * 0.82, s * 0.08, -s * 0.92, -s * 0.25);
  ctx.bezierCurveTo(-s * 1.1, -s * 0.72, -s * 0.38, -s * 1.02, 0, -s * 0.4);
  ctx.bezierCurveTo(s * 0.38, -s * 1.02, s * 1.1, -s * 0.72, s * 0.92, -s * 0.25);
  ctx.bezierCurveTo(s * 0.82, s * 0.08, s * 0.05, s * 0.28, 0, s * 0.5);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = 'rgba(255,255,255,0.38)';
  ctx.beginPath();
  ctx.ellipse(-s * 0.3, -s * 0.44, s * 0.28, s * 0.16, -0.45, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

const star: ShapeFn = (ctx, x, y, r, color) => {
  ctx.save();
  const outer = r * 0.85;
  const inner = r * 0.36;
  withShadow(ctx);
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? outer : inner;
    const a = (i * Math.PI) / 5 - Math.PI / 2;
    const px = x + rad * Math.cos(a);
    const py = y + rad * Math.sin(a);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = 'rgba(255,255,255,0.38)';
  ctx.beginPath();
  ctx.ellipse(x - r * 0.18, y - r * 0.3, r * 0.2, r * 0.12, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

const moon: ShapeFn = (ctx, x, y, r, color) => {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r * 0.88, 0, Math.PI * 2);
  ctx.clip();
  withShadow(ctx);
  ctx.beginPath();
  ctx.arc(x, y, r * 0.82, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(x + r * 0.36, y - r * 0.06, r * 0.68, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.ellipse(x - r * 0.36, y - r * 0.3, r * 0.16, r * 0.1, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

const butterfly: ShapeFn = (ctx, x, y, r, color) => {
  ctx.save();
  withShadow(ctx);
  const w = r * 0.76;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x - w * 0.44, y - w * 0.24, w * 0.52, w * 0.4, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x + w * 0.44, y - w * 0.24, w * 0.52, w * 0.4, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x - w * 0.38, y + w * 0.28, w * 0.38, w * 0.3, 0.32, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x + w * 0.38, y + w * 0.28, w * 0.38, w * 0.3, -0.32, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = 'rgba(255,255,255,0.24)';
  ctx.beginPath();
  ctx.ellipse(x - w * 0.42, y - w * 0.24, w * 0.28, w * 0.2, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x + w * 0.42, y - w * 0.24, w * 0.28, w * 0.2, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x, y, w * 0.1, w * 0.54, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#3a2a1a';
  ctx.fill();
  ctx.restore();
};

const flower: ShapeFn = (ctx, x, y, r, color) => {
  ctx.save();
  withShadow(ctx);
  const pr = r * 0.38;
  const pd = r * 0.35;
  ctx.fillStyle = color;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * pd, y + Math.sin(a) * pd, pr, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowColor = 'transparent';
  ctx.beginPath();
  ctx.arc(x, y, r * 0.28, 0, Math.PI * 2);
  ctx.fillStyle = '#ffe066';
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath();
  ctx.arc(x - r * 0.07, y - r * 0.08, r * 0.09, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

const infinity: ShapeFn = (ctx, x, y, r, color) => {
  ctx.save();
  withShadow(ctx);
  const w = r * 0.78;
  const h = r * 0.4;
  const lw = r * 0.2;
  ctx.lineWidth = lw;
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.bezierCurveTo(x - w * 0.1, y - h, x - w, y - h, x - w, y);
  ctx.bezierCurveTo(x - w, y + h, x - w * 0.1, y + h, x, y);
  ctx.bezierCurveTo(x + w * 0.1, y - h, x + w, y - h, x + w, y);
  ctx.bezierCurveTo(x + w, y + h, x + w * 0.1, y + h, x, y);
  ctx.stroke();
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = lw * 0.38;
  ctx.beginPath();
  ctx.arc(x - w * 0.64, y - h * 0.4, h * 0.36, Math.PI * 0.8, Math.PI * 1.6);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x + w * 0.64, y - h * 0.4, h * 0.36, Math.PI * 0.8, Math.PI * 1.6);
  ctx.stroke();
  ctx.restore();
};

const flatDisc: ShapeFn = (ctx, x, y, r, color) => {
  ctx.save();
  const w = r * 0.86;
  const h = r * 0.28;
  withShadow(ctx, 5);
  const grad = ctx.createLinearGradient(x, y - h, x, y + h);
  grad.addColorStop(0, lightenHex(color, 0.32));
  grad.addColorStop(0.5, color);
  grad.addColorStop(1, darkenHex(color, 0.22));
  ctx.beginPath();
  ctx.ellipse(x, y, w, h, 0, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.beginPath();
  ctx.ellipse(x, y - h * 0.38, w * 0.68, h * 0.28, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.42)';
  ctx.fill();
  ctx.restore();
};

const rondelle: ShapeFn = (ctx, x, y, r, color) => {
  ctx.save();
  const w = r * 0.86;
  const h = r * 0.42;
  withShadow(ctx, 5);
  const grad = ctx.createLinearGradient(x, y - h, x, y + h);
  grad.addColorStop(0, lightenHex(color, 0.38));
  grad.addColorStop(0.42, color);
  grad.addColorStop(1, darkenHex(color, 0.25));
  ctx.beginPath();
  ctx.ellipse(x, y, w, h, 0, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = 'rgba(255,255,255,0.28)';
  ctx.lineWidth = 0.9;
  for (let i = 1; i < 10; i++) {
    const fx = x - w + (i * 2 * w) / 10;
    const lineH = Math.sqrt(Math.max(0, 1 - Math.pow((fx - x) / w, 2))) * h;
    ctx.beginPath();
    ctx.moveTo(fx, y - lineH);
    ctx.lineTo(fx, y + lineH);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.ellipse(x, y - h * 0.38, w * 0.64, h * 0.22, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fill();
  ctx.restore();
};

const coin: ShapeFn = (ctx, x, y, r, color) => {
  ctx.save();
  withShadow(ctx);
  ctx.beginPath();
  ctx.arc(x, y, r * 0.86, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.beginPath();
  ctx.arc(x, y, r * 0.86, 0, Math.PI * 2);
  ctx.strokeStyle = darkenHex(color, 0.18);
  ctx.lineWidth = r * 0.1;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, r * 0.58, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  const os = r * 0.36;
  const is = r * 0.16;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? os : is;
    const a = (i * Math.PI) / 5 - Math.PI / 2;
    const px = x + rad * Math.cos(a);
    const py = y + rad * Math.sin(a);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x - r * 0.22, y - r * 0.26, r * 0.28, r * 0.16, -0.5, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.36)';
  ctx.fill();
  ctx.restore();
};

const evilEye: ShapeFn = (ctx, x, y, r, color) => {
  ctx.save();
  const s = r * 0.86;
  withShadow(ctx);
  ctx.beginPath();
  ctx.arc(x, y, s, 0, Math.PI * 2);
  ctx.fillStyle = '#f0f8ff';
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.beginPath();
  ctx.arc(x, y, s * 0.76, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y, s * 0.5, 0, Math.PI * 2);
  ctx.fillStyle = '#e3f2fd';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y, s * 0.3, 0, Math.PI * 2);
  ctx.fillStyle = '#0d1b3e';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x - s * 0.1, y - s * 0.12, s * 0.1, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fill();
  ctx.restore();
};

const hexagon: ShapeFn = (ctx, x, y, r, color) => {
  ctx.save();
  withShadow(ctx);
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3 - Math.PI / 6;
    const px = x + r * 0.86 * Math.cos(a);
    const py = y + r * 0.86 * Math.sin(a);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3 - Math.PI / 6;
    const px = x + r * 0.56 * Math.cos(a);
    const py = y + r * 0.56 * Math.sin(a);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.strokeStyle = 'rgba(255,255,255,0.28)';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.32)';
  ctx.beginPath();
  ctx.ellipse(x - r * 0.2, y - r * 0.24, r * 0.24, r * 0.14, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

const cross: ShapeFn = (ctx, x, y, r, color) => {
  ctx.save();
  const arm = r * 0.24;
  const len = r * 0.8;
  withShadow(ctx);
  ctx.beginPath();
  ctx.moveTo(x - arm, y - len);
  ctx.lineTo(x + arm, y - len);
  ctx.lineTo(x + arm, y - arm);
  ctx.lineTo(x + len, y - arm);
  ctx.lineTo(x + len, y + arm);
  ctx.lineTo(x + arm, y + arm);
  ctx.lineTo(x + arm, y + len);
  ctx.lineTo(x - arm, y + len);
  ctx.lineTo(x - arm, y + arm);
  ctx.lineTo(x - len, y + arm);
  ctx.lineTo(x - len, y - arm);
  ctx.lineTo(x - arm, y - arm);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = 'rgba(255,255,255,0.32)';
  ctx.beginPath();
  ctx.ellipse(x - arm * 0.3, y - len * 0.52, arm * 0.7, arm * 0.38, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

const SHAPES: Record<AccessoryShape, ShapeFn> = {
  heart,
  star,
  moon,
  butterfly,
  flower,
  infinity,
  'flat-disc': flatDisc,
  rondelle,
  coin,
  'evil-eye': evilEye,
  hexagon,
  cross,
};

/** Draw an accessory at (x, y), rotated by `angle`, centred on the origin. */
export function drawAccessory(
  ctx: Ctx,
  x: number,
  y: number,
  r: number,
  def: AccessoryDef,
  angle = 0,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  SHAPES[def.shape](ctx, 0, 0, r, def.color);
  ctx.restore();
}
