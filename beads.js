// ─── BEAD SIZE HELPERS ────────────────────────────────────────────────────────

function mmToRadius(mm) { return mm * 2.2; }
function beadRadius()   { return mmToRadius(state.beadSize); }

// ─── BEAD SPAWN & REMOVAL ─────────────────────────────────────────────────────

function spawnBead(beadDef) {
  if (state.isBraceletMode) {
    addBeadToBracelet(beadDef);
    return;
  }

  const cx = state.canvasSize / 2;
  const x = cx + (Math.random() - 0.5) * 60;
  const y = cx - state.circleRadius * 0.6 + Math.random() * 20;

  const body = Matter.Bodies.circle(x, y, beadRadius(), {
    restitution: 0.82,
    friction: 0.0,
    frictionAir: 0.003,
    frictionAngular: 0.001,
    density: 0.002,
    label: 'bead',
  });

  Matter.Body.setVelocity(body, { x: (Math.random() - 0.5) * 4, y: Math.random() * 4 + 6 });
  Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.5);
  Matter.World.add(world, body);

  state.beadsOnCanvas.push({ body, beadDef, size: state.beadSize });
  updateSidebar();
  advanceStep(1);
}

function addBeadToBracelet(beadDef) {
  const cx = state.canvasSize / 2;
  const cy = state.canvasSize / 2;

  const body = Matter.Bodies.circle(cx, cy, beadRadius(), {
    restitution: 0.82,
    friction: 0.4,
    frictionAir: 0.003,
    frictionAngular: 0.001,
    density: 0.002,
    label: 'bead',
    isStatic: true,
  });
  Matter.World.add(world, body);

  const entry = { body, beadDef, size: state.beadSize };
  state.beadsOnCanvas.push(entry);

  state.braceletBeads.forEach(b => {
    b.startX = b.body.position.x;
    b.startY = b.body.position.y;
  });

  state.braceletBeads.push({ ...entry, startX: cx, startY: cy });

  recomputeTargetAngles();

  state.draggingBeadIndex = -1;
  state.isDraggingBracelet = false;

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
  if (entry.beadDef.shape) return; // accessories are fixed-size
  if (entry.size === newSizeMm) return;

  const oldBody = entry.body;
  const newRadius = mmToRadius(newSizeMm);
  const pos = oldBody.position;
  const isStatic = oldBody.isStatic;

  const newBody = Matter.Bodies.circle(pos.x, pos.y, newRadius, {
    restitution: 0.82, friction: 0.4, frictionAir: 0.003,
    frictionAngular: 0.001, density: 0.002, label: 'bead', isStatic,
  });
  if (!isStatic) {
    Matter.Body.setVelocity(newBody, oldBody.velocity);
    Matter.Body.setAngularVelocity(newBody, oldBody.angularVelocity);
  }

  Matter.World.remove(world, oldBody);
  Matter.World.add(world, newBody);

  entry.body = newBody;
  entry.size = newSizeMm;

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
  window.removeEventListener('mouseup', finishBeadDrag);
  window.removeEventListener('touchend', finishBeadDrag);
  if (state.draggingBeadIndex >= 0) {
    const cx = state.canvasSize / 2;
    const cy = state.canvasSize / 2;
    const wasTap = Math.hypot(state.mouseX - state.mouseDownX, state.mouseY - state.mouseDownY) < 8;

    if (!wasTap && Math.hypot(state.mouseX - cx, state.mouseY - cy) > state.circleRadius) {
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
    Matter.Body.setStatic(body, false);
    Matter.Body.setVelocity(body, { x: 0, y: 0 });
  } else if (Math.hypot(state.mouseX - cx, state.mouseY - cy) > state.circleRadius) {
    if (idx >= 0) removeBead(idx);
  } else {
    Matter.Body.setStatic(body, false);
    Matter.Body.setVelocity(body, { x: (Math.random() - 0.5) * 2, y: 8 });
    Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.3);
  }

  state.freeDraggingBody = null;
  state.freeDraggingBeadDef = null;
}
