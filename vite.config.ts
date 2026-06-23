import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

// Two build targets:
//  - default:  a normal SPA (index.html) for local development / standalone hosting.
//  - "widget": a single-file library bundle (mount API) for embedding in Shopify.
//
// Build the embeddable widget with:  npm run build:widget
export default defineConfig(({ command, mode }) => {
  const isWidget = mode === 'widget';

  return {
    // Relative base so the built SPA works from any sub-path (e.g. GitHub
    // Pages project sites at /<repo>/). Dev server stays at '/'.
    base: command === 'build' && !isWidget ? './' : '/',
    plugins: [react()],
    resolve: {
      alias: { '@': resolve(__dirname, 'src') },
    },
    build: isWidget
      ? {
          outDir: 'dist-widget',
          lib: {
            entry: resolve(__dirname, 'src/widget.ts'),
            name: 'BraceletConfigurator',
            formats: ['umd', 'es'],
            fileName: (format) => `bracelet-configurator.${format}.js`,
          },
          rollupOptions: {
            // React is bundled in so the widget is fully self-contained on any theme.
            output: { assetFileNames: 'bracelet-configurator.[ext]' },
          },
        }
      : {
          outDir: 'dist',
        },
  };
});
