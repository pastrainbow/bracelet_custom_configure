import Matter from 'matter-js';
import type { EngineSummary, ItemDef, PlacedItem, StudioMode } from '@/types';
import { isAccessory } from '@/types';
import {
  ARRANGE_SPEED,
  BEAD_SIZES,
  BOWL_RADIUS_RATIO,
  BRACELET_RADIUS_RATIO,
  CANVAS_MAX,
  CANVAS_MIN,
  DEFAULT_BEAD_SIZE,
  HIT_SLOP,
  LONG_PRESS_MS,
  TAP_THRESHOLD,
  WHEEL_HIT_PAD,
  WHEEL_SIZES,
} from '@/config/constants';
import type { TextureId } from '@/data/textures';
import { ITEM_BY_ID } from '@/data/catalogue';
import {
  applyPointerRepulsion,
  beadBodyOptions,
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
  private overlayW = 0;
  private overlayH = 0;
  private dpr = 1;

  private pointer = { x: 0, y: 0, overlayX: 0, overlayY: 0, inCanvas: false, fine: true };
  private drag: DragState | null = null;
  private wheel: WheelState = { open: false, itemId: null, cx: 0, cy: 0, hovered: -1 };
  private longPressTimer: number | null = null;

  private rafId = 0;
  private running = false;

  constructor(opts: EngineOptions) {
    this.canvas = opts.physicsCanvas;
    this.overlay = opts.overlayCanvas;
    this.container = opts.container;
    this.onChange = opts.onChange;
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
    this.loop();
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

    this.canvasSize = Math.max(CANVAS_MIN, Math.min(CANVAS_MAX, available));
    this.bowlRadius = this.canvasSize * BOWL_RADIUS_RATIO;
    this.dpr = window.devicePixelRatio || 1;

    // Crisp, DPR-aware backing store; drawing happens in CSS pixels.
    this.sizeCanvas(this.canvas, this.ctx, this.canvasSize, this.canvasSize);
    this.canvas.style.width = `${this.canvasSize}px`;
    this.canvas.style.height = `${this.canvasSize}px`;

    this.overlayW = this.container.offsetWidth;
    this.overlayH = this.container.offsetHeight;
    this.sizeCanvas(this.overlay, this.octx, this.overlayW, this.overlayH);

    // Reposition the bowl walls for the new radius.
    Matter.World.remove(this.pw.world, this.walls);
    this.walls = buildCircularWalls(this.canvasSize / 2, this.canvasSize / 2, this.bowlRadius);
    Matter.World.add(this.pw.world, this.walls);
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

  private get braceletRadius(): number {
    return this.bowlRadius * BRACELET_RADIUS_RATIO;
  }

  // ── store sync ─────────────────────────────────────────────────────────────

  private emit(): void {
    this.onChange(this.getSummary());
  }

  getSummary(): EngineSummary {
    return {
      items: this.items.map<PlacedItem>((it) => ({ id: it.id, def: it.def, size: it.size })),
      mode: this.mode,
      selectedId: this.selectedId,
    };
  }

  // ── public mutations (called from the UI via the store) ─────────────────────

  addItem(def: ItemDef): void {
    if (this.mode === 'bracelet' || this.mode === 'arranging') {
      this.addToBracelet(def);
    } else {
      this.spawnFree(def);
    }
  }

  removeItem(id: string): void {
    const idx = this.items.findIndex((it) => it.id === id);
    if (idx < 0) return;
    Matter.World.remove(this.pw.world, this.items[idx].body);
    this.items.splice(idx, 1);
    if (this.selectedId === id) this.selectedId = null;

    if (this.mode !== 'free') {
      if (this.items.length === 0) this.scatter();
      else this.recomputeTargetAngles();
    }
    this.emit();
  }

  resizeItem(id: string, mm: number): void {
    const item = this.items.find((it) => it.id === id);
    if (!item || isAccessory(item.def) || item.size === mm) return;
    this.replaceBody(item, mm);
    this.emit();
  }

  setBeadSize(mm: number): void {
    this.beadSize = mm;
    for (const item of this.items) {
      if (!isAccessory(item.def) && item.size !== mm) this.replaceBody(item, mm);
    }
    this.emit();
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

    const body = Matter.Bodies.circle(x, y, mmToRadius(size), beadBodyOptions());
    Matter.Body.setVelocity(body, { x: (Math.random() - 0.5) * 4, y: Math.random() * 4 + 6 });
    Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.5);
    Matter.World.add(this.pw.world, body);

    this.items.push({ id: makeId(), def, size, body, targetAngle: 0, startX: x, startY: y });
    this.emit();
  }

  private addToBracelet(def: ItemDef): void {
    const c = this.center;
    const body = Matter.Bodies.circle(c, c, mmToRadius(this.beadSize), beadBodyOptions(true));
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

    this.recomputeTargetAngles();
    this.drag = null;
    this.braceletAngle = 0;
    this.mode = 'arranging';
    this.arrangeProgress = 0;
    this.emit();
  }

  // ── arrange / scatter ────────────────────────────────────────────────────────

  private startArranging(): void {
    const n = this.items.length;
    this.items.forEach((item, i) => {
      item.startX = item.body.position.x;
      item.startY = item.body.position.y;
      item.targetAngle = (i / n) * Math.PI * 2 - Math.PI / 2;
      Matter.Body.setStatic(item.body, true);
    });
    this.mode = 'arranging';
    this.arrangeProgress = 0;
    this.canvas.style.cursor = 'grab';
    this.emit();
  }

  private recomputeTargetAngles(): void {
    const n = this.items.length;
    this.items.forEach((item, i) => {
      item.targetAngle = (i / n) * Math.PI * 2 - Math.PI / 2;
    });
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
    const body = Matter.Bodies.circle(old.position.x, old.position.y, mmToRadius(mm), beadBodyOptions(isStatic));
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

  private loop = (): void => {
    if (!this.running) return;
    this.rafId = requestAnimationFrame(this.loop);

    if (this.mode === 'free') {
      Matter.Engine.update(this.pw.engine, 1000 / 60);
      if (this.pointer.inCanvas && !this.drag) {
        applyPointerRepulsion(
          this.items.map((it) => it.body),
          { x: this.pointer.x, y: this.pointer.y },
        );
      }
    }

    this.renderScene();
    this.renderOverlay();
  };

  /** Render a single frame on demand (used by tests where rAF is throttled). */
  renderFrame(): void {
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
      const r = mmToRadius(item.size);
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
        Matter.Body.setVelocity(item.body, { x: v.x - 1.8 * dot * nx, y: v.y - 1.8 * dot * ny });
      }

      drawItem(ctx, item.body.position.x, item.body.position.y, r, item.def, item.body.angle);
      if (item.id === this.selectedId) {
        drawSelectionRing(ctx, item.body.position.x, item.body.position.y, r);
      }
    }
  }

  private renderArranging(cx: number, cy: number): void {
    const { ctx } = this;
    this.arrangeProgress = Math.min(1, this.arrangeProgress + ARRANGE_SPEED);
    const t = easeInOut(this.arrangeProgress);
    const br = this.braceletRadius;

    for (const item of this.items) {
      const r = mmToRadius(item.size);
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
    const br = this.braceletRadius;
    const draggingId = this.drag?.kind === 'bracelet-bead' ? this.drag.itemId : null;

    drawBraceletThread(ctx, cx, cy, br);

    for (const item of this.items) {
      if (item.id === draggingId) continue;
      const r = mmToRadius(item.size);
      const angle = item.targetAngle + this.braceletAngle;
      const x = cx + Math.cos(angle) * br;
      const y = cy + Math.sin(angle) * br;
      Matter.Body.setPosition(item.body, { x, y });
      drawItem(ctx, x, y, r, item.def);
      if (item.id === this.selectedId) drawSelectionRing(ctx, x, y, r);
    }

    if (draggingId) {
      const item = this.items.find((it) => it.id === draggingId)!;
      const r = mmToRadius(item.size);
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
    octx.clearRect(0, 0, this.overlayW, this.overlayH);

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
    const dragItem = this.draggedItem();
    if (dragItem && this.pointerOutsideBowl()) {
      const r = mmToRadius(dragItem.size);
      drawItem(octx, this.pointer.overlayX, this.pointer.overlayY, r * 1.12, dragItem.def, dragItem.body.angle);
      drawTrashOverlay(octx, this.pointer.overlayX, this.pointer.overlayY, r * 1.12);
    }

    // Custom cursor ring in free mode (fine pointers only).
    if (this.mode === 'free' && !this.drag && this.pointer.inCanvas && this.pointer.fine) {
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
    this.canvas.addEventListener('contextmenu', this.onContextMenu);
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
    this.canvas.removeEventListener('contextmenu', this.onContextMenu);
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
        bx = cx + Math.cos(a) * this.braceletRadius;
        by = cy + Math.sin(a) * this.braceletRadius;
      } else {
        bx = item.body.position.x;
        by = item.body.position.y;
      }
      if (Math.hypot(this.pointer.x - bx, this.pointer.y - by) < mmToRadius(item.size) * HIT_SLOP) {
        found = item;
      }
    }
    return found;
  }

  private onPointerDown = (e: PointerEvent): void => {
    if (this.wheel.open) return;
    // Ignore secondary buttons — right-click is handled by `contextmenu`.
    if (e.button !== 0) return;
    this.updatePointer(e);
    this.pointer.inCanvas = true;
    this.canvas.setPointerCapture(e.pointerId);

    // Long-press opens the size wheel on touch / pen.
    if (e.pointerType !== 'mouse') this.startLongPress();

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

    if (this.drag && this.movedFarEnough()) this.cancelLongPress();

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
    const slot = (Math.PI * 2) / n;
    const dragIdx = this.items.findIndex((it) => it.id === this.drag!.itemId);
    if (dragIdx < 0) return;

    const mouseAngle = Math.atan2(this.pointer.y - this.center, this.pointer.x - this.center);
    const signed = shortestAngle(mouseAngle - (this.braceletAngle + this.items[dragIdx].targetAngle));

    let target = dragIdx;
    if (signed > slot / 2) target = (dragIdx + 1) % n;
    else if (signed < -slot / 2) target = (dragIdx - 1 + n) % n;

    if (target !== dragIdx) {
      [this.items[dragIdx], this.items[target]] = [this.items[target], this.items[dragIdx]];
      this.recomputeTargetAngles();
      this.emit();
    }
  }

  private onPointerUp = (e: PointerEvent): void => {
    this.cancelLongPress();
    this.updatePointer(e);
    if (this.canvas.hasPointerCapture(e.pointerId)) this.canvas.releasePointerCapture(e.pointerId);

    const drag = this.drag;
    this.drag = null;
    if (!drag) return;

    const wasTap = Math.hypot(this.pointer.x - drag.downX, this.pointer.y - drag.downY) < TAP_THRESHOLD;

    if (drag.kind === 'free' && drag.itemId) {
      const item = this.items.find((it) => it.id === drag.itemId);
      if (item) {
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
      }
    } else if (drag.kind === 'bracelet-bead' && drag.itemId) {
      if (!wasTap && this.pointerOutsideBowl()) this.removeItem(drag.itemId);
    }

    this.canvas.style.cursor = this.mode === 'bracelet' ? 'grab' : 'none';
  };

  private onPointerLeave = (): void => {
    this.pointer.inCanvas = false;
  };

  private movedFarEnough(): boolean {
    if (!this.drag) return false;
    return Math.hypot(this.pointer.x - this.drag.downX, this.pointer.y - this.drag.downY) > TAP_THRESHOLD;
  }

  // ── size wheel ───────────────────────────────────────────────────────────────

  private onContextMenu = (e: MouseEvent): void => {
    e.preventDefault();
    if (this.items.length === 0) return;
    const rect = this.canvas.getBoundingClientRect();
    const scale = this.canvasSize / rect.width;
    this.pointer.x = (e.clientX - rect.left) * scale;
    this.pointer.y = (e.clientY - rect.top) * scale;
    const hit = this.hitTest(true);
    if (hit) this.openWheel(hit);
  };

  private startLongPress(): void {
    this.cancelLongPress();
    this.longPressTimer = window.setTimeout(() => {
      this.longPressTimer = null;
      const hit = this.hitTest(true);
      if (!hit) return;
      // Abandon any in-progress drag in favour of the wheel.
      if (this.drag?.kind === 'free' && this.drag.itemId) {
        const item = this.items.find((it) => it.id === this.drag!.itemId);
        if (item) {
          Matter.Body.setStatic(item.body, false);
          Matter.Body.setVelocity(item.body, { x: 0, y: 0 });
        }
      }
      this.drag = null;
      this.openWheel(hit);
    }, LONG_PRESS_MS);
  }

  private cancelLongPress(): void {
    if (this.longPressTimer) {
      window.clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  private openWheel(item: LiveItem): void {
    // Convert the bead's canvas position into overlay-canvas coordinates.
    const crect = this.canvas.getBoundingClientRect();
    const orect = this.overlay.getBoundingClientRect();
    const scale = crect.width / this.canvasSize;
    let bx: number;
    let by: number;
    if (this.mode === 'bracelet') {
      const a = item.targetAngle + this.braceletAngle;
      bx = this.center + Math.cos(a) * this.braceletRadius;
      by = this.center + Math.sin(a) * this.braceletRadius;
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
