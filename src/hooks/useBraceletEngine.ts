import { useEffect, type RefObject } from 'react';
import { BraceletEngine } from '@/engine/BraceletEngine';
import { useStore } from '@/store/store';
import { decodeDesign } from '@/shopify/integration';

/**
 * Creates and owns a BraceletEngine for the lifetime of the studio, wiring it
 * to the store and keeping it sized to its container. The engine is the source
 * of truth for physics; the store mirrors its serializable summary.
 */
export function useBraceletEngine(
  containerRef: RefObject<HTMLElement>,
  physicsRef: RefObject<HTMLCanvasElement>,
  overlayRef: RefObject<HTMLCanvasElement>,
): void {
  useEffect(() => {
    const container = containerRef.current;
    const physicsCanvas = physicsRef.current;
    const overlayCanvas = overlayRef.current;
    if (!container || !physicsCanvas || !overlayCanvas) return;

    const { syncFromEngine, attachEngine, options } = useStore.getState();

    const engine = new BraceletEngine({
      container,
      physicsCanvas,
      overlayCanvas,
      onChange: syncFromEngine,
    });

    attachEngine(engine);
    // Apply the initial texture/bead size already selected in the store.
    const initial = useStore.getState();
    engine.setTexture(initial.texture);
    engine.start();

    // Dev-only handle for debugging / manual frame rendering.
    if (import.meta.env.DEV) {
      (window as unknown as { __braceletEngine?: BraceletEngine }).__braceletEngine = engine;
    }

    if (options.initialDesign) {
      engine.loadDesign(decodeDesign(options.initialDesign));
    }

    const onResize = () => engine.resize();
    const observer = new ResizeObserver(onResize);
    observer.observe(container);
    window.addEventListener('resize', onResize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', onResize);
      engine.destroy();
      attachEngine(null);
    };
    // Engine is created once for the studio's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
