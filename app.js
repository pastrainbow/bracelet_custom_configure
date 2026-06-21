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
};

// ─── PHYSICS ─────────────────────────────────────────────────────────────────

let engine, world, runner;

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
}

// ─── BEAD SPAWN & REMOVAL ────────────────────────────────────────────────────

function beadRadius() {
  return state.beadSize * 2.2;
}

function spawnBead(beadDef) {
  if (state.isBraceletMode) exitBraceletMode();

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

  state.beadsOnCanvas.push({ body, beadDef });
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

function drawBead(x, y, r, beadDef) {
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.25)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 3;

  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.05, x, y, r);
  if (beadDef.shimmer) {
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.25, beadDef.gradient[0]);
    g.addColorStop(1, beadDef.gradient[1]);
  } else {
    g.addColorStop(0, lightenHex(beadDef.gradient[0], 0.4));
    g.addColorStop(0.5, beadDef.gradient[0]);
    g.addColorStop(1, beadDef.gradient[1]);
  }

  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.restore();

  const spec = ctx.createRadialGradient(x - r * 0.32, y - r * 0.35, 0, x - r * 0.2, y - r * 0.2, r * 0.55);
  spec.addColorStop(0, 'rgba(255,255,255,0.75)');
  spec.addColorStop(0.4, 'rgba(255,255,255,0.2)');
  spec.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = spec;
  ctx.fill();

  const rim = ctx.createRadialGradient(x, y, r * 0.6, x, y, r);
  rim.addColorStop(0, 'rgba(0,0,0,0)');
  rim.addColorStop(1, 'rgba(0,0,0,0.18)');
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = rim;
  ctx.fill();
}

function lightenHex(hex, amount) {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, (n >> 16) + Math.round(255 * amount));
  const g = Math.min(255, ((n >> 8) & 0xff) + Math.round(255 * amount));
  const b = Math.min(255, (n & 0xff) + Math.round(255 * amount));
  return `rgb(${r},${g},${b})`;
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
  const r = beadRadius();

  ctx.clearRect(0, 0, canvasSize, canvasSize);
  drawPlate(cx, cy);

  if (animationPhase === 'arranging') {
    renderArranging(cx, cy, r);
  } else if (animationPhase === 'bracelet') {
    renderBracelet(cx, cy, r);
  } else {
    renderFreeBeads(cx, cy, r);
  }

  drawWatermark(cx, cy);
}

function renderArranging(cx, cy, r) {
  state.arrangeProgress = Math.min(1, state.arrangeProgress + 0.025);
  const t = easeInOut(state.arrangeProgress);
  const brRadius = state.circleRadius * 0.72;

  state.braceletBeads.forEach(b => {
    const tx = cx + Math.cos(b.targetAngle) * brRadius;
    const ty = cy + Math.sin(b.targetAngle) * brRadius;
    const px = b.startX + (tx - b.startX) * t;
    const py = b.startY + (ty - b.startY) * t;
    Matter.Body.setPosition(b.body, { x: px, y: py });
    drawBead(px, py, r, b.beadDef);
  });

  if (state.arrangeProgress >= 1) {
    state.animationPhase = 'bracelet';
    state.braceletAngle = 0;
  }
}

function renderBracelet(cx, cy, r) {
  const brRadius = state.circleRadius * 0.72;
  const { draggingBeadIndex, mouseX, mouseY } = state;

  drawBraceletThread(cx, cy, brRadius);

  // Draw non-dragged beads first
  state.braceletBeads.forEach((b, i) => {
    if (i === draggingBeadIndex) return;
    const angle = b.targetAngle + state.braceletAngle;
    const x = cx + Math.cos(angle) * brRadius;
    const y = cy + Math.sin(angle) * brRadius;
    Matter.Body.setPosition(b.body, { x, y });
    drawBead(x, y, r, b.beadDef);
  });

  // Draw dragged bead on top, snapped to bracelet circle at mouse angle
  if (draggingBeadIndex >= 0) {
    const b = state.braceletBeads[draggingBeadIndex];
    const mouseAngle = Math.atan2(mouseY - cy, mouseX - cx);
    const x = cx + Math.cos(mouseAngle) * brRadius;
    const y = cy + Math.sin(mouseAngle) * brRadius;
    Matter.Body.setPosition(b.body, { x, y });
    drawBead(x, y, r * 1.12, b.beadDef);  // slightly enlarged to indicate it's held
  }
}

function renderFreeBeads(cx, cy, r) {
  const maxDist = state.circleRadius - r - 4;

  state.beadsOnCanvas.forEach(({ body, beadDef }) => {
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

    drawBead(body.position.x, body.position.y, r, beadDef);
  });
}

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────

function updateSidebar() {
  const beads = state.beadsOnCanvas;
  const count = beads.length;
  const total = beads.reduce((sum, b) => sum + b.beadDef.price, 0);
  const lengthCm = (count * (state.beadSize + 0.5) * 0.1).toFixed(1);

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

  const groups = beads.reduce((acc, b, idx) => {
    const key = b.beadDef.id;
    if (!acc[key]) acc[key] = { beadDef: b.beadDef, count: 0, indices: [] };
    acc[key].count++;
    acc[key].indices.push(idx);
    return acc;
  }, {});

  list.innerHTML = '';
  Object.values(groups).forEach(g => {
    const row = document.createElement('div');
    row.className = 'bead-list-item';

    const dot = document.createElement('div');
    dot.className = 'bead-dot';
    dot.style.background = `radial-gradient(circle at 35% 35%, ${g.beadDef.gradient[0]}, ${g.beadDef.gradient[1]})`;

    const name = document.createElement('div');
    name.className = 'bead-list-name';
    name.textContent = `${g.beadDef.name} × ${g.count}`;

    const price = document.createElement('div');
    price.className = 'bead-list-price';
    price.textContent = `$${(g.beadDef.price * g.count).toFixed(2)}`;

    const rm = document.createElement('button');
    rm.className = 'bead-list-remove';
    rm.innerHTML = '×';
    rm.title = 'Remove one';
    rm.addEventListener('click', () => removeBead(g.indices[g.indices.length - 1]));

    row.append(dot, name, price, rm);
    list.appendChild(row);
  });
}

// ─── PICKER UI ───────────────────────────────────────────────────────────────

function buildBeadGrid(cat) {
  const grid = document.getElementById('beadGrid');
  grid.innerHTML = '';

  (CATALOGUE[cat] || []).forEach(bead => {
    const item = document.createElement('div');
    item.className = 'bead-item';

    const preview = document.createElement('div');
    preview.className = 'bead-preview';
    preview.style.background = bead.shimmer
      ? `radial-gradient(circle at 35% 35%, #fff 0%, ${bead.gradient[0]} 30%, ${bead.gradient[1]} 100%)`
      : `radial-gradient(circle at 35% 35%, ${bead.gradient[0]}, ${bead.gradient[1]})`;

    const name = document.createElement('div');
    name.className = 'bead-name';
    name.textContent = bead.name;

    const price = document.createElement('div');
    price.className = 'bead-price';
    price.textContent = `$${bead.price}`;

    item.append(preview, name, price);
    item.addEventListener('click', () => spawnBead(bead));
    grid.appendChild(item);
  });
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

canvas.addEventListener('mousedown', e => {
  if (!state.isBraceletMode) return;
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  const cx = state.canvasSize / 2;
  const cy = state.canvasSize / 2;
  const brRadius = state.circleRadius * 0.72;
  const r = beadRadius();

  // Check if the click lands on a bracelet bead
  let hitIndex = -1;
  state.braceletBeads.forEach((b, i) => {
    const angle = b.targetAngle + state.braceletAngle;
    const bx = cx + Math.cos(angle) * brRadius;
    const by = cy + Math.sin(angle) * brRadius;
    if (Math.hypot(mx - bx, my - by) < r * 1.3) hitIndex = i;
  });

  if (hitIndex >= 0) {
    state.draggingBeadIndex = hitIndex;
  } else {
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

  const cx = state.canvasSize / 2;
  const cy = state.canvasSize / 2;

  if (state.draggingBeadIndex >= 0) {
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

  if (!state.isBraceletMode) {
    const cursor = document.getElementById('cursor');
    cursor.style.display = 'block';
    cursor.style.left = state.mouseX + 'px';
    cursor.style.top = state.mouseY + 'px';
  }
});

canvas.addEventListener('mouseup', () => {
  state.isDraggingBracelet = false;
  state.draggingBeadIndex = -1;
  canvas.style.cursor = state.isBraceletMode ? 'grab' : 'none';
});

canvas.addEventListener('mouseleave', () => {
  state.mouseInCanvas = false;
  state.isDraggingBracelet = false;
  state.draggingBeadIndex = -1;
  document.getElementById('cursor').style.display = 'none';
  canvas.style.cursor = state.isBraceletMode ? 'grab' : 'none';
});

document.getElementById('arrangeBtn').addEventListener('click', () => {
  if (state.isBraceletMode) {
    exitBraceletMode();
  } else if (state.beadsOnCanvas.length > 0) {
    startArranging();
  }
});

document.querySelectorAll('.picker-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.picker-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    buildBeadGrid(tab.dataset.cat);
  });
});

document.querySelectorAll('.size-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.beadSize = parseInt(btn.dataset.size);
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

window.addEventListener('resize', resizeCanvas);

// ─── INIT ────────────────────────────────────────────────────────────────────

resizeCanvas();
initPhysics();
buildBeadGrid('crystal');
renderLoop();
