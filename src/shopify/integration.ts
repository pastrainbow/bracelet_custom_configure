import type { PlacedItem } from '@/types';

/** Payload handed to the host (Shopify) when the shopper adds their design. */
export interface AddToCartPayload {
  /** One entry per placed bead/accessory, in bracelet order. */
  items: { id: string; defId: string; name: string; size: number; price: number }[];
  beadCount: number;
  totalPrice: number;
  estimatedLengthCm: number;
  /** Shopper's wrist circumference in cm, or null if not provided. */
  wristSizeCm: number | null;
  /** Compact, shareable encoding of the design (defId@size,defId@size,…). */
  designCode: string;
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
