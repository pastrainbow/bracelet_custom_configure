import { create } from 'zustand';
import type { EngineSummary, ItemDef, PlacedItem, StudioMode } from '@/types';
import { isAccessory } from '@/types';
import { DEFAULT_BEAD_SIZE } from '@/config/constants';
import type { TextureId } from '@/data/textures';
import type { BraceletEngine } from '@/engine/BraceletEngine';
import {
  encodeDesign,
  type AddToCartPayload,
  type ConfiguratorOptions,
} from '@/shopify/integration';

interface DerivedTotals {
  count: number;
  totalPrice: number;
  lengthCm: number;
}

const ERROR_DURATION_MS = 2600;
let errorTimer: ReturnType<typeof setTimeout> | null = null;

interface ConfiguratorState {
  engine: BraceletEngine | null;
  options: ConfiguratorOptions;

  items: PlacedItem[];
  mode: StudioMode;
  selectedId: string | null;
  beadSize: number;
  texture: TextureId;
  /** Highest completed step (0–3) for the progress tracker. */
  progress: number;
  cartPending: boolean;
  /** Transient error toast; `id` changes on each trigger to replay the animation. */
  error: { msg: string; id: number } | null;

  // wiring
  attachEngine: (engine: BraceletEngine | null) => void;
  setOptions: (options: ConfiguratorOptions) => void;
  syncFromEngine: (summary: EngineSummary) => void;
  showError: (msg: string) => void;

  // actions (delegate to the engine)
  addItem: (def: ItemDef) => void;
  removeItem: (id: string) => void;
  resizeItem: (id: string, mm: number) => void;
  selectItem: (id: string | null) => void;
  setBeadSize: (mm: number) => void;
  setTexture: (id: TextureId) => void;
  toggleArrange: () => void;
  addToCart: () => Promise<void>;
  saveDesign: () => void;
}

export const useStore = create<ConfiguratorState>((set, get) => ({
  engine: null,
  options: {},

  items: [],
  mode: 'free',
  selectedId: null,
  beadSize: DEFAULT_BEAD_SIZE,
  texture: 'default',
  progress: 0,
  cartPending: false,
  error: null,

  attachEngine: (engine) => set({ engine }),
  setOptions: (options) => set({ options }),

  showError: (msg) => {
    if (errorTimer) clearTimeout(errorTimer);
    set({ error: { msg, id: Date.now() } });
    errorTimer = setTimeout(() => set({ error: null }), ERROR_DURATION_MS);
  },

  syncFromEngine: ({ items, mode, selectedId }) =>
    set((prev) => ({
      items,
      mode,
      selectedId,
      progress: Math.max(prev.progress, items.length > 0 ? 1 : 0, mode !== 'free' ? 2 : 0),
    })),

  // The engine reports overlap rejections via its onError callback (wired to
  // showError), so these actions just delegate.
  addItem: (def) => get().engine?.addItem(def),
  removeItem: (id) => get().engine?.removeItem(id),
  resizeItem: (id, mm) => get().engine?.resizeItem(id, mm),
  selectItem: (id) => get().engine?.selectItem(id),

  setBeadSize: (mm) => {
    // Only commit the selected size if the engine actually applied it (a size
    // increase that would overlap beads is rejected).
    const applied = get().engine?.setBeadSize(mm);
    if (applied !== false) set({ beadSize: mm });
  },

  setTexture: (id) => {
    set({ texture: id });
    get().engine?.setTexture(id);
  },

  toggleArrange: () => get().engine?.toggleArrange(),

  addToCart: async () => {
    const { items, options } = get();
    if (items.length === 0) return;

    const totals = selectTotals(get());
    const payload: AddToCartPayload = {
      items: items.map((it) => ({
        id: it.id,
        defId: it.def.id,
        name: it.def.name,
        size: it.size,
        price: it.def.price,
      })),
      beadCount: totals.count,
      totalPrice: totals.totalPrice,
      estimatedLengthCm: totals.lengthCm,
      designCode: encodeDesign(items),
    };

    set({ progress: 3 });

    if (options.onAddToCart) {
      try {
        set({ cartPending: true });
        await options.onAddToCart(payload);
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

// ─── DERIVED SELECTORS ───────────────────────────────────────────────────────

/** Order summary numbers derived from the placed items. */
export function selectTotals(state: Pick<ConfiguratorState, 'items' | 'beadSize'>): DerivedTotals {
  const { items } = state;
  const count = items.length;
  const totalPrice = items.reduce((sum, it) => sum + it.def.price, 0);
  // Approximate strung length: bead diameter + ~0.5mm spacing, in cm.
  const lengthCm = items.reduce((sum, it) => sum + it.size + 0.5, 0) * 0.1;
  return { count, totalPrice, lengthCm: Number(lengthCm.toFixed(1)) };
}
