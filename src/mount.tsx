import { createRoot, type Root } from 'react-dom/client';
import { App } from './App';
import { useStore } from './store/store';
import type { ConfiguratorOptions } from './shopify/integration';
import './index.css';

export interface ConfiguratorInstance {
  /** Tear down the widget and release its resources. */
  unmount: () => void;
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

  // Seed options before first render so the engine can load any initial design.
  useStore.getState().setOptions(options);

  const root: Root = createRoot(el);
  root.render(<App options={options} />);

  return {
    unmount: () => root.unmount(),
  };
}
