import { WHEEL_INNER, WHEEL_OUTER, WHEEL_SIZES } from '@/config/constants';

type Ctx = CanvasRenderingContext2D;

/** Glowing ring drawn around the currently selected bead. */
export function drawSelectionRing(ctx: Ctx, x: number, y: number, r: number): void {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r + 4, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 2.5;
  ctx.shadowColor = 'rgba(100,140,255,0.55)';
  ctx.shadowBlur = 10;
  ctx.stroke();
  ctx.restore();
}

/** Faint thread the bracelet beads are strung onto. */
export function drawBraceletThread(ctx: Ctx, cx: number, cy: number, radius: number): void {
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(180,160,130,0.55)';
  ctx.lineWidth = 2;
  ctx.stroke();
}

export function drawWatermark(ctx: Ctx, cx: number, cy: number): void {
  ctx.save();
  ctx.globalAlpha = 0.06;
  ctx.font = 'bold 13px sans-serif';
  ctx.fillStyle = '#000';
  ctx.textAlign = 'center';
  ctx.fillText('STONE STUDIO', cx, cy + 4);
  ctx.restore();
}

/** Red "drop to delete" badge shown over a bead dragged outside the bowl. */
export function drawTrashOverlay(ctx: Ctx, x: number, y: number, r: number): void {
  ctx.save();

  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(220, 38, 38, 0.5)';
  ctx.fill();

  const badge = r * 0.52;
  ctx.beginPath();
  ctx.arc(x, y, badge, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.fill();

  const s = badge * 0.7;
  ctx.fillStyle = '#dc2626';
  ctx.lineCap = 'round';

  ctx.fillRect(x - s * 0.22, y - s * 1.05, s * 0.44, s * 0.28);
  ctx.fillRect(x - s * 0.62, y - s * 0.78, s * 1.24, s * 0.22);
  ctx.beginPath();
  ctx.moveTo(x - s * 0.5, y - s * 0.56);
  ctx.lineTo(x - s * 0.42, y + s * 0.72);
  ctx.lineTo(x + s * 0.42, y + s * 0.72);
  ctx.lineTo(x + s * 0.5, y - s * 0.56);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = s * 0.14;
  for (const offset of [-0.22, 0, 0.22]) {
    ctx.beginPath();
    ctx.moveTo(x + s * offset, y - s * 0.38);
    ctx.lineTo(x + s * offset, y + s * 0.55);
    ctx.stroke();
  }

  ctx.restore();
}

export interface WheelDrawState {
  cx: number;
  cy: number;
  hoveredSector: number;
  currentSize: number | undefined;
}

/** Radial size-picker menu drawn on the overlay canvas. */
export function drawSizeWheel(ctx: Ctx, { cx, cy, hoveredSector, currentSize }: WheelDrawState): void {
  ctx.save();

  for (let i = 0; i < 4; i++) {
    const sa = (i * Math.PI) / 2 - Math.PI / 4;
    const ea = sa + Math.PI / 2;
    const isCurrent = WHEEL_SIZES[i] === currentSize;
    const isHovered = i === hoveredSector;
    const outerR = isHovered ? WHEEL_OUTER + 10 : WHEEL_OUTER;

    ctx.beginPath();
    ctx.moveTo(cx + WHEEL_INNER * Math.cos(sa), cy + WHEEL_INNER * Math.sin(sa));
    ctx.arc(cx, cy, outerR, sa, ea);
    ctx.arc(cx, cy, WHEEL_INNER, ea, sa, true);
    ctx.closePath();

    ctx.shadowColor = 'rgba(0,0,0,0.18)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 3;
    ctx.fillStyle = isHovered
      ? '#b8860b'
      : isCurrent
        ? 'rgba(184,134,11,0.22)'
        : 'rgba(255,255,255,0.93)';
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = isHovered ? '#a07020' : 'rgba(180,160,120,0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const centerA = (i * Math.PI) / 2;
    const labelR = (WHEEL_INNER + WHEEL_OUTER) / 2 + (isHovered ? 5 : 0);
    ctx.fillStyle = isHovered ? '#fff' : isCurrent ? '#7a5a10' : '#555';
    ctx.font = `${isHovered ? 'bold ' : ''}12px -apple-system,sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${WHEEL_SIZES[i]}mm`, cx + labelR * Math.cos(centerA), cy + labelR * Math.sin(centerA));
  }

  // Central close button.
  ctx.beginPath();
  ctx.arc(cx, cy, WHEEL_INNER - 2, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.96)';
  ctx.shadowColor = 'rgba(0,0,0,0.1)';
  ctx.shadowBlur = 6;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = 'rgba(180,160,120,0.4)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#aaa';
  ctx.font = '13px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('✕', cx, cy);

  ctx.restore();
}
