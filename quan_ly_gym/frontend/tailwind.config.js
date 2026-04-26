/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gym: {
          bg: '#111827',
          surface: '#1F2937',
          card: '#0F172A',
          primary: '#DC2626',
          'primary-hover': '#EF4444',
          'text-primary': '#FFFFFF',
          'text-secondary': '#9CA3AF',
          border: '#374151',
        }
      },
      fontFamily: {
        body: ['Barlow', 'sans-serif'],
        display: ['Bebas Neue', 'sans-serif'],
        condensed: ['Barlow Condensed', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
