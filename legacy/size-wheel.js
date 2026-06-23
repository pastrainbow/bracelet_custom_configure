// ─── SIZE WHEEL ──────────────────────────────────────────────────────────────

let wheelOutsideHandler = null;

function getWheelSector(dx, dy) {
  const a = Math.atan2(dy, dx);
  const rotated = ((a + Math.PI / 4) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
  return Math.floor(rotated / (Math.PI / 2)) % 4;
}

function openSizeWheel(beadsIdx, canvasX, canvasY) {
  const cr = canvas.getBoundingClientRect();
  const or = overlayCanvas.getBoundingClientRect();
  const scale = cr.width / state.canvasSize;
  state.wheelCenterX = (cr.left + canvasX * scale) - or.left;
  state.wheelCenterY = (cr.top  + canvasY * scale) - or.top;

  state.wheelOpen         = true;
  state.wheelBeadIndex    = beadsIdx;
  state.wheelHoveredSector = -1;
  state.selectedBeadIndex = beadsIdx;

  overlayCanvas.style.pointerEvents = 'auto';
  overlayCanvas.style.cursor = 'pointer';
  updateSidebar();

  wheelOutsideHandler = e => {
    if (!overlayCanvas.contains(e.target)) closeSizeWheel();
  };
  setTimeout(() => document.addEventListener('pointerdown', wheelOutsideHandler), 0);
}

function closeSizeWheel() {
  if (!state.wheelOpen) return;
  state.wheelOpen = false;
  state.wheelBeadIndex = -1;
  state.wheelHoveredSector = -1;
  overlayCanvas.style.pointerEvents = 'none';
  overlayCanvas.style.cursor = '';
  if (state.wheelLongPressTimer) {
    clearTimeout(state.wheelLongPressTimer);
    state.wheelLongPressTimer = null;
  }
  if (wheelOutsideHandler) {
    document.removeEventListener('pointerdown', wheelOutsideHandler);
    wheelOutsideHandler = null;
  }
}

function drawSizeWheel(c) {
  const cx = state.wheelCenterX;
  const cy = state.wheelCenterY;
  const hover = state.wheelHoveredSector;
  const curSize = state.beadsOnCanvas[state.wheelBeadIndex]?.size;

  c.save();

  for (let i = 0; i < 4; i++) {
    const sa = i * Math.PI / 2 - Math.PI / 4;
    const ea = sa + Math.PI / 2;
    const isCurrent = WHEEL_SIZES[i] === curSize;
    const isHovered = i === hover;
    const outerR = isHovered ? WHEEL_OUTER + 10 : WHEEL_OUTER;

    c.beginPath();
    c.moveTo(cx + WHEEL_INNER * Math.cos(sa), cy + WHEEL_INNER * Math.sin(sa));
    c.arc(cx, cy, outerR, sa, ea);
    c.arc(cx, cy, WHEEL_INNER, ea, sa, true);
    c.closePath();

    c.shadowColor = 'rgba(0,0,0,0.18)';
    c.shadowBlur  = 12;
    c.shadowOffsetY = 3;
    c.fillStyle = isHovered ? '#b8860b'
                : isCurrent ? 'rgba(184,134,11,0.22)'
                : 'rgba(255,255,255,0.93)';
    c.fill();
    c.shadowColor = 'transparent';
    c.strokeStyle = isHovered ? '#a07020' : 'rgba(180,160,120,0.35)';
    c.lineWidth   = 1.5;
    c.stroke();

    const centerA = i * Math.PI / 2;
    const labelR  = (WHEEL_INNER + WHEEL_OUTER) / 2 + (isHovered ? 5 : 0);
    c.fillStyle  = isHovered ? '#fff' : isCurrent ? '#7a5a10' : '#555';
    c.font       = `${isHovered ? 'bold ' : ''}12px -apple-system,sans-serif`;
    c.textAlign  = 'center';
    c.textBaseline = 'middle';
    c.fillText(`${WHEEL_SIZES[i]}mm`, cx + labelR * Math.cos(centerA), cy + labelR * Math.sin(centerA));
  }

  c.beginPath();
  c.arc(cx, cy, WHEEL_INNER - 2, 0, Math.PI * 2);
  c.fillStyle = 'rgba(255,255,255,0.96)';
  c.shadowColor = 'rgba(0,0,0,0.1)';
  c.shadowBlur = 6;
  c.fill();
  c.shadowColor = 'transparent';
  c.strokeStyle = 'rgba(180,160,120,0.4)';
  c.lineWidth = 1;
  c.stroke();

  c.fillStyle = '#aaa';
  c.font = '13px sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('✕', cx, cy);

  c.restore();
}
