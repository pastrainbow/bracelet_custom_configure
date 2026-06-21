// ─── CATALOGUE ───────────────────────────────────────────────────────────────

const CATALOGUE = {
  crystal: [
    { id: 'white-crystal', name: 'White Crystal',   price: 2,  gradient: ['#f8f8ff', '#e8e8f0'], shimmer: true },
    { id: 'rose-quartz',   name: 'Rose Quartz',     price: 3,  gradient: ['#f9c5d1', '#f48fb1'] },
    { id: 'amethyst',      name: 'Amethyst',        price: 4,  gradient: ['#9c72b5', '#6a3fa1'] },
    { id: 'citrine',       name: 'Citrine',         price: 3,  gradient: ['#f5c842', '#e8a800'] },
    { id: 'aquamarine',    name: 'Aquamarine',      price: 5,  gradient: ['#7ec8e3', '#0b8dba'] },
    { id: 'obsidian',      name: 'Obsidian',        price: 3,  gradient: ['#2c2c2c', '#111111'] },
    { id: 'moonstone',     name: 'Moonstone',       price: 6,  gradient: ['#d4e8f5', '#a8d0ed'], shimmer: true },
    { id: 'labradorite',   name: 'Labradorite',     price: 7,  gradient: ['#5c7a8a', '#3a566a'] },
    { id: 'turquoise',     name: 'Turquoise',       price: 5,  gradient: ['#40e0d0', '#1aa090'] },
    { id: 'sunstone',      name: 'Sunstone',        price: 6,  gradient: ['#ff9a3c', '#e06b00'] },
  ],
  stone: [
    { id: 'marble',        name: 'White Marble',    price: 4,  gradient: ['#f0ede8', '#d8d4cc'] },
    { id: 'black-onyx',    name: 'Black Onyx',      price: 3,  gradient: ['#1a1a1a', '#050505'] },
    { id: 'tiger-eye',     name: 'Tiger Eye',       price: 4,  gradient: ['#c8860a', '#8b5e0a'] },
    { id: 'jade',          name: 'Jade',            price: 8,  gradient: ['#5da85d', '#2d7a2d'] },
    { id: 'lapis',         name: 'Lapis Lazuli',    price: 6,  gradient: ['#1a3a7a', '#0d2050'] },
    { id: 'red-agate',     name: 'Red Agate',       price: 3,  gradient: ['#c0392b', '#922b21'] },
    { id: 'jasper',        name: 'Jasper',          price: 3,  gradient: ['#8b4513', '#5a2d0c'] },
    { id: 'malachite',     name: 'Malachite',       price: 7,  gradient: ['#2e8b57', '#145a32'] },
  ],
  shell: [
    { id: 'pearl',         name: 'Pearl',           price: 8,  gradient: ['#faf9f6', '#e8e4de'], shimmer: true },
    { id: 'abalone',       name: 'Abalone',         price: 10, gradient: ['#6bbfbf', '#4a9fa0'] },
    { id: 'mother-pearl',  name: 'Mother of Pearl', price: 7,  gradient: ['#f0ece8', '#c8c0b8'], shimmer: true },
    { id: 'paua',          name: 'Paua Shell',      price: 9,  gradient: ['#5040a0', '#302060'] },
  ],
  accent: [
    { id: 'gold-spacer',   name: 'Gold Spacer',     price: 2,  gradient: ['#d4af37', '#b8960c'] },
    { id: 'silver-spacer', name: 'Silver Spacer',   price: 2,  gradient: ['#c0c0c0', '#909090'] },
    { id: 'hematite',      name: 'Hematite',        price: 2,  gradient: ['#4a4a4a', '#2a2a2a'] },
    { id: 'pyrite',        name: 'Pyrite',          price: 3,  gradient: ['#c8b850', '#a09030'] },
    { id: 'clear-quartz',  name: 'Clear Quartz',    price: 2,  gradient: ['#e8f4ff', '#cce0ff'], shimmer: true },
  ],

  // ── Accessories supercategory ──────────────────────────────────────────────
  charms: [
    { id: 'heart-charm',     name: 'Heart',       price: 8,  color: '#e91e8c', shape: 'heart' },
    { id: 'star-charm',      name: 'Star',        price: 6,  color: '#d4af37', shape: 'star' },
    { id: 'moon-charm',      name: 'Crescent',    price: 7,  color: '#b0c8e8', shape: 'moon' },
    { id: 'butterfly-charm', name: 'Butterfly',   price: 9,  color: '#9c27b0', shape: 'butterfly' },
    { id: 'flower-charm',    name: 'Flower',      price: 7,  color: '#ff6b9d', shape: 'flower' },
    { id: 'infinity-charm',  name: 'Infinity',    price: 8,  color: '#d4af37', shape: 'infinity' },
  ],
  spacers: [
    { id: 'gold-disc',           name: 'Gold Disc',        price: 2, color: '#d4af37', shape: 'flat-disc' },
    { id: 'silver-disc',         name: 'Silver Disc',      price: 2, color: '#c0c0c0', shape: 'flat-disc' },
    { id: 'gold-rondelle',       name: 'Gold Rondelle',    price: 3, color: '#d4af37', shape: 'rondelle' },
    { id: 'silver-rondelle',     name: 'Silver Rondelle',  price: 3, color: '#c0c0c0', shape: 'rondelle' },
    { id: 'crystal-rondelle',    name: 'Crystal Rondelle', price: 4, color: '#d4f0ff', shape: 'rondelle' },
  ],
  pendants: [
    { id: 'gold-coin',      name: 'Gold Coin',    price: 10, color: '#d4af37', shape: 'coin' },
    { id: 'evil-eye',       name: 'Evil Eye',     price: 8,  color: '#1565c0', shape: 'evil-eye' },
    { id: 'hexagon-silver', name: 'Hexagon',      price: 7,  color: '#9e9e9e', shape: 'hexagon' },
    { id: 'cross-gold',     name: 'Gold Cross',   price: 7,  color: '#d4af37', shape: 'cross' },
    { id: 'cross-silver',   name: 'Silver Cross', price: 7,  color: '#c0c0c0', shape: 'cross' },
  ],
};

const SUPERCATS = {
  beads: [
    { cat: 'crystal', label: 'Crystal' },
    { cat: 'stone',   label: 'Natural Stone' },
    { cat: 'shell',   label: 'Shell' },
    { cat: 'accent',  label: 'Accent' },
  ],
  accessories: [
    { cat: 'charms',   label: 'Charms' },
    { cat: 'spacers',  label: 'Spacers' },
    { cat: 'pendants', label: 'Pendants' },
  ],
};

// ─── STATE ───────────────────────────────────────────────────────────────────

const state = {
  beadSize: 10,
  beadsOnCanvas: [],   // [{ body, beadDef }]
  braceletBeads: [],   // same entries extended with startX/Y, targetAngle
  braceletAngle: 0,
  animationPhase: null, // null | 'arranging' | 'bracelet'
  arrangeProgress: 0,
  isBraceletMode: false,
  mouseX: 0,
  mouseY: 0,
  mouseInCanvas: false,
  canvasSize: 360,
  circleRadius: 160,
  isDraggingBracelet: false,
  dragStartAngle: 0,
  draggingBeadIndex: -1,  // index into braceletBeads while reordering
  overlayMouseX: 0,       // mouse position relative to the overlay canvas
  overlayMouseY: 0,
  freeDraggingBody: null, // Matter.js body being manually dragged in free mode
  freeDraggingBeadDef: null,
  mouseDownX: 0,          // canvas-space pointer position at last mousedown (for tap detection)
  mouseDownY: 0,
  selectedBeadIndex: -1,  // index into beadsOnCanvas of the bead whose size picker is open
};

// ─── PHYSICS ─────────────────────────────────────────────────────────────────

let engine, world, runner;
let windowDragMoveHandler = null;

function initPhysics() {
  engine = Matter.Engine.create({ gravity: { x: 0, y: 0.4 } });
  world = engine.world;

  const walls = buildCircularWalls(state.canvasSize / 2, state.canvasSize / 2, state.circleRadius, 64);
  Matter.World.add(world, walls);

  runner = Matter.Runner.create();
  Matter.Runner.run(runner, engine);

  const mouseConstraint = Matter.MouseConstraint.create(engine, {
    mouse: Matter.Mouse.create(canvas),
    constraint: { stiffness: 0.05, render: { visible: false } },
  });
  Matter.World.add(world, mouseConstraint);
}

function buildCircularWalls(cx, cy, radius, count) {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2;
    return Matter.Bodies.rectangle(
      cx + Math.cos(angle) * radius,
      cy + Math.sin(angle) * radius,
      12, 18,
      { isStatic: true, angle, friction: 0.3, restitution: 0.5, label: 'wall' }
    );
  });
}

function resizeCanvas() {
  const area = document.getElementById('canvasArea');
  const available = Math.min(area.offsetWidth - 40, area.offsetHeight - 80);
  state.canvasSize = Math.max(280, Math.min(420, available));
  state.circleRadius = state.canvasSize * 0.44;

  canvas.width = state.canvasSize;
  canvas.height = state.canvasSize;

  const ring = document.getElementById('canvasRing');
  ring.style.width = state.canvasSize + 'px';
  ring.style.height = state.canvasSize + 'px';

  // Match overlay to the full left panel so the bead can render anywhere inside it
  const left = document.querySelector('.left');
  overlayCanvas.width = left.offsetWidth;
  overlayCanvas.height = left.offsetHeight;
}

// ─── BEAD SPAWN & REMOVAL ────────────────────────────────────────────────────

function mmToRadius(mm) { return mm * 2.2; }
function beadRadius()   { return mmToRadius(state.beadSize); }

function spawnBead(beadDef) {
  if (state.isBraceletMode) {
    addBeadToBracelet(beadDef);
    return;
  }

  const cx = state.canvasSize / 2;
  const x = cx + (Math.random() - 0.5) * 60;
  const y = cx - state.circleRadius * 0.6 + Math.random() * 20;

  const body = Matter.Bodies.circle(x, y, beadRadius(), {
    restitution: 0.65,
    friction: 0.1,
    frictionAir: 0.008,
    density: 0.002,
    label: 'bead',
  });

  Matter.Body.setVelocity(body, { x: (Math.random() - 0.5) * 6, y: Math.random() * 3 + 1 });
  Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.3);
  Matter.World.add(world, body);

  state.beadsOnCanvas.push({ body, beadDef, size: state.beadSize });
  updateSidebar();
  advanceStep(1);
}

function addBeadToBracelet(beadDef) {
  const cx = state.canvasSize / 2;
  const cy = state.canvasSize / 2;

  // Create a static body at the circle centre; the arrange animation flies it outward
  const body = Matter.Bodies.circle(cx, cy, beadRadius(), {
    restitution: 0.65,
    friction: 0.1,
    frictionAir: 0.008,
    density: 0.002,
    label: 'bead',
    isStatic: true,
  });
  Matter.World.add(world, body);

  const entry = { body, beadDef, size: state.beadSize };
  state.beadsOnCanvas.push(entry);

  // Snapshot each existing bead's current visual position — renderBracelet keeps
  // body.position in sync with the ring (including any braceletAngle rotation).
  state.braceletBeads.forEach(b => {
    b.startX = b.body.position.x;
    b.startY = b.body.position.y;
  });

  // New bead animates in from the centre
  state.braceletBeads.push({ ...entry, startX: cx, startY: cy });

  // Redistribute slots evenly across all beads including the new one
  recomputeTargetAngles();

  // Cancel any in-progress drag so the animation can play cleanly
  state.draggingBeadIndex = -1;
  state.isDraggingBracelet = false;

  // Re-run the arrange animation from current positions to the new layout.
  // braceletAngle resets to 0 at animation end (renderArranging handles this),
  // so set it to 0 now so targetAngles and start positions are consistent.
  state.braceletAngle = 0;
  state.animationPhase = 'arranging';
  state.arrangeProgress = 0;

  updateSidebar();
  advanceStep(1);
}

function removeBead(index) {
  const entry = state.beadsOnCanvas[index];
  Matter.World.remove(world, entry.body);
  state.beadsOnCanvas.splice(index, 1);
  if (state.isBraceletMode) exitBraceletMode();
  updateSidebar();
}

function removeBraceletBead(index) {
  const { body } = state.braceletBeads[index];
  state.braceletBeads.splice(index, 1);
  state.beadsOnCanvas = state.beadsOnCanvas.filter(b => b.body !== body);
  Matter.World.remove(world, body);
  if (state.braceletBeads.length === 0) {
    exitBraceletMode();
  } else {
    recomputeTargetAngles();
  }
  updateSidebar();
}

function resizeBead(index, newSizeMm) {
  const entry = state.beadsOnCanvas[index];
  if (entry.size === newSizeMm) return;

  const oldBody = entry.body;
  const newRadius = mmToRadius(newSizeMm);
  const pos = oldBody.position;
  const isStatic = oldBody.isStatic;

  const newBody = Matter.Bodies.circle(pos.x, pos.y, newRadius, {
    restitution: 0.65, friction: 0.1, frictionAir: 0.008,
    density: 0.002, label: 'bead', isStatic,
  });
  if (!isStatic) Matter.Body.setVelocity(newBody, oldBody.velocity);

  Matter.World.remove(world, oldBody);
  Matter.World.add(world, newBody);

  entry.body = newBody;
  entry.size = newSizeMm;

  // Keep braceletBeads in sync if in bracelet mode
  if (state.isBraceletMode) {
    const bb = state.braceletBeads.find(b => b.body === oldBody);
    if (bb) { bb.body = newBody; bb.size = newSizeMm; }
  }
}

// ─── BRACELET ARRANGE ────────────────────────────────────────────────────────

function startArranging() {
  const n = state.beadsOnCanvas.length;
  state.braceletBeads = state.beadsOnCanvas.map((b, i) => ({
    ...b,
    startX: b.body.position.x,
    startY: b.body.position.y,
    targetAngle: (i / n) * Math.PI * 2 - Math.PI / 2,
  }));

  state.beadsOnCanvas.forEach(({ body }) => Matter.Body.setStatic(body, true));
  state.animationPhase = 'arranging';
  state.arrangeProgress = 0;
  state.isBraceletMode = true;
  canvas.style.cursor = 'grab';
  document.getElementById('cursor').style.display = 'none';

  const btn = document.getElementById('arrangeBtn');
  btn.textContent = 'Scatter Beads';
  btn.classList.add('bracelet-mode');
  advanceStep(2);
}

function recomputeTargetAngles() {
  const n = state.braceletBeads.length;
  state.braceletBeads.forEach((b, i) => {
    b.targetAngle = (i / n) * Math.PI * 2 - Math.PI / 2;
  });
}

function exitBraceletMode() {
  state.isBraceletMode = false;
  state.isDraggingBracelet = false;
  state.draggingBeadIndex = -1;
  state.animationPhase = null;
  state.braceletBeads = [];
  canvas.style.cursor = 'none';

  state.beadsOnCanvas.forEach(({ body }) => {
    Matter.Body.setStatic(body, false);
    Matter.Body.setVelocity(body, { x: (Math.random() - 0.5) * 4, y: (Math.random() - 0.5) * 4 });
  });

  const btn = document.getElementById('arrangeBtn');
  btn.textContent = 'Arrange as Bracelet';
  btn.classList.remove('bracelet-mode');
}

function finishBeadDrag() {
  if (windowDragMoveHandler) {
    window.removeEventListener('mousemove', windowDragMoveHandler);
    window.removeEventListener('touchmove', windowDragMoveHandler);
    windowDragMoveHandler = null;
  }
  // Remove any remaining once-listeners in case finishBeadDrag is called by
  // a canvas mouseup/touchend relay before the window listener fires.
  window.removeEventListener('mouseup', finishBeadDrag);
  window.removeEventListener('touchend', finishBeadDrag);
  if (state.draggingBeadIndex >= 0) {
    const cx = state.canvasSize / 2;
    const cy = state.canvasSize / 2;
    const wasTap = Math.hypot(state.mouseX - state.mouseDownX, state.mouseY - state.mouseDownY) < 8;

    if (wasTap) {
      // Tap on a bracelet bead: select it
      const b = state.braceletBeads[state.draggingBeadIndex];
      const idx = state.beadsOnCanvas.findIndex(e => e.body === b.body);
      if (idx >= 0) { state.selectedBeadIndex = idx; updateSidebar(); }
    } else if (Math.hypot(state.mouseX - cx, state.mouseY - cy) > state.circleRadius) {
      removeBraceletBead(state.draggingBeadIndex);
    }
  }
  state.draggingBeadIndex = -1;
  overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
  canvas.style.cursor = state.isBraceletMode ? 'grab' : 'none';
}

function finishFreeDrag() {
  if (windowDragMoveHandler) {
    window.removeEventListener('mousemove', windowDragMoveHandler);
    window.removeEventListener('touchmove', windowDragMoveHandler);
    windowDragMoveHandler = null;
  }
  window.removeEventListener('mouseup', finishFreeDrag);
  window.removeEventListener('touchend', finishFreeDrag);
  overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

  if (!state.freeDraggingBody) return;
  const body = state.freeDraggingBody;
  const cx = state.canvasSize / 2;
  const cy = state.canvasSize / 2;
  const idx = state.beadsOnCanvas.findIndex(b => b.body === body);
  const wasTap = Math.hypot(state.mouseX - state.mouseDownX, state.mouseY - state.mouseDownY) < 8;

  if (wasTap) {
    // Tap on a free bead: restore physics and select it
    Matter.Body.setStatic(body, false);
    Matter.Body.setVelocity(body, { x: 0, y: 0 });
    if (idx >= 0) { state.selectedBeadIndex = idx; updateSidebar(); }
  } else if (Math.hypot(state.mouseX - cx, state.mouseY - cy) > state.circleRadius) {
    if (idx >= 0) removeBead(idx);
  } else {
    // Release back into physics with a small nudge
    Matter.Body.setStatic(body, false);
    Matter.Body.setVelocity(body, { x: (Math.random() - 0.5) * 3, y: (Math.random() - 0.5) * 3 });
  }

  state.freeDraggingBody = null;
  state.freeDraggingBeadDef = null;
}

// ─── MOUSE REPULSION ─────────────────────────────────────────────────────────

function applyMouseForce() {
  if (state.isBraceletMode || !state.mouseInCanvas) return;
  const { mouseX, mouseY } = state;
  const FORCE_RADIUS = 60;

  state.beadsOnCanvas.forEach(({ body }) => {
    const dx = body.position.x - mouseX;
    const dy = body.position.y - mouseY;
    const dist = Math.hypot(dx, dy);
    if (dist < FORCE_RADIUS && dist > 1) {
      const force = (1 - dist / FORCE_RADIUS) * 0.0012;
      Matter.Body.applyForce(body, body.position, { x: (dx / dist) * force, y: (dy / dist) * force });
    }
  });
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

// ─── RENDER ──────────────────────────────────────────────────────────────────

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function drawPlate(cx, cy) {
  const { circleRadius } = state;

  const grad = ctx.createRadialGradient(cx * 0.8, cy * 0.7, 0, cx, cy, circleRadius * 1.1);
  grad.addColorStop(0, '#faf9f6');
  grad.addColorStop(1, '#eae6de');
  ctx.beginPath();
  ctx.arc(cx, cy, circleRadius, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx, cy, circleRadius, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(0,0,0,0.06)';
  ctx.lineWidth = 2;
  ctx.stroke();

  const vignette = ctx.createRadialGradient(cx, cy, circleRadius * 0.7, cx, cy, circleRadius);
  vignette.addColorStop(0, 'transparent');
  vignette.addColorStop(1, 'rgba(0,0,0,0.06)');
  ctx.beginPath();
  ctx.arc(cx, cy, circleRadius, 0, Math.PI * 2);
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

  // Red tint over the bead
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fillStyle = 'rgba(220, 38, 38, 0.5)';
  c.fill();

  // White badge circle
  const badge = r * 0.52;
  c.beginPath();
  c.arc(x, y, badge, 0, Math.PI * 2);
  c.fillStyle = 'rgba(255,255,255,0.92)';
  c.fill();

  // Trash can drawn with canvas primitives (reliable cross-platform)
  const s = badge * 0.7; // scale unit
  c.fillStyle = '#dc2626';
  c.strokeStyle = '#dc2626';
  c.lineCap = 'round';

  // Handle
  c.fillRect(x - s * 0.22, y - s * 1.05, s * 0.44, s * 0.28);
  // Lid
  c.fillRect(x - s * 0.62, y - s * 0.78, s * 1.24, s * 0.22);
  // Body
  c.beginPath();
  c.moveTo(x - s * 0.5, y - s * 0.56);
  c.lineTo(x - s * 0.42, y + s * 0.72);
  c.lineTo(x + s * 0.42, y + s * 0.72);
  c.lineTo(x + s * 0.5, y - s * 0.56);
  c.closePath();
  c.fill();

  // Vertical stripes inside body
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

function drawBead(x, y, r, beadDef, c = ctx) {
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

  const spec = c.createRadialGradient(x - r * 0.32, y - r * 0.35, 0, x - r * 0.2, y - r * 0.2, r * 0.55);
  spec.addColorStop(0, 'rgba(255,255,255,0.75)');
  spec.addColorStop(0.4, 'rgba(255,255,255,0.2)');
  spec.addColorStop(1, 'rgba(255,255,255,0)');
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fillStyle = spec;
  c.fill();

  const rim = c.createRadialGradient(x, y, r * 0.6, x, y, r);
  rim.addColorStop(0, 'rgba(0,0,0,0)');
  rim.addColorStop(1, 'rgba(0,0,0,0.18)');
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fillStyle = rim;
  c.fill();
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
  // Clip to bounding circle so destination-out stays local
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
  // Upper wings
  c.beginPath();
  c.ellipse(x - w * 0.44, y - w * 0.24, w * 0.52, w * 0.4, -0.4, 0, Math.PI * 2);
  c.fillStyle = color;
  c.fill();
  c.beginPath();
  c.ellipse(x + w * 0.44, y - w * 0.24, w * 0.52, w * 0.4, 0.4, 0, Math.PI * 2);
  c.fill();
  // Lower wings
  c.beginPath();
  c.ellipse(x - w * 0.38, y + w * 0.28, w * 0.38, w * 0.3, 0.32, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.ellipse(x + w * 0.38, y + w * 0.28, w * 0.38, w * 0.3, -0.32, 0, Math.PI * 2);
  c.fill();
  c.shadowColor = 'transparent';
  // Wing sheen
  c.fillStyle = 'rgba(255,255,255,0.24)';
  c.beginPath();
  c.ellipse(x - w * 0.42, y - w * 0.24, w * 0.28, w * 0.2, -0.4, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.ellipse(x + w * 0.42, y - w * 0.24, w * 0.28, w * 0.2, 0.4, 0, Math.PI * 2);
  c.fill();
  // Body
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
  // Yellow centre
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
  // Vertical facet lines
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
  // Rim
  c.beginPath();
  c.arc(x, y, r * 0.86, 0, Math.PI * 2);
  c.strokeStyle = darkenHex(color, 0.18);
  c.lineWidth = r * 0.1;
  c.stroke();
  // Inner ring
  c.beginPath();
  c.arc(x, y, r * 0.58, 0, Math.PI * 2);
  c.strokeStyle = 'rgba(255,255,255,0.22)';
  c.lineWidth = 1.2;
  c.stroke();
  // Star emboss
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
  // Highlight
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
  // Inner hex outline
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

function drawAccessory(x, y, r, def, c = ctx) {
  switch (def.shape) {
    case 'heart':     shapeHeart(c, x, y, r, def.color);    break;
    case 'star':      shapeStar(c, x, y, r, def.color);     break;
    case 'moon':      shapeMoon(c, x, y, r, def.color);     break;
    case 'butterfly': shapeButterfly(c, x, y, r, def.color);break;
    case 'flower':    shapeFlower(c, x, y, r, def.color);   break;
    case 'infinity':  shapeInfinity(c, x, y, r, def.color); break;
    case 'flat-disc': shapeFlatDisc(c, x, y, r, def.color); break;
    case 'rondelle':  shapeRondelle(c, x, y, r, def.color); break;
    case 'coin':      shapeCoin(c, x, y, r, def.color);     break;
    case 'evil-eye':  shapeEvilEye(c, x, y, r, def.color);  break;
    case 'hexagon':   shapeHexagon(c, x, y, r, def.color);  break;
    case 'cross':     shapeCross(c, x, y, r, def.color);    break;
  }
}

function drawItem(x, y, r, def, c = ctx) {
  def.shape ? drawAccessory(x, y, r, def, c) : drawBead(x, y, r, def, c);
}

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

  // Clip all regular drawing to the circular plate region
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
  ctx.restore(); // Remove circular clip

  // Clear the overlay every frame, then draw the outside-dragged bead onto it.
  // The overlay canvas fills the full left panel so the bead is never clipped.
  overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

  // Bracelet mode: dragged bead outside the circle
  if (animationPhase === 'bracelet' && state.draggingBeadIndex >= 0) {
    if (Math.hypot(state.mouseX - cx, state.mouseY - cy) > circleRadius) {
      const b = state.braceletBeads[state.draggingBeadIndex];
      const r = mmToRadius(b.size);
      drawItem(state.overlayMouseX, state.overlayMouseY, r * 1.12, b.beadDef, overlayCtx);
      drawTrashOverlay(state.overlayMouseX, state.overlayMouseY, r * 1.12, overlayCtx);
    }
  }

  // Free mode: manually dragged bead outside the circle
  if (!animationPhase && state.freeDraggingBody) {
    if (Math.hypot(state.mouseX - cx, state.mouseY - cy) > circleRadius) {
      const draggingEntry = state.beadsOnCanvas.find(e => e.body === state.freeDraggingBody);
      const r = draggingEntry ? mmToRadius(draggingEntry.size) : beadRadius();
      drawItem(state.overlayMouseX, state.overlayMouseY, r * 1.12, state.freeDraggingBeadDef, overlayCtx);
      drawTrashOverlay(state.overlayMouseX, state.overlayMouseY, r * 1.12, overlayCtx);
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

  // Draw non-dragged beads first
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

  // Draw dragged bead on top (only when inside the circle; outside is handled by renderLoop)
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

    // Bead being manually dragged — follow the mouse
    if (body === state.freeDraggingBody) {
      Matter.Body.setPosition(body, { x: state.mouseX, y: state.mouseY });
      // Draw inside the circle at a slightly enlarged scale; outside is on the overlay
      if (Math.hypot(state.mouseX - cx, state.mouseY - cy) <= state.circleRadius) {
        drawItem(state.mouseX, state.mouseY, r * 1.12, beadDef);
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

    drawItem(body.position.x, body.position.y, r, beadDef);
    if (idx === state.selectedBeadIndex) drawSelectionRing(body.position.x, body.position.y, r);
  });
}

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────

function updateSidebar() {
  const beads = state.beadsOnCanvas;
  const count = beads.length;
  const total = beads.reduce((sum, b) => sum + b.beadDef.price, 0);
  const lengthCm = (beads.reduce((sum, b) => sum + b.size + 0.5, 0) * 0.1).toFixed(1);

  document.getElementById('beadCountBadge').textContent = `${count} bead${count !== 1 ? 's' : ''}`;
  document.getElementById('priceDisplay').innerHTML = `<span>$</span>${total.toFixed(2)}`;
  document.getElementById('infoCount').textContent = `${count} / 40`;
  document.getElementById('infoLength').textContent = count > 0 ? `~${lengthCm} cm` : '— cm';
  document.getElementById('infoSize').textContent = `${state.beadSize}mm`;

  renderBeadList(beads);
}

function renderBeadList(beads) {
  const list = document.getElementById('beadList');

  if (beads.length === 0) {
    list.innerHTML = '<div class="empty-state"><div class="icon">○</div>Add beads from the picker below</div>';
    return;
  }

  list.innerHTML = '';
  let selectedRow = null;
  beads.forEach((b, idx) => {
    const isSelected = idx === state.selectedBeadIndex;
    const row = document.createElement('div');
    row.className = 'bead-list-item' + (isSelected ? ' selected' : '');

    // ── Top row: dot · name · price · remove ──
    const top = document.createElement('div');
    top.className = 'bead-list-top';

    const dot = document.createElement('div');
    dot.className = 'bead-dot';
    dot.style.background = b.beadDef.gradient
      ? `radial-gradient(circle at 35% 35%, ${b.beadDef.gradient[0]}, ${b.beadDef.gradient[1]})`
      : b.beadDef.color || '#888';

    const name = document.createElement('div');
    name.className = 'bead-list-name';
    name.textContent = `${b.beadDef.name} · ${b.size}mm`;

    const price = document.createElement('div');
    price.className = 'bead-list-price';
    price.textContent = `$${b.beadDef.price.toFixed(2)}`;

    const rm = document.createElement('button');
    rm.className = 'bead-list-remove';
    rm.innerHTML = '×';
    rm.title = 'Remove';
    rm.addEventListener('click', () => { removeBead(idx); });

    top.append(dot, name, price, rm);
    row.appendChild(top);

    // ── Size pills — only for the selected bead ──
    if (isSelected) {
      const sizeBtns = document.createElement('div');
      sizeBtns.className = 'bead-size-btns';
      [6, 10, 12, 14].forEach(mm => {
        const btn = document.createElement('button');
        btn.className = 'bead-size-btn' + (b.size === mm ? ' active' : '');
        btn.textContent = `${mm}mm`;
        btn.addEventListener('click', e => {
          e.stopPropagation();
          resizeBead(idx, mm);
          updateSidebar();
        });
        sizeBtns.appendChild(btn);
      });
      row.appendChild(sizeBtns);
      selectedRow = row;
    }

    list.appendChild(row);
  });
  if (selectedRow) selectedRow.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

// ─── PICKER UI ───────────────────────────────────────────────────────────────

function buildBeadGrid(cat) {
  const grid = document.getElementById('beadGrid');
  grid.innerHTML = '';

  (CATALOGUE[cat] || []).forEach(def => {
    const item = document.createElement('div');
    item.className = 'bead-item';

    if (def.shape) {
      // Accessory — draw shape on a mini canvas
      const pc = document.createElement('canvas');
      pc.width = 46;
      pc.height = 46;
      pc.className = 'accessory-preview';
      drawAccessory(23, 23, 20, def, pc.getContext('2d'));
      item.appendChild(pc);
    } else {
      // Bead — CSS radial gradient sphere
      const preview = document.createElement('div');
      preview.className = 'bead-preview';
      preview.style.background = def.shimmer
        ? `radial-gradient(circle at 35% 35%, #fff 0%, ${def.gradient[0]} 30%, ${def.gradient[1]} 100%)`
        : `radial-gradient(circle at 35% 35%, ${def.gradient[0]}, ${def.gradient[1]})`;
      item.appendChild(preview);
    }

    const name = document.createElement('div');
    name.className = 'bead-name';
    name.textContent = def.name;

    const price = document.createElement('div');
    price.className = 'bead-price';
    price.textContent = `$${def.price}`;

    item.append(name, price);
    item.addEventListener('click', () => spawnBead(def));
    grid.appendChild(item);
  });
}

function buildPickerTabs(supercat) {
  const container = document.getElementById('pickerTabs');
  container.innerHTML = '';
  (SUPERCATS[supercat] || []).forEach((tab, i) => {
    const btn = document.createElement('button');
    btn.className = 'picker-tab' + (i === 0 ? ' active' : '');
    btn.dataset.cat = tab.cat;
    btn.textContent = tab.label;
    btn.addEventListener('click', () => {
      container.querySelectorAll('.picker-tab').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      buildBeadGrid(tab.cat);
    });
    container.appendChild(btn);
  });
  if (SUPERCATS[supercat]?.length) buildBeadGrid(SUPERCATS[supercat][0].cat);
}

// ─── STEP PROGRESS ───────────────────────────────────────────────────────────

function advanceStep(n) {
  for (let i = 1; i <= n; i++) {
    const el = document.getElementById(`step${i}`);
    el.classList.remove('active');
    el.classList.add('done');
  }
  if (n < 3) {
    document.getElementById(`step${n + 1}`).classList.add('active');
  }
}

// ─── EVENT WIRING ────────────────────────────────────────────────────────────

const canvas = document.getElementById('physicsCanvas');
const ctx = canvas.getContext('2d');
const overlayCanvas = document.getElementById('overlayCanvas');
const overlayCtx = overlayCanvas.getContext('2d');

// Shared setup: track the pointer across the whole page during any bead drag.
function setupWindowDrag(finishCallback) {
  windowDragMoveHandler = ev => {
    let clientX, clientY;
    if (ev.touches || ev.changedTouches) {
      const t = ev.touches[0] || ev.changedTouches[0];
      if (!t) return;
      ev.preventDefault();
      clientX = t.clientX;
      clientY = t.clientY;
    } else {
      clientX = ev.clientX;
      clientY = ev.clientY;
    }
    const physRect = canvas.getBoundingClientRect();
    state.mouseX = clientX - physRect.left;
    state.mouseY = clientY - physRect.top;
    const ovRect = overlayCanvas.getBoundingClientRect();
    state.overlayMouseX = clientX - ovRect.left;
    state.overlayMouseY = clientY - ovRect.top;
  };
  window.addEventListener('mousemove', windowDragMoveHandler);
  window.addEventListener('touchmove', windowDragMoveHandler, { passive: false });
  window.addEventListener('mouseup', finishCallback, { once: true });
  window.addEventListener('touchend', finishCallback, { once: true });
}

canvas.addEventListener('mousedown', e => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  // Sync mouseX/Y so tap detection (distance = 0) works even with no mousemove
  state.mouseX = mx;
  state.mouseY = my;
  state.mouseDownX = mx;
  state.mouseDownY = my;
  const cx = state.canvasSize / 2;
  const cy = state.canvasSize / 2;

  if (!state.isBraceletMode) {
    // Free mode: drag a bead outside the circle to remove it
    let hitIdx = -1;
    state.beadsOnCanvas.forEach((entry, i) => {
      const r = mmToRadius(entry.size);
      if (Math.hypot(mx - entry.body.position.x, my - entry.body.position.y) < r * 1.3) hitIdx = i;
    });
    if (hitIdx < 0) {
      // Clicked background — deselect
      if (state.selectedBeadIndex >= 0) { state.selectedBeadIndex = -1; updateSidebar(); }
      return;
    }
    const entry = state.beadsOnCanvas[hitIdx];
    state.freeDraggingBody = entry.body;
    state.freeDraggingBeadDef = entry.beadDef;
    // Freeze the body so Matter.js physics can't move it while we drag manually
    Matter.Body.setStatic(entry.body, true);
    setupWindowDrag(finishFreeDrag);
    return;
  }

  // ── Bracelet mode ──────────────────────────────────────────────────────────
  const brRadius = state.circleRadius * 0.72;

  // Check if the click lands on a bracelet bead
  let hitIndex = -1;
  state.braceletBeads.forEach((b, i) => {
    const r = mmToRadius(b.size);
    const angle = b.targetAngle + state.braceletAngle;
    const bx = cx + Math.cos(angle) * brRadius;
    const by = cy + Math.sin(angle) * brRadius;
    if (Math.hypot(mx - bx, my - by) < r * 1.3) hitIndex = i;
  });

  if (hitIndex >= 0) {
    state.draggingBeadIndex = hitIndex;
    setupWindowDrag(finishBeadDrag);
  } else {
    // Clicked bracelet background — deselect
    if (state.selectedBeadIndex >= 0) { state.selectedBeadIndex = -1; updateSidebar(); }
    state.isDraggingBracelet = true;
    state.dragStartAngle = Math.atan2(my - cy, mx - cx);
  }
  canvas.style.cursor = 'grabbing';
});

canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  state.mouseX = e.clientX - rect.left;
  state.mouseY = e.clientY - rect.top;
  state.mouseInCanvas = true;
  const ovRect = overlayCanvas.getBoundingClientRect();
  state.overlayMouseX = e.clientX - ovRect.left;
  state.overlayMouseY = e.clientY - ovRect.top;

  const cx = state.canvasSize / 2;
  const cy = state.canvasSize / 2;

  if (state.draggingBeadIndex >= 0) {
    // When outside the circle the bead is in "delete zone" — skip slot swapping.
    if (Math.hypot(state.mouseX - cx, state.mouseY - cy) > state.circleRadius) return;

    const n = state.braceletBeads.length;
    const slotSize = (Math.PI * 2) / n;
    const mouseAngle = Math.atan2(state.mouseY - cy, state.mouseX - cx);

    // Signed angular distance from the dragged bead's current slot centre to the mouse.
    // Normalise to (-PI, PI] so we get a true CW/CCW sign.
    const rawDist = mouseAngle - (state.braceletAngle + state.braceletBeads[state.draggingBeadIndex].targetAngle);
    const signedDist = ((rawDist + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;

    // Only ever swap with the single adjacent neighbour the mouse has crossed into.
    // This prevents all-beads-shift-at-once and gives the correct directional feel.
    let targetSlot = state.draggingBeadIndex;
    if (signedDist > slotSize / 2)       targetSlot = (state.draggingBeadIndex + 1) % n;
    else if (signedDist < -slotSize / 2) targetSlot = (state.draggingBeadIndex - 1 + n) % n;

    if (targetSlot !== state.draggingBeadIndex) {
      [state.braceletBeads[state.draggingBeadIndex], state.braceletBeads[targetSlot]] =
        [state.braceletBeads[targetSlot], state.braceletBeads[state.draggingBeadIndex]];
      state.draggingBeadIndex = targetSlot;
      recomputeTargetAngles();
    }
    return;
  }

  if (state.isDraggingBracelet) {
    const currentAngle = Math.atan2(state.mouseY - cy, state.mouseX - cx);
    state.braceletAngle += currentAngle - state.dragStartAngle;
    state.dragStartAngle = currentAngle;
    return;
  }

  if (!state.isBraceletMode && window.matchMedia('(pointer: fine)').matches) {
    const cursor = document.getElementById('cursor');
    cursor.style.display = 'block';
    cursor.style.left = state.mouseX + 'px';
    cursor.style.top = state.mouseY + 'px';
  }
});

canvas.addEventListener('mouseup', () => {
  state.isDraggingBracelet = false;
  finishBeadDrag();
});

canvas.addEventListener('mouseleave', () => {
  state.mouseInCanvas = false;
  document.getElementById('cursor').style.display = 'none';
  // Keep bead drag alive so release outside the canvas still triggers removal.
  if (state.draggingBeadIndex < 0) {
    state.isDraggingBracelet = false;
    canvas.style.cursor = state.isBraceletMode ? 'grab' : 'none';
  }
});

document.getElementById('arrangeBtn').addEventListener('click', () => {
  if (state.isBraceletMode) {
    exitBraceletMode();
  } else if (state.beadsOnCanvas.length > 0) {
    startArranging();
  }
});

document.querySelectorAll('.super-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.super-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    buildPickerTabs(tab.dataset.super);
  });
});

document.querySelectorAll('.size-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.beadSize = parseInt(btn.dataset.size);
    // Resize every existing bead to the new global size
    const n = state.beadsOnCanvas.length;
    for (let i = 0; i < n; i++) resizeBead(i, state.beadSize);
    updateSidebar();
  });
});

document.getElementById('addToCartBtn').addEventListener('click', () => {
  if (state.beadsOnCanvas.length === 0) {
    alert('Please add beads to your bracelet first!');
    return;
  }
  advanceStep(3);
  if (window.ShopifyCustomConfigurator) {
    window.ShopifyCustomConfigurator.addToCart({
      beads: state.beadsOnCanvas.map(b => ({ id: b.beadDef.id, price: b.beadDef.price })),
      beadSize: state.beadSize,
      totalPrice: state.beadsOnCanvas.reduce((s, b) => s + b.beadDef.price, 0),
    });
  } else {
    alert('Design saved! (Shopify integration hook ready)');
  }
});

document.getElementById('saveBtn').addEventListener('click', () => {
  const design = state.beadsOnCanvas.map(b => b.beadDef.id).join(',');
  const url = `${window.location.href.split('?')[0]}?design=${encodeURIComponent(design)}&size=${state.beadSize}`;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(() => alert('Design link copied!'));
  } else {
    prompt('Copy this link to save your design:', url);
  }
});

// ─── TOUCH RELAY ─────────────────────────────────────────────────────────────
// Convert single-finger touch events to the mouse events the canvas handlers
// already understand. bubbles:false prevents window-level mouse handlers from
// double-firing (window touch listeners handle the outside-canvas case).
(function wireTouchRelay() {
  function relay(mouseType) {
    return function(e) {
      e.preventDefault();
      const t = e.changedTouches[0] || e.touches[0];
      if (!t) return;
      canvas.dispatchEvent(new MouseEvent(mouseType, {
        clientX: t.clientX,
        clientY: t.clientY,
        bubbles: false,
        cancelable: true,
      }));
    };
  }
  canvas.addEventListener('touchstart',  relay('mousedown'), { passive: false });
  canvas.addEventListener('touchmove',   relay('mousemove'), { passive: false });
  canvas.addEventListener('touchend',    relay('mouseup'),   { passive: false });
  canvas.addEventListener('touchcancel', relay('mouseup'),   { passive: false });
})();

window.addEventListener('resize', resizeCanvas);

// ─── INIT ────────────────────────────────────────────────────────────────────

resizeCanvas();
initPhysics();
buildPickerTabs('beads');
renderLoop();
