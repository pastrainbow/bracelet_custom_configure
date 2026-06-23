// ─── PHYSICS ─────────────────────────────────────────────────────────────────

function initPhysics() {
  engine = Matter.Engine.create({ gravity: { x: 0, y: 0.6 } });
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
      { isStatic: true, angle, friction: 0.05, restitution: 0.8, label: 'wall' }
    );
  });
}

function resizeCanvas() {
  const area = document.getElementById('canvasArea');
  let available;
  if (window.matchMedia('(max-width: 639px)').matches) {
    // On mobile the button flows below canvas-wrap, so size from wrap height directly
    const wrap = area.querySelector('.canvas-wrap');
    available = Math.min(area.offsetWidth - 40, wrap.offsetHeight - 40);
  } else {
    available = Math.min(area.offsetWidth - 40, area.offsetHeight - 80);
  }
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
