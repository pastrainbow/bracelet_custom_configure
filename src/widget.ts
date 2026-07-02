// Library entry for the embeddable widget build (`npm run build:widget`).
// Produces a self-contained bundle exposing the public mount API.
export { mount } from './mount';
export type { ConfiguratorInstance } from './mount';
export type {
  ConfiguratorOptions,
  AddToCartPayload,
} from './shopify/integration';
export { encodeDesign, decodeDesign } from './shopify/integration';
export type { DesignSnapshot } from './persistence/autosave';
