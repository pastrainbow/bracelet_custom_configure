import { create } from 'zustand';
import type { EngineSummary, ItemDef, PlacedItem, StudioMode } from '@/types';
import { DEFAULT_BEAD_SIZE } from '@/config/constants';
import { priceFor, variantFor } from '@/data/pricing';
import type { TextureId } from '@/data/textures';
import type { BraceletEngine } from '@/engine/BraceletEngine';
import {
  encodeDesign,
  toCartLines,
  type AddToCartPayload,
  type ConfiguratorOptions,
} from '@/shopify/integration';
import { writeLocalDraft, type DesignSnapshot } from '@/persistence/autosave';

interface DerivedTotals {
  count: number;
  totalPrice: number;
  lengthCm: number;
}

/** Which control subsection the mobile tab selector currently shows. */
export type MobilePanel = 'add' | 'order';

const ERROR_DURATION_MS = 2600;
let errorTimer: ReturnType<typeof setTimeout> | null = null;

// ─── AUTOSAVE ────────────────────────────────────────────────────────────────
// Every design change persists automatically: to localStorage always, and to
// the host via options.onAutoSave (the Shopify embed syncs logged-in
// customers' drafts to a cart attribute). Disabled until the studio has
// applied any restored draft (enableAutosave), so the initial empty state
// never clobbers a stored design.

const AUTOSAVE_DEBOUNCE_MS = 800;
let autosaveEnabled = false;
let autosaveTimer: ReturnType<typeof setTimeout> | null = null;
/** Signature of the last persisted state, to skip no-op saves (e.g. a
 *  selection change re-emits the engine summary without changing the design). */
let lastSavedSig: string | null = null;
let pagehideHooked = false;

type DesignState = Pick<ConfiguratorState, 'items' | 'beadSize' | 'texture' | 'wristSizeCm'>;

function snapshotOf(state: DesignState): DesignSnapshot {
  return {
    code: encodeDesign(state.items),
    beadSize: state.beadSize,
    texture: state.texture,
    wristSizeCm: state.wristSizeCm,
    updatedAt: Date.now(),
  };
}

function sigOf(s: DesignSnapshot): string {
  return `${s.code}|${s.beadSize}|${s.texture}|${s.wristSizeCm ?? ''}`;
}

interface ConfiguratorState {
  engine: BraceletEngine | null;
  options: ConfiguratorOptions;

  items: PlacedItem[];
  mode: StudioMode;
  selectedId: string | null;
  beadSize: number;
  texture: TextureId;
  /** Shopper's wrist circumference in cm, or null until entered. */
  wristSizeCm: number | null;
  /** Highest completed step (0–3) for the progress tracker. */
  progress: number;
  cartPending: boolean;
  /** False while image-backed sprites are still preloading; gates the studio. */
  catalogueReady: boolean;
  /** Whether the focused share/preview view is open. */
  shareOpen: boolean;
  /** Which control subsection the mobile tab selector shows (mobile only). */
  mobilePanel: MobilePanel;
  /** Transient error toast; `id` changes on each trigger to replay the animation. */
  error: { msg: string; id: number } | null;

  // wiring
  attachEngine: (engine: BraceletEngine | null) => void;
  setOptions: (options: ConfiguratorOptions) => void;
  /** Arm autosave once the studio has applied any restored draft. */
  enableAutosave: () => void;
  setCatalogueReady: (ready: boolean) => void;
  syncFromEngine: (summary: EngineSummary) => void;
  showError: (msg: string) => void;

  // actions (delegate to the engine)
  addItem: (def: ItemDef) => void;
  removeItem: (id: string) => void;
  resizeItem: (id: string, mm: number) => void;
  clearAll: () => void;
  selectItem: (id: string | null) => void;
  /** Size for newly-added beads only (does not touch existing beads). */
  setBeadSize: (mm: number) => void;
  /** Resize every existing bead to the given size. */
  setAllBeadSize: (mm: number) => void;
  setTexture: (id: TextureId) => void;
  setWristSize: (cm: number | null) => void;
  toggleArrange: () => void;
  addToCart: () => Promise<void>;
  saveDesign: () => void;
  openShare: () => void;
  closeShare: () => void;
  setMobilePanel: (panel: MobilePanel) => void;
}

export const useStore = create<ConfiguratorState>((set, get) => ({
  engine: null,
  options: {},

  items: [],
  mode: 'free',
  selectedId: null,
  beadSize: DEFAULT_BEAD_SIZE,
  texture: 'default',
  zoom: 1,
  wristSizeCm: null,
  progress: 0,
  cartPending: false,
  catalogueReady: true,
  shareOpen: false,
  mobilePanel: 'add',
  error: null,

  attachEngine: (engine) => set({ engine }),
  setOptions: (options) => set({ options }),
  setCatalogueReady: (ready) => set({ catalogueReady: ready }),

  enableAutosave: () => {
    // Seed the signature with the just-restored state so restoring alone
    // doesn't trigger a (pointless) save.
    lastSavedSig = sigOf(snapshotOf(get()));
    autosaveEnabled = true;
    if (!pagehideHooked && typeof window !== 'undefined') {
      pagehideHooked = true;
      // Flush a pending debounce when the shopper leaves mid-edit (e.g. the
      // add-to-cart redirect) so the last change isn't lost.
      window.addEventListener('pagehide', () => flushAutosave(get));
    }
  },

  showError: (msg) => {
    if (errorTimer) clearTimeout(errorTimer);
    set({ error: { msg, id: Date.now() } });
    errorTimer = setTimeout(() => set({ error: null }), ERROR_DURATION_MS);
  },

  syncFromEngine: ({ items, mode, selectedId }) => {
    set((prev) => ({
      items,
      mode,
      selectedId,
      progress: Math.max(prev.progress, items.length > 0 ? 1 : 0, mode !== 'free' ? 2 : 0),
    }));
    scheduleAutosave(get);
  },

  // The engine reports overlap rejections via its onError callback (wired to
  // showError), so these actions just delegate.
  addItem: (def) => get().engine?.addItem(def),
  removeItem: (id) => get().engine?.removeItem(id),
  resizeItem: (id, mm) => get().engine?.resizeItem(id, mm),
  clearAll: () => get().engine?.clearAll(),
  selectItem: (id) => get().engine?.selectItem(id),

  setBeadSize: (mm) => {
    // Only changes the size of beads added from now on; existing beads stay.
    set({ beadSize: mm });
    get().engine?.setDefaultBeadSize(mm);
    scheduleAutosave(get);
  },

  setAllBeadSize: (mm) => {
    // Resize every existing bead; rejected if it would exceed the max length.
    const applied = get().engine?.setBeadSize(mm);
    if (applied !== false) set({ beadSize: mm });
    scheduleAutosave(get);
  },

  setTexture: (id) => {
    set({ texture: id });
    get().engine?.setTexture(id);
    scheduleAutosave(get);
  },

  setWristSize: (cm) => {
    set({ wristSizeCm: cm });
    scheduleAutosave(get);
  },

  toggleArrange: () => get().engine?.toggleArrange(),

  openShare: () => set({ shareOpen: true }),
  closeShare: () => set({ shareOpen: false }),
  setMobilePanel: (panel) => set({ mobilePanel: panel }),

  addToCart: async () => {
    const { items, options, wristSizeCm, engine } = get();
    if (items.length === 0) return;

    const totals = selectTotals(get());
    const payload: AddToCartPayload = {
      items: items.map((it) => ({
        id: it.id,
        defId: it.def.id,
        name: it.def.name,
        size: it.size,
        price: priceFor(it.def, it.size),
        variantId: variantFor(it.def, it.size),
      })),
      lines: toCartLines(items),
      beadCount: totals.count,
      totalPrice: totals.totalPrice,
      estimatedLengthCm: totals.lengthCm,
      wristSizeCm,
      designCode: encodeDesign(items),
      previewImage: engine?.renderThumbnail() ?? null,
    };

    set({ progress: 3 });

    if (options.onAddToCart) {
      try {
        set({ cartPending: true });
        await options.onAddToCart(payload);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[BraceletConfigurator] add-to-cart failed', err);
        get().showError(
          err instanceof Error && err.message ? err.message : 'Could not add to cart — please try again.',
        );
      } finally {
        set({ cartPending: false });
      }
    } else {
      // eslint-disable-next-line no-console
      console.info('[BraceletConfigurator] add-to-cart payload', payload);
      window.alert('Design saved! (Shopify integration hook ready)');
    }
  },

  saveDesign: () => {
    const { items, beadSize, options } = get();
    const code = encodeDesign(items);
    const base = window.location.href.split('?')[0];
    const url = `${base}?design=${encodeURIComponent(code)}&size=${beadSize}`;
    options.onSaveDesign?.(code, url);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(
        () => window.alert('Design link copied!'),
        () => window.prompt('Copy this link to save your design:', url),
      );
    } else {
      window.prompt('Copy this link to save your design:', url);
    }
  },
}));

type StateGetter = () => Pick<ConfiguratorState, 'items' | 'beadSize' | 'texture' | 'wristSizeCm' | 'options'>;

function scheduleAutosave(get: StateGetter): void {
  if (!autosaveEnabled) return;
  if (autosaveTimer) clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => {
    autosaveTimer = null;
    flushAutosave(get);
  }, AUTOSAVE_DEBOUNCE_MS);
}

function flushAutosave(get: StateGetter): void {
  if (!autosaveEnabled) return;
  if (autosaveTimer) {
    clearTimeout(autosaveTimer);
    autosaveTimer = null;
  }
  const state = get();
  const snapshot = snapshotOf(state);
  const sig = sigOf(snapshot);
  if (sig === lastSavedSig) return;
  lastSavedSig = sig;
  writeLocalDraft(state.options.customerId, snapshot);
  try {
    void state.options.onAutoSave?.(snapshot);
  } catch (err) {
    // Autosave must never break the studio — log and move on.
    // eslint-disable-next-line no-console
    console.warn('[BraceletConfigurator] autosave hook failed', err);
  }
}

// ─── DERIVED SELECTORS ───────────────────────────────────────────────────────

/** Order summary numbers derived from the placed items. */
export function selectTotals(state: Pick<ConfiguratorState, 'items' | 'beadSize'>): DerivedTotals {
  const { items } = state;
  const count = items.length;
  const totalPrice = items.reduce((sum, it) => sum + priceFor(it.def, it.size), 0);
  // Approximate strung length: bead diameter + ~0.5mm spacing, in cm.
  const lengthCm = items.reduce((sum, it) => sum + it.size + 0.5, 0) * 0.1;
  return { count, totalPrice, lengthCm: Number(lengthCm.toFixed(1)) };
}
