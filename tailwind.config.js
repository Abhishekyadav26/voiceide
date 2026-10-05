/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'var(--vs-bg)',
        foreground: 'var(--vs-fg)',
        accent: 'var(--vs-accent)',
        muted: 'var(--vs-muted)',
        card: 'var(--vs-card)',
        border: 'var(--vs-border)',
      },
      fontFamily: {
        sans: ['var(--vs-font, Inter, system-ui, sans-serif)'],
        mono: ['var(--vs-font-mono, JetBrains Mono, monospace)'],
        serif: ['Fraunces, Georgia, serif'],
      },
      borderRadius: { DEFAULT: 'var(--vs-radius, 0.625rem)' },
    },
  },
  plugins: [],
};
