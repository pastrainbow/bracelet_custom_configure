import type { TextureId } from '@/data/textures';
import type { ConfiguratorOptions } from '@/shopify/integration';

/**
 * A point-in-time capture of everything needed to rebuild the shopper's
 * design. Saved automatically (debounced) on every design change: always to
 * localStorage, and — when the host wires `onAutoSave` — to remote storage
 * (the Shopify embed pushes it to a cart attribute so it follows the
 * logged-in customer's cart).
 */
export interface DesignSnapshot {
  /** Compact design code (`defId@size,…`) — same encoding as share links. */
  code: string;
  /** Default size for newly-added beads, in mm. */
  beadSize: number;
  texture: TextureId;
  wristSizeCm: number | null;
  /** Epoch ms when saved; picks the newer of local vs account drafts. */
  updatedAt: number;
}

/** What the studio applies on mount. Optional fields are left untouched. */
export interface RestoreDesign {
  code: string;
  beadSize?: number;
  texture?: TextureId;
  wristSizeCm?: number | null;
}

const KEY_PREFIX = 'bracelet-design-draft';

function draftKey(customerId?: string | number | null): string {
  return `${KEY_PREFIX}:${customerId ?? 'guest'}`;
}

/** Validate untrusted snapshot data (localStorage, cart attributes). */
export function sanitizeSnapshot(value: unknown): DesignSnapshot | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Partial<DesignSnapshot>;
  if (typeof v.code !== 'string' || typeof v.updatedAt !== 'number') return null;
  return {
    code: v.code,
    beadSize: typeof v.beadSize === 'number' && v.beadSize > 0 ? v.beadSize : 0,
    texture: typeof v.texture === 'string' ? (v.texture as TextureId) : 'default',
    wristSizeCm: typeof v.wristSizeCm === 'number' ? v.wristSizeCm : null,
    updatedAt: v.updatedAt,
  };
}

function readKey(key: string): DesignSnapshot | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? sanitizeSnapshot(JSON.parse(raw)) : null;
  } catch {
    // Storage disabled (private mode) or corrupt JSON — treat as no draft.
    return null;
  }
}

/**
 * Read the local draft. For a logged-in customer, a draft they made while
 * browsing as a guest (before logging in, same browser) is also considered,
 * so logging in never "loses" the design on screen — the newest wins.
 */
export function readLocalDraft(customerId?: string | number | null): DesignSnapshot | null {
  const own = readKey(draftKey(customerId));
  if (customerId == null) return own;
  const guest = readKey(draftKey(null));
  if (!own) return guest;
  if (!guest) return own;
  return guest.updatedAt > own.updatedAt ? guest : own;
}

export function writeLocalDraft(
  customerId: string | number | null | undefined,
  snapshot: DesignSnapshot,
): void {
  try {
    window.localStorage.setItem(draftKey(customerId), JSON.stringify(snapshot));
  } catch {
    // Storage unavailable — remote autosave (onAutoSave) still runs.
  }
}

/**
 * Decide what design (if any) to load on mount, in priority order:
 *   1. an explicit `initialDesign` mount option,
 *   2. a `?design=` share link (also carries `&size=`),
 *   3. the newest of the host-restored draft (`savedDesign`, e.g. from the
 *      customer's cart) and the localStorage draft.
 */
export function resolveRestoreDesign(
  options: Pick<ConfiguratorOptions, 'initialDesign' | 'savedDesign' | 'customerId'>,
): RestoreDesign | null {
  if (options.initialDesign) return { code: options.initialDesign };

  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('design');
    if (code) {
      const size = Number(params.get('size'));
      return { code, beadSize: Number.isFinite(size) && size > 0 ? size : undefined };
    }
  }

  const local = readLocalDraft(options.customerId);
  const remote = sanitizeSnapshot(options.savedDesign);
  const newest =
    local && remote ? (remote.updatedAt > local.updatedAt ? remote : local) : (local ?? remote);
  if (!newest) return null;
  return {
    code: newest.code,
    beadSize: newest.beadSize > 0 ? newest.beadSize : undefined,
    texture: newest.texture,
    wristSizeCm: newest.wristSizeCm,
  };
}
