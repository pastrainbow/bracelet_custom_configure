import Matter from 'matter-js';
import type { EngineSummary, ItemDef, PlacedItem, StudioMode } from '@/types';
import { isAccessory } from '@/types';
import {
  ARRANGE_SPEED,
  BEAD_SIZES,
  BOWL_RADIUS_RATIO,
  BRACELET_RADIUS_RATIO,
  MAX_BRACELET_LENGTH_CM,
  CANVAS_MAX,
  CANVAS_MIN,
  DEFAULT_BEAD_SIZE,
  HIT_SLOP,
  MAX_DPR,
  PHYSICS,
  REFERENCE_CANVAS,
  TAP_THRESHOLD,
  WHEEL_HIT_PAD,
  WHEEL_SIZES,
} from '@/config/constants';
import type { TextureId } from '@/data/textures';
import { ITEM_BY_ID } from '@/data/catalogue';
import {
  applyPointerRepulsion,
  createBead,
  buildCircularWalls,
  createPhysics,
  type PhysicsWorld,
} from './physics';
import { isWithinWheel, mmToRadius, shortestAngle, wheelSector } from './geometry';
import { drawItem } from './render/item';
import { drawPlate } from './render/textures';
import {
  drawBraceletThread,
  drawSelectionRing,
  drawSizeWheel,
  drawTrashOverlay,
  drawWatermark,
} from './render/overlay';
import { easeInOut } from './render/color';

let nextId = 1;
const makeId = () => `item-${nextId++}`;

const MAX_LENGTH_MSG = `Maximum bracelet length (${MAX_BRACELET_LENGTH_CM} cm) reached`;

// ── Fixed-timestep physics ──
/** One physics step (ms) — physics is integrated in fixed slices for stability. */
const PHYSICS_STEP_MS = 1000 / 60;
/** Largest frame delta we honour; longer (tab was backgrounded) is clamped so
 *  physics never tries to catch up with a huge jump. */
const MAX_FRAME_MS = 1000 / 15;
/** Safety cap on substeps per frame to avoid a spiral of death on slow devices. */
const MAX_SUBSTEPS = 5;

/** Smallest the bracelet ring may shrink to, as a fraction of its max radius —
 *  so a handful of beads still reads as a ring rather than a tiny cluster. */
const MIN_RING_RATIO = 0.3;

/** Internal live item — the serializable parts plus the Matter body & ring data. */
interface LiveItem {
  id: string;
  def: ItemDef;
  size: number;
  body: Matter.Body;
  targetAngle: number;
  startX: number;
  startY: number;
}

type DragKind = 'free' | 'bracelet-bead' | 'rotate';
interface DragState {
  kind: DragKind;
  pointerId: number;
  itemId: string | null;
  startAngle: number;
  downX: number;
  downY: number;
}

interface WheelState {
  open: boolean;
  itemId: string | null;
  cx: number;
  cy: number;
  hovered: number;
}

export interface EngineOptions {
  physicsCanvas: HTMLCanvasElement;
  overlayCanvas: HTMLCanvasElement;
  container: HTMLElement;
  onChange: (summary: EngineSummary) => void;
  /** Surface a transient, user-facing error (e.g. an overlap rejection). */
  onError: (msg: string) => void;
}

/**
 * Owns the imperative physics + canvas world. Frame-by-frame mutation lives
 * here, isolated from React; structural changes are mirrored to the store via
 * `onChange` so the declarative UI stays in sync without per-frame re-renders.
 */
export class BraceletEngine {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly overlay: HTMLCanvasElement;
  private readonly octx: CanvasRenderingContext2D;
  private readonly container: HTMLElement;
  private readonly onChange: (summary: EngineSummary) => void;
  private readonly onError: (msg: string) => void;

  private pw: PhysicsWorld;
  private walls: Matter.Body[] = [];
  private items: LiveItem[] = [];

  private mode: StudioMode = 'free';
  private beadSize: number = DEFAULT_BEAD_SIZE;
  private texture: TextureId = 'default';
  private selectedId: string | null = null;

  private braceletAngle = 0;
  private arrangeProgress = 0;

  private canvasSize = 360;
  private bowlRadius = 160;
  /** Multiplier applied to bead radii so they stay proportional across screens. */
  private beadScale = 360 / REFERENCE_CANVAS;
  /** Extra ≤1 multiplier that shrinks beads so a crowded ring never overlaps. */
  private fitScale = 1;
  /** Current bracelet ring radius (px); sized to the beads by layoutRing. */
  private ringRadius = 160;
  /** fitScale the beads were already shown at when the arrange animation began,
   *  so they ease from their current size (not a jump to full size) to the new fit. */
  private arrangeStartScale = 1;
  private overlayW = 0;
  private overlayH = 0;
  private dpr = 1;

  private pointer = { x: 0, y: 0, overlayX: 0, overlayY: 0, inCanvas: false, fine: true };
  private drag: DragState | null = null;
  private wheel: WheelState = { open: false, itemId: null, cx: 0, cy: 0, hovered: -1 };
  private longPressTimer: number | null = null;

  private rafId = 0;
  private running = false;
  /** rAF timestamp of the previous frame; 0 before the first frame. */
  private lastTime = 0;
  /** Unspent frame time (ms) carried into the next physics step. */
  private accumulator = 0;
  /** Elapsed time (ms) of the current frame, used to time the arrange tween. */
  private frameDt = PHYSICS_STEP_MS;
  /** Whether the overlay canvas currently has anything drawn on it. */
  private overlayHasContent = false;

  constructor(opts: EngineOptions) {
    this.canvas = opts.physicsCanvas;
    this.overlay = opts.overlayCanvas;
    this.container = opts.container;
    this.onChange = opts.onChange;
    this.onError = opts.onError;
    this.ctx = this.canvas.getContext('2d')!;
    this.octx = this.overlay.getContext('2d')!;
    this.pw = createPhysics();
  }

  // ── lifecycle ──────────────────────────────────────────────────────────────

  start(): void {
    if (this.running) return;
    this.running = true;
    this.pointer.fine = window.matchMedia('(pointer: fine)').matches;
    this.resize();
    // Re-size after layout settles, in case the container wasn't measurable yet
    // (dev CSS injection, fonts, fractional grid columns).
    requestAnimationFrame(() => this.resize());
    this.attachListeners();
    this.lastTime = 0;
    this.accumulator = 0;
    this.rafId = requestAnimationFrame(this.loop);
    this.emit();
  }

  destroy(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
    this.detachListeners();
    if (this.longPressTimer) window.clearTimeout(this.longPressTimer);
    Matter.Engine.clear(this.pw.engine);
    Matter.World.clear(this.pw.world, false);
  }

  // ── sizing ───────────────────────────────────────────────────────────────────

  resize(): void {
    // Skip until the container has actually been laid out — otherwise we'd lock
    // in the clamped minimum size (e.g. before dev CSS is injected).
    if (this.container.offsetWidth === 0 || this.container.offsetHeight === 0) return;

    const isMobile = window.matchMedia('(max-width: 639px)').matches;
    const areaW = this.container.offsetWidth;
    let available: number;
    if (isMobile) {
      const wrap = this.container.querySelector<HTMLElement>('[data-canvas-wrap]');
      const wrapH = wrap?.offsetHeight ?? areaW;
      available = Math.min(areaW - 40, wrapH - 40);
    } else {
      available = Math.min(areaW - 40, this.container.offsetHeight - 80);
    }

    const prevSize = this.canvasSize;
    this.canvasSize = Math.max(CANVAS_MIN, Math.min(CANVAS_MAX, available));
    this.bowlRadius = this.canvasSize * BOWL_RADIUS_RATIO;
    // Keep beads proportional to the bowl on every screen size.
    this.beadScale = this.canvasSize / REFERENCE_CANVAS;
    // Cap DPR so high-density phones don't tank the frame rate filling pixels.
    this.dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);

    // Crisp, DPR-aware backing store; drawing happens in CSS pixels.
    this.sizeCanvas(this.canvas, this.ctx, this.canvasSize, this.canvasSize);
    this.canvas.style.width = `${this.canvasSize}px`;
    this.canvas.style.height = `${this.canvasSize}px`;

    this.overlayW = this.container.offsetWidth;
    this.overlayH = this.container.offsetHeight;
    this.sizeCanvas(this.overlay, this.octx, this.overlayW, this.overlayH);

    // Rescale existing beads (size + position) so the layout is identical, just
    // zoomed, when the canvas changes (e.g. window resize / phone rotation).
    if (prevSize > 0 && prevSize !== this.canvasSize && this.items.length > 0) {
      this.rescaleItems(prevSize);
    }

    // Reposition the bowl walls for the new radius.
    Matter.World.remove(this.pw.world, this.walls);
    this.walls = buildCircularWalls(this.canvasSize / 2, this.canvasSize / 2, this.bowlRadius);
    Matter.World.add(this.pw.world, this.walls);

    // The ring radius / fit scale are in canvas pixels, so recompute them for the
    // new size — otherwise the bracelet renders with a stale layout until the
    // next change (too big and out of the bowl, or too small and overlapping).
    this.layoutRing();
  }

  /** Bead/accessory radius (px) for a given diameter, scaled to the canvas. */
  private beadRadius(mm: number): number {
    return mmToRadius(mm) * this.beadScale;
  }

  /** Recreate every bead body, scaling radius and position from the old canvas. */
  private rescaleItems(prevSize: number): void {
    const k = this.canvasSize / prevSize;
    const oldC = prevSize / 2;
    const newC = this.canvasSize / 2;
    for (const item of this.items) {
      const x = newC + (item.body.position.x - oldC) * k;
      const y = newC + (item.body.position.y - oldC) * k;
      const isStatic = item.body.isStatic;
      const velocity = { x: item.body.velocity.x * k, y: item.body.velocity.y * k };
      const angularVelocity = item.body.angularVelocity;

      Matter.World.remove(this.pw.world, item.body);
      const body = createBead(x, y, this.beadRadius(item.size), isStatic);
      if (!isStatic) {
        Matter.Body.setVelocity(body, velocity);
        Matter.Body.setAngularVelocity(body, angularVelocity);
      }
      Matter.World.add(this.pw.world, body);
      item.body = body;

      // Keep the in-flight arrange animation's start points in the new space.
      item.startX = newC + (item.startX - oldC) * k;
      item.startY = newC + (item.startY - oldC) * k;
    }
  }

  private sizeCanvas(c: HTMLCanvasElement, cx: CanvasRenderingContext2D, w: number, h: number): void {
    c.width = Math.round(w * this.dpr);
    c.height = Math.round(h * this.dpr);
    cx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  // ── derived geometry ─────────────────────────────────────────────────────────

  private get center(): number {
    return this.canvasSize / 2;
  }

  /** Largest the bracelet ring may grow (it shrinks toward the beads). */
  private get maxRingRadius(): number {
    return this.bowlRadius * BRACELET_RADIUS_RATIO;
  }

  /** Rendered radius — beads shrink to fit the ring (fitScale) when arranged. */
  private displayRadius(mm: number): number {
    const fit = this.mode === 'free' ? 1 : this.fitScale;
    return this.beadRadius(mm) * fit;
  }

  /**
   * Lay the beads out on the ring with spacing proportional to their sizes, so
   * neighbours just touch (no gaps) regardless of size — a big bead simply takes
   * a wider arc than a small one. Sets each bead's `targetAngle` and the global
   * `fitScale` together, since they're coupled.
   *
   * For touching beads the angle between adjacent centres is
   * `2·asin((rᵢ+rⱼ)/2R)`. We scale all radii by `s ≤ 1` until those angles sum
   * to a full turn (so a crowded ring fills exactly with no gaps); if even at
   * full size the beads don't fill the ring, the leftover is spread evenly so a
   * sparse ring still looks balanced. The geometry is canvas-independent, so the
   * layout is identical on every screen size.
   */
  private layoutRing(): void {
    const n = this.items.length;
    if (n === 0) {
      this.fitScale = 1;
      this.ringRadius = this.maxRingRadius;
      return;
    }

    const FULL = Math.PI * 2;
    const maxR = this.maxRingRadius;
    const minR = maxR * MIN_RING_RATIO;
    const radii = this.items.map((it) => this.beadRadius(it.size));
    const pairSum = (i: number) => radii[i] + radii[(i + 1) % n];
    // Angle between adjacent touching beads of scaled radii on a ring of radius R.
    const gap = (i: number, R: number, s: number) =>
      2 * Math.asin(Math.min(1, (s * pairSum(i)) / (2 * R)));
    const totalAngle = (R: number, s: number) => {
      let sum = 0;
      for (let i = 0; i < n; i++) sum += gap(i, R, s);
      return sum;
    };

    let R: number;
    let s: number;
    if (totalAngle(maxR, 1) >= FULL) {
      // Crowded: ring is at its max and full-size beads overflow — shrink beads.
      R = maxR;
      let lo = 0;
      let hi = 1;
      for (let iter = 0; iter < 40; iter++) {
        const mid = (lo + hi) / 2;
        if (totalAngle(maxR, mid) > FULL) hi = mid;
        else lo = mid;
      }
      s = lo;
    } else {
      // Beads fit with room — shrink the *ring* toward the beads so they touch
      // (a real bracelet is only as big as its beads), down to a sensible min.
      s = 1;
      if (totalAngle(minR, 1) <= FULL) {
        R = minR; // very few beads — can't fill even the smallest ring
      } else {
        let lo = minR;
        let hi = maxR;
        for (let iter = 0; iter < 40; iter++) {
          const mid = (lo + hi) / 2;
          if (totalAngle(mid, 1) > FULL) lo = mid;
          else hi = mid;
        }
        R = hi;
      }
    }

    this.ringRadius = R;
    this.fitScale = s;

    // Spread any leftover evenly (≈0 once the ring is packed and beads touch).
    const extra = Math.max(0, (FULL - totalAngle(R, s)) / n);

    let angle = -Math.PI / 2; // start at the top
    for (let i = 0; i < n; i++) {
      this.items[i].targetAngle = angle;
      angle += gap(i, R, s) + extra;
    }
  }

  /** Estimated strung length (cm) for a set of bead diameters (mm). */
  private lengthOf(sizes: number[]): number {
    return sizes.reduce((sum, mm) => sum + mm + 0.5, 0) * 0.1;
  }

  // ── store sync ─────────────────────────────────────────────────────────────

  private emit(): void {
    // Keep the ring layout (bead angles + fit scale) current with the arrangement.
    this.layoutRing();
    this.onChange(this.getSummary());
  }

  getSummary(): EngineSummary {
    return {
      items: this.items.map<PlacedItem>((it) => ({ id: it.id, def: it.def, size: it.size })),
      mode: this.mode,
      selectedId: this.selectedId,
    };
  }

  /**
   * Draw the current bracelet (beads only, no bowl) centred at (cx, cy), scaled
   * so its outermost edge reaches `outerRadius`. Reuses the live ring layout, so
   * it renders the arranged bracelet regardless of the current mode — used by the
   * share/preview view and its exported image.
   */
  drawBraceletPortrait(ctx: CanvasRenderingContext2D, cx: number, cy: number, outerRadius: number): void {
    const n = this.items.length;
    if (n === 0) return;

    let maxBead = 0;
    for (const it of this.items) {
      const r = this.beadRadius(it.size) * this.fitScale;
      if (r > maxBead) maxBead = r;
    }
    const extent = this.ringRadius + maxBead;
    if (extent <= 0) return;

    const scale = outerRadius / extent;
    const R = this.ringRadius * scale;
    for (const it of this.items) {
      const a = it.targetAngle + this.braceletAngle;
      const x = cx + Math.cos(a) * R;
      const y = cy + Math.sin(a) * R;
      drawItem(ctx, x, y, this.beadRadius(it.size) * this.fitScale * scale, it.def);
    }
  }

  // ── public mutations (called from the UI via the store) ─────────────────────

  /**
   * Add a bead/accessory. Overlap is handled automatically (beads shrink to fit
   * the ring), so the only rejection is exceeding the maximum bracelet length.
   * Returns `false` (adding nothing, and reporting an error) when over the cap.
   */
  addItem(def: ItemDef): boolean {
    const sizes = [...this.items.map((it) => it.size), this.beadSize];
    if (this.lengthOf(sizes) > MAX_BRACELET_LENGTH_CM) {
      this.onError(MAX_LENGTH_MSG);
      return false;
    }
    if (this.mode === 'bracelet' || this.mode === 'arranging') {
      this.addToBracelet(def);
    } else {
      this.spawnFree(def);
    }
    return true;
  }

  removeItem(id: string): void {
    const idx = this.items.findIndex((it) => it.id === id);
    if (idx < 0) return;
    Matter.World.remove(this.pw.world, this.items[idx].body);
    this.items.splice(idx, 1);
    if (this.selectedId === id) this.selectedId = null;

    if (this.mode !== 'free' && this.items.length === 0) this.scatter();
    this.emit(); // re-lays out the ring via layoutRing
  }

  /**
   * Resize one bead. Beads auto-shrink to avoid overlap, so the only rejection
   * is when the larger size would push the estimate over the max length.
   */
  resizeItem(id: string, mm: number): boolean {
    const item = this.items.find((it) => it.id === id);
    if (!item || isAccessory(item.def) || item.size === mm) return false;

    const sizes = this.items.map((it) => (it === item ? mm : it.size));
    if (this.lengthOf(sizes) > MAX_BRACELET_LENGTH_CM) {
      this.onError(MAX_LENGTH_MSG);
      return false;
    }
    this.replaceBody(item, mm);
    this.emit();
    return true;
  }

  /**
   * Set the default size and resize every existing bead to it. Rejected only
   * when the new sizes would push the estimate over the max length.
   */
  setBeadSize(mm: number): boolean {
    const sizes = this.items.map((it) => (isAccessory(it.def) ? it.size : mm));
    if (this.lengthOf(sizes) > MAX_BRACELET_LENGTH_CM) {
      this.onError(MAX_LENGTH_MSG);
      return false;
    }
    this.beadSize = mm;
    for (const item of this.items) {
      if (!isAccessory(item.def) && item.size !== mm) this.replaceBody(item, mm);
    }
    this.emit();
    return true;
  }

  setTexture(id: TextureId): void {
    this.texture = id;
  }

  selectItem(id: string | null): void {
    this.selectedId = id;
    this.emit();
  }

  /** Toggle between the scattered dish and the strung bracelet. */
  toggleArrange(): void {
    if (this.mode === 'free') {
      if (this.items.length > 0) this.startArranging();
    } else {
      this.scatter();
    }
  }

  /** Restore a saved design: a list of {defId, size}. Resets the studio first. */
  loadDesign(entries: { defId: string; size: number }[]): void {
    for (const item of this.items) Matter.World.remove(this.pw.world, item.body);
    this.items = [];
    this.mode = 'free';
    this.selectedId = null;
    for (const { defId, size } of entries) {
      const def = ITEM_BY_ID[defId];
      if (def) this.spawnFree(def, size);
    }
    this.emit();
  }

  // ── spawning ─────────────────────────────────────────────────────────────────

  private spawnFree(def: ItemDef, size = this.beadSize): void {
    const cx = this.center;
    const x = cx + (Math.random() - 0.5) * 60;
    const y = cx - this.bowlRadius * 0.6 + Math.random() * 20;

    const body = createBead(x, y, this.beadRadius(size));
    Matter.Body.setVelocity(body, { x: (Math.random() - 0.5) * 4, y: Math.random() * 4 + 6 });
    Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.5);
    Matter.World.add(this.pw.world, body);

    this.items.push({ id: makeId(), def, size, body, targetAngle: 0, startX: x, startY: y });
    this.emit();
  }

  private addToBracelet(def: ItemDef): void {
    // Capture the size the existing beads are already shown at, before emit()
    // recomputes a (smaller) fitScale, so the animation eases from here.
    this.arrangeStartScale = this.fitScale;

    const c = this.center;
    const body = createBead(c, c, this.beadRadius(this.beadSize), true);
    Matter.World.add(this.pw.world, body);

    // Existing beads animate from their current ring positions.
    for (const item of this.items) {
      item.startX = item.body.position.x;
      item.startY = item.body.position.y;
    }

    this.items.push({
      id: makeId(),
      def,
      size: this.beadSize,
      body,
      targetAngle: 0,
      startX: c,
      startY: c,
    });

    this.drag = null;
    this.braceletAngle = 0;
    this.mode = 'arranging';
    this.arrangeProgress = 0;
    this.emit(); // computes targetAngles + fitScale via layoutRing
  }

  // ── arrange / scatter ────────────────────────────────────────────────────────

  private startArranging(): void {
    // Beads come from the dish at full size, so ease from 1 → fitted size.
    this.arrangeStartScale = 1;
    for (const item of this.items) {
      item.startX = item.body.position.x;
      item.startY = item.body.position.y;
      Matter.Body.setStatic(item.body, true);
    }
    this.mode = 'arranging';
    this.arrangeProgress = 0;
    this.canvas.style.cursor = 'grab';
    this.emit(); // computes targetAngles + fitScale via layoutRing
  }

  private scatter(): void {
    this.mode = 'free';
    this.drag = null;
    this.canvas.style.cursor = 'none';
    for (const item of this.items) {
      Matter.Body.setStatic(item.body, false);
      Matter.Body.setVelocity(item.body, { x: (Math.random() - 0.5) * 4, y: (Math.random() - 0.5) * 4 });
    }
    this.emit();
  }

  // ── body replacement (resize) ────────────────────────────────────────────────

  private replaceBody(item: LiveItem, mm: number): void {
    const old = item.body;
    const isStatic = old.isStatic;
    const body = createBead(old.position.x, old.position.y, this.beadRadius(mm), isStatic);
    if (!isStatic) {
      Matter.Body.setVelocity(body, old.velocity);
      Matter.Body.setAngularVelocity(body, old.angularVelocity);
    }
    Matter.World.remove(this.pw.world, old);
    Matter.World.add(this.pw.world, body);
    item.body = body;
    item.size = mm;
  }

  // ── render loop ──────────────────────────────────────────────────────────────

  private loop = (now: number): void => {
    if (!this.running) return;
    this.rafId = requestAnimationFrame(this.loop);

    // Real elapsed time since the last frame, clamped so a long stall (e.g. the
    // tab was backgrounded) doesn't trigger a huge catch-up.
    if (this.lastTime === 0) this.lastTime = now;
    const dt = Math.min(now - this.lastTime, MAX_FRAME_MS) * PHYSICS.speedMultiplier;
    this.lastTime = now;
    this.frameDt = dt;

    if (this.mode === 'free') {
      // Integrate physics in fixed slices so behaviour is frame-rate independent:
      // a 30fps phone runs two steps per frame and stays at real-time speed.
      this.accumulator += dt;
      const repel = this.pointer.inCanvas && !this.drag;
      const bodies = repel ? this.items.map((it) => it.body) : null;
      let substeps = 0;
      while (this.accumulator >= PHYSICS_STEP_MS && substeps < MAX_SUBSTEPS) {
        if (bodies) applyPointerRepulsion(bodies, { x: this.pointer.x, y: this.pointer.y });
        Matter.Engine.update(this.pw.engine, PHYSICS_STEP_MS);
        this.accumulator -= PHYSICS_STEP_MS;
        substeps += 1;
      }
      // Too slow to keep up — drop the backlog rather than spiral.
      if (substeps >= MAX_SUBSTEPS) this.accumulator = 0;
    } else {
      this.accumulator = 0;
    }

    this.renderScene();
    this.renderOverlay();
  };

  /** Render a single frame on demand (used by tests where rAF is throttled). */
  renderFrame(): void {
    this.frameDt = PHYSICS_STEP_MS;
    this.renderScene();
    this.renderOverlay();
  }

  private renderScene(): void {
    const { ctx } = this;
    const cx = this.center;
    const cy = this.center;

    ctx.clearRect(0, 0, this.canvasSize, this.canvasSize);
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, this.bowlRadius, 0, Math.PI * 2);
    ctx.clip();

    drawPlate(ctx, cx, cy, this.bowlRadius, this.texture);

    if (this.mode === 'arranging') this.renderArranging(cx, cy);
    else if (this.mode === 'bracelet') this.renderBracelet(cx, cy);
    else this.renderFree(cx, cy);

    drawWatermark(ctx, cx, cy);
    ctx.restore();

    // Framed bowl ring (drawn unclipped so its soft shadow reads as a rim).
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, this.bowlRadius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(232,228,222,0.9)';
    ctx.lineWidth = 2;
    ctx.shadowColor = 'rgba(0,0,0,0.10)';
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 2;
    ctx.stroke();
    ctx.restore();
  }

  private renderFree(cx: number, cy: number): void {
    const { ctx } = this;
    const draggingId = this.drag?.kind === 'free' ? this.drag.itemId : null;

    for (const item of this.items) {
      const r = this.beadRadius(item.size);
      const maxDist = this.bowlRadius - r - 4;

      if (item.id === draggingId) {
        Matter.Body.setPosition(item.body, { x: this.pointer.x, y: this.pointer.y });
        if (Math.hypot(this.pointer.x - cx, this.pointer.y - cy) <= this.bowlRadius) {
          drawItem(ctx, this.pointer.x, this.pointer.y, r * 1.12, item.def, item.body.angle);
        }
        continue;
      }

      // Soft radial containment: reflect velocity at the bowl edge.
      const { x, y } = item.body.position;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.hypot(dx, dy);
      if (dist > maxDist) {
        const nx = dx / dist;
        const ny = dy / dist;
        Matter.Body.setPosition(item.body, { x: cx + nx * maxDist, y: cy + ny * maxDist });
        const v = item.body.velocity;
        const dot = v.x * nx + v.y * ny;
        // Reflect only outward motion off the rim, with the bead's restitution
        // (v' = v − (1+e)·(v·n)·n) so the edge bounce matches glass-on-glass.
        if (dot > 0) {
          const bounce = 1 + PHYSICS.wallRestitution;
          Matter.Body.setVelocity(item.body, { x: v.x - bounce * dot * nx, y: v.y - bounce * dot * ny });
        }
      }

      drawItem(ctx, item.body.position.x, item.body.position.y, r, item.def, item.body.angle);
      if (item.id === this.selectedId) {
        drawSelectionRing(ctx, item.body.position.x, item.body.position.y, r);
      }
    }
  }

  private renderArranging(cx: number, cy: number): void {
    const { ctx } = this;
    // Advance by real elapsed time so the tween lasts the same wall-clock
    // duration at any frame rate (ARRANGE_SPEED is calibrated per 60fps frame).
    this.arrangeProgress = Math.min(
      1,
      this.arrangeProgress + ARRANGE_SPEED * (this.frameDt / PHYSICS_STEP_MS),
    );
    const t = easeInOut(this.arrangeProgress);
    const br = this.ringRadius;

    const scale = this.arrangeStartScale + (this.fitScale - this.arrangeStartScale) * t;
    for (const item of this.items) {
      // Ease from the size beads were already at to the fitted ring size.
      const r = this.beadRadius(item.size) * scale;
      const tx = cx + Math.cos(item.targetAngle) * br;
      const ty = cy + Math.sin(item.targetAngle) * br;
      const px = item.startX + (tx - item.startX) * t;
      const py = item.startY + (ty - item.startY) * t;
      Matter.Body.setPosition(item.body, { x: px, y: py });
      drawItem(ctx, px, py, r, item.def);
      if (item.id === this.selectedId) drawSelectionRing(ctx, px, py, r);
    }

    if (this.arrangeProgress >= 1) {
      this.mode = 'bracelet';
      this.braceletAngle = 0;
      this.emit();
    }
  }

  private renderBracelet(cx: number, cy: number): void {
    const { ctx } = this;
    const br = this.ringRadius;
    const draggingId = this.drag?.kind === 'bracelet-bead' ? this.drag.itemId : null;

    drawBraceletThread(ctx, cx, cy, br);

    for (const item of this.items) {
      if (item.id === draggingId) continue;
      const r = this.displayRadius(item.size);
      const angle = item.targetAngle + this.braceletAngle;
      const x = cx + Math.cos(angle) * br;
      const y = cy + Math.sin(angle) * br;
      Matter.Body.setPosition(item.body, { x, y });
      drawItem(ctx, x, y, r, item.def);
      if (item.id === this.selectedId) drawSelectionRing(ctx, x, y, r);
    }

    if (draggingId) {
      const item = this.items.find((it) => it.id === draggingId)!;
      const r = this.displayRadius(item.size);
      const outside = Math.hypot(this.pointer.x - cx, this.pointer.y - cy) > this.bowlRadius;
      if (outside) {
        Matter.Body.setPosition(item.body, { x: this.pointer.x, y: this.pointer.y });
      } else {
        const a = Math.atan2(this.pointer.y - cy, this.pointer.x - cx);
        const x = cx + Math.cos(a) * br;
        const y = cy + Math.sin(a) * br;
        Matter.Body.setPosition(item.body, { x, y });
        drawItem(ctx, x, y, r * 1.12, item.def);
      }
    }
  }

  private renderOverlay(): void {
    const { octx } = this;

    const dragItem = this.draggedItem();
    const showDrag = dragItem !== null && this.pointerOutsideBowl();
    const showCursor =
      this.mode === 'free' && !this.drag && this.pointer.inCanvas && this.pointer.fine;
    const needsContent = this.wheel.open || showDrag || showCursor;

    // The overlay spans the whole panel and is expensive to clear on mobile —
    // skip entirely while it's idle (the common case on touch devices).
    if (!needsContent && !this.overlayHasContent) return;

    octx.clearRect(0, 0, this.overlayW, this.overlayH);
    this.overlayHasContent = needsContent;
    if (!needsContent) return;

    if (this.wheel.open) {
      const cur = this.items.find((it) => it.id === this.wheel.itemId)?.size;
      drawSizeWheel(octx, {
        cx: this.wheel.cx,
        cy: this.wheel.cy,
        hoveredSector: this.wheel.hovered,
        currentSize: cur,
      });
      return;
    }

    // Drag-out-to-delete preview while a bead is held outside the bowl.
    if (showDrag && dragItem) {
      const r = this.displayRadius(dragItem.size);
      drawItem(octx, this.pointer.overlayX, this.pointer.overlayY, r * 1.12, dragItem.def, dragItem.body.angle);
      drawTrashOverlay(octx, this.pointer.overlayX, this.pointer.overlayY, r * 1.12);
    }

    // Custom cursor ring in free mode (fine pointers only).
    if (showCursor) {
      octx.save();
      octx.beginPath();
      octx.arc(this.pointer.overlayX, this.pointer.overlayY, 10, 0, Math.PI * 2);
      octx.strokeStyle = 'rgba(45,45,45,0.5)';
      octx.lineWidth = 2;
      octx.stroke();
      octx.restore();
    }
  }

  private draggedItem(): LiveItem | null {
    if (!this.drag || this.drag.kind === 'rotate' || !this.drag.itemId) return null;
    return this.items.find((it) => it.id === this.drag!.itemId) ?? null;
  }

  private pointerOutsideBowl(): boolean {
    return Math.hypot(this.pointer.x - this.center, this.pointer.y - this.center) > this.bowlRadius;
  }

  // ── pointer plumbing ─────────────────────────────────────────────────────────

  private attachListeners(): void {
    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    this.canvas.addEventListener('pointermove', this.onPointerMove);
    this.canvas.addEventListener('pointerup', this.onPointerUp);
    this.canvas.addEventListener('pointercancel', this.onPointerUp);
    this.canvas.addEventListener('pointerleave', this.onPointerLeave);
    this.overlay.addEventListener('pointermove', this.onWheelMove);
    this.overlay.addEventListener('pointerdown', this.onWheelDown);
    window.addEventListener('keydown', this.onKeyDown);
  }

  private detachListeners(): void {
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('pointerup', this.onPointerUp);
    this.canvas.removeEventListener('pointercancel', this.onPointerUp);
    this.canvas.removeEventListener('pointerleave', this.onPointerLeave);
    this.overlay.removeEventListener('pointermove', this.onWheelMove);
    this.overlay.removeEventListener('pointerdown', this.onWheelDown);
    window.removeEventListener('keydown', this.onKeyDown);
  }

  private updatePointer(e: PointerEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const scale = this.canvasSize / rect.width;
    this.pointer.x = (e.clientX - rect.left) * scale;
    this.pointer.y = (e.clientY - rect.top) * scale;
    const orect = this.overlay.getBoundingClientRect();
    const oscale = this.overlayW / orect.width;
    this.pointer.overlayX = (e.clientX - orect.left) * oscale;
    this.pointer.overlayY = (e.clientY - orect.top) * oscale;
  }

  /** Topmost bead under the pointer, optionally beads-only (for sizing). */
  private hitTest(beadsOnly = false): LiveItem | null {
    const cx = this.center;
    const cy = this.center;
    let found: LiveItem | null = null;
    for (const item of this.items) {
      if (beadsOnly && isAccessory(item.def)) continue;
      let bx: number;
      let by: number;
      if (this.mode === 'bracelet') {
        const a = item.targetAngle + this.braceletAngle;
        bx = cx + Math.cos(a) * this.ringRadius;
        by = cy + Math.sin(a) * this.ringRadius;
      } else {
        bx = item.body.position.x;
        by = item.body.position.y;
      }
      if (Math.hypot(this.pointer.x - bx, this.pointer.y - by) < this.displayRadius(item.size) * HIT_SLOP) {
        found = item;
      }
    }
    return found;
  }

  private onPointerDown = (e: PointerEvent): void => {
    if (this.wheel.open) {
      this.updatePointer(e);

      const hit = this.hitTest(true);

      if (!hit || hit.id !== this.wheel.itemId) {
        this.closeWheel();
      }

      return;
    }
    // Ignore secondary buttons — right-click is handled by `contextmenu`.
    if (e.button !== 0) return;
    this.updatePointer(e);
    this.pointer.inCanvas = true;
    this.canvas.setPointerCapture(e.pointerId);

    const hit = this.hitTest();

    if (this.mode === 'bracelet') {
      if (hit) {
        this.drag = {
          kind: 'bracelet-bead',
          pointerId: e.pointerId,
          itemId: hit.id,
          startAngle: 0,
          downX: this.pointer.x,
          downY: this.pointer.y,
        };
        this.canvas.style.cursor = 'grabbing';
      } else {
        if (this.selectedId) this.selectItem(null);
        this.drag = {
          kind: 'rotate',
          pointerId: e.pointerId,
          itemId: null,
          startAngle: Math.atan2(this.pointer.y - this.center, this.pointer.x - this.center),
          downX: this.pointer.x,
          downY: this.pointer.y,
        };
        this.canvas.style.cursor = 'grabbing';
      }
      return;
    }

    // Free mode.
    if (!hit) {
      if (this.selectedId) this.selectItem(null);
      return;
    }
    Matter.Body.setStatic(hit.body, true);
    this.drag = {
      kind: 'free',
      pointerId: e.pointerId,
      itemId: hit.id,
      startAngle: 0,
      downX: this.pointer.x,
      downY: this.pointer.y,
    };
  };

  private onPointerMove = (e: PointerEvent): void => {
    this.updatePointer(e);
    this.pointer.inCanvas = true;

    if (!this.drag) return;
    const cx = this.center;
    const cy = this.center;

    if (this.drag.kind === 'bracelet-bead') {
      this.handleReorder();
    } else if (this.drag.kind === 'rotate') {
      const a = Math.atan2(this.pointer.y - cy, this.pointer.x - cx);
      this.braceletAngle += a - this.drag.startAngle;
      this.drag.startAngle = a;
    }
    // 'free' drag position is applied during render.
  };

  private handleReorder(): void {
    if (!this.drag || this.pointerOutsideBowl()) return;
    const n = this.items.length;
    const dragIdx = this.items.findIndex((it) => it.id === this.drag!.itemId);
    if (dragIdx < 0) return;

    const cur = this.braceletAngle + this.items[dragIdx].targetAngle;
    const mouseAngle = Math.atan2(this.pointer.y - this.center, this.pointer.x - this.center);
    const signed = shortestAngle(mouseAngle - cur);

    // Swap once the bead is dragged past the midpoint toward a neighbour. Gaps
    // are size-proportional, so use the actual angle to each neighbour.
    const toNext = shortestAngle(this.braceletAngle + this.items[(dragIdx + 1) % n].targetAngle - cur);
    const toPrev = shortestAngle(this.braceletAngle + this.items[(dragIdx - 1 + n) % n].targetAngle - cur);

    let target = dragIdx;
    if (signed > 0 && signed > toNext / 2) target = (dragIdx + 1) % n;
    else if (signed < 0 && signed < toPrev / 2) target = (dragIdx - 1 + n) % n;

    if (target !== dragIdx) {
      [this.items[dragIdx], this.items[target]] = [this.items[target], this.items[dragIdx]];
      this.emit(); // re-lays out the ring via layoutRing
    }
  }

  private onPointerUp = (e: PointerEvent): void => {
    this.updatePointer(e);
    if (this.canvas.hasPointerCapture(e.pointerId)) this.canvas.releasePointerCapture(e.pointerId);

    const drag = this.drag;
    this.drag = null;
    if (!drag) return;

    const wasTap = Math.hypot(this.pointer.x - drag.downX, this.pointer.y - drag.downY) < TAP_THRESHOLD;

    if (drag.itemId) {
      const item = this.items.find((it) => it.id === drag.itemId);

      if (item && wasTap && !isAccessory(item.def)) {
        this.openWheel(item);
      }

      if (item && drag.kind === 'free') {

        if (wasTap) {
          Matter.Body.setStatic(item.body, false);
          Matter.Body.setVelocity(item.body, { x: 0, y: 0 });

        } else if (this.pointerOutsideBowl()) {
          this.removeItem(item.id);
        } else {
          Matter.Body.setStatic(item.body, false);
          Matter.Body.setVelocity(item.body, { x: (Math.random() - 0.5) * 2, y: 8 });
          Matter.Body.setAngularVelocity(item.body, (Math.random() - 0.5) * 0.3);
        }
      
      } else if (drag.kind === 'bracelet-bead') {
        if (!wasTap && this.pointerOutsideBowl()) this.removeItem(drag.itemId);
      }
    }

    this.canvas.style.cursor = this.mode === 'bracelet' ? 'grab' : 'none';
  };

  private onPointerLeave = (): void => {
    this.pointer.inCanvas = false;
  };

  // ── size wheel ───────────────────────────────────────────────────────────────

  private openWheel(item: LiveItem): void {
    // Convert the bead's canvas position into overlay-canvas coordinates.
    const crect = this.canvas.getBoundingClientRect();
    const orect = this.overlay.getBoundingClientRect();
    const scale = crect.width / this.canvasSize;
    let bx: number;
    let by: number;
    if (this.mode === 'bracelet') {
      const a = item.targetAngle + this.braceletAngle;
      bx = this.center + Math.cos(a) * this.ringRadius;
      by = this.center + Math.sin(a) * this.ringRadius;
    } else {
      bx = item.body.position.x;
      by = item.body.position.y;
    }
    this.wheel = {
      open: true,
      itemId: item.id,
      cx: crect.left + bx * scale - orect.left,
      cy: crect.top + by * scale - orect.top,
      hovered: -1,
    };
    this.selectedId = item.id;
    this.overlay.style.pointerEvents = 'auto';
    this.overlay.style.cursor = 'pointer';
    this.emit();
  }

  private closeWheel(): void {
    if (!this.wheel.open) return;
    this.wheel = { open: false, itemId: null, cx: 0, cy: 0, hovered: -1 };
    this.overlay.style.pointerEvents = 'none';
    this.overlay.style.cursor = '';
  }

  private onWheelMove = (e: PointerEvent): void => {
    if (!this.wheel.open) return;
    const rect = this.overlay.getBoundingClientRect();
    const scale = this.overlayW / rect.width;
    const dx = (e.clientX - rect.left) * scale - this.wheel.cx;
    const dy = (e.clientY - rect.top) * scale - this.wheel.cy;
    this.wheel.hovered = isWithinWheel(dx, dy, WHEEL_HIT_PAD) ? wheelSector(dx, dy) : -1;
  };

  private onWheelDown = (e: PointerEvent): void => {
    if (!this.wheel.open) return;
    e.preventDefault();
    const rect = this.overlay.getBoundingClientRect();
    const scale = this.overlayW / rect.width;
    const dx = (e.clientX - rect.left) * scale - this.wheel.cx;
    const dy = (e.clientY - rect.top) * scale - this.wheel.cy;
    if (isWithinWheel(dx, dy, WHEEL_HIT_PAD) && this.wheel.itemId) {
      this.resizeItem(this.wheel.itemId, WHEEL_SIZES[wheelSector(dx, dy)]);
    }
    this.closeWheel();
  };

  private onKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') this.closeWheel();
  };

  // expose available sizes (handy for any consumer)
  static readonly sizes = BEAD_SIZES;
}
