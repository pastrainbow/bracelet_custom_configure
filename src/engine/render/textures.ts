import type { TextureId } from '@/data/textures';

// ─── BOWL BACKGROUND TEXTURES ────────────────────────────────────────────────
// Each draws a filled circle of radius `r` at (cx, cy) on the given context.

type Ctx = CanvasRenderingContext2D;

function textureDefault(ctx: Ctx, cx: number, cy: number, r: number): void {
  const g = ctx.createRadialGradient(cx * 0.8, cy * 0.7, 0, cx, cy, r * 1.1);
  g.addColorStop(0, '#faf9f6');
  g.addColorStop(1, '#eae6de');
  fillCircle(ctx, cx, cy, r, g);
}

function textureWood(ctx: Ctx, cx: number, cy: number, r: number): void {
  const g = ctx.createRadialGradient(cx - r * 0.25, cy - r * 0.2, 0, cx, cy, r * 1.15);
  g.addColorStop(0, '#cd8c4e');
  g.addColorStop(0.5, '#9c5a24');
  g.addColorStop(1, '#5e3010');
  fillCircle(ctx, cx, cy, r, g);

  ctx.save();
  for (let i = 1; i < 20; i++) {
    const rr = (i / 20) * r;
    const ox = Math.sin(i * 1.1) * 7;
    const oy = Math.cos(i * 0.8) * 4;
    ctx.beginPath();
    ctx.ellipse(cx + ox, cy + oy, rr * 1.03, rr * 0.97, 0.08, 0, Math.PI * 2);
    ctx.strokeStyle = i % 4 === 0 ? 'rgba(50,20,4,0.25)' : 'rgba(170,100,38,0.12)';
    ctx.lineWidth = i % 4 === 0 ? 1.8 : 1.1;
    ctx.stroke();
  }
  ctx.restore();

  const shine = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.35, 0, cx - r * 0.1, cy - r * 0.1, r * 0.7);
  shine.addColorStop(0, 'rgba(255,210,150,0.22)');
  shine.addColorStop(1, 'rgba(255,210,150,0)');
  fillCircle(ctx, cx, cy, r, shine);
}

function textureJade(ctx: Ctx, cx: number, cy: number, r: number): void {
  const g = ctx.createRadialGradient(cx - r * 0.2, cy - r * 0.25, 0, cx, cy, r * 1.1);
  g.addColorStop(0, '#5aab78');
  g.addColorStop(0.45, '#2d7a4c');
  g.addColorStop(1, '#154828');
  fillCircle(ctx, cx, cy, r, g);

  ctx.save();
  const veins = [
    [cx - r, cy - r * 0.4, cx - r * 0.2, cy - r * 0.7, cx + r * 0.15, cy - r * 0.1, cx + r, cy + r * 0.3],
    [cx - r * 0.6, cy + r * 0.7, cx, cy + r * 0.1, cx + r * 0.35, cy - r * 0.2, cx + r * 0.9, cy - r * 0.5],
    [cx + r * 0.2, cy - r, cx + r * 0.6, cy - r * 0.3, cx - r * 0.3, cy + r * 0.25, cx - r * 0.2, cy + r * 0.9],
  ];
  for (const v of veins) {
    ctx.beginPath();
    ctx.moveTo(v[0], v[1]);
    ctx.bezierCurveTo(v[2], v[3], v[4], v[5], v[6], v[7]);
    ctx.strokeStyle = 'rgba(190,255,215,0.2)';
    ctx.lineWidth = r * 0.045;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(230,255,240,0.3)';
    ctx.lineWidth = r * 0.012;
    ctx.stroke();
  }
  ctx.restore();

  const shine = ctx.createRadialGradient(cx - r * 0.2, cy - r * 0.3, 0, cx, cy, r * 0.9);
  shine.addColorStop(0, 'rgba(140,255,180,0.2)');
  shine.addColorStop(1, 'rgba(0,0,0,0)');
  fillCircle(ctx, cx, cy, r, shine);
}

function textureCrystal(ctx: Ctx, cx: number, cy: number, r: number): void {
  const g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.35, 0, cx, cy, r * 1.1);
  g.addColorStop(0, '#eef8ff');
  g.addColorStop(0.4, '#b4d8f0');
  g.addColorStop(1, '#68aed4');
  fillCircle(ctx, cx, cy, r, g);

  ctx.save();
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * r * 1.1, cy + Math.sin(a) * r * 1.1);
    ctx.strokeStyle = i % 3 === 0 ? 'rgba(255,255,255,0.22)' : 'rgba(180,220,245,0.14)';
    ctx.lineWidth = 0.9;
    ctx.stroke();
  }
  for (const frac of [0.38, 0.62, 0.84]) {
    ctx.beginPath();
    ctx.arc(cx, cy, r * frac, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(200,235,255,0.18)';
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }
  ctx.restore();

  const shine = ctx.createRadialGradient(cx - r * 0.28, cy - r * 0.32, 0, cx - r * 0.08, cy - r * 0.12, r * 0.68);
  shine.addColorStop(0, 'rgba(255,255,255,0.55)');
  shine.addColorStop(0.35, 'rgba(255,255,255,0.18)');
  shine.addColorStop(1, 'rgba(255,255,255,0)');
  fillCircle(ctx, cx, cy, r, shine);
}

function textureMarble(ctx: Ctx, cx: number, cy: number, r: number): void {
  const g = ctx.createRadialGradient(cx - r * 0.15, cy - r * 0.2, 0, cx, cy, r * 1.1);
  g.addColorStop(0, '#f8f7f4');
  g.addColorStop(0.55, '#e6e2dc');
  g.addColorStop(1, '#ccc8c0');
  fillCircle(ctx, cx, cy, r, g);

  ctx.save();
  const veins = [
    [cx - r, cy - r * 0.25, cx - r * 0.25, cy - r * 0.7, cx + r * 0.2, cy - r * 0.15, cx + r, cy + r * 0.15],
    [cx - r * 0.7, cy + r * 0.65, cx - r * 0.2, cy + r * 0.2, cx + r * 0.25, cy - r * 0.15, cx + r * 0.7, cy - r * 0.55],
    [cx + r * 0.3, cy - r, cx + r * 0.65, cy - r * 0.2, cx + r * 0.1, cy + r * 0.35, cx - r * 0.1, cy + r * 0.85],
  ];
  veins.forEach((v, idx) => {
    ctx.beginPath();
    ctx.moveTo(v[0], v[1]);
    ctx.bezierCurveTo(v[2], v[3], v[4], v[5], v[6], v[7]);
    ctx.strokeStyle = idx === 0 ? 'rgba(90,85,78,0.2)' : 'rgba(110,105,98,0.15)';
    ctx.lineWidth = idx === 0 ? r * 0.04 : r * 0.025;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(60,55,50,0.1)';
    ctx.lineWidth = r * 0.008;
    ctx.stroke();
  });
  ctx.restore();
}

function fillCircle(ctx: Ctx, cx: number, cy: number, r: number, fill: string | CanvasGradient): void {
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
}

/** Draw the bowl plate with the selected texture, plus rim stroke and vignette. */
export function drawPlate(ctx: Ctx, cx: number, cy: number, r: number, texture: TextureId): void {
  switch (texture) {
    case 'wood':
      textureWood(ctx, cx, cy, r);
      break;
    case 'jade':
      textureJade(ctx, cx, cy, r);
      break;
    case 'crystal':
      textureCrystal(ctx, cx, cy, r);
      break;
    case 'marble':
      textureMarble(ctx, cx, cy, r);
      break;
    default:
      textureDefault(ctx, cx, cy, r);
      break;
  }

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(0,0,0,0.06)';
  ctx.lineWidth = 2;
  ctx.stroke();

  const vignette = ctx.createRadialGradient(cx, cy, r * 0.7, cx, cy, r);
  vignette.addColorStop(0, 'transparent');
  vignette.addColorStop(1, 'rgba(0,0,0,0.06)');
  fillCircle(ctx, cx, cy, r, vignette);
}
