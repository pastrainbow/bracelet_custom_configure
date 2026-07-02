import type { PlacedItem, RawCatalogue } from '@/types';
import { priceFor, variantFor } from '@/data/pricing';

/**
 * One `/cart/add.js` line: a Shopify variant with a quantity. The design is
 * priced by adding each component's real variant to the cart, so the cart
 * total is exactly the sum the widget displayed — no app or draft order.
 */
export interface CartLine {
  /** Shopify variant id, or null when the catalogue carries none (stub/dev). */
  variantId: number | null;
  defId: string;
  name: string;
  /** Diameter in mm (accessories report the placed size; they're one-size). */
  size: number;
  quantity: number;
  /** Unit price as displayed in the widget (the variant's Shopify price). */
  unitPrice: number;
}

/** Payload handed to the host (Shopify) when the shopper adds their design. */
export interface AddToCartPayload {
  /** One entry per placed bead/accessory, in bracelet order. */
  items: { id: string; defId: string; name: string; size: number; price: number; variantId: number | null }[];
  /**
   * `items` aggregated by Shopify variant, ready to POST to `/cart/add.js`
   * so the cart charges the real per-component prices.
   */
  lines: CartLine[];
  beadCount: number;
  totalPrice: number;
  estimatedLengthCm: number;
  /** Shopper's wrist circumference in cm, or null if not provided. */
  wristSizeCm: number | null;
  /** Compact, shareable encoding of the design (defId@size,defId@size,…). */
  designCode: string;
  /**
   * Small JPEG render of the arranged bracelet as a data URL (~10–25 KB), or
   * null when unavailable. The Shopify cart handler stores it in a hidden
   * line-item property so the cart can show the designed bracelet as the
   * product image of the grouped "Custom Bracelet" line.
   */
  previewImage: string | null;
}

/** Aggregate placed items into cart lines, one per distinct Shopify variant
 *  (items without a variant id group by defId+size so they still count). */
export function toCartLines(items: PlacedItem[]): CartLine[] {
  const lines = new Map<string, CartLine>();
  for (const it of items) {
    const variantId = variantFor(it.def, it.size);
    const key = variantId !== null ? `v:${variantId}` : `d:${it.def.id}@${it.size}`;
    const line = lines.get(key);
    if (line) {
      line.quantity += 1;
    } else {
      lines.set(key, {
        variantId,
        defId: it.def.id,
        name: it.def.name,
        size: it.size,
        quantity: 1,
        unitPrice: priceFor(it.def, it.size),
      });
    }
  }
  return [...lines.values()];
}

/** Options supplied when mounting the widget into a Shopify theme. */
export interface ConfiguratorOptions {
  /**
   * Called when the shopper clicks "Add to Cart". Return a promise to keep the
   * button in a pending state until the host finishes (e.g. an AJAX cart add).
   * If omitted, a default handler logs the payload and shows a confirmation.
   */
  onAddToCart?: (payload: AddToCartPayload) => void | Promise<void>;
  /** Called when the shopper saves/share their design (receives a deep link). */
  onSaveDesign?: (designCode: string, shareUrl: string) => void;
  /**
   * Called when the shopper shares their bracelet image from the preview view,
   * receiving the rendered PNG. If omitted, the widget uses the Web Share API
   * (mobile) and falls back to downloading the image (desktop).
   */
  onShare?: (image: Blob) => void | Promise<void>;
  /**
   * Catalogue of beads/accessories to offer. Normally the Liquid section injects
   * this as a `<script id="bracelet-catalogue">` JSON block (read automatically),
   * but a host can pass it directly here instead. When absent, the built-in stub
   * catalogue is used.
   */
  catalogue?: RawCatalogue;
  /** Restore a previously saved design on mount. */
  initialDesign?: string;
  /** Override the wrist-size hint shown in the header. */
  wristHint?: string;
  /** Brand name shown on the shareable card (default "Stone Studio"). */
  brandName?: string;
  /** Tagline shown under the brand on the shareable card. */
  brandTagline?: string;
}

/** Encode placed items into a compact, URL-safe design code. */
export function encodeDesign(items: PlacedItem[]): string {
  return items.map((it) => `${it.def.id}@${it.size}`).join(',');
}

/** Decode a design code back into {defId, size} entries. */
export function decodeDesign(code: string): { defId: string; size: number }[] {
  if (!code) return [];
  return code
    .split(',')
    .map((token) => {
      const [defId, size] = token.split('@');
      return { defId, size: Number(size) || 0 };
    })
    .filter((e) => e.defId && e.size > 0);
}
