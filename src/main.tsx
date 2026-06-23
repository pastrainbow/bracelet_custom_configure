// Standalone development / hosting entry point.
import { mount } from './mount';

// Full-page sizing for the standalone build (no effect when embedded).
document.documentElement.classList.add('bcfg-standalone');

mount('#bracelet-configurator', {
  // Demo handler — replace via the mount() options when embedding in Shopify.
  onAddToCart: (payload) => {
    // eslint-disable-next-line no-console
    console.info('Add to cart:', payload);
    window.alert(
      `Added ${payload.beadCount} beads — $${payload.totalPrice.toFixed(2)}\n\nDesign: ${payload.designCode}`,
    );
  },
});
