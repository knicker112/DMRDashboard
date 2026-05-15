import plugin from 'tailwindcss/plugin'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [
    // landscape/portrait Varianten für automatisches Layout je nach Geräteausrichtung
    plugin(({ addVariant }) => {
      addVariant('landscape', '@media (orientation: landscape)')
      addVariant('portrait',  '@media (orientation: portrait)')
    }),
  ],
}
