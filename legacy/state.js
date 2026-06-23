// ─── STATE ────────────────────────────────────────────────────────────────────

const state = {
  beadSize: 10,
  beadsOnCanvas: [],   // [{ body, beadDef }]
  braceletBeads: [],   // same entries extended with startX/Y, targetAngle
  braceletAngle: 0,
  backgroundTexture: 'default',
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
  selectedBeadIndex: -1,  // index into beadsOnCanvas of the bead with a visible outline
  // ── size wheel ──
  wheelOpen: false,
  wheelBeadIndex: -1,     // beadsOnCanvas index of the bead the wheel is centred on
  wheelCenterX: 0,        // overlay-canvas coordinates of the wheel centre
  wheelCenterY: 0,
  wheelHoveredSector: -1, // 0-3, or -1 for none
  wheelLongPressTimer: null,
};

// ─── CANVAS REFERENCES ────────────────────────────────────────────────────────

const canvas = document.getElementById('physicsCanvas');
const ctx = canvas.getContext('2d');
const overlayCanvas = document.getElementById('overlayCanvas');
const overlayCtx = overlayCanvas.getContext('2d');

// ─── PHYSICS GLOBALS ─────────────────────────────────────────────────────────

let engine, world, runner;
let windowDragMoveHandler = null;
