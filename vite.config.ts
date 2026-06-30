import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import { resolve } from 'node:path';

// PostCSS plugin: rewrite every `rem` length to its `px` equivalent at the
// standard 1rem = 16px the widget is designed against. The widget is embedded
// in a host theme (Shopify's Dawn) that sets the root `html` font-size to 62.5%
// (1rem = 10px); without this, every rem-based Tailwind utility — text sizes,
// padding, gaps, button heights — would render at 62.5% scale while px-based
// utilities stayed full size, distorting the whole layout. Converting to px
// makes the bundle immune to whatever root font-size the host sets.
const REM_TO_PX = 16;
const remToPx = () => ({
  postcssPlugin: 'bcfg-rem-to-px',
  Declaration(decl: { value: string }) {
    if (decl.value.includes('rem')) {
      decl.value = decl.value.replace(
        /(-?[\d.]+)rem\b/g,
        (_m, n) => `${parseFloat(n) * REM_TO_PX}px`,
      );
    }
  },
});
remToPx.postcss = true;

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
    // The widget bundles React in. React reads `process.env.NODE_ENV`, which
    // doesn't exist in the browser — and because the widget builds under a
    // custom `--mode widget` (not the default `production` mode), Vite won't
    // replace it automatically. Statically define it so no live `process`
    // reference survives into the embeddable bundle.
    define: isWidget
      ? { 'process.env.NODE_ENV': JSON.stringify('production') }
      : {},
    plugins: [react()],
    resolve: {
      alias: { '@': resolve(__dirname, 'src') },
    },
    // Only the widget build runs the rem→px transform (see remToPx above). The
    // default SPA build reads the regular postcss.config.js. Tailwind +
    // autoprefixer are listed explicitly here because an inline `css.postcss`
    // replaces the config-file pipeline rather than extending it.
    css: isWidget
      ? { postcss: { plugins: [tailwindcss(), remToPx(), autoprefixer()] } }
      : {},
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
