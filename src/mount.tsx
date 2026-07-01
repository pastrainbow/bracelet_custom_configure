import { createRoot, type Root } from 'react-dom/client';
import { App } from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useStore } from './store/store';
import { CATALOGUE, initCatalogue } from './data/catalogue';
import { preloadSprites } from './engine/render/spriteCache';
import type { ConfiguratorOptions } from './shopify/integration';
import type { RawCatalogue } from './types';
import './index.css';

export interface ConfiguratorInstance {
  /** Tear down the widget and release its resources. */
  unmount: () => void;
}

/** Read the catalogue the Liquid section injects as a JSON script block. */
function readInjectedCatalogue(): RawCatalogue | undefined {
  if (typeof document === 'undefined') return undefined;
  const el = document.getElementById('bracelet-catalogue');
  const text = el?.textContent?.trim();
  if (!text) return undefined;
  try {
    return JSON.parse(text) as RawCatalogue;
  } catch {
    // eslint-disable-next-line no-console
    console.warn('[BraceletConfigurator] could not parse #bracelet-catalogue; using stub catalogue');
    return undefined;
  }
}

/**
 * Mount the bracelet configurator into a host element.
 *
 * @example
 *   import { mount } from 'bracelet-configurator';
 *   mount('#bracelet', {
 *     onAddToCart: (payload) => fetch('/cart/add.js', { ... }),
 *   });
 */
export function mount(
  target: string | HTMLElement,
  options: ConfiguratorOptions = {},
): ConfiguratorInstance {
  const el = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target;
  if (!el) {
    throw new Error(`[BraceletConfigurator] mount target not found: ${String(target)}`);
  }

  // Mark the host element as the widget root. Tailwind utilities are scoped under
  // `.bcfg` (see `important` in tailwind.config.js), so the host must carry the
  // class for the App root's own utility classes to resolve to a `.bcfg` ancestor.
  el.classList.add('bcfg');

  // Install the host's catalogue (explicit option, else the injected JSON block,
  // else the built-in stub) before anything reads CATALOGUE/SUPERCATS.
  initCatalogue(options.catalogue ?? readInjectedCatalogue());

  // Kick off sprite preloading. When the catalogue is image-backed (Shopify),
  // gate the studio until they're decoded; the stub has no images so it stays
  // instant and `catalogueReady` is left true.
  const defs = Object.values(CATALOGUE).flat();
  if (defs.some((d) => d.imageUrl)) {
    useStore.getState().setCatalogueReady(false);
    // A stalled image request (no load OR error event) must never gate the
    // studio forever — cap the wait; late arrivals still land in the cache and
    // any still-missing sprite falls back to the procedural render.
    const preloadCap = new Promise<void>((r) => setTimeout(r, 10_000));
    Promise.race([preloadSprites(defs), preloadCap]).finally(() =>
      useStore.getState().setCatalogueReady(true),
    );
  }

  // Seed options before first render so the engine can load any initial design.
  useStore.getState().setOptions(options);

  const root: Root = createRoot(el);
  root.render(
    <ErrorBoundary>
      <App options={options} />
    </ErrorBoundary>,
  );

  return {
    unmount: () => root.unmount(),
  };
}
