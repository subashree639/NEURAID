/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'healthcare-blue': '#1e3a8a',
        'healthcare-light': '#3b82f6',
        'healthcare-purple': '#4c1d95',
        'healthcare-dark': '#0f172a',
        'healthcare-card': 'rgba(15, 23, 42, 0.6)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-gradient': 'linear-gradient(to right bottom, #0f172a, #1e1b4b, #312e81)',
      }
    },
  },
  plugins: [],
}
