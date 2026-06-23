// ─── DRAG HELPERS ─────────────────────────────────────────────────────────────

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

// ─── BEAD HIT TEST ────────────────────────────────────────────────────────────

function hitTestBead(mx, my) {
  const cx = state.canvasSize / 2;
  const cy = state.canvasSize / 2;

  if (state.isBraceletMode) {
    const brRadius = state.circleRadius * 0.72;
    let result = null;
    state.braceletBeads.forEach(b => {
      const angle = b.targetAngle + state.braceletAngle;
      const bx = cx + Math.cos(angle) * brRadius;
      const by = cy + Math.sin(angle) * brRadius;
      const r  = mmToRadius(b.size);
      if (Math.hypot(mx - bx, my - by) < r * 1.3) {
        const idx = state.beadsOnCanvas.findIndex(e => e.body === b.body);
        if (idx >= 0 && !b.beadDef.shape) result = { idx, canvasX: bx, canvasY: by };
      }
    });
    return result;
  } else {
    let result = null;
    state.beadsOnCanvas.forEach((entry, i) => {
      const { x, y } = entry.body.position;
      const r = mmToRadius(entry.size);
      if (!entry.beadDef.shape && Math.hypot(mx - x, my - y) < r * 1.3) result = { idx: i, canvasX: x, canvasY: y };
    });
    return result;
  }
}

// ─── CANVAS MOUSE EVENTS ─────────────────────────────────────────────────────

canvas.addEventListener('mousedown', e => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  state.mouseX = mx;
  state.mouseY = my;
  state.mouseDownX = mx;
  state.mouseDownY = my;
  const cx = state.canvasSize / 2;
  const cy = state.canvasSize / 2;

  if (!state.isBraceletMode) {
    let hitIdx = -1;
    state.beadsOnCanvas.forEach((entry, i) => {
      const r = mmToRadius(entry.size);
      if (Math.hypot(mx - entry.body.position.x, my - entry.body.position.y) < r * 1.3) hitIdx = i;
    });
    if (hitIdx < 0) {
      if (state.selectedBeadIndex >= 0) { state.selectedBeadIndex = -1; updateSidebar(); }
      return;
    }
    const entry = state.beadsOnCanvas[hitIdx];
    state.freeDraggingBody = entry.body;
    state.freeDraggingBeadDef = entry.beadDef;
    Matter.Body.setStatic(entry.body, true);
    setupWindowDrag(finishFreeDrag);
    return;
  }

  const brRadius = state.circleRadius * 0.72;

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
    if (Math.hypot(state.mouseX - cx, state.mouseY - cy) > state.circleRadius) return;

    const n = state.braceletBeads.length;
    const slotSize = (Math.PI * 2) / n;
    const mouseAngle = Math.atan2(state.mouseY - cy, state.mouseX - cx);

    const rawDist = mouseAngle - (state.braceletAngle + state.braceletBeads[state.draggingBeadIndex].targetAngle);
    const signedDist = ((rawDist + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;

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
  if (state.draggingBeadIndex < 0) {
    state.isDraggingBracelet = false;
    canvas.style.cursor = state.isBraceletMode ? 'grab' : 'none';
  }
});

// ─── BUTTON / TAB EVENTS ──────────────────────────────────────────────────────

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

// ─── SIZE WHEEL EVENTS ────────────────────────────────────────────────────────

canvas.addEventListener('contextmenu', e => {
  e.preventDefault();
  if (state.beadsOnCanvas.length === 0) return;
  const rect = canvas.getBoundingClientRect();
  const sx = state.canvasSize / rect.width;
  const sy = state.canvasSize / rect.height;
  const mx = (e.clientX - rect.left) * sx;
  const my = (e.clientY - rect.top)  * sy;
  const hit = hitTestBead(mx, my);
  if (hit) openSizeWheel(hit.idx, hit.canvasX, hit.canvasY);
});

canvas.addEventListener('touchstart', e => {
  if (state.wheelOpen || e.touches.length !== 1) return;
  const t = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  const sx = state.canvasSize / rect.width;
  const sy = state.canvasSize / rect.height;
  const mx = (t.clientX - rect.left) * sx;
  const my = (t.clientY - rect.top)  * sy;
  const hit = hitTestBead(mx, my);
  if (!hit) return;

  const startX = t.clientX;
  const startY = t.clientY;

  state.wheelLongPressTimer = setTimeout(() => {
    state.wheelLongPressTimer = null;

    if (state.freeDraggingBody) {
      Matter.Body.setStatic(state.freeDraggingBody, false);
      Matter.Body.setVelocity(state.freeDraggingBody, { x: 0, y: 0 });
      state.freeDraggingBody    = null;
      state.freeDraggingBeadDef = null;
    }
    state.draggingBeadIndex = -1;
    if (windowDragMoveHandler) {
      window.removeEventListener('mousemove',  windowDragMoveHandler);
      window.removeEventListener('touchmove',  windowDragMoveHandler);
      windowDragMoveHandler = null;
    }
    window.removeEventListener('mouseup',  finishFreeDrag);
    window.removeEventListener('touchend', finishFreeDrag);
    window.removeEventListener('mouseup',  finishBeadDrag);
    window.removeEventListener('touchend', finishBeadDrag);

    canvas.removeEventListener('touchmove',   onMovePre);
    canvas.removeEventListener('touchend',    onEndPre);
    canvas.removeEventListener('touchcancel', onEndPre);

    openSizeWheel(hit.idx, hit.canvasX, hit.canvasY);

    function onDragMove(ev) {
      if (!state.wheelOpen) return;
      const tt = ev.touches[0];
      if (!tt) return;
      ev.preventDefault();
      const ovRect = overlayCanvas.getBoundingClientRect();
      const dx = tt.clientX - ovRect.left - state.wheelCenterX;
      const dy = tt.clientY - ovRect.top  - state.wheelCenterY;
      const d  = Math.hypot(dx, dy);
      state.wheelHoveredSector = (d >= WHEEL_INNER && d <= WHEEL_OUTER + 12)
        ? getWheelSector(dx, dy) : -1;
    }

    function onDragEnd(ev) {
      canvas.removeEventListener('touchmove',   onDragMove);
      canvas.removeEventListener('touchend',    onDragEnd);
      canvas.removeEventListener('touchcancel', onDragEnd);
      if (!state.wheelOpen) return;
      const tt = ev.changedTouches[0];
      if (tt) {
        const ovRect = overlayCanvas.getBoundingClientRect();
        const dx = tt.clientX - ovRect.left - state.wheelCenterX;
        const dy = tt.clientY - ovRect.top  - state.wheelCenterY;
        const d  = Math.hypot(dx, dy);
        if (d >= WHEEL_INNER && d <= WHEEL_OUTER + 12) {
          resizeBead(state.wheelBeadIndex, WHEEL_SIZES[getWheelSector(dx, dy)]);
          document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
          updateSidebar();
        }
      }
      closeSizeWheel();
    }

    canvas.addEventListener('touchmove',   onDragMove, { passive: false });
    canvas.addEventListener('touchend',    onDragEnd);
    canvas.addEventListener('touchcancel', onDragEnd);
  }, 500);

  function cancelTimer() {
    if (state.wheelLongPressTimer) {
      clearTimeout(state.wheelLongPressTimer);
      state.wheelLongPressTimer = null;
    }
    canvas.removeEventListener('touchmove',   onMovePre);
    canvas.removeEventListener('touchend',    onEndPre);
    canvas.removeEventListener('touchcancel', onEndPre);
  }
  function onMovePre(ev) {
    const tt = ev.touches[0];
    if (!tt || Math.hypot(tt.clientX - startX, tt.clientY - startY) > 8) cancelTimer();
  }
  function onEndPre() { cancelTimer(); }

  canvas.addEventListener('touchmove',   onMovePre,   { passive: true });
  canvas.addEventListener('touchend',    onEndPre,    { once: true });
  canvas.addEventListener('touchcancel', onEndPre,    { once: true });
}, { passive: true });

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSizeWheel(); });

overlayCanvas.addEventListener('mousemove', e => {
  if (!state.wheelOpen) return;
  const rect = overlayCanvas.getBoundingClientRect();
  const dx = e.clientX - rect.left - state.wheelCenterX;
  const dy = e.clientY - rect.top  - state.wheelCenterY;
  const d  = Math.hypot(dx, dy);
  state.wheelHoveredSector = (d >= WHEEL_INNER && d <= WHEEL_OUTER + 12) ? getWheelSector(dx, dy) : -1;
});

overlayCanvas.addEventListener('click', e => {
  if (!state.wheelOpen) return;
  const rect = overlayCanvas.getBoundingClientRect();
  const dx = e.clientX - rect.left - state.wheelCenterX;
  const dy = e.clientY - rect.top  - state.wheelCenterY;
  const d  = Math.hypot(dx, dy);
  if (d >= WHEEL_INNER && d <= WHEEL_OUTER + 12) {
    resizeBead(state.wheelBeadIndex, WHEEL_SIZES[getWheelSector(dx, dy)]);
    document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
    updateSidebar();
  }
  closeSizeWheel();
});

overlayCanvas.addEventListener('touchmove', e => {
  if (!state.wheelOpen) return;
  e.preventDefault();
  const t    = e.touches[0];
  const rect = overlayCanvas.getBoundingClientRect();
  const dx = t.clientX - rect.left - state.wheelCenterX;
  const dy = t.clientY - rect.top  - state.wheelCenterY;
  const d  = Math.hypot(dx, dy);
  state.wheelHoveredSector = (d >= WHEEL_INNER && d <= WHEEL_OUTER + 12) ? getWheelSector(dx, dy) : -1;
}, { passive: false });

overlayCanvas.addEventListener('touchend', e => {
  if (!state.wheelOpen) return;
  const t    = e.changedTouches[0];
  const rect = overlayCanvas.getBoundingClientRect();
  const dx = t.clientX - rect.left - state.wheelCenterX;
  const dy = t.clientY - rect.top  - state.wheelCenterY;
  const d  = Math.hypot(dx, dy);
  if (d >= WHEEL_INNER && d <= WHEEL_OUTER + 12) {
    resizeBead(state.wheelBeadIndex, WHEEL_SIZES[getWheelSector(dx, dy)]);
    document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
    updateSidebar();
  }
  closeSizeWheel();
});

// ─── TOUCH RELAY ─────────────────────────────────────────────────────────────
// Convert single-finger touch events to the mouse events the canvas handlers
// already understand.
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

// ─── INIT ─────────────────────────────────────────────────────────────────────

resizeCanvas();
initPhysics();
buildPickerTabs('beads');
buildTextureGrid();
renderLoop();
