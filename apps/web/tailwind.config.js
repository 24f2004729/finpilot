/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        fintech: {
          dark: '#0B0F19',
          card: '#111827',
          surface: '#1F2937',
          border: '#374151',
          primary: '#10B981', // Emerald 500
          primaryDark: '#059669',
          accent: '#6366F1', // Indigo
          warning: '#F59E0B',
          danger: '#EF4444',
          muted: '#9CA3AF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
