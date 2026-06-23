// ─── UTILS ───────────────────────────────────────────────────────────────────

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function lightenHex(hex, amount) {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, (n >> 16) + Math.round(255 * amount));
  const g = Math.min(255, ((n >> 8) & 0xff) + Math.round(255 * amount));
  const b = Math.min(255, (n & 0xff) + Math.round(255 * amount));
  return `rgb(${r},${g},${b})`;
}

function darkenHex(hex, amount) {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, (n >> 16) - Math.round(255 * amount));
  const g = Math.max(0, ((n >> 8) & 0xff) - Math.round(255 * amount));
  const b = Math.max(0, (n & 0xff) - Math.round(255 * amount));
  return `rgb(${r},${g},${b})`;
}

// ─── SELECTION RING ──────────────────────────────────────────────────────────

function drawSelectionRing(x, y, r, c = ctx) {
  c.save();
  c.beginPath();
  c.arc(x, y, r + 4, 0, Math.PI * 2);
  c.strokeStyle = 'rgba(255,255,255,0.85)';
  c.lineWidth = 2.5;
  c.shadowColor = 'rgba(100,140,255,0.55)';
  c.shadowBlur = 10;
  c.stroke();
  c.restore();
}

// ─── BACKGROUND TEXTURES ─────────────────────────────────────────────────────

function drawTextureDefault(cx, cy, r) {
  const g = ctx.createRadialGradient(cx * 0.8, cy * 0.7, 0, cx, cy, r * 1.1);
  g.addColorStop(0, '#faf9f6');
  g.addColorStop(1, '#eae6de');
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();
}

function drawTextureWood(cx, cy, r) {
  const g = ctx.createRadialGradient(cx - r * 0.25, cy - r * 0.2, 0, cx, cy, r * 1.15);
  g.addColorStop(0, '#cd8c4e');
  g.addColorStop(0.5, '#9c5a24');
  g.addColorStop(1, '#5e3010');
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();

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
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = shine;
  ctx.fill();
}

function drawTextureJade(cx, cy, r) {
  const g = ctx.createRadialGradient(cx - r * 0.2, cy - r * 0.25, 0, cx, cy, r * 1.1);
  g.addColorStop(0, '#5aab78');
  g.addColorStop(0.45, '#2d7a4c');
  g.addColorStop(1, '#154828');
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();

  ctx.save();
  const jveins = [
    [cx - r, cy - r*0.4, cx - r*0.2, cy - r*0.7, cx + r*0.15, cy - r*0.1, cx + r, cy + r*0.3],
    [cx - r*0.6, cy + r*0.7, cx, cy + r*0.1, cx + r*0.35, cy - r*0.2, cx + r*0.9, cy - r*0.5],
    [cx + r*0.2, cy - r, cx + r*0.6, cy - r*0.3, cx - r*0.3, cy + r*0.25, cx - r*0.2, cy + r*0.9],
  ];
  jveins.forEach(v => {
    ctx.beginPath();
    ctx.moveTo(v[0], v[1]);
    ctx.bezierCurveTo(v[2], v[3], v[4], v[5], v[6], v[7]);
    ctx.strokeStyle = 'rgba(190,255,215,0.2)';
    ctx.lineWidth = r * 0.045;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(230,255,240,0.3)';
    ctx.lineWidth = r * 0.012;
    ctx.stroke();
  });
  ctx.restore();

  const shine = ctx.createRadialGradient(cx - r*0.2, cy - r*0.3, 0, cx, cy, r*0.9);
  shine.addColorStop(0, 'rgba(140,255,180,0.2)');
  shine.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = shine;
  ctx.fill();
}

function drawTextureCrystal(cx, cy, r) {
  const g = ctx.createRadialGradient(cx - r*0.3, cy - r*0.35, 0, cx, cy, r * 1.1);
  g.addColorStop(0, '#eef8ff');
  g.addColorStop(0.4, '#b4d8f0');
  g.addColorStop(1, '#68aed4');
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();

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
  [0.38, 0.62, 0.84].forEach(frac => {
    ctx.beginPath();
    ctx.arc(cx, cy, r * frac, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(200,235,255,0.18)';
    ctx.lineWidth = 0.8;
    ctx.stroke();
  });
  ctx.restore();

  const shine = ctx.createRadialGradient(cx - r*0.28, cy - r*0.32, 0, cx - r*0.08, cy - r*0.12, r*0.68);
  shine.addColorStop(0, 'rgba(255,255,255,0.55)');
  shine.addColorStop(0.35, 'rgba(255,255,255,0.18)');
  shine.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = shine;
  ctx.fill();
}

function drawTextureMarble(cx, cy, r) {
  const g = ctx.createRadialGradient(cx - r*0.15, cy - r*0.2, 0, cx, cy, r * 1.1);
  g.addColorStop(0, '#f8f7f4');
  g.addColorStop(0.55, '#e6e2dc');
  g.addColorStop(1, '#ccc8c0');
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();

  ctx.save();
  const mveins = [
    [cx - r, cy - r*0.25, cx - r*0.25, cy - r*0.7, cx + r*0.2, cy - r*0.15, cx + r, cy + r*0.15],
    [cx - r*0.7, cy + r*0.65, cx - r*0.2, cy + r*0.2, cx + r*0.25, cy - r*0.15, cx + r*0.7, cy - r*0.55],
    [cx + r*0.3, cy - r, cx + r*0.65, cy - r*0.2, cx + r*0.1, cy + r*0.35, cx - r*0.1, cy + r*0.85],
  ];
  mveins.forEach((v, idx) => {
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

function drawPlate(cx, cy) {
  const r = state.circleRadius;

  switch (state.backgroundTexture) {
    case 'wood':    drawTextureWood(cx, cy, r);    break;
    case 'jade':    drawTextureJade(cx, cy, r);    break;
    case 'crystal': drawTextureCrystal(cx, cy, r); break;
    case 'marble':  drawTextureMarble(cx, cy, r);  break;
    default:        drawTextureDefault(cx, cy, r); break;
  }

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(0,0,0,0.06)';
  ctx.lineWidth = 2;
  ctx.stroke();

  const vignette = ctx.createRadialGradient(cx, cy, r * 0.7, cx, cy, r);
  vignette.addColorStop(0, 'transparent');
  vignette.addColorStop(1, 'rgba(0,0,0,0.06)');
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = vignette;
  ctx.fill();
}

function drawWatermark(cx, cy) {
  ctx.save();
  ctx.globalAlpha = 0.06;
  ctx.font = 'bold 13px sans-serif';
  ctx.fillStyle = '#000';
  ctx.textAlign = 'center';
  ctx.fillText('STONE STUDIO', cx, cy + 4);
  ctx.restore();
}

function drawBraceletThread(cx, cy, radius) {
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(180,160,130,0.55)';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawTrashOverlay(x, y, r, c = ctx) {
  c.save();

  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fillStyle = 'rgba(220, 38, 38, 0.5)';
  c.fill();

  const badge = r * 0.52;
  c.beginPath();
  c.arc(x, y, badge, 0, Math.PI * 2);
  c.fillStyle = 'rgba(255,255,255,0.92)';
  c.fill();

  const s = badge * 0.7;
  c.fillStyle = '#dc2626';
  c.strokeStyle = '#dc2626';
  c.lineCap = 'round';

  c.fillRect(x - s * 0.22, y - s * 1.05, s * 0.44, s * 0.28);
  c.fillRect(x - s * 0.62, y - s * 0.78, s * 1.24, s * 0.22);
  c.beginPath();
  c.moveTo(x - s * 0.5, y - s * 0.56);
  c.lineTo(x - s * 0.42, y + s * 0.72);
  c.lineTo(x + s * 0.42, y + s * 0.72);
  c.lineTo(x + s * 0.5, y - s * 0.56);
  c.closePath();
  c.fill();

  c.strokeStyle = 'rgba(255,255,255,0.85)';
  c.lineWidth = s * 0.14;
  [-0.22, 0, 0.22].forEach(offset => {
    c.beginPath();
    c.moveTo(x + s * offset, y - s * 0.38);
    c.lineTo(x + s * offset, y + s * 0.55);
    c.stroke();
  });

  c.restore();
}

// ─── BEAD RENDERER ───────────────────────────────────────────────────────────

function drawBead(x, y, r, beadDef, c = ctx, angle = 0) {
  c.save();
  c.shadowColor = 'rgba(0,0,0,0.25)';
  c.shadowBlur = 8;
  c.shadowOffsetX = 2;
  c.shadowOffsetY = 3;

  const g = c.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.05, x, y, r);
  if (beadDef.shimmer) {
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.25, beadDef.gradient[0]);
    g.addColorStop(1, beadDef.gradient[1]);
  } else {
    g.addColorStop(0, lightenHex(beadDef.gradient[0], 0.4));
    g.addColorStop(0.5, beadDef.gradient[0]);
    g.addColorStop(1, beadDef.gradient[1]);
  }

  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fillStyle = g;
  c.fill();
  c.restore();

  // Fixed primary specular (light always from upper-left)
  const spec = c.createRadialGradient(x - r * 0.32, y - r * 0.35, 0, x - r * 0.2, y - r * 0.2, r * 0.55);
  spec.addColorStop(0, 'rgba(255,255,255,0.75)');
  spec.addColorStop(0.4, 'rgba(255,255,255,0.2)');
  spec.addColorStop(1, 'rgba(255,255,255,0)');
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fillStyle = spec;
  c.fill();

  // Rotating secondary shimmer
  const sa = angle * 1.4;
  const sx = x + r * 0.42 * Math.cos(sa);
  const sy = y + r * 0.42 * Math.sin(sa);
  const spin = c.createRadialGradient(sx, sy, 0, sx, sy, r * 0.38);
  const alpha = beadDef.shimmer ? 0.45 : 0.28;
  spin.addColorStop(0, `rgba(255,255,255,${alpha})`);
  spin.addColorStop(1, 'rgba(255,255,255,0)');
  c.save();
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.clip();
  c.fillStyle = spin;
  c.fillRect(x - r, y - r, r * 2, r * 2);
  c.restore();

  // Rim darkening
  const rim = c.createRadialGradient(x, y, r * 0.6, x, y, r);
  rim.addColorStop(0, 'rgba(0,0,0,0)');
  rim.addColorStop(1, 'rgba(0,0,0,0.18)');
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fillStyle = rim;
  c.fill();
}

// ─── ACCESSORY SHAPE RENDERERS ────────────────────────────────────────────────

function shapeHeart(c, x, y, r, color) {
  c.save();
  c.translate(x, y - r * 0.04);
  const s = r * 0.72;
  c.shadowColor = 'rgba(0,0,0,0.28)';
  c.shadowBlur = 7;
  c.shadowOffsetX = 1;
  c.shadowOffsetY = 2;
  c.beginPath();
  c.moveTo(0, s * 0.5);
  c.bezierCurveTo(-s * 0.05, s * 0.28, -s * 0.82, s * 0.08, -s * 0.92, -s * 0.25);
  c.bezierCurveTo(-s * 1.1, -s * 0.72, -s * 0.38, -s * 1.02, 0, -s * 0.4);
  c.bezierCurveTo(s * 0.38, -s * 1.02, s * 1.1, -s * 0.72, s * 0.92, -s * 0.25);
  c.bezierCurveTo(s * 0.82, s * 0.08, s * 0.05, s * 0.28, 0, s * 0.5);
  c.fillStyle = color;
  c.fill();
  c.shadowColor = 'transparent';
  c.fillStyle = 'rgba(255,255,255,0.38)';
  c.beginPath();
  c.ellipse(-s * 0.3, -s * 0.44, s * 0.28, s * 0.16, -0.45, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

function shapeStar(c, x, y, r, color) {
  c.save();
  const outer = r * 0.85;
  const inner = r * 0.36;
  c.shadowColor = 'rgba(0,0,0,0.28)';
  c.shadowBlur = 7;
  c.shadowOffsetX = 1;
  c.shadowOffsetY = 2;
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? outer : inner;
    const a = (i * Math.PI) / 5 - Math.PI / 2;
    i === 0 ? c.moveTo(x + rad * Math.cos(a), y + rad * Math.sin(a))
            : c.lineTo(x + rad * Math.cos(a), y + rad * Math.sin(a));
  }
  c.closePath();
  c.fillStyle = color;
  c.fill();
  c.shadowColor = 'transparent';
  c.fillStyle = 'rgba(255,255,255,0.38)';
  c.beginPath();
  c.ellipse(x - r * 0.18, y - r * 0.3, r * 0.2, r * 0.12, -0.5, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

function shapeMoon(c, x, y, r, color) {
  c.save();
  c.beginPath();
  c.arc(x, y, r * 0.88, 0, Math.PI * 2);
  c.clip();
  c.shadowColor = 'rgba(0,0,0,0.28)';
  c.shadowBlur = 7;
  c.shadowOffsetX = 1;
  c.shadowOffsetY = 2;
  c.beginPath();
  c.arc(x, y, r * 0.82, 0, Math.PI * 2);
  c.fillStyle = color;
  c.fill();
  c.shadowColor = 'transparent';
  c.globalCompositeOperation = 'destination-out';
  c.beginPath();
  c.arc(x + r * 0.36, y - r * 0.06, r * 0.68, 0, Math.PI * 2);
  c.fill();
  c.globalCompositeOperation = 'source-over';
  c.fillStyle = 'rgba(255,255,255,0.35)';
  c.beginPath();
  c.ellipse(x - r * 0.36, y - r * 0.3, r * 0.16, r * 0.1, -0.4, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

function shapeButterfly(c, x, y, r, color) {
  c.save();
  c.shadowColor = 'rgba(0,0,0,0.28)';
  c.shadowBlur = 7;
  c.shadowOffsetX = 1;
  c.shadowOffsetY = 2;
  const w = r * 0.76;
  c.beginPath();
  c.ellipse(x - w * 0.44, y - w * 0.24, w * 0.52, w * 0.4, -0.4, 0, Math.PI * 2);
  c.fillStyle = color;
  c.fill();
  c.beginPath();
  c.ellipse(x + w * 0.44, y - w * 0.24, w * 0.52, w * 0.4, 0.4, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.ellipse(x - w * 0.38, y + w * 0.28, w * 0.38, w * 0.3, 0.32, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.ellipse(x + w * 0.38, y + w * 0.28, w * 0.38, w * 0.3, -0.32, 0, Math.PI * 2);
  c.fill();
  c.shadowColor = 'transparent';
  c.fillStyle = 'rgba(255,255,255,0.24)';
  c.beginPath();
  c.ellipse(x - w * 0.42, y - w * 0.24, w * 0.28, w * 0.2, -0.4, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.ellipse(x + w * 0.42, y - w * 0.24, w * 0.28, w * 0.2, 0.4, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.ellipse(x, y, w * 0.1, w * 0.54, 0, 0, Math.PI * 2);
  c.fillStyle = '#3a2a1a';
  c.fill();
  c.restore();
}

function shapeFlower(c, x, y, r, color) {
  c.save();
  c.shadowColor = 'rgba(0,0,0,0.28)';
  c.shadowBlur = 7;
  c.shadowOffsetX = 1;
  c.shadowOffsetY = 2;
  const pr = r * 0.38;
  const pd = r * 0.35;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    c.beginPath();
    c.arc(x + Math.cos(a) * pd, y + Math.sin(a) * pd, pr, 0, Math.PI * 2);
    c.fillStyle = color;
    c.fill();
  }
  c.shadowColor = 'transparent';
  c.beginPath();
  c.arc(x, y, r * 0.28, 0, Math.PI * 2);
  c.fillStyle = '#ffe066';
  c.fill();
  c.fillStyle = 'rgba(255,255,255,0.5)';
  c.beginPath();
  c.arc(x - r * 0.07, y - r * 0.08, r * 0.09, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

function shapeInfinity(c, x, y, r, color) {
  c.save();
  c.shadowColor = 'rgba(0,0,0,0.28)';
  c.shadowBlur = 7;
  c.shadowOffsetX = 1;
  c.shadowOffsetY = 2;
  const w = r * 0.78;
  const h = r * 0.4;
  const lw = r * 0.2;
  c.lineWidth = lw;
  c.strokeStyle = color;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.beginPath();
  c.moveTo(x, y);
  c.bezierCurveTo(x - w * 0.1, y - h, x - w, y - h, x - w, y);
  c.bezierCurveTo(x - w, y + h, x - w * 0.1, y + h, x, y);
  c.bezierCurveTo(x + w * 0.1, y - h, x + w, y - h, x + w, y);
  c.bezierCurveTo(x + w, y + h, x + w * 0.1, y + h, x, y);
  c.stroke();
  c.shadowColor = 'transparent';
  c.strokeStyle = 'rgba(255,255,255,0.4)';
  c.lineWidth = lw * 0.38;
  c.beginPath();
  c.arc(x - w * 0.64, y - h * 0.4, h * 0.36, Math.PI * 0.8, Math.PI * 1.6);
  c.stroke();
  c.beginPath();
  c.arc(x + w * 0.64, y - h * 0.4, h * 0.36, Math.PI * 0.8, Math.PI * 1.6);
  c.stroke();
  c.restore();
}

function shapeFlatDisc(c, x, y, r, color) {
  c.save();
  const w = r * 0.86;
  const h = r * 0.28;
  c.shadowColor = 'rgba(0,0,0,0.28)';
  c.shadowBlur = 5;
  c.shadowOffsetX = 1;
  c.shadowOffsetY = 2;
  const grad = c.createLinearGradient(x, y - h, x, y + h);
  grad.addColorStop(0, lightenHex(color, 0.32));
  grad.addColorStop(0.5, color);
  grad.addColorStop(1, darkenHex(color, 0.22));
  c.beginPath();
  c.ellipse(x, y, w, h, 0, 0, Math.PI * 2);
  c.fillStyle = grad;
  c.fill();
  c.shadowColor = 'transparent';
  c.beginPath();
  c.ellipse(x, y - h * 0.38, w * 0.68, h * 0.28, 0, 0, Math.PI * 2);
  c.fillStyle = 'rgba(255,255,255,0.42)';
  c.fill();
  c.restore();
}

function shapeRondelle(c, x, y, r, color) {
  c.save();
  const w = r * 0.86;
  const h = r * 0.42;
  c.shadowColor = 'rgba(0,0,0,0.28)';
  c.shadowBlur = 5;
  c.shadowOffsetX = 1;
  c.shadowOffsetY = 2;
  const grad = c.createLinearGradient(x, y - h, x, y + h);
  grad.addColorStop(0, lightenHex(color, 0.38));
  grad.addColorStop(0.42, color);
  grad.addColorStop(1, darkenHex(color, 0.25));
  c.beginPath();
  c.ellipse(x, y, w, h, 0, 0, Math.PI * 2);
  c.fillStyle = grad;
  c.fill();
  c.shadowColor = 'transparent';
  c.strokeStyle = 'rgba(255,255,255,0.28)';
  c.lineWidth = 0.9;
  for (let i = 1; i < 10; i++) {
    const fx = x - w + (i * 2 * w) / 10;
    const lineH = Math.sqrt(Math.max(0, 1 - Math.pow((fx - x) / w, 2))) * h;
    c.beginPath();
    c.moveTo(fx, y - lineH);
    c.lineTo(fx, y + lineH);
    c.stroke();
  }
  c.beginPath();
  c.ellipse(x, y - h * 0.38, w * 0.64, h * 0.22, 0, 0, Math.PI * 2);
  c.fillStyle = 'rgba(255,255,255,0.4)';
  c.fill();
  c.restore();
}

function shapeCoin(c, x, y, r, color) {
  c.save();
  c.shadowColor = 'rgba(0,0,0,0.28)';
  c.shadowBlur = 7;
  c.shadowOffsetX = 1;
  c.shadowOffsetY = 2;
  c.beginPath();
  c.arc(x, y, r * 0.86, 0, Math.PI * 2);
  c.fillStyle = color;
  c.fill();
  c.shadowColor = 'transparent';
  c.beginPath();
  c.arc(x, y, r * 0.86, 0, Math.PI * 2);
  c.strokeStyle = darkenHex(color, 0.18);
  c.lineWidth = r * 0.1;
  c.stroke();
  c.beginPath();
  c.arc(x, y, r * 0.58, 0, Math.PI * 2);
  c.strokeStyle = 'rgba(255,255,255,0.22)';
  c.lineWidth = 1.2;
  c.stroke();
  const os = r * 0.36;
  const is = r * 0.16;
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? os : is;
    const a = (i * Math.PI) / 5 - Math.PI / 2;
    i === 0 ? c.moveTo(x + rad * Math.cos(a), y + rad * Math.sin(a))
            : c.lineTo(x + rad * Math.cos(a), y + rad * Math.sin(a));
  }
  c.closePath();
  c.fillStyle = 'rgba(255,255,255,0.22)';
  c.fill();
  c.beginPath();
  c.ellipse(x - r * 0.22, y - r * 0.26, r * 0.28, r * 0.16, -0.5, 0, Math.PI * 2);
  c.fillStyle = 'rgba(255,255,255,0.36)';
  c.fill();
  c.restore();
}

function shapeEvilEye(c, x, y, r, color) {
  c.save();
  const s = r * 0.86;
  c.shadowColor = 'rgba(0,0,0,0.28)';
  c.shadowBlur = 7;
  c.shadowOffsetX = 1;
  c.shadowOffsetY = 2;
  c.beginPath();
  c.arc(x, y, s, 0, Math.PI * 2);
  c.fillStyle = '#f0f8ff';
  c.fill();
  c.shadowColor = 'transparent';
  c.beginPath();
  c.arc(x, y, s * 0.76, 0, Math.PI * 2);
  c.fillStyle = color;
  c.fill();
  c.beginPath();
  c.arc(x, y, s * 0.5, 0, Math.PI * 2);
  c.fillStyle = '#e3f2fd';
  c.fill();
  c.beginPath();
  c.arc(x, y, s * 0.3, 0, Math.PI * 2);
  c.fillStyle = '#0d1b3e';
  c.fill();
  c.beginPath();
  c.arc(x - s * 0.1, y - s * 0.12, s * 0.1, 0, Math.PI * 2);
  c.fillStyle = 'rgba(255,255,255,0.85)';
  c.fill();
  c.restore();
}

function shapeHexagon(c, x, y, r, color) {
  c.save();
  c.shadowColor = 'rgba(0,0,0,0.28)';
  c.shadowBlur = 7;
  c.shadowOffsetX = 1;
  c.shadowOffsetY = 2;
  c.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3 - Math.PI / 6;
    i === 0 ? c.moveTo(x + r * 0.86 * Math.cos(a), y + r * 0.86 * Math.sin(a))
            : c.lineTo(x + r * 0.86 * Math.cos(a), y + r * 0.86 * Math.sin(a));
  }
  c.closePath();
  c.fillStyle = color;
  c.fill();
  c.shadowColor = 'transparent';
  c.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3 - Math.PI / 6;
    i === 0 ? c.moveTo(x + r * 0.56 * Math.cos(a), y + r * 0.56 * Math.sin(a))
            : c.lineTo(x + r * 0.56 * Math.cos(a), y + r * 0.56 * Math.sin(a));
  }
  c.closePath();
  c.strokeStyle = 'rgba(255,255,255,0.28)';
  c.lineWidth = 1.2;
  c.stroke();
  c.fillStyle = 'rgba(255,255,255,0.32)';
  c.beginPath();
  c.ellipse(x - r * 0.2, y - r * 0.24, r * 0.24, r * 0.14, -0.4, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

function shapeCross(c, x, y, r, color) {
  c.save();
  const arm = r * 0.24;
  const len = r * 0.8;
  c.shadowColor = 'rgba(0,0,0,0.28)';
  c.shadowBlur = 7;
  c.shadowOffsetX = 1;
  c.shadowOffsetY = 2;
  c.beginPath();
  c.moveTo(x - arm, y - len);
  c.lineTo(x + arm, y - len);
  c.lineTo(x + arm, y - arm);
  c.lineTo(x + len, y - arm);
  c.lineTo(x + len, y + arm);
  c.lineTo(x + arm, y + arm);
  c.lineTo(x + arm, y + len);
  c.lineTo(x - arm, y + len);
  c.lineTo(x - arm, y + arm);
  c.lineTo(x - len, y + arm);
  c.lineTo(x - len, y - arm);
  c.lineTo(x - arm, y - arm);
  c.closePath();
  c.fillStyle = color;
  c.fill();
  c.shadowColor = 'transparent';
  c.fillStyle = 'rgba(255,255,255,0.32)';
  c.beginPath();
  c.ellipse(x - arm * 0.3, y - len * 0.52, arm * 0.7, arm * 0.38, -0.3, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

function drawAccessory(x, y, r, def, c = ctx, angle = 0) {
  c.save();
  c.translate(x, y);
  c.rotate(angle);
  switch (def.shape) {
    case 'heart':     shapeHeart(c, 0, 0, r, def.color);    break;
    case 'star':      shapeStar(c, 0, 0, r, def.color);     break;
    case 'moon':      shapeMoon(c, 0, 0, r, def.color);     break;
    case 'butterfly': shapeButterfly(c, 0, 0, r, def.color);break;
    case 'flower':    shapeFlower(c, 0, 0, r, def.color);   break;
    case 'infinity':  shapeInfinity(c, 0, 0, r, def.color); break;
    case 'flat-disc': shapeFlatDisc(c, 0, 0, r, def.color); break;
    case 'rondelle':  shapeRondelle(c, 0, 0, r, def.color); break;
    case 'coin':      shapeCoin(c, 0, 0, r, def.color);     break;
    case 'evil-eye':  shapeEvilEye(c, 0, 0, r, def.color);  break;
    case 'hexagon':   shapeHexagon(c, 0, 0, r, def.color);  break;
    case 'cross':     shapeCross(c, 0, 0, r, def.color);    break;
  }
  c.restore();
}

function drawItem(x, y, r, def, c = ctx, angle = 0) {
  def.shape ? drawAccessory(x, y, r, def, c, angle) : drawBead(x, y, r, def, c, angle);
}

// ─── RENDER LOOP ─────────────────────────────────────────────────────────────

function renderLoop() {
  requestAnimationFrame(renderLoop);

  if (!state.isBraceletMode) {
    Matter.Engine.update(engine, 1000 / 60);
    applyMouseForce();
  }

  const { canvasSize, circleRadius, animationPhase } = state;
  const cx = canvasSize / 2;
  const cy = canvasSize / 2;

  ctx.clearRect(0, 0, canvasSize, canvasSize);

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, circleRadius, 0, Math.PI * 2);
  ctx.clip();

  drawPlate(cx, cy);

  if (animationPhase === 'arranging') {
    renderArranging(cx, cy);
  } else if (animationPhase === 'bracelet') {
    renderBracelet(cx, cy);
  } else {
    renderFreeBeads(cx, cy);
  }

  drawWatermark(cx, cy);
  ctx.restore();

  overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

  if (state.wheelOpen) {
    drawSizeWheel(overlayCtx);
  } else {
    if (animationPhase === 'bracelet' && state.draggingBeadIndex >= 0) {
      if (Math.hypot(state.mouseX - cx, state.mouseY - cy) > circleRadius) {
        const b = state.braceletBeads[state.draggingBeadIndex];
        const r = mmToRadius(b.size);
        drawItem(state.overlayMouseX, state.overlayMouseY, r * 1.12, b.beadDef, overlayCtx);
        drawTrashOverlay(state.overlayMouseX, state.overlayMouseY, r * 1.12, overlayCtx);
      }
    }

    if (!animationPhase && state.freeDraggingBody) {
      if (Math.hypot(state.mouseX - cx, state.mouseY - cy) > circleRadius) {
        const draggingEntry = state.beadsOnCanvas.find(e => e.body === state.freeDraggingBody);
        const r = draggingEntry ? mmToRadius(draggingEntry.size) : beadRadius();
        const dragAngle = state.freeDraggingBody.angle;
        drawItem(state.overlayMouseX, state.overlayMouseY, r * 1.12, state.freeDraggingBeadDef, overlayCtx, dragAngle);
        drawTrashOverlay(state.overlayMouseX, state.overlayMouseY, r * 1.12, overlayCtx);
      }
    }
  }
}

function renderArranging(cx, cy) {
  state.arrangeProgress = Math.min(1, state.arrangeProgress + 0.025);
  const t = easeInOut(state.arrangeProgress);
  const brRadius = state.circleRadius * 0.72;
  const selBody = state.selectedBeadIndex >= 0 ? state.beadsOnCanvas[state.selectedBeadIndex]?.body : null;

  state.braceletBeads.forEach(b => {
    const r = mmToRadius(b.size);
    const tx = cx + Math.cos(b.targetAngle) * brRadius;
    const ty = cy + Math.sin(b.targetAngle) * brRadius;
    const px = b.startX + (tx - b.startX) * t;
    const py = b.startY + (ty - b.startY) * t;
    Matter.Body.setPosition(b.body, { x: px, y: py });
    drawItem(px, py, r, b.beadDef);
    if (b.body === selBody) drawSelectionRing(px, py, r);
  });

  if (state.arrangeProgress >= 1) {
    state.animationPhase = 'bracelet';
    state.braceletAngle = 0;
  }
}

function renderBracelet(cx, cy) {
  const brRadius = state.circleRadius * 0.72;
  const { draggingBeadIndex, mouseX, mouseY } = state;
  const selBody = state.selectedBeadIndex >= 0 ? state.beadsOnCanvas[state.selectedBeadIndex]?.body : null;

  drawBraceletThread(cx, cy, brRadius);

  state.braceletBeads.forEach((b, i) => {
    if (i === draggingBeadIndex) return;
    const r = mmToRadius(b.size);
    const angle = b.targetAngle + state.braceletAngle;
    const x = cx + Math.cos(angle) * brRadius;
    const y = cy + Math.sin(angle) * brRadius;
    Matter.Body.setPosition(b.body, { x, y });
    drawItem(x, y, r, b.beadDef);
    if (b.body === selBody) drawSelectionRing(x, y, r);
  });

  if (draggingBeadIndex >= 0) {
    const b = state.braceletBeads[draggingBeadIndex];
    const r = mmToRadius(b.size);
    const isOutside = Math.hypot(mouseX - cx, mouseY - cy) > state.circleRadius;

    if (isOutside) {
      Matter.Body.setPosition(b.body, { x: mouseX, y: mouseY });
    } else {
      const mouseAngle = Math.atan2(mouseY - cy, mouseX - cx);
      const x = cx + Math.cos(mouseAngle) * brRadius;
      const y = cy + Math.sin(mouseAngle) * brRadius;
      Matter.Body.setPosition(b.body, { x, y });
      drawItem(x, y, r * 1.12, b.beadDef);
    }
  }
}

function renderFreeBeads(cx, cy) {
  state.beadsOnCanvas.forEach((entry, idx) => {
    const { body, beadDef, size } = entry;
    const r = mmToRadius(size);
    const maxDist = state.circleRadius - r - 4;

    if (body === state.freeDraggingBody) {
      Matter.Body.setPosition(body, { x: state.mouseX, y: state.mouseY });
      if (Math.hypot(state.mouseX - cx, state.mouseY - cy) <= state.circleRadius) {
        drawItem(state.mouseX, state.mouseY, r * 1.12, beadDef, ctx, body.angle);
      }
      return;
    }

    const { x, y } = body.position;
    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.hypot(dx, dy);

    if (dist > maxDist) {
      const nx = dx / dist;
      const ny = dy / dist;
      Matter.Body.setPosition(body, { x: cx + nx * maxDist, y: cy + ny * maxDist });
      const vel = body.velocity;
      const dot = vel.x * nx + vel.y * ny;
      Matter.Body.setVelocity(body, { x: vel.x - 1.8 * dot * nx, y: vel.y - 1.8 * dot * ny });
    }

    drawItem(body.position.x, body.position.y, r, beadDef, ctx, body.angle);
    if (idx === state.selectedBeadIndex) drawSelectionRing(body.position.x, body.position.y, r);
  });
}
