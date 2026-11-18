/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#000000',
        surface: '#0A0A0A',
        raised: '#111213',
        card: '#0C0D0E',
        border: '#1F2421',
        'border-highlight': '#00EA64',
        'text-primary': '#FFFFFF',
        'text-secondary': '#A1A1AA',
        'text-muted': '#71717A',
        brand: '#00EA64',
        'brand-glow': '#00FF6A',
        'brand-dark': '#064E24',
        success: '#00EA64',
        warning: '#F59E0B',
        danger: '#EF4444',
        info: '#38BDF8',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'brand-glow': '0 0 25px -5px rgba(0, 234, 100, 0.3)',
        'brand-glow-lg': '0 0 45px -5px rgba(0, 234, 100, 0.45)',
        'card-dark': '0 10px 30px -10px rgba(0, 0, 0, 0.8)',
      }
    },
  },
  plugins: [],
}
