/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  // Preflight is disabled so the widget does not reset the host Shopify theme's
  // global styles. A scoped reset lives in src/index.css under the `.bcfg` root.
  corePlugins: {
    preflight: false,
  },
  // Scope every utility under the widget root (`.bcfg`) and, in doing so, raise
  // its specificity to two classes. Host themes like Shopify's Dawn ship their
  // own generic classes (`.grid`, `.hidden`, `.uppercase`, …) and element
  // selectors that would otherwise collide with — and, depending on stylesheet
  // load order, override — the widget's bare utility classes. The `.bcfg`
  // prefix makes the widget's utilities win deterministically without `!important`.
  // (This is why mount() adds `.bcfg` to the host element: every utility now
  // needs a `.bcfg` ancestor, including the App root's own classes.)
  important: '.bcfg',
  theme: {
    extend: {
      colors: {
        // Brand palette. Mirrored as CSS variables in index.css for canvas use.
        bg: 'var(--bcfg-bg)',
        surface: 'var(--bcfg-surface)',
        border: 'var(--bcfg-border)',
        ink: 'var(--bcfg-text)',
        muted: 'var(--bcfg-muted)',
        accent: 'var(--bcfg-accent)',
        gold: 'var(--bcfg-accent2)',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
      },
      boxShadow: {
        panel: '0 2px 16px rgba(0, 0, 0, 0.07)',
        float: '0 4px 16px rgba(0, 0, 0, 0.18)',
      },
      borderRadius: {
        pill: '20px',
      },
    },
  },
  plugins: [],
};
