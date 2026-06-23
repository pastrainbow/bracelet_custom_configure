/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  // Preflight is disabled so the widget does not reset the host Shopify theme's
  // global styles. A scoped reset lives in src/index.css under the `.bcfg` root.
  corePlugins: {
    preflight: false,
  },
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
